import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/language', pathMatch: 'full' },
  { path: 'language', loadComponent: () => import('./app/language/language-select.component').then(m => m.LanguageSelectComponent) },
  { path: 'register', loadComponent: () => import('./app/components/register/register.component').then(m => m.RegisterComponent) },
  { path: 'welcome', loadComponent: () => import('./app/welcome/welcome.component').then(m => m.WelcomeComponent) },
  { path: 'routine-level', loadComponent: () => import('./app/routine-level/level-select.component').then(m => m.LevelSelectComponent) },
  { path: 'splash', loadComponent: () => import('./app/components/splash/splash.component').then(m => m.SplashComponent) },
  { path: 'home', loadComponent: () => import('./app/components/home/home.component').then(m => m.HomeComponent) },
  { path: 'intro-daily-routine', loadComponent: () => import('./app/components/intro-daily-routine/intro-daily-routine.component').then(m => m.IntroDailyRoutineComponent) },
  { path: 'lets-begin', loadComponent: () => import('./app/components/lets-begin/lets-begin.component').then(m => m.LetsBeginComponent) },
  { path: 'music-session', loadComponent: () => import('./app/components/music-session/music-session.component').then(m => m.MusicSessionComponent) },
  { path: 'breathing-options', loadComponent: () => import('./app/components/breathing-options/breathing-options.component').then(m => m.BreathingOptionsComponent) },
  { path: 'breathing-session', loadComponent: () => import('./app/components/breathing-session/breathing-session.component').then(m => m.BreathingSessionComponent) },
  { path: 'feldenkrais-options', loadComponent: () => import('./app/components/feldenkrais-options/feldenkrais-options.component').then(m => m.FeldenkraisOptionsComponent) },
  { path: 'feldenkrais-session', loadComponent: () => import('./app/components/feldenkrais-session/feldenkrais-session.component').then(m => m.FeldenkraisSessionComponent) },
  { path: 'game-options', loadComponent: () => import('./app/components/game-options/game-options.component').then(m => m.GameOptionsComponent) },
  { path: 'memory-game', loadComponent: () => import('./app/components/memory-game/memory-game.component').then(m => m.MemoryGameComponent) },
  { path: 'ai-assistant', loadComponent: () => import('./app/components/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent) },
  { path: 'goals', loadComponent: () => import('./app/components/goals/goals.component').then(m => m.GoalsComponent) },
  { path: 'knowledge', loadComponent: () => import('./app/components/knowledge/knowledge.component').then(m => m.KnowledgeComponent) },
  { path: 'contact', loadComponent: () => import('./app/components/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'notifications', loadComponent: () => import('./app/components/notifications/notifications.component').then(m => m.NotificationsComponent) },
  { path: 'personal-info', loadComponent: () => import('./app/components/personal-info/personal-info.component').then(m => m.PersonalInfoComponent) },
  { path: 'settings', loadComponent: () => import('./app/components/settings/settings.component').then(m => m.SettingsComponent) },
  { path: '**', redirectTo: '/language' }
];
