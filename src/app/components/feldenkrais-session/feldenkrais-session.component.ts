import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';

@Component({
  selector: 'app-feldenkrais-session',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './feldenkrais-session.component.html',
  styleUrls: ['./feldenkrais-session.component.scss']
})
export class FeldenkraisSessionComponent implements OnInit {
  @ViewChild('feldenkraisVideo') feldenkraisVideo!: ElementRef<HTMLVideoElement>;
  
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
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Feldenkrais+lesson+one+person+vertical+compressed.mp4';
        break;
      case 'ai-youtube':
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Feldenkrais+lesson+brain+power+YouTube+to+AI.mp4';
        break;
      case 'ai-video':
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Feldenkrais+lesson+alien+1.mp4';
        break;
      default:
        this.videoUrl = 'https://brain-power-app.s3.eu-north-1.amazonaws.com/videos/Feldenkrais+lesson+one+person+vertical+compressed.mp4';
    }
  }

  onVideoLoaded() {
    const video = this.feldenkraisVideo.nativeElement;
    this.duration = video.duration;
    console.log('Video loaded. Duration:', this.duration);
  }

  onVideoError(event: any) {
    console.error('Video error:', event);
    console.error('Error details:', event.target.error);
  }

  onTimeUpdate() {
    const video = this.feldenkraisVideo.nativeElement;
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
      this.markFeldenkraisSessionCompleted();
    }
  }

  onPlay() {
    this.isPlaying = true;
  }

  onPause() {
    this.isPlaying = false;
  }

  togglePlayPause() {
    const video = this.feldenkraisVideo.nativeElement;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  rewind5Seconds() {
    const video = this.feldenkraisVideo.nativeElement;
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

  markFeldenkraisSessionCompleted() {
    // Mark Feldenkrais session as completed for today
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('feldenkraisSessionCompleted', today);
  }

  goBack() {
    this.router.navigate(['/lets-begin']);
  }
}
