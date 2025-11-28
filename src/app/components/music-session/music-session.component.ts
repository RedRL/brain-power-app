import { Component, ViewChild, ElementRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';

interface Track {
  id: number;
  title: string;
  artist: string;
  duration: string;
  url: string;
}

@Component({
  selector: 'app-music-session',
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderComponent, TPipe],
  templateUrl: './music-session.component.html',
  styleUrls: ['./music-session.component.scss']
})
export class MusicSessionComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  
  currentTime = 0;
  duration = 0;
  progressPercentage = 0;
  showCongratulations = false;
  isPlaying = false;
  volume = 100;
  showPlayer = false; // Controls visibility of the bottom player
  isHidingPlayer = false; // Track if player is being hidden (for animation)
  isPlayerCollapsed = false; // Track if player is collapsed
  
  currentTrackIndex = 0;
  playedTracks = new Set<number>();
  sessionProgress = 0;
  
  selectedActivity: string | null = null;
  selectedSubActivity: any = null;
  showFullText = false;
  readingProgress = 0;
  
  // Individual activity progress tracking
  activityProgress: { [key: string]: number } = {};
  completedActivities: Set<string> = new Set();
  
  // Connect the Dots Game properties
  connectDotsProgress = 0;
  dots: Array<{x: number, y: number, number: number, connected: boolean}> = [];
  lines: Array<{start: {x: number, y: number}, end: {x: number, y: number}}> = [];
  isDrawing = false;
  currentDotIndex = 0;
  startDot: {x: number, y: number, number: number, connected: boolean} | null = null;
  canvas: HTMLCanvasElement | null = null;
  ctx: CanvasRenderingContext2D | null = null;
  
  // Maze Game properties
  mazeProgress = 0;
  mazePath: Array<{x: number, y: number}> = [];
  mazeCompletedPaths: Array<Array<{x: number, y: number}>> = [];
  isDrawingMaze = false;
  mazeStartPosition: {x: number, y: number} = {x: 30, y: 30};
  mazeEndPosition: {x: number, y: number} = {x: 270, y: 170};
  mazeCanvasElement: HTMLCanvasElement | null = null;
  mazeCtx: CanvasRenderingContext2D | null = null;
  
  // Image-based maze properties
  mazeImage: HTMLImageElement | null = null;
  mazeImageData: ImageData | null = null;
  mazeImageUrl: string = 'assets/images/maze.png';
  
  @ViewChild('textContent') textContent!: ElementRef<HTMLDivElement>;
  @ViewChild('backgroundVideo') backgroundVideo!: ElementRef<HTMLVideoElement>;
  @ViewChild('connectDotsCanvas') connectDotsCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('mazeCanvas') mazeCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Sub-activities for each main activity
  subActivities = {
    nature_trips: [],
    reading: [
      { id: 'novel', name: 'רומן', translationKey: 'novel', icon: '📖' },
      { id: 'newspaper', name: 'עיתון', translationKey: 'newspaper', icon: '📰' },
      { id: 'article', name: 'מאמר', translationKey: 'article', icon: '📄' },
      { id: 'poetry', name: 'שירה', translationKey: 'poetry', icon: '📜' }
    ],
    writing: [
      { id: 'connect_dots', name: 'חברו את הנקודות', translationKey: 'connect_dots', icon: '🔗' },
      { id: 'solve_maze', name: 'פתור מבוך', translationKey: 'solve_maze', icon: '🌀' }
    ],
    slides: [
      { id: 'presentation', name: 'Presentation', translationKey: 'presentation', icon: '📊' },
      { id: 'study', name: 'Study Material', translationKey: 'study_material', icon: '📖' },
      { id: 'work', name: 'Work Slides', translationKey: 'work_slides', icon: '💼' },
      { id: 'lecture', name: 'Lecture Notes', translationKey: 'lecture_notes', icon: '🎓' }
    ],
    objects: [
      { id: 'puzzle', name: 'Puzzle', translationKey: 'puzzle', icon: '🧩' },
      { id: 'memory_game', name: 'Memory Game', translationKey: 'memory_game', icon: '🎴' }
    ]
  };

  // Playlist - Classical Music Collection
  playlist: Track[] = [
    {
      id: 1,
      title: 'Air',
      artist: 'Johann Sebastian Bach',
      duration: '3:45',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Air - Johann Sebastian Bach.mp3'
    },
    {
      id: 2,
      title: 'Für Elise',
      artist: 'Ludwig van Beethoven',
      duration: '3:20',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Beethoven - Für Elise.mp3'
    },
    {
      id: 3,
      title: '5th Symphony',
      artist: 'Ludwig van Beethoven',
      duration: '8:45',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Beethoven\'s 5th Symphony.mp3'
    },
    {
      id: 4,
      title: 'Nocturne op.9 No.2',
      artist: 'Frédéric Chopin',
      duration: '4:20',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Chopin - Nocturne op.9 No.2.mp3'
    },
    {
      id: 5,
      title: 'Clair de Lune',
      artist: 'Claude Debussy',
      duration: '5:10',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Debussy - Clair de Lune.mp3'
    },
    {
      id: 6,
      title: 'Waltz No. 2',
      artist: 'Dmitri Shostakovich',
      duration: '3:30',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Dmitri Shostakovich - Waltz No. 2.mp3'
    },
    {
      id: 7,
      title: 'Waltz of Love',
      artist: 'Eugen Doga',
      duration: '4:15',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Eugen Doga - Waltz of Love.mp3'
    },
    {
      id: 8,
      title: 'Liebestraum No. 3 (Love Dream)',
      artist: 'Franz Liszt',
      duration: '4:50',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Liszt - Liebestraum No. 3 (Love Dream).mp3'
    },
    {
      id: 9,
      title: 'Lacrimosa',
      artist: 'Wolfgang Amadeus Mozart',
      duration: '3:40',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Mozart - Lacrimosa.mp3'
    },
    {
      id: 10,
      title: 'Piano Concerto No. 21 - Andante',
      artist: 'Wolfgang Amadeus Mozart',
      duration: '6:25',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Mozart - Piano Concerto No. 21 - Andante.mp3'
    },
    {
      id: 11,
      title: 'Canon In D Major',
      artist: 'Johann Pachelbel',
      duration: '5:15',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Pachelbel - Canon In D Major. Best version..mp3'
    },
    {
      id: 12,
      title: 'La Campanella',
      artist: 'Paganini/Liszt',
      duration: '4:40',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/PaganiniLiszt - La Campanella.mp3'
    },
    {
      id: 13,
      title: 'Por una Cabeza',
      artist: 'Carlos Gardel',
      duration: '3:25',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Por una Cabeza - Carlos Gardel.mp3'
    },
    {
      id: 14,
      title: 'Ballade Pour Adeline',
      artist: 'Richard Clayderman',
      duration: '3:55',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Richard Clayderman - Ballade Pour Adeline.mp3'
    },
    {
      id: 15,
      title: 'Serenade',
      artist: 'Franz Schubert',
      duration: '4:10',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Schubert - Serenade.mp3'
    },
    {
      id: 16,
      title: 'Spring Waltz (Mariage d\'Amour)',
      artist: 'Paul de Senneville',
      duration: '3:20',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Spring Waltz (Mariage d\'Amour).mp3'
    },
    {
      id: 17,
      title: 'Swan Lake',
      artist: 'Pyotr Ilyich Tchaikovsky',
      duration: '7:30',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Tchaikovsky Swan Lake.mp3'
    },
    {
      id: 18,
      title: 'Pas de Deux (The Nutcracker)',
      artist: 'Pyotr Ilyich Tchaikovsky',
      duration: '6:15',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Tchaikovsky - Pas de Deux (\'The Nutcracker\').mp3'
    },
    {
      id: 19,
      title: 'Waltz of the Flowers',
      artist: 'Pyotr Ilyich Tchaikovsky',
      duration: '6:45',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Tchaikovsky - Waltz of the Flowers.mp3'
    },
    {
      id: 20,
      title: 'The Godfather Theme Song',
      artist: 'Nino Rota',
      duration: '3:40',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/The Godfather Theme Song.mp3'
    },
    {
      id: 21,
      title: 'Première Gymnopédie',
      artist: 'Erik Satie',
      duration: '3:30',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Trois Gymnopédies - Première Gymnopédie.mp3'
    },
    {
      id: 22,
      title: 'Four Seasons (Winter)',
      artist: 'Antonio Vivaldi',
      duration: '8:20',
      url: 'https://brain-power-app.s3.eu-north-1.amazonaws.com/music/Vivaldi - Four Seasons (Winter).mp3'
    },
  ];

  constructor(
    private router: Router,
    private location: Location,
    public translateService: TranslateService
  ) {}

  ngOnInit() {
    // Clear any cached activity data to ensure fresh start
    this.clearCachedActivityData();
    
    // Override the browser back button behavior
    this.setupCustomBackButton();
  }

  clearCachedActivityData() {
    // Clear any cached activity selections that might interfere
    localStorage.removeItem('selectedActivity');
    localStorage.removeItem('selectedSpecificActivity');
    localStorage.removeItem('showFullText');
  }

  setupCustomBackButton() {
    // Save the original back function
    const originalBack = this.location.back.bind(this.location);
    
    // Override with custom logic
    this.location.back = () => {
      this.handleCustomBack(originalBack);
    };
  }

  handleCustomBack(originalBack: () => void) {
    if (this.showFullText) {
      // If showing text, go back to activity selection
      this.closeFullText();
    } else if (this.selectedActivity) {
      // If in activity selection, go back to main activities
      this.goBackToMainActivities();
    } else {
      // Otherwise, use normal back navigation
      originalBack();
    }
  }

  get currentTrack(): Track | null {
    return this.playlist[this.currentTrackIndex] || null;
  }

  onAudioLoaded() {
    const audio = this.audioPlayer.nativeElement;
    this.duration = audio.duration;
    audio.volume = this.volume / 100;
  }

  onTimeUpdate() {
    const audio = this.audioPlayer.nativeElement;
    this.currentTime = audio.currentTime;
    this.progressPercentage = (this.currentTime / this.duration) * 100;
    
    // Update CSS custom property for progress bar
    const progressBar = document.querySelector('.progress-bar-fill') as HTMLElement;
    if (progressBar) {
      progressBar.style.setProperty('--progress-width', this.progressPercentage.toString());
    }
  }

  onPlay() {
    this.isPlaying = true;
  }

  onPause() {
    this.isPlaying = false;
  }

  onTrackEnded() {
    // Mark current track as played
    this.playedTracks.add(this.currentTrackIndex);
    this.updateSessionProgress();
    
    // Auto-play next track if available
    if (this.currentTrackIndex < this.playlist.length - 1) {
      this.nextTrack();
    } else {
      // All tracks completed
      this.showCongratulations = true;
      this.markMusicSessionCompleted();
    }
  }

  togglePlayPause() {
    const audio = this.audioPlayer.nativeElement;
    if (audio.paused) {
      audio.play().catch(err => console.error('Play error:', err));
    } else {
      audio.pause();
    }
    // Don't hide player when toggling from player controls - player stays visible
  }

  toggleMusicPlayer() {
    if (!this.showPlayer) {
      // Show player and start playing
      this.isHidingPlayer = false;
      this.showPlayer = true;
      const audio = this.audioPlayer.nativeElement;
      if (audio.paused) {
        audio.play().catch(err => console.error('Play error:', err));
      }
    } else {
      // If player is visible and playing, hide and stop (reset)
      // If player is visible and paused, just play
      const audio = this.audioPlayer.nativeElement;
      if (!audio.paused) {
        // Playing: hide and stop (reset to beginning)
        this.isHidingPlayer = true;
        // Wait for animation to complete before actually hiding
        setTimeout(() => {
          this.showPlayer = false;
          this.isHidingPlayer = false;
          audio.pause();
          audio.currentTime = 0; // Reset to beginning
          this.currentTime = 0;
          this.progressPercentage = 0;
        }, 400); // Match animation duration
      } else {
        // Paused: just play (keep player visible)
        audio.play().catch(err => console.error('Play error:', err));
      }
    }
  }

  togglePlayerCollapse() {
    this.isPlayerCollapsed = !this.isPlayerCollapsed;
  }

  previousTrack() {
    if (this.currentTrackIndex > 0) {
      this.currentTrackIndex--;
      this.playTrack();
    }
  }

  nextTrack() {
    if (this.currentTrackIndex < this.playlist.length - 1) {
      this.currentTrackIndex++;
      this.playTrack();
    }
  }

  selectTrack(index: number) {
    this.currentTrackIndex = index;
    this.playTrack();
  }

  playTrack() {
    setTimeout(() => {
      const audio = this.audioPlayer.nativeElement;
      audio.load();
      audio.play().catch(err => console.error('Play error:', err));
    }, 100);
  }

  seekTo(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    let percent = (event.clientX - rect.left) / rect.width;
    
    // For RTL, since container is flipped with scaleX(-1), we need to reverse the percentage
    if (this.translateService.lang === 'he') {
      percent = 1 - percent;
    }
    
    const audio = this.audioPlayer.nativeElement;
    audio.currentTime = percent * this.duration;
  }

  onVolumeChange() {
    const audio = this.audioPlayer.nativeElement;
    audio.volume = this.volume / 100;
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  updateSessionProgress() {
    this.sessionProgress = (this.playedTracks.size / this.playlist.length) * 100;
  }

  markMusicSessionCompleted() {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('musicSessionCompleted', today);
  }

  selectActivity(activity: string) {
    this.selectedActivity = activity;
    localStorage.setItem('selectedActivity', activity);
    console.log('Selected activity:', activity);
    console.log('Writing sub-activities:', this.subActivities.writing);
    
    // If nature_trips, automatically show the video without sub-activity selection
    if (activity === 'nature_trips') {
      this.selectedSubActivity = { id: 'nature_view', name: 'טיולים בטבע', translationKey: 'nature_trips', icon: '🌿' };
      this.showFullText = true;
      
      // Start playing music
      if (!this.isPlaying) {
        const audio = this.audioPlayer.nativeElement;
        audio.play().catch(err => console.error('Play error:', err));
      }
    }
  }

  selectSubActivity(subActivityId: string) {
    const fullActivityId = `${this.selectedActivity}_${subActivityId}`;
    localStorage.setItem('selectedSubActivity', fullActivityId);
    console.log('Selected sub-activity:', fullActivityId);
    // Start the music session with this specific activity
    this.playTrack();
  }

  goBackToMainActivities() {
    this.selectedActivity = null;
  }

  getSelectedActivityTitle(): string {
    switch (this.selectedActivity) {
      case 'nature_trips': return this.translateService.t('nature_trips');
      case 'reading': return this.translateService.t('reading');
      case 'writing': return this.translateService.t('writing');
      case 'slides': return this.translateService.t('changing_slides');
      case 'objects': return this.translateService.t('identify_objects');
      default: return '';
    }
  }

  getSubActivities(): any[] {
    if (!this.selectedActivity) return [];
    return this.subActivities[this.selectedActivity as keyof typeof this.subActivities] || [];
  }

  getSpecificActivityOptions(): any[] {
    return this.getSubActivities();
  }

  selectSpecificActivity(option: any) {
    this.selectedSubActivity = option;
    this.showFullText = true;
    localStorage.setItem('selectedSpecificActivity', JSON.stringify(option));
    console.log('Selected specific activity:', option);
    
    // Initialize games if selected
    if (option.id === 'connect_dots') {
      setTimeout(() => {
        this.initConnectDotsGame();
      }, 100);
    } else if (option.id === 'solve_maze') {
      setTimeout(() => {
        this.initMazeGame();
      }, 100);
    }
    
    // Restore scroll position and reading progress after view is rendered
    setTimeout(() => {
      this.restoreScrollPosition();
      this.restoreVideoTimestamp();
    }, 100);
    
    // Start playing music from where it was paused
    if (!this.isPlaying) {
      const audio = this.audioPlayer.nativeElement;
      audio.play().catch(err => console.error('Play error:', err));
    }
  }

  closeFullText() {
    this.saveScrollPosition();
    this.saveVideoTimestamp();
    this.showFullText = false;
    this.selectedSubActivity = null;
  }

  saveScrollPosition() {
    if (this.textContent && this.selectedSubActivity) {
      const element = this.textContent.nativeElement;
      const scrollTop = element.scrollTop;
      const key = `scroll_${this.selectedActivity}_${this.selectedSubActivity.id}`;
      localStorage.setItem(key, scrollTop.toString());
      
      // Also save reading progress
      const progressKey = `progress_${this.selectedActivity}_${this.selectedSubActivity.id}`;
      localStorage.setItem(progressKey, this.readingProgress.toString());
    }
  }

  restoreScrollPosition() {
    if (this.textContent && this.selectedSubActivity) {
      const key = `scroll_${this.selectedActivity}_${this.selectedSubActivity.id}`;
      const savedScroll = localStorage.getItem(key);
      
      // Restore reading progress
      const progressKey = `progress_${this.selectedActivity}_${this.selectedSubActivity.id}`;
      const savedProgress = localStorage.getItem(progressKey);
      if (savedProgress) {
        this.readingProgress = parseInt(savedProgress, 10);
      }
      
      if (savedScroll) {
        const element = this.textContent.nativeElement;
        element.scrollTop = parseInt(savedScroll, 10);
      }
    }
  }

  saveVideoTimestamp() {
    if (this.backgroundVideo && this.selectedSubActivity) {
      const video = this.backgroundVideo.nativeElement;
      const currentTime = video.currentTime;
      const key = `video_${this.selectedActivity}_${this.selectedSubActivity.id}`;
      localStorage.setItem(key, currentTime.toString());
    }
  }

  restoreVideoTimestamp() {
    if (this.backgroundVideo && this.selectedSubActivity) {
      const key = `video_${this.selectedActivity}_${this.selectedSubActivity.id}`;
      const savedTime = localStorage.getItem(key);
      
      if (savedTime) {
        const video = this.backgroundVideo.nativeElement;
        video.currentTime = parseFloat(savedTime);
      }
    }
  }

  onTextScroll(event: Event) {
    const element = event.target as HTMLElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    if (scrollHeight <= clientHeight) {
      this.readingProgress = 100;
    } else {
      const newProgress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      // Only update if new progress is greater than current (don't go backwards)
      if (newProgress > this.readingProgress) {
        this.readingProgress = newProgress;
        
        // Update individual activity progress
        if (this.selectedActivity && this.selectedSubActivity) {
          const activityKey = `${this.selectedActivity}_${this.selectedSubActivity.id}`;
          this.activityProgress[activityKey] = this.readingProgress;
          
          // Save to localStorage
          localStorage.setItem(`progress_${activityKey}`, this.readingProgress.toString());
          
          // Check if activity is completed (100%)
          if (this.readingProgress >= 100) {
            this.completedActivities.add(activityKey);
            this.showCongratulations = true;
            
            // Mark the entire music session as completed when any activity is completed
            this.markMusicSessionCompleted();
            
            // Hide congratulations after 3 seconds
            setTimeout(() => {
              this.showCongratulations = false;
            }, 3000);
          }
        }
      }
    }
  }

  shouldShowVideoBackground(): boolean {
    // Hide video background when in reading or writing activities with full text shown
    // Keep video visible for nature_trips
    if (this.showFullText && (this.selectedActivity === 'reading' || this.selectedActivity === 'writing')) {
      return false;
    }
    return true;
  }

  getBackgroundVideoUrl(): string {
    if (this.showFullText && this.selectedActivity === 'nature_trips') {
      return 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/The-Most-Beautiful-Earth-Scenes-Captured-Short-720p-Compressed.mp4';
    } else if (this.showFullText) {
      return 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Colors+Video+Background+480P.mp4';
    }
    return 'https://brain-power-app.s3.eu-north-1.amazonaws.com/Mozart-heb.mp4';
  }

  getActivityText(): string {
    if (!this.selectedSubActivity) return '';
    
    // Games and nature trips don't have text content - return empty string
    if (this.selectedSubActivity.id === 'connect_dots' || 
        this.selectedSubActivity.id === 'solve_maze' ||
        this.selectedActivity === 'nature_trips') {
      return '';
    }
    
    // Return sample text based on activity
    const activityKey = `${this.selectedActivity}_${this.selectedSubActivity.id}_text`;
    return this.translateService.t(activityKey);
  }

  getActivityTitle(): string {
    // Show "סימון על מסך" when in writing sub-menu, otherwise show "בחרו פעילות"
    if (this.selectedActivity === 'writing' && !this.showFullText) {
      return 'סימון על המסך';
    }
    return this.translateService.t('choose_activity');
  }

  getTrackTitle(): string {
    if (!this.currentTrack) return '';
    
    // Try to get Hebrew translation if in Hebrew mode
    if (this.translateService.lang === 'he') {
      const translationKey = `song_${this.currentTrack.id}`;
      const translated = this.translateService.t(translationKey);
      // If translation exists (not the same as key), use it
      if (translated !== translationKey) {
        return translated;
      }
    }
    
    // Otherwise return original English title
    return this.currentTrack.title;
  }

  getArtistName(): string {
    if (!this.currentTrack) return '';
    
    // Try to get Hebrew translation if in Hebrew mode
    if (this.translateService.lang === 'he') {
      const translationKey = `artist_${this.currentTrack.id}`;
      const translated = this.translateService.t(translationKey);
      // If translation exists (not the same as key), use it
      if (translated !== translationKey) {
        return translated;
      }
    }
    
    // Otherwise return original English artist name
    return this.currentTrack.artist;
  }

  getActivityProgress(activity: string, subActivityId: string): number {
    const activityKey = `${activity}_${subActivityId}`;
    const savedProgress = localStorage.getItem(`progress_${activityKey}`);
    return savedProgress ? parseInt(savedProgress, 10) : 0;
  }

  isActivityCompleted(activity: string, subActivityId: string): boolean {
    const activityKey = `${activity}_${subActivityId}`;
    return this.completedActivities.has(activityKey) || this.getActivityProgress(activity, subActivityId) >= 100;
  }

  goBack() {
    this.router.navigate(['/lets-begin']);
  }

  ngOnDestroy() {
    // Save state when leaving the component
    if (this.showFullText) {
      this.saveScrollPosition();
      this.saveVideoTimestamp();
    }
  }

  // Connect the Dots Game Methods
  initConnectDotsGame() {
    if (!this.connectDotsCanvas) return;
    
    this.canvas = this.connectDotsCanvas.nativeElement;
    this.ctx = this.canvas.getContext('2d');
    
    if (!this.ctx) return;
    
    // Create dots for an open book shape - bigger and more sparse
    this.dots = [
      // Book spine (center binding)
      { x: 150, y: 20, number: 1, connected: false },   // Start - top of spine
      { x: 150, y: 60, number: 2, connected: false },   // Middle of spine
      { x: 150, y: 100, number: 3, connected: false },  // Center of spine
      { x: 150, y: 140, number: 4, connected: false },  // Lower spine
      { x: 150, y: 180, number: 5, connected: false },  // Bottom of spine
      
      // Left page outline
      { x: 50, y: 20, number: 6, connected: false },    // Top left corner
      { x: 20, y: 60, number: 7, connected: false },    // Left side top
      { x: 30, y: 100, number: 8, connected: false },   // Left side middle
      { x: 40, y: 140, number: 9, connected: false },   // Left side bottom
      { x: 60, y: 180, number: 10, connected: false },  // Bottom left corner
      
      // Right page outline
      { x: 250, y: 20, number: 11, connected: false },  // Top right corner
      { x: 280, y: 60, number: 12, connected: false },  // Right side top
      { x: 270, y: 100, number: 13, connected: false }, // Right side middle
      { x: 260, y: 140, number: 14, connected: false }, // Right side bottom
      { x: 240, y: 180, number: 15, connected: false }, // Bottom right corner
      
      // Left page content lines
      { x: 80, y: 40, number: 16, connected: false },   // Left page line 1
      { x: 70, y: 80, number: 17, connected: false },   // Left page line 2
      { x: 75, y: 120, number: 18, connected: false },  // Left page line 3
      { x: 85, y: 160, number: 19, connected: false },  // Left page line 4
      
      // Right page content lines
      { x: 220, y: 40, number: 20, connected: false },  // Right page line 1
      { x: 230, y: 80, number: 21, connected: false },  // Right page line 2
      { x: 225, y: 120, number: 22, connected: false }  // Right page line 3
    ];
    
    this.lines = [];
    this.currentDotIndex = 0;
    this.connectDotsProgress = 0;
    
    this.drawConnectDots();
  }

  drawConnectDots() {
    if (!this.ctx || !this.canvas) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw completed lines
    this.ctx.strokeStyle = '#ff6b35';
    this.ctx.lineWidth = 3;
    this.ctx.setLineDash([]);
    
    this.lines.forEach(line => {
      this.ctx!.beginPath();
      this.ctx!.moveTo(line.start.x, line.start.y);
      this.ctx!.lineTo(line.end.x, line.end.y);
      this.ctx!.stroke();
    });
    
    // Draw dots with white fill - bigger sizes and bold numbers
    this.dots.forEach((dot, index) => {
      // First dot (dot 1) should be orange fill with larger size
      if (dot.number === 1) {
        this.ctx!.fillStyle = '#ff6b35';
        this.ctx!.strokeStyle = '#fff';
        this.ctx!.lineWidth = 3;
        
        this.ctx!.beginPath();
        this.ctx!.arc(dot.x, dot.y, 16, 0, 2 * Math.PI); // Bigger radius for first dot
        this.ctx!.fill();
        this.ctx!.stroke();
        
        // Draw number 1 in white - bold
        this.ctx!.fillStyle = '#fff';
        this.ctx!.font = 'bold 16px Arial';
        this.ctx!.textAlign = 'center';
        this.ctx!.textBaseline = 'middle';
        this.ctx!.fillText('1', dot.x, dot.y);
      } else if (dot.number === this.dots.length) {
        // Last dot should be more visible (green fill with larger size)
        this.ctx!.fillStyle = '#4CAF50';
        this.ctx!.strokeStyle = '#fff';
        this.ctx!.lineWidth = 3;
        
        this.ctx!.beginPath();
        this.ctx!.arc(dot.x, dot.y, 14, 0, 2 * Math.PI); // Bigger for last dot
        this.ctx!.fill();
        this.ctx!.stroke();
        
        // Draw number in white - bold
        this.ctx!.fillStyle = '#fff';
        this.ctx!.font = 'bold 15px Arial';
        this.ctx!.textAlign = 'center';
        this.ctx!.textBaseline = 'middle';
        this.ctx!.fillText(dot.number.toString(), dot.x, dot.y);
      } else {
        // Other dots are white fill - bigger
        this.ctx!.fillStyle = '#fff';
        this.ctx!.strokeStyle = '#333';
        this.ctx!.lineWidth = 3;
        
        this.ctx!.beginPath();
        this.ctx!.arc(dot.x, dot.y, 12, 0, 2 * Math.PI); // Bigger radius
        this.ctx!.fill();
        this.ctx!.stroke();
        
        // Draw numbers in dark text - bold
        this.ctx!.fillStyle = '#333';
        this.ctx!.font = 'bold 14px Arial';
        this.ctx!.textAlign = 'center';
        this.ctx!.textBaseline = 'middle';
        this.ctx!.fillText(dot.number.toString(), dot.x, dot.y);
      }
    });
  }

  getCanvasPosition(event: MouseEvent | TouchEvent): { x: number, y: number } {
    if (!this.canvas) return { x: 0, y: 0 };
    
    const rect = this.canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      // For touch events, use touches[0] if available, otherwise use changedTouches[0]
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else {
        return { x: 0, y: 0 };
      }
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  onCanvasMouseDown(event: MouseEvent) {
    this.handleCanvasStart(event);
  }

  onCanvasTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.handleCanvasStart(event);
  }

  handleCanvasStart(event: MouseEvent | TouchEvent) {
    const pos = this.getCanvasPosition(event);
    const clickedDot = this.getDotAtPosition(pos.x, pos.y);
    
    // Start drawing from the correct next dot (currentDotIndex is 0-based, dots are 1-based)
    if (clickedDot && clickedDot.number === this.currentDotIndex + 1) {
      this.isDrawing = true;
      this.startDot = clickedDot;
      this.drawConnectDots();
    }
  }

  onCanvasMouseMove(event: MouseEvent) {
    if (this.isDrawing && this.startDot) {
      const pos = this.getCanvasPosition(event);
      
      // Check if we're over the next correct dot
      const endDot = this.getDotAtPosition(pos.x, pos.y);
      if (endDot && endDot.number === this.startDot.number + 1) {
        // Auto-connect to the next dot
        this.lines.push({
          start: { x: this.startDot.x, y: this.startDot.y },
          end: { x: endDot.x, y: endDot.y }
        });
        
        this.currentDotIndex = endDot.number - 1;
        this.updateConnectDotsProgress();
        
        // Check if game is complete
        if (this.currentDotIndex >= this.dots.length - 1) {
          this.connectDotsProgress = 100;
          this.onConnectDotsComplete();
          this.isDrawing = false;
          this.startDot = null;
        } else {
          // Continue from the connected dot
          this.startDot = endDot;
        }
        
        this.drawConnectDots();
      } else {
        // Draw temporary line from start dot to current position
        this.drawConnectDots();
        if (this.ctx) {
          this.ctx.strokeStyle = '#ff6b35';
          this.ctx.lineWidth = 3;
          this.ctx.setLineDash([5, 5]);
          this.ctx.beginPath();
          this.ctx.moveTo(this.startDot.x, this.startDot.y);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
    }
  }

  onCanvasTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (this.isDrawing && this.startDot) {
      const pos = this.getCanvasPosition(event);
      
      // Check if we're over the next correct dot
      const endDot = this.getDotAtPosition(pos.x, pos.y);
      if (endDot && endDot.number === this.startDot.number + 1) {
        // Auto-connect to the next dot
        this.lines.push({
          start: { x: this.startDot.x, y: this.startDot.y },
          end: { x: endDot.x, y: endDot.y }
        });
        
        this.currentDotIndex = endDot.number - 1;
        this.updateConnectDotsProgress();
        
        // Check if game is complete
        if (this.currentDotIndex >= this.dots.length - 1) {
          this.connectDotsProgress = 100;
          this.onConnectDotsComplete();
          this.isDrawing = false;
          this.startDot = null;
        } else {
          // Continue from the connected dot
          this.startDot = endDot;
        }
        
        this.drawConnectDots();
      } else {
        // Draw temporary line from start dot to current position
        this.drawConnectDots();
        if (this.ctx) {
          this.ctx.strokeStyle = '#ff6b35';
          this.ctx.lineWidth = 3;
          this.ctx.setLineDash([5, 5]);
          this.ctx.beginPath();
          this.ctx.moveTo(this.startDot.x, this.startDot.y);
          this.ctx.lineTo(pos.x, pos.y);
          this.ctx.stroke();
          this.ctx.setLineDash([]);
        }
      }
    }
  }

  onCanvasMouseUp(event: MouseEvent) {
    this.handleCanvasEnd(event);
  }

  onCanvasTouchEnd(event: TouchEvent) {
    event.preventDefault();
    this.handleCanvasEnd(event);
  }

  handleCanvasEnd(event: MouseEvent | TouchEvent) {
    if (this.isDrawing && this.startDot) {
      const pos = this.getCanvasPosition(event);
      const endDot = this.getDotAtPosition(pos.x, pos.y);
      
      // Check if we're connecting to the next correct dot
      if (endDot && endDot.number === this.startDot.number + 1) {
        // Create a straight line between the dots
        this.lines.push({
          start: { x: this.startDot.x, y: this.startDot.y },
          end: { x: endDot.x, y: endDot.y }
        });
        
        this.currentDotIndex = endDot.number - 1; // Convert to 0-based index
        this.updateConnectDotsProgress();
        this.drawConnectDots();
        
        // Check if game is complete
        if (this.currentDotIndex >= this.dots.length - 1) {
          this.connectDotsProgress = 100;
          this.onConnectDotsComplete();
          this.isDrawing = false;
          this.startDot = null;
        } else {
          // Continue drawing from the connected dot
          this.startDot = endDot;
          // Don't reset isDrawing - keep drawing continuously
        }
      } else {
        // If not connecting to correct dot, stop drawing
        this.isDrawing = false;
        this.startDot = null;
      }
    }
  }

  getDotAtPosition(x: number, y: number) {
    const threshold = 35; // Larger threshold for easier dot detection, especially for last dot
    return this.dots.find(dot => 
      Math.abs(dot.x - x) < threshold && Math.abs(dot.y - y) < threshold
    );
  }

  updateConnectDotsProgress() {
    // Fix: currentDotIndex is 0-based, so we need to add 1 to get the actual connected dots count
    const connectedDots = this.currentDotIndex + 1;
    this.connectDotsProgress = Math.round((connectedDots / this.dots.length) * 100);
    
    // Update activity progress
    if (this.selectedActivity && this.selectedSubActivity) {
      const activityKey = `${this.selectedActivity}_${this.selectedSubActivity.id}`;
      this.activityProgress[activityKey] = this.connectDotsProgress;
      localStorage.setItem(`progress_${activityKey}`, this.connectDotsProgress.toString());
    }
  }

  onConnectDotsComplete() {
    this.showCongratulations = true;
    
    if (this.selectedActivity && this.selectedSubActivity) {
      const activityKey = `${this.selectedActivity}_${this.selectedSubActivity.id}`;
      this.completedActivities.add(activityKey);
    }
    
    // Mark the entire music session as completed when any activity is completed
    this.markMusicSessionCompleted();
    
    setTimeout(() => {
      this.showCongratulations = false;
    }, 3000);
  }

  resetConnectDotsGame() {
    this.currentDotIndex = 0;
    this.connectDotsProgress = 0;
    this.lines = [];
    this.startDot = null;
    this.isDrawing = false;
    this.drawConnectDots();
    this.updateConnectDotsProgress();
  }

  // Maze Game Methods
  initMazeGame() {
    if (!this.mazeCanvas) return;
    
    this.mazeCanvasElement = this.mazeCanvas.nativeElement;
    this.mazeCtx = this.mazeCanvasElement.getContext('2d');
    
    if (!this.mazeCtx) return;
    
    this.mazePath = [];
    this.mazeCompletedPaths = [];
    this.mazeProgress = 0;
    this.isDrawingMaze = false;
    
    // Load the maze image
    this.loadMazeImage();
  }
  
  loadMazeImage() {
    this.mazeImage = new Image();
    this.mazeImage.onload = () => {
      if (this.mazeCtx && this.mazeCanvasElement && this.mazeImage) {
        // Scale down the image to a reasonable size
        const maxWidth = 700;
        const maxHeight = 560;
        let width = this.mazeImage.width;
        let height = this.mazeImage.height;
        
        // Calculate scaling to fit within max dimensions
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
        
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
        
        // Set canvas to scaled dimensions
        this.mazeCanvasElement.width = width;
        this.mazeCanvasElement.height = height;
        
        // Draw the scaled image
        this.mazeCtx.drawImage(this.mazeImage, 0, 0, width, height);
        this.mazeImageData = this.mazeCtx.getImageData(0, 0, width, height);
        
        // Detect start and end positions from the scaled image
        this.detectMazeStartEnd();
        
        // Redraw to show the maze
        this.drawMaze();
      }
    };
    this.mazeImage.onerror = () => {
      console.error('Failed to load maze image from:', this.mazeImageUrl);
    };
    this.mazeImage.src = this.mazeImageUrl;
  }
  
  detectMazeStartEnd() {
    if (!this.mazeImageData) return;
    
    const data = this.mazeImageData.data;
    const width = this.mazeImageData.width;
    const height = this.mazeImageData.height;
    
    let startFound = false;
    let endFound = false;
    
    // Look for green pixel (start) and red pixel (end)
    // Green: RGB(0, 255, 0) or similar
    // Red: RGB(255, 0, 0) or similar
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Detect green (start position)
        if (g > 200 && r < 100 && b < 100) {
          this.mazeStartPosition = { x, y };
          startFound = true;
        }
        
        // Detect red (end position)
        if (r > 200 && g < 100 && b < 100) {
          this.mazeEndPosition = { x, y };
          endFound = true;
        }
      }
    }
    
    // Fallback to default positions if not found in image
    if (!startFound) {
      this.mazeStartPosition = { x: 20, y: 20 };
      console.warn('Green start marker not found in maze image, using default position');
    }
    
    if (!endFound) {
      this.mazeEndPosition = { x: width - 20, y: height - 20 };
      console.warn('Red end marker not found in maze image, using default position');
    }
  }

  drawMaze() {
    if (!this.mazeCtx || !this.mazeCanvasElement || !this.mazeImage) return;
    const ctx = this.mazeCtx;
    ctx.clearRect(0, 0, this.mazeCanvasElement.width, this.mazeCanvasElement.height);
    
    // Draw the maze image as background (scaled to canvas size)
    ctx.drawImage(this.mazeImage, 0, 0, this.mazeCanvasElement.width, this.mazeCanvasElement.height);
    
    // Draw start/end circles on top of the image
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(this.mazeStartPosition.x, this.mazeStartPosition.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#F44336';
    ctx.beginPath();
    ctx.arc(this.mazeEndPosition.x, this.mazeEndPosition.y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Previously completed paths
    this.mazeCompletedPaths.forEach(path => {
      if (path.length > 1) {
        ctx.strokeStyle = '#2196F3';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
      }
    });

    // Current path being drawn
    if (this.mazePath.length > 1) {
      ctx.strokeStyle = '#FF9800';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.mazePath[0].x, this.mazePath[0].y);
      for (let i = 1; i < this.mazePath.length; i++) ctx.lineTo(this.mazePath[i].x, this.mazePath[i].y);
      ctx.stroke();
    }
  }


  onMazeMouseDown(event: MouseEvent) {
    this.handleMazeStart(event);
  }

  onMazeTouchStart(event: TouchEvent) {
    event.preventDefault();
    this.handleMazeStart(event);
  }

  handleMazeStart(event: MouseEvent | TouchEvent) {
    const pos = this.getMazeCanvasPosition(event);
    
    // Check if starting from the start circle (green circle) - only allowed for the first line
    const distanceFromStart = Math.sqrt(
      Math.pow(pos.x - this.mazeStartPosition.x, 2) + 
      Math.pow(pos.y - this.mazeStartPosition.y, 2)
    );
    
    // Check if actually touching/intersecting with any existing line
    let touchingExistingLine = false;
    this.mazeCompletedPaths.forEach(path => {
      for (let i = 0; i < path.length - 1; i++) {
        // Check distance from point to line segment
        const lineStart = path[i];
        const lineEnd = path[i + 1];
        const distance = this.distancePointToLineSegment(pos, lineStart, lineEnd);
        if (distance <= 5) { // Much smaller threshold - must actually be on the line
          touchingExistingLine = true;
          break;
        }
      }
    });
    
    // Allow starting from green circle only if no lines have been drawn yet
    const canStartFromGreenCircle = this.mazeCompletedPaths.length === 0 && distanceFromStart <= 15;
    
    if (canStartFromGreenCircle || touchingExistingLine) {
      this.mazePath = [pos];
      this.isDrawingMaze = true;
      this.updateMazeProgress();
      this.drawMaze();
    }
  }

  onMazeMouseMove(event: MouseEvent) {
    if (this.isDrawingMaze) {
      this.handleMazeMove(event);
    }
  }

  onMazeTouchMove(event: TouchEvent) {
    event.preventDefault();
    if (this.isDrawingMaze) {
      this.handleMazeMove(event);
    }
  }

  handleMazeMove(event: MouseEvent | TouchEvent) {
    if (!this.isDrawingMaze) return;
    
    const pos = this.getMazeCanvasPosition(event);
    
    // Check if the new position is close to the last point in the path (continuous drawing)
    if (this.mazePath.length > 0) {
      const lastPoint = this.mazePath[this.mazePath.length - 1];
      const distance = Math.sqrt(
        Math.pow(pos.x - lastPoint.x, 2) + 
        Math.pow(pos.y - lastPoint.y, 2)
      );
      
      // Only add point if it's close enough (continuous drawing)
      if (distance <= 20) {
        // Check if adding this point would create a collision with borders
        const testPath = [...this.mazePath, pos];
        if (!this.checkPathCollisionWithBorders(testPath)) {
          this.mazePath.push(pos);
          this.drawMaze();
          this.updateMazeProgress();
          
          // Check if reached the end
          if (Math.abs(pos.x - this.mazeEndPosition.x) < 15 && Math.abs(pos.y - this.mazeEndPosition.y) < 15) {
            this.mazeProgress = 100;
            this.onMazeComplete();
          }
        } else {
          // Stop drawing if we hit a border
          console.log('Hit border - stopping line');
          this.handleMazeEnd();
        }
      }
    }
  }

  onMazeMouseUp(event: MouseEvent) {
    this.handleMazeEnd();
  }

  onMazeTouchEnd(event: TouchEvent) {
    event.preventDefault();
    this.handleMazeEnd();
  }

  handleMazeEnd() {
    if (this.isDrawingMaze && this.mazePath.length > 1) {
      // Check if the path collides with any borders
      if (this.checkPathCollisionWithBorders(this.mazePath)) {
        // Path is invalid - erase it by not saving it
        console.log('Invalid path - touches border, erasing...');
      } else {
        // Path is valid - save it
        this.mazeCompletedPaths.push([...this.mazePath]);
      }
      
      // Reset current path
      this.mazePath = [];
      this.isDrawingMaze = false;
      this.drawMaze();
    }
  }

  getMazeCanvasPosition(event: MouseEvent | TouchEvent): { x: number, y: number } {
    if (!this.mazeCanvasElement) return { x: 0, y: 0 };
    
    const rect = this.mazeCanvasElement.getBoundingClientRect();
    let clientX: number, clientY: number;
    
    if ('touches' in event) {
      // For touch events, use touches[0] if available, otherwise use changedTouches[0]
      if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else {
        return { x: 0, y: 0 };
      }
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Calculate position relative to canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Scale the coordinates to match the canvas internal dimensions
    const scaleX = this.mazeCanvasElement.width / rect.width;
    const scaleY = this.mazeCanvasElement.height / rect.height;
    
    return {
      x: x * scaleX,
      y: y * scaleY
    };
  }

  // Helper function to calculate distance from a point to a line segment
  distancePointToLineSegment(point: {x: number, y: number}, lineStart: {x: number, y: number}, lineEnd: {x: number, y: number}): number {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Line start and end are the same point
      return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Check if a drawn path intersects with any maze borders
  checkPathCollisionWithBorders(path: Array<{x: number, y: number}>): boolean {
    return this.checkPathCollisionWithImage(path);
  }
  
  // Check if path collides with dark pixels in the maze image
  checkPathCollisionWithImage(path: Array<{x: number, y: number}>): boolean {
    if (!this.mazeImageData) return false;
    
    const data = this.mazeImageData.data;
    const width = this.mazeImageData.width;
    const height = this.mazeImageData.height;
    
    // Check each segment of the path
    for (let i = 0; i < path.length - 1; i++) {
      const start = path[i];
      const end = path[i + 1];
      
      // Interpolate points between start and end to check entire line
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
      );
      const steps = Math.ceil(distance);
      
      for (let step = 0; step <= steps; step++) {
        const t = step / steps;
        const x = Math.round(start.x + (end.x - start.x) * t);
        const y = Math.round(start.y + (end.y - start.y) * t);
        
        // Skip out of bounds points
        if (x < 0 || x >= width || y < 0 || y >= height) {
          continue;
        }
        
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // Check if this pixel is a wall (dark color, not green or red)
        const isGreen = g > 200 && r < 100 && b < 100;
        const isRed = r > 200 && g < 100 && b < 100;
        const isDark = r < 128 && g < 128 && b < 128;
        
        if (isDark && !isGreen && !isRed) {
          return true; // Hit a wall
        }
      }
    }
    
    return false; // No collision
  }

  updateMazeProgress() {
    // Calculate progress based on path length and complexity
    const maxPathLength = 200;
    this.mazeProgress = Math.min(Math.round((this.mazePath.length / maxPathLength) * 100), 100);
    
    // Update activity progress
    if (this.selectedActivity && this.selectedSubActivity) {
      const activityKey = `${this.selectedActivity}_${this.selectedSubActivity.id}`;
      this.activityProgress[activityKey] = this.mazeProgress;
      localStorage.setItem(`progress_${activityKey}`, this.mazeProgress.toString());
    }
  }

  onMazeComplete() {
    this.mazeProgress = 100;
    this.showCongratulations = true;
    
    if (this.selectedActivity && this.selectedSubActivity) {
      const activityKey = `${this.selectedActivity}_${this.selectedSubActivity.id}`;
      this.completedActivities.add(activityKey);
      this.activityProgress[activityKey] = 100;
      localStorage.setItem(`progress_${activityKey}`, '100');
    }
    
    // Mark the entire music session as completed when any activity is completed
    this.markMusicSessionCompleted();
    
    setTimeout(() => {
      this.showCongratulations = false;
    }, 3000);
  }

  resetMazeGame() {
    this.mazePath = [];
    this.mazeCompletedPaths = [];
    this.mazeProgress = 0;
    this.isDrawingMaze = false;
    this.drawMaze();
    this.updateMazeProgress();
  }
}


