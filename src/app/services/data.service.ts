import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { TranslateService } from '../shared/services/translate.service';

export interface Profile {
  name: string;
  age: number;
  email: string;
  phone: string;
}

export interface Completion {
  date: string;
  exerciseId: string;
  level: 'beginner' | 'advanced' | 'grand';
  durationSec: number;
  score?: number;
}

export interface Goal {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  url?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: 'beginner' | 'advanced' | 'grand';
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(
    private storage: StorageService,
    private translateService: TranslateService
  ) {}

  getProfile(): Profile | null {
    return this.storage.get<Profile | null>('profile', null);
  }

  saveProfile(profile: Profile): void {
    this.storage.set('profile', profile);
  }

  getRoutines(level: 'beginner' | 'advanced' | 'grand') {
    return [
      {
        id: 'breathing',
        title: this.translateService.t('breathing_exercise'),
        description: this.translateService.t('exercise_breathing_description'),
        duration: 5,
        level: level
      },
      {
        id: 'memory',
        title: this.translateService.t('memory_game'),
        description: this.translateService.t('exercise_memory_description'),
        duration: 3,
        level: level
      }
    ];
  }

  getExercises(level: 'beginner' | 'advanced' | 'grand'): Exercise[] {
    return this.getRoutines(level);
  }

  getTodayProgress(): Completion[] {
    const today = new Date().toISOString().split('T')[0];
    const allCompletions = this.storage.get<Completion[]>('completions', []);
    return allCompletions.filter(c => c.date === today);
  }

  addCompletion(completion: Completion): void {
    this.storage.pushToArray('completions', completion);
  }

  getGoals(): Goal[] {
    return this.storage.get<Goal[]>('goals', [
      { id: '1', title: this.translateService.t('goal_family_call'), done: false },
      { id: '3', title: this.translateService.t('goal_breathing'), done: false }
    ]);
  }

  isAllDailyActivitiesCompleted(): boolean {
    const today = new Date().toISOString().split('T')[0];
    
    // Check Music Session completion
    const musicCompletedDate = localStorage.getItem('musicSessionCompleted');
    const isMusicSessionCompleted = musicCompletedDate === today;
    
    // Check Breathing Exercise completion
    const breathingCompletedDate = localStorage.getItem('breathingSessionCompleted');
    const isBreathingExerciseCompleted = breathingCompletedDate === today;
    
    // Check Feldenkrais Exercise completion
    const feldenkraisCompletedDate = localStorage.getItem('feldenkraisSessionCompleted');
    const isFeldenkraisExerciseCompleted = feldenkraisCompletedDate === today;
    
    // Check Memory Game completion
    const todayCompletions = this.getTodayProgress();
    const isMemoryGameCompleted = todayCompletions.some(c => c.exerciseId === 'memory');
    
    // All 4 activities must be completed
    return isMusicSessionCompleted && 
           isBreathingExerciseCompleted && 
           isFeldenkraisExerciseCompleted && 
           isMemoryGameCompleted;
  }

  saveGoals(goals: Goal[]): void {
    this.storage.set('goals', goals);
  }

  getArticles(): Article[] {
    return [
      {
        id: '1',
        title: this.translateService.t('article_nutrition_title'),
        excerpt: this.translateService.t('article_nutrition_excerpt'),
        body: this.translateService.t('article_nutrition_body'),
        url: 'https://www.health.harvard.edu/topics/diet-and-weight-loss'
      },
      {
        id: '2',
        title: this.translateService.t('article_anxiety_title'),
        excerpt: this.translateService.t('article_anxiety_excerpt'),
        body: this.translateService.t('article_anxiety_body'),
        url: 'https://www.apa.org/topics/anxiety'
      },
      {
        id: '3',
        title: this.translateService.t('article_sleep_title'),
        excerpt: this.translateService.t('article_sleep_excerpt'),
        body: this.translateService.t('article_sleep_body'),
        url: 'https://www.sleepfoundation.org/sleep-hygiene'
      },
      {
        id: '4',
        title: this.translateService.t('article_feldenkrais_title'),
        excerpt: this.translateService.t('article_feldenkrais_excerpt'),
        body: this.translateService.t('article_feldenkrais_body'),
        url: 'https://feldenkrais.com/about-the-feldenkrais-method/'
      }
    ];
  }

  // Add the missing set method
  set(key: string, value: any): void {
    this.storage.set(key, value);
  }
}
