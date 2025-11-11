import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'update';
  title: string;
  message: string;
  date: Date;
  icon: string;
}

interface Announcement {
  id: number;
  title: string;
  description: string;
  date: Date;
  category: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe, DatePipe],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  
  notifications: Notification[] = [
    {
      id: 1,
      type: 'success',
      title: 'notification_new_content',
      message: 'notification_new_content_desc',
      date: new Date('2024-11-08'),
      icon: '🎉'
    },
    {
      id: 2,
      type: 'info',
      title: 'notification_daily_reminder',
      message: 'notification_daily_reminder_desc',
      date: new Date('2024-11-07'),
      icon: '⏰'
    },
    {
      id: 3,
      type: 'update',
      title: 'notification_app_update',
      message: 'notification_app_update_desc',
      date: new Date('2024-11-05'),
      icon: '🔄'
    },
    {
      id: 4,
      type: 'warning',
      title: 'notification_maintenance',
      message: 'notification_maintenance_desc',
      date: new Date('2024-11-03'),
      icon: '⚠️'
    }
  ];

  announcements: Announcement[] = [
    {
      id: 1,
      title: 'announcement_new_exercises',
      description: 'announcement_new_exercises_desc',
      date: new Date('2024-11-10'),
      category: 'announcement_category_content'
    },
    {
      id: 2,
      title: 'announcement_workshop',
      description: 'announcement_workshop_desc',
      date: new Date('2024-11-08'),
      category: 'announcement_category_event'
    },
    {
      id: 3,
      title: 'announcement_community',
      description: 'announcement_community_desc',
      date: new Date('2024-11-05'),
      category: 'announcement_category_community'
    }
  ];

  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    // Ensure the language class is applied
    this.translateService.applyDir();
    
    // Debug: Check if lang-he class is applied
    console.log('Body classes:', document.body.className);
    console.log('Current language:', this.translateService.lang);
    
    // Debug: Check CSS variables
    const rootStyles = getComputedStyle(document.documentElement);
    console.log('--hebrew-arrow:', rootStyles.getPropertyValue('--hebrew-arrow'));
    console.log('--hebrew-margin-left:', rootStyles.getPropertyValue('--hebrew-margin-left'));
    console.log('--hebrew-transform:', rootStyles.getPropertyValue('--hebrew-transform'));
  }
  
  sendWhatsApp() {
    const message = 'Hello,\n\nI need help with the Brain Power app. Please provide assistance with:\n\n';
    const whatsappLink = `https://wa.me/972797291729?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappLink, '_blank');
  }
}
