import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-feldenkrais-options',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './feldenkrais-options.component.html',
  styleUrls: ['./feldenkrais-options.component.scss']
})
export class FeldenkraisOptionsComponent {
  constructor(private router: Router) {}

  selectOption(type: 'youtube' | 'ai-youtube' | 'ai-video') {
    this.router.navigate(['/feldenkrais-session'], {
      queryParams: { type }
    });
  }
}
