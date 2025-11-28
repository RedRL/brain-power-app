import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { DataService, Goal } from '../../services/data.service';
import { TranslateService } from '../../shared/services/translate.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [AppHeaderComponent, FormsModule, CommonModule, DatePipe, TPipe],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.scss']
})
export class GoalsComponent implements OnInit, OnDestroy {
  goals: Goal[] = [];
  completedGoals: number = 0;
  totalGoals: number = 0;
  completionPercentage: number = 0;
  isDailyRoutineCompleted: boolean = false;
  private routerSubscription?: Subscription;
  editingGoalId: string | null = null;
  editingGoalTitle: string = '';

  constructor(
    private dataService: DataService,
    private router: Router,
    private translateService: TranslateService
  ) {}

  ngOnInit() {
    this.loadGoals();
    this.checkDailyRoutineCompletion();
    
    // Listen for navigation events to refresh completion status when returning to this page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if ((event as NavigationEnd).url === '/goals') {
          this.checkDailyRoutineCompletion();
          this.updateProgress();
        }
      });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadGoals() {
    let allGoals = this.dataService.getGoals();
    // Filter out the memory game goal (id '2' or title matching 'goal_memory_game')
    const memoryGameGoalTitle = this.translateService.t('goal_memory_game');
    this.goals = allGoals.filter(goal => 
      goal.id !== '2' && goal.title !== memoryGameGoalTitle
    );
    
    // Re-translate default goals based on current language
    // This ensures goals always display in the current language
    const goalFamilyCallTranslated = this.translateService.t('goal_family_call');
    const goalBreathingTranslated = this.translateService.t('goal_breathing');
    
    // Update goal titles if they match the default goals (by ID or English/Hebrew titles)
    this.goals = this.goals.map(goal => {
      // Goal with ID '1' is "Call a family member today"
      if (goal.id === '1') {
        return { ...goal, title: goalFamilyCallTranslated };
      }
      // Goal with ID '3' is "5-minute breathing after breakfast"
      if (goal.id === '3') {
        return { ...goal, title: goalBreathingTranslated };
      }
      // Also check by English/Hebrew titles in case IDs don't match
      const enFamilyCall = 'Call a family member today';
      const heFamilyCall = 'התקשר לבן משפחה היום';
      const enBreathing = '5-minute breathing after breakfast';
      const heBreathing = '5 דקות נשימה אחרי ארוחת בוקר';
      
      if (goal.title === enFamilyCall || goal.title === heFamilyCall) {
        return { ...goal, title: goalFamilyCallTranslated };
      }
      if (goal.title === enBreathing || goal.title === heBreathing) {
        return { ...goal, title: goalBreathingTranslated };
      }
      return goal;
    });
    
    // If we filtered out a goal or updated translations, save the updated list
    if (allGoals.length !== this.goals.length || 
        JSON.stringify(allGoals) !== JSON.stringify(this.goals)) {
      this.dataService.saveGoals(this.goals);
    }
    
    this.updateProgress();
  }

  checkDailyRoutineCompletion() {
    const today = new Date().toISOString().split('T')[0];
    
    // Check Music Session completion (uses localStorage)
    const musicCompletedDate = localStorage.getItem('musicSessionCompleted');
    const isMusicSessionCompleted = musicCompletedDate === today;
    
    // Check Breathing Exercise completion (uses localStorage)
    const breathingCompletedDate = localStorage.getItem('breathingSessionCompleted');
    const isBreathingExerciseCompleted = breathingCompletedDate === today;
    
    // Check Feldenkrais Exercise completion (uses localStorage)
    const feldenkraisCompletedDate = localStorage.getItem('feldenkraisSessionCompleted');
    const isFeldenkraisExerciseCompleted = feldenkraisCompletedDate === today;
    
    // Check Memory Game completion (uses dataService)
    const todayCompletions = this.dataService.getTodayProgress();
    const isMemoryGameCompleted = todayCompletions.some(c => c.exerciseId === 'memory');
    
    // All 4 activities must be completed
    this.isDailyRoutineCompleted = isMusicSessionCompleted && 
                                   isBreathingExerciseCompleted && 
                                   isFeldenkraisExerciseCompleted && 
                                   isMemoryGameCompleted;
    
    // Update progress after checking daily routine completion
    this.updateProgress();
  }

  toggleGoal(goal: Goal) {
    const today = new Date().toISOString().split('T')[0];
    const goalCompletionKey = `goal_${goal.id}_completed`;
    
    if (goal.done) {
      // Goal is being completed - save completion date
      localStorage.setItem(goalCompletionKey, today);
    } else {
      // Goal is being unchecked - remove completion date
      localStorage.removeItem(goalCompletionKey);
    }
    
    this.dataService.saveGoals(this.goals);
    this.updateProgress();
  }

  updateProgress() {
    // Count completed regular goals
    const completedRegularGoals = this.goals.filter(g => g.done).length;
    
    // Include daily routine completion in the count
    this.completedGoals = completedRegularGoals + (this.isDailyRoutineCompleted ? 1 : 0);
    
    // Total goals includes daily routine + regular goals
    this.totalGoals = this.goals.length + 1;
    
    // Calculate percentage
    this.completionPercentage = this.totalGoals > 0 ? Math.round((this.completedGoals / this.totalGoals) * 100) : 0;
  }

  addNewGoal() {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: this.translateService.t('new_goal'),
      done: false
    };
    
    this.goals.push(newGoal);
    this.dataService.saveGoals(this.goals);
    this.updateProgress();
    
    // Automatically enter edit mode for the new goal
    this.startEditingGoal(newGoal);
  }

  startEditingGoal(goal: Goal) {
    this.editingGoalId = goal.id;
    this.editingGoalTitle = goal.title;
  }

  saveGoalEdit(goal: Goal) {
    if (this.editingGoalTitle.trim()) {
      goal.title = this.editingGoalTitle.trim();
      this.dataService.saveGoals(this.goals);
    }
    this.cancelEditingGoal();
  }

  cancelEditingGoal() {
    this.editingGoalId = null;
    this.editingGoalTitle = '';
  }

  deleteGoal(goalId: string) {
    this.goals = this.goals.filter(g => g.id !== goalId);
    this.dataService.saveGoals(this.goals);
    this.updateProgress();
  }

  isEditing(goalId: string): boolean {
    return this.editingGoalId === goalId;
  }
}
