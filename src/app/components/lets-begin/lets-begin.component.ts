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

  constructor(
    private router: Router,
    private dataService: DataService
  ) {}

  ngOnInit() {
    // Read level from localStorage, default to beginner if missing
    const stored = localStorage.getItem('level') as any;
    this.selectedLevel = (stored === 'advanced' || stored === 'grand') ? stored : 'beginner';
    this.loadExercises();
    this.updateProgress();
    this.checkMusicSessionCompletion();
    
    // Listen for navigation events to refresh completion status
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if ((event as NavigationEnd).url === '/lets-begin') {
          this.checkMusicSessionCompletion();
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
    // Navigate to game options component
    this.router.navigate(['/game-options'], { 
      queryParams: { 
        level: this.selectedLevel 
      } 
    });
  }

  updateProgress() {
    const todayCompletions = this.dataService.getTodayProgress();
    this.completedToday = todayCompletions.length;
    this.todayProgress = this.completedToday / this.totalExercises;
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

  checkMusicSessionCompletion() {
    const today = new Date().toISOString().split('T')[0];
    const completedDate = localStorage.getItem('musicSessionCompleted');
    this.isMusicSessionCompleted = completedDate === today;
  }

  startMusicSession() {
    this.router.navigate(['/music-session']);
  }
}
