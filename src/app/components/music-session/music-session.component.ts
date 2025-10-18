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
  
  @ViewChild('textContent') textContent!: ElementRef<HTMLDivElement>;
  @ViewChild('backgroundVideo') backgroundVideo!: ElementRef<HTMLVideoElement>;
  
  // Sub-activities for each main activity
  subActivities = {
    reading: [
      { id: 'novel', name: 'Novel', translationKey: 'novel', icon: '📖' },
      { id: 'newspaper', name: 'Newspaper', translationKey: 'newspaper', icon: '📰' },
      { id: 'magazine', name: 'Magazine', translationKey: 'magazine', icon: '📚' },
      { id: 'article', name: 'Article', translationKey: 'article', icon: '📄' },
      { id: 'poetry', name: 'Poetry', translationKey: 'poetry', icon: '📜' }
    ],
    writing: [
      { id: 'journal', name: 'Journal', translationKey: 'journal', icon: '📔' },
      { id: 'letter', name: 'Letter', translationKey: 'letter', icon: '✉️' },
      { id: 'essay', name: 'Essay', translationKey: 'essay', icon: '📝' },
      { id: 'notes', name: 'Notes', translationKey: 'notes', icon: '🗒️' }
    ],
    slides: [
      { id: 'presentation', name: 'Presentation', translationKey: 'presentation', icon: '📊' },
      { id: 'study', name: 'Study Material', translationKey: 'study_material', icon: '📖' },
      { id: 'work', name: 'Work Slides', translationKey: 'work_slides', icon: '💼' },
      { id: 'lecture', name: 'Lecture Notes', translationKey: 'lecture_notes', icon: '🎓' }
    ],
    objects: [
      { id: 'puzzle', name: 'Puzzle', translationKey: 'puzzle', icon: '🧩' },
      { id: 'memory', name: 'Memory Game', translationKey: 'memory_game', icon: '🎴' },
      { id: 'spot', name: 'Spot Differences', translationKey: 'spot_differences', icon: '🔍' },
      { id: 'pattern', name: 'Pattern Recognition', translationKey: 'pattern_recognition', icon: '🎯' }
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
    // Override the browser back button behavior
    this.setupCustomBackButton();
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
      case 'reading': return this.translateService.t('reading');
      case 'writing': return this.translateService.t('writing');
      case 'slides': return this.translateService.t('changing_slides');
      case 'objects': return this.translateService.t('identify_objects');
      default: return '';
    }
  }

  getSpecificActivityOptions(): any[] {
    switch (this.selectedActivity) {
      case 'reading':
        return [
          { id: 'novel', name: this.translateService.t('novel'), icon: '📚' },
          { id: 'newspaper', name: this.translateService.t('newspaper'), icon: '📰' },
          { id: 'article', name: this.translateService.t('article'), icon: '📄' },
          { id: 'poetry', name: this.translateService.t('poetry'), icon: '📜' }
        ];
      case 'writing':
        return [
          { id: 'journal', name: this.translateService.t('journal'), icon: '📝' },
          { id: 'essay', name: this.translateService.t('essay'), icon: '✍️' },
          { id: 'letter', name: this.translateService.t('letter'), icon: '💌' },
          { id: 'story', name: this.translateService.t('story'), icon: '📖' }
        ];
      case 'slides':
        return [
          { id: 'presentation', name: this.translateService.t('presentation'), icon: '📊' },
          { id: 'slideshow', name: this.translateService.t('slideshow'), icon: '🎬' },
          { id: 'meeting', name: this.translateService.t('meeting'), icon: '👥' },
          { id: 'training', name: this.translateService.t('training'), icon: '🎓' }
        ];
      case 'objects':
        return [
          { id: 'shapes', name: this.translateService.t('shapes'), icon: '🔷' },
          { id: 'colors', name: this.translateService.t('colors'), icon: '🎨' },
          { id: 'patterns', name: this.translateService.t('patterns'), icon: '🌀' },
          { id: 'objects', name: this.translateService.t('objects'), icon: '🎯' }
        ];
      default:
        return [];
    }
  }

  selectSpecificActivity(option: any) {
    this.selectedSubActivity = option;
    this.showFullText = true;
    localStorage.setItem('selectedSpecificActivity', JSON.stringify(option));
    console.log('Selected specific activity:', option);
    
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
            
            // Hide congratulations after 3 seconds
            setTimeout(() => {
              this.showCongratulations = false;
            }, 3000);
          }
        }
      }
    }
  }

  getBackgroundVideoUrl(): string {
    if (this.showFullText) {
      return 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Colors+Video+Background+480P.mp4';
    }
    return 'https://brain-power-app.s3.eu-north-1.amazonaws.com/Mozart-heb.mp4';
  }

  getActivityText(): string {
    if (!this.selectedSubActivity) return '';
    
    // Return sample text based on activity
    const activityKey = `${this.selectedActivity}_${this.selectedSubActivity.id}_text`;
    return this.translateService.t(activityKey);
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
}


