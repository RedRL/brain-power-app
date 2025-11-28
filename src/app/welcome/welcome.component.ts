import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';
import { TPipe } from '../shared/pipes/t.pipe';

@Component({
  standalone: true,
  selector: 'app-welcome',
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css']
})
export class WelcomeComponent implements OnInit {
  name = '';
  showDemoPopup = false;

  constructor(private router: Router) {
    try {
      const p = JSON.parse(localStorage.getItem('profile') || '{}');
      this.name = p?.fullName || '';
    } catch {}
  }

  ngOnInit() {
    // Check if this is first signup (user hasn't seen demo popup before)
    const hasSeenDemoPopup = localStorage.getItem('hasSeenDemoPopup');
    if (!hasSeenDemoPopup) {
      this.showDemoPopup = true;
    }
  }

  watchDemo() {
    localStorage.setItem('hasSeenDemoPopup', 'true');
    this.showDemoPopup = false;
    this.router.navigate(['/intro-daily-routine']);
  }

  skipDemo() {
    localStorage.setItem('hasSeenDemoPopup', 'true');
    this.showDemoPopup = false;
  }

  continue() { 
    this.router.navigate(['/home']); 
  }
}
