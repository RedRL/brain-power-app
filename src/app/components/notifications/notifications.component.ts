import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';
import { NotificationsService, Reminder } from '../../services/notifications.service';

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
  imports: [CommonModule, FormsModule, AppHeaderComponent, TPipe, DatePipe],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  reminderName: string = '';
  reminderTime: string = '10:30';
  reminders: Reminder[] = [];
  
  notifications: Notification[] = [
    {
      id: 2,
      type: 'info',
      title: 'notification_daily_reminder',
      message: 'notification_daily_reminder_desc',
      date: new Date('2024-11-07'),
      icon: '⏰'
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

  constructor(
    private translateService: TranslateService,
    private notificationsService: NotificationsService
  ) {}

  ngOnInit() {
    this.translateService.applyDir();
    this.loadReminders();
  }

  loadReminders() {
    this.reminders = this.notificationsService.getReminders();
  }

  saveReminder() {
    if (!this.reminderTime) {
      return;
    }

    const name = this.reminderName.trim() || this.translateService.t('daily_routine_reminder');
    this.notificationsService.scheduleReminder(name, this.reminderTime);
    this.loadReminders();
    
    // Show success message
    alert(this.translateService.t('reminder_saved'));
    
    // Reset inputs
    this.reminderName = '';
    this.reminderTime = '10:30';
  }

  deleteReminder(id: string) {
    if (confirm(this.translateService.t('delete_reminder') + '?')) {
      this.notificationsService.removeReminder(id);
      this.loadReminders();
    }
  }
}

