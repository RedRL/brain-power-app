import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';

@Component({
  selector: 'app-game-options',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './game-options.component.html',
  styleUrls: ['./game-options.component.scss']
})
export class GameOptionsComponent {
  level: 'beginner' | 'advanced' | 'grand' = 'beginner';
  showLevelSelection: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.route.queryParams.subscribe(params => {
      this.level = params['level'] || 'beginner';
    });
  }

  selectMemoryGame() {
    this.showLevelSelection = true;
  }

  selectLevel(level: 'beginner' | 'advanced' | 'grand') {
    this.level = level;
    this.router.navigate(['/memory-game'], {
      queryParams: { level: this.level }
    });
  }

  goBack() {
    this.showLevelSelection = false;
  }
}





