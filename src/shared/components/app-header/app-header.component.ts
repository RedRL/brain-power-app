import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { TPipe } from '../../../app/shared/pipes/t.pipe';
import { TranslateService } from '../../../app/shared/services/translate.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, TPipe],
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.css']
})
export class AppHeaderComponent implements OnInit, OnChanges {
  @Input() title = '';
  @Input() showBack = true;  // hide on Home
  @Input() showHome = true;  // hide on Home
  @Input() showUserInfo = false;  // show user info on home page

  userName = '';
  isGuest = false;

  constructor(
    private router: Router, 
    private location: Location,
    private translateService: TranslateService
  ) {
    // Listen for route changes to refresh user info
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if ((event as NavigationEnd).url === '/home' && this.showUserInfo) {
          this.loadUserInfo();
        }
      });
  }

  ngOnInit() {
    if (this.showUserInfo) {
      this.loadUserInfo();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['showUserInfo'] && this.showUserInfo) {
      this.loadUserInfo();
    }
  }

  loadUserInfo() {
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}');
      // Use firstName only, fall back to fullName if firstName not available
      this.userName = profile?.firstName || profile?.fullName?.split(' ')[0] || '';
      this.isGuest = localStorage.getItem('guest') === 'true';
    } catch {
      this.userName = '';
      this.isGuest = false;
    }
  }

  goBack() { 
    if (!this.showBack) return;
    
    const currentUrl = this.router.url;
    
    // Define navigation hierarchy based on routes
    if (currentUrl === '/lets-begin') {
      // From "Let's Begin" page, go back to home (main menu)
      this.router.navigate(['/home']);
    } else if (currentUrl.startsWith('/breathing-session') || 
               currentUrl.startsWith('/feldenkrais-session') || 
               currentUrl.startsWith('/memory-game') ||
               currentUrl.startsWith('/music-session') ||
               currentUrl.startsWith('/breathing-options') ||
               currentUrl.startsWith('/feldenkrais-options') ||
               currentUrl.startsWith('/game-options')) {
      // From exercise/option pages, go back to "Let's Begin"
      this.router.navigate(['/lets-begin']);
    } else if (currentUrl.startsWith('/intro-daily-routine') ||
               currentUrl.startsWith('/ai-assistant') ||
               currentUrl.startsWith('/goals') ||
               currentUrl.startsWith('/knowledge') ||
               currentUrl.startsWith('/contact') ||
               currentUrl.startsWith('/personal-info') ||
               currentUrl.startsWith('/settings')) {
      // From other pages accessible from home, go back to home
      this.router.navigate(['/home']);
    } else {
      // Fallback to browser history for other routes
      this.location.back();
    }
  }
  
  goHome() { if (this.showHome) this.router.navigate(['/home']); }
  goToPersonalInfo() { this.router.navigate(['/personal-info']); }
} 