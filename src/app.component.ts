import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, IonApp, IonRouterOutlet],
  template: `
    <ion-app>
      <ion-router-outlet></ion-router-outlet>
    </ion-app>
  `
})
export class AppComponent implements OnInit {
  title = 'brain-power';

  ngOnInit() {
    // Apply font size from localStorage on app initialization
    const storedFontSize = localStorage.getItem('fontSize');
    if (storedFontSize === 'small' || storedFontSize === 'medium' || storedFontSize === 'large' || storedFontSize === 'extra-large') {
      const root = document.documentElement;
      switch (storedFontSize) {
        case 'small':
          root.style.setProperty('--base-font-size', '14px');
          break;
        case 'medium':
          root.style.setProperty('--base-font-size', '18px');
          break;
        case 'large':
          root.style.setProperty('--base-font-size', '22px');
          break;
        case 'extra-large':
          root.style.setProperty('--base-font-size', '26px');
          break;
      }
    }
  }
}
