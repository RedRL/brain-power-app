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
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  
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
    this.translateService.applyDir();
  }
}

