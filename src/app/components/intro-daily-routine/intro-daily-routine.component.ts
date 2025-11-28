import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-intro-daily-routine',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './intro-daily-routine.component.html',
  styleUrls: ['./intro-daily-routine.component.scss']
})
export class IntroDailyRoutineComponent {
  playDemo() {
    // TODO: Implement demo video presentation
    // This will show a video presentation demonstrating how to use the app
    console.log('Play demo video');
    alert('Demo video will be shown here');
  }
}
