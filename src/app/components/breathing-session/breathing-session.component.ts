import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';

@Component({
  selector: 'app-breathing-session',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './breathing-session.component.html',
  styleUrls: ['./breathing-session.component.scss']
})
export class BreathingSessionComponent implements OnInit {
  @ViewChild('breathingVideo') breathingVideo!: ElementRef<HTMLVideoElement>;
  
  maxWatchedTime = 0;
  currentTime = 0;
  duration = 0;
  progressPercentage = 0;
  showCongratulations = false;
  isPlaying = false;
  isFullscreen = false;
  videoType: string = 'youtube';
  videoUrl: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public translateService: TranslateService
  ) {}

  ngOnInit() {
    // Get video type from route query params
    this.route.queryParams.subscribe(params => {
      this.videoType = params['type'] || 'youtube';
      this.setVideoUrl();
    });
  }

  setVideoUrl() {
    switch (this.videoType) {
      case 'youtube':
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Chair+Yoga++Beginners+Breathwork+%26+Meditation+for+Seniors.mp4';
        break;
      case 'ai-youtube':
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Chair+Yoga++Beginners+Breathwork+%26+Meditation+for+Seniors.mp4';
        break;
      case 'ai-video':
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Sporty+Redhead+Breathing+Exercise.mp4';
        break;
      default:
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Chair+Yoga++Beginners+Breathwork+%26+Meditation+for+Seniors.mp4';
    }
  }

  onVideoLoaded() {
    const video = this.breathingVideo.nativeElement;
    this.duration = video.duration;
    console.log('Video loaded. Duration:', this.duration);
  }

  onVideoError(event: any) {
    console.error('Video error:', event);
    console.error('Error details:', event.target.error);
  }

  onTimeUpdate() {
    const video = this.breathingVideo.nativeElement;
    this.currentTime = video.currentTime;
    
    // Update max watched time (only moves forward)
    if (this.currentTime > this.maxWatchedTime) {
      this.maxWatchedTime = this.currentTime;
    }
    
    // Calculate progress percentage based on max watched time
    this.progressPercentage = (this.maxWatchedTime / this.duration) * 100;
    
    // Check if video is completed (watched to the end)
    if (this.maxWatchedTime >= this.duration - 1 && !this.showCongratulations) {
      this.showCongratulations = true;
      this.markBreathingSessionCompleted();
    }
  }

  onPlay() {
    this.isPlaying = true;
  }

  onPause() {
    this.isPlaying = false;
  }

  togglePlayPause() {
    const video = this.breathingVideo.nativeElement;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  rewind5Seconds() {
    const video = this.breathingVideo.nativeElement;
    video.currentTime = Math.max(0, video.currentTime - 5);
  }

  toggleFullscreen() {
    const container = document.querySelector('.video-wrapper') as HTMLElement;
    
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        this.isFullscreen = true;
      });
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen = false;
      });
    }
  }

  markBreathingSessionCompleted() {
    // Mark breathing session as completed for today
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('breathingSessionCompleted', today);
  }

  goBack() {
    this.router.navigate(['/lets-begin']);
  }
}
