import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { DataService, Exercise, Completion } from '../../services/data.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-lets-begin',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './lets-begin.component.html',
  styleUrls: ['./lets-begin.component.scss']
})
export class LetsBeginComponent implements OnInit {
  selectedLevel: 'beginner' | 'advanced' | 'grand' = 'beginner';
  exercises: Exercise[] = [];
  completedToday: number = 0;
  totalExercises: number = 4;
  todayProgress: number = 0;
  isMusicSessionCompleted: boolean = false;
  isBreathingExerciseCompleted: boolean = false;
  isFeldenkraisExerciseCompleted: boolean = false;
  isMemoryGameCompleted: boolean = false;
  showCongratulationsModal: boolean = false;

  constructor(
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit() {
    // Read level from localStorage, default to beginner if missing
    const stored = localStorage.getItem('level') as any;
    this.selectedLevel = (stored === 'advanced' || stored === 'grand') ? stored : 'beginner';
    this.loadExercises();
    // updateProgress() calls checkAllActivityCompletions() internally
    this.updateProgress();
    
    // Listen for navigation events to refresh completion status when returning to this page
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if ((event as NavigationEnd).url === '/lets-begin') {
          // Refresh completion status and progress for all activities
          this.updateProgress();
          // Check if all activities are completed and show congratulations if needed
          this.checkAndShowCongratulations();
        }
      });
  }

  loadExercises() {
    this.exercises = this.dataService.getExercises(this.selectedLevel);
  }

  startExercise(exercise: Exercise) {
    if (exercise.id === 'breathing') {
      this.startBreathingExercise();
    } else if (exercise.id === 'memory') {
      this.startGame();
    }
  }

  startBreathingExercise() {
    // Navigate to breathing options component
    this.router.navigate(['/breathing-options'], { 
      queryParams: { 
        duration: 5,
        level: this.selectedLevel 
      } 
    });
  }

  startFeldenkraisExercise() {
    // Navigate to Feldenkrais options component
    this.router.navigate(['/feldenkrais-options'], { 
      queryParams: { 
        level: this.selectedLevel 
      } 
    });
  }

  startGame() {
    // Navigate directly to memory game with level from personal area settings
    const storedLevel = localStorage.getItem('level');
    const gameLevel = (storedLevel === 'advanced' || storedLevel === 'grand') ? storedLevel : 'beginner';
    this.router.navigate(['/memory-game'], { 
      queryParams: { 
        level: gameLevel 
      } 
    });
  }

  updateProgress() {
    // Check all activity completions first
    this.checkAllActivityCompletions();
    
    // Count completed activities
    let completedCount = 0;
    if (this.isMusicSessionCompleted) completedCount++;
    if (this.isBreathingExerciseCompleted) completedCount++;
    if (this.isFeldenkraisExerciseCompleted) completedCount++;
    if (this.isMemoryGameCompleted) completedCount++;
    
    this.completedToday = completedCount;
    this.todayProgress = this.completedToday / this.totalExercises;
    
    // Check if all activities are completed and show congratulations if needed
    this.checkAndShowCongratulations();
  }

  completeExercise(exerciseId: string, durationSec: number, score?: number) {
    const completion: Completion = {
      date: new Date().toISOString().split('T')[0],
      exerciseId,
      level: this.selectedLevel,
      durationSec,
      score
    };
    
    this.dataService.addCompletion(completion);
    this.updateProgress();
  }

  checkAllActivityCompletions() {
    const today = new Date().toISOString().split('T')[0];
    
    // Check Music Session completion (uses localStorage)
    const musicCompletedDate = localStorage.getItem('musicSessionCompleted');
    this.isMusicSessionCompleted = musicCompletedDate === today;
    
    // Check Breathing Exercise completion (uses localStorage)
    const breathingCompletedDate = localStorage.getItem('breathingSessionCompleted');
    this.isBreathingExerciseCompleted = breathingCompletedDate === today;
    
    // Check Feldenkrais Exercise completion (uses localStorage)
    const feldenkraisCompletedDate = localStorage.getItem('feldenkraisSessionCompleted');
    this.isFeldenkraisExerciseCompleted = feldenkraisCompletedDate === today;
    
    // Check Memory Game completion (uses dataService)
    const todayCompletions = this.dataService.getTodayProgress();
    this.isMemoryGameCompleted = todayCompletions.some(c => c.exerciseId === 'memory');
  }

  checkMusicSessionCompletion() {
    // Kept for backward compatibility, but checkAllActivityCompletions is preferred
    this.checkAllActivityCompletions();
  }

  startMusicSession() {
    this.router.navigate(['/music-session']);
  }

  checkAndShowCongratulations() {
    // Check if all daily activities are completed
    if (this.dataService.isAllDailyActivitiesCompleted()) {
      // Check if we've already shown the congratulations for today
      const today = new Date().toISOString().split('T')[0];
      const lastShownDate = localStorage.getItem('dailyRoutineCongratulationsShown');
      
      // Only show if we haven't shown it today
      if (lastShownDate !== today) {
        this.showCongratulationsModal = true;
        localStorage.setItem('dailyRoutineCongratulationsShown', today);
      }
    }
  }

  onCongratulationsOk() {
    this.showCongratulationsModal = false;
    this.router.navigate(['/goals']);
  }
}
