import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';
import { DataService, Goal } from '../../services/data.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface CalendarDay {
  date: string;
  day: number;
  completedCount: number;
  totalGoals: number;
  completionStatus: 'none' | 'partial' | 'full';
  isFuture: boolean;
  isOtherMonth: boolean;
}

@Component({
  standalone: true,
  selector: 'app-personal-info',
  imports: [CommonModule, ReactiveFormsModule, AppHeaderComponent, TPipe],
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent implements OnInit, OnDestroy, AfterViewInit {
  isInfoSectionExpanded: boolean = false;
  editingFields: Set<string> = new Set();
  selectedDate: string | null = null;
  calendarDays: CalendarDay[] = [];
  selectedDayCompletedGoals: Goal[] = [];
  selectedDayUncompletedGoals: Goal[] = [];
  selectedDayActivities: { name: string; completed: boolean }[] = [];
  allGoals: Goal[] = [];
  dayNames: string[] = [];
  currentMonth: Date = new Date();
  monthName: string = '';
  private routerSubscription?: Subscription;
  private originalFieldValues: { [key: string]: any } = {};

  // Settings
  selectedLevel: 'beginner' | 'advanced' | 'grand' = 'beginner';
  selectedFontSize: 'small' | 'medium' | 'large' | 'extra-large' = 'medium';
  selectedLanguage: 'en' | 'he' = 'en';
  
  // Settings section states
  isLevelSectionExpanded: boolean = false;
  isFontSizeSectionExpanded: boolean = false;
  isLanguageSectionExpanded: boolean = false;

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(12), Validators.pattern(/^[a-zA-Z\u0590-\u05FF\s\'\-\"]+$/)]],
    lastName: ['', [Validators.pattern(/^[a-zA-Z\u0590-\u05FF\s\'\-\"]*$/)]],
    age: ['', [Validators.min(1), Validators.max(120)]],
    weight: ['', [Validators.min(1), Validators.max(300)]],
    height: ['', [Validators.min(0.5), Validators.max(3.0)]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9\s\-\+\(\)]+$/)]]
  });

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    public translateService: TranslateService,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.loadExistingProfile();
    this.loadGoals();
    this.initializeDayNames();
    this.initializeCalendar();
    this.loadSettings();
    
    // Listen for navigation events to refresh calendar when returning to this page
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if ((event as NavigationEnd).url === '/personal-info') {
          this.loadGoals();
          this.initializeCalendar();
        }
      });
  }

  ngAfterViewInit() {
    // Apply font size on component initialization
    this.applyFontSize();
  }

  loadSettings() {
    // Load level
    const storedLevel = localStorage.getItem('level');
    if (storedLevel === 'beginner' || storedLevel === 'advanced' || storedLevel === 'grand') {
      this.selectedLevel = storedLevel;
    }

    // Load font size
    const storedFontSize = localStorage.getItem('fontSize');
    if (storedFontSize === 'small' || storedFontSize === 'medium' || storedFontSize === 'large' || storedFontSize === 'extra-large') {
      this.selectedFontSize = storedFontSize;
    }
    this.applyFontSize();

    // Load language
    const storedLang = localStorage.getItem('lang');
    if (storedLang === 'en' || storedLang === 'he') {
      this.selectedLanguage = storedLang;
    }
  }

  selectLevel(level: 'beginner' | 'advanced' | 'grand') {
    this.selectedLevel = level;
    localStorage.setItem('level', level);
  }

  selectFontSize(size: 'small' | 'medium' | 'large' | 'extra-large') {
    this.selectedFontSize = size;
    localStorage.setItem('fontSize', size);
    this.applyFontSize();
  }

  applyFontSize() {
    const root = document.documentElement;
    switch (this.selectedFontSize) {
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

  selectLanguage(lang: 'en' | 'he') {
    this.selectedLanguage = lang;
    this.translateService.setLang(lang);
    // Reload to apply language changes throughout the app
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }

  toggleLevelSection() {
    this.isLevelSectionExpanded = !this.isLevelSectionExpanded;
  }

  toggleFontSizeSection() {
    this.isFontSizeSectionExpanded = !this.isFontSizeSectionExpanded;
  }

  toggleLanguageSection() {
    this.isLanguageSectionExpanded = !this.isLanguageSectionExpanded;
  }

  toggleInfoSection() {
    this.isInfoSectionExpanded = !this.isInfoSectionExpanded;
  }

  initializeDayNames() {
    if (this.translateService.lang === 'he') {
      this.dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    } else {
      this.dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    }
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  loadGoals() {
    this.allGoals = this.dataService.getGoals();
  }

  toggleFieldEdit(fieldName: string) {
    if (!this.editingFields.has(fieldName)) {
      // Store original value when entering edit mode
      const control = this.form.get(fieldName);
      if (control) {
        this.originalFieldValues[fieldName] = control.value;
      }
      this.editingFields.add(fieldName);
    }
  }

  cancelFieldEdit(fieldName: string) {
    // Restore original value
    const control = this.form.get(fieldName);
    if (control && this.originalFieldValues[fieldName] !== undefined) {
      control.setValue(this.originalFieldValues[fieldName]);
      delete this.originalFieldValues[fieldName];
    }
    this.editingFields.delete(fieldName);
  }

  saveField(fieldName: string) {
    const control = this.form.get(fieldName);
    if (control && control.valid) {
      // Save just this field to profile
      const formData = this.form.value;
      const profileData = {
        fullName: `${formData.firstName} ${formData.lastName || ''}`.trim(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: formData.age,
        weight: formData.weight,
        height: formData.height,
        email: formData.email,
        phone: formData.phone
      };

      localStorage.setItem('profile', JSON.stringify(profileData));
      
      // Clear edit mode for this field
      delete this.originalFieldValues[fieldName];
      this.editingFields.delete(fieldName);
    }
  }

  isFieldEditing(fieldName: string): boolean {
    return this.editingFields.has(fieldName);
  }

  hasAnyFieldEditing(): boolean {
    return this.editingFields.size > 0;
  }

  cancelEditing() {
    // Restore all original values
    Object.keys(this.originalFieldValues).forEach(fieldName => {
      const control = this.form.get(fieldName);
      if (control) {
        control.setValue(this.originalFieldValues[fieldName]);
      }
    });
    this.originalFieldValues = {};
    this.editingFields.clear();
  }

  initializeCalendar() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: CalendarDay[] = [];
    
    // Get the first day of the displayed month
    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1);
    // Get the last day of the displayed month
    const lastDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0);
    
    // Set month name
    this.updateMonthName();
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    // In Hebrew calendar, week starts on Sunday (0)
    let firstDayOfWeek = firstDay.getDay();
    
    // Add days from previous month to fill the first week
    if (firstDayOfWeek > 0) {
      const prevMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 0);
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const dayNum = prevMonth.getDate() - i;
        const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, dayNum);
        const dateStr = this.formatDateToLocalString(date);
        const { completed, total } = this.getGoalsForDate(dateStr);
        const dailyActivitiesCount = this.checkDailyActivitiesForDate(dateStr);
        
        let status: 'none' | 'partial' | 'full' = 'none';
        const totalActivities = total + 4; // goals + 4 daily activities
        const completedActivities = completed + dailyActivitiesCount;
        
        if (completedActivities > 0 && completedActivities < totalActivities) {
          status = 'partial';
        } else if (completedActivities === totalActivities && totalActivities > 0) {
          status = 'full';
        } else if (completedActivities === 0) {
          status = 'none';
        }
        
        days.push({
          date: dateStr,
          day: dayNum,
          completedCount: completed,
          totalGoals: total,
          completionStatus: status,
          isFuture: false,
          isOtherMonth: true
        });
      }
    }
    
    // Add all days of the displayed month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), day);
      const dateStr = this.formatDateToLocalString(date);
      const isFuture = date > today;
      const { completed, total } = this.getGoalsForDate(dateStr);
      const dailyActivitiesCount = this.checkDailyActivitiesForDate(dateStr);
      
      let status: 'none' | 'partial' | 'full' = 'none';
      if (!isFuture) {
        const totalActivities = total + 4; // goals + 4 daily activities
        const completedActivities = completed + dailyActivitiesCount;
        
        if (completedActivities > 0 && completedActivities < totalActivities) {
          status = 'partial';
        } else if (completedActivities === totalActivities && totalActivities > 0) {
          status = 'full';
        } else if (completedActivities === 0) {
          status = 'none';
        }
      }
      
      days.push({
        date: dateStr,
        day: day,
        completedCount: completed,
        totalGoals: total,
        completionStatus: status,
        isFuture: isFuture,
        isOtherMonth: false
      });
    }
    
    // Add days from next month only to complete the last week (if needed)
    // Only add days if the last week is incomplete (not a full row of next month days)
    const lastDayOfWeek = lastDay.getDay();
    const daysInLastWeek = lastDayOfWeek === 6 ? 0 : (6 - lastDayOfWeek); // Days needed to complete last week
    
    // Only add days if we need to complete the current week (not a full row)
    if (daysInLastWeek > 0) {
      for (let day = 1; day <= daysInLastWeek; day++) {
        const date = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, day);
        const dateStr = this.formatDateToLocalString(date);
        
        days.push({
          date: dateStr,
          day: day,
          completedCount: 0,
          totalGoals: 0,
          completionStatus: 'none',
          isFuture: true,
          isOtherMonth: true
        });
      }
    }
    
    this.calendarDays = days;
  }

  updateMonthName() {
    const monthNames = this.translateService.lang === 'he' 
      ? ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.monthName = monthNames[this.currentMonth.getMonth()] + ' ' + this.currentMonth.getFullYear();
  }

  previousMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.initializeCalendar();
  }

  nextMonth() {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.initializeCalendar();
  }

  getGoalsForDate(date: string): { completed: number; total: number } {
    // Get all goals from Goals page
    const goals = this.allGoals;
    let completed = 0;
    
    // Check which goals were completed on this date
    // Normalize the date string to ensure proper comparison
    const normalizedDate = this.normalizeDateString(date);
    
    goals.forEach(g => {
      const goalCompletionKey = `goal_${g.id}_completed`;
      const completionDate = localStorage.getItem(goalCompletionKey);
      if (completionDate) {
        const normalizedCompletionDate = this.normalizeDateString(completionDate);
        if (normalizedCompletionDate === normalizedDate) {
          completed++;
        }
      }
    });
    
    return { completed, total: goals.length };
  }

  normalizeDateString(dateStr: string): string {
    // Ensure date string is in YYYY-MM-DD format
    // Handle both ISO strings and date strings
    if (dateStr.includes('T')) {
      // If it's an ISO string, extract just the date part
      return dateStr.split('T')[0];
    }
    // If it's already in YYYY-MM-DD format, return as is
    return dateStr;
  }

  formatDateToLocalString(date: Date): string {
    // Format date as YYYY-MM-DD using local timezone, not UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  checkDailyActivitiesForDate(date: string): number {
    // Count how many daily activities were completed on this date
    const normalizedDate = this.normalizeDateString(date);
    let count = 0;
    
    const musicDate = localStorage.getItem('musicSessionCompleted');
    if (musicDate && this.normalizeDateString(musicDate) === normalizedDate) {
      count++;
    }
    
    const breathingDate = localStorage.getItem('breathingSessionCompleted');
    if (breathingDate && this.normalizeDateString(breathingDate) === normalizedDate) {
      count++;
    }
    
    const feldenkraisDate = localStorage.getItem('feldenkraisSessionCompleted');
    if (feldenkraisDate && this.normalizeDateString(feldenkraisDate) === normalizedDate) {
      count++;
    }
    
    const memoryCompletions = this.dataService.getCompletionsForDate(normalizedDate);
    if (memoryCompletions.some(c => c.exerciseId === 'memory')) {
      count++;
    }
    
    return count;
  }

  selectDate(date: string) {
    this.selectedDate = this.selectedDate === date ? null : date;
    if (this.selectedDate) {
      this.loadDayDetails(date);
    }
  }

  loadDayDetails(date: string) {
    // Normalize the date string for comparison
    const normalizedDate = this.normalizeDateString(date);
    
    // Load completed and uncompleted goals for this date
    const goals = this.allGoals;
    this.selectedDayCompletedGoals = [];
    this.selectedDayUncompletedGoals = [];
    
    goals.forEach(g => {
      const goalCompletionKey = `goal_${g.id}_completed`;
      const completionDate = localStorage.getItem(goalCompletionKey);
      if (completionDate) {
        const normalizedCompletionDate = this.normalizeDateString(completionDate);
        if (normalizedCompletionDate === normalizedDate) {
          this.selectedDayCompletedGoals.push(g);
        } else {
          this.selectedDayUncompletedGoals.push(g);
        }
      } else {
        this.selectedDayUncompletedGoals.push(g);
      }
    });

    // Load daily activities for this date
    const musicDate = localStorage.getItem('musicSessionCompleted');
    const breathingDate = localStorage.getItem('breathingSessionCompleted');
    const feldenkraisDate = localStorage.getItem('feldenkraisSessionCompleted');
    
    this.selectedDayActivities = [
      {
        name: this.translateService.t('music_session'),
        completed: musicDate ? this.normalizeDateString(musicDate) === normalizedDate : false
      },
      {
        name: this.translateService.t('breathing'),
        completed: breathingDate ? this.normalizeDateString(breathingDate) === normalizedDate : false
      },
      {
        name: this.translateService.t('feldenkrais_movement'),
        completed: feldenkraisDate ? this.normalizeDateString(feldenkraisDate) === normalizedDate : false
      },
      {
        name: this.translateService.t('memory_game'),
        completed: this.dataService.getCompletionsForDate(normalizedDate).some(c => c.exerciseId === 'memory')
      }
    ];
  }

  formatDate(date: string): string {
    // Parse date string directly to avoid timezone issues
    // Date string format: YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    // Create date in local timezone (not UTC) - use noon to avoid timezone edge cases
    const d = new Date(year, month - 1, day, 12, 0, 0);
    return d.toLocaleDateString(this.translateService.lang === 'he' ? 'he-IL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  loadExistingProfile() {
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}');
      if (profile) {
        // Split fullName into firstName and lastName
        const fullName = profile.fullName || '';
        const nameParts = fullName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        this.form.patchValue({
          firstName: firstName,
          lastName: lastName,
          age: profile.age || '',
          weight: profile.weight || '',
          height: profile.height || '',
          email: profile.email || '',
          phone: profile.phone || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  saveProfile() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.form.value;
    const profileData = {
      fullName: `${formData.firstName} ${formData.lastName || ''}`.trim(),
      firstName: formData.firstName,
      lastName: formData.lastName,
      age: formData.age,
      weight: formData.weight,
      height: formData.height,
      email: formData.email,
      phone: formData.phone
    };

    localStorage.setItem('profile', JSON.stringify(profileData));
    localStorage.removeItem('guest'); // Remove guest status when profile is saved
    
    // Clear editing fields
    this.editingFields.clear();
    
    // Update header by reloading the page or using a service
    this.router.navigate(['/home']);
  }

  cancel() {
    this.router.navigate(['/home']);
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return this.translateService.t('field_required');
      }
      if (field.errors['minlength']) {
        return this.translateService.t('field_too_short');
      }
      if (field.errors['maxlength']) {
        return this.translateService.t('field_too_long');
      }
      if (field.errors['email']) {
        return this.translateService.t('invalid_email');
      }
      if (field.errors['pattern']) {
        if (fieldName === 'firstName' || fieldName === 'lastName') {
          return this.translateService.t('invalid_name');
        }
        if (fieldName === 'phone') {
          return this.translateService.t('invalid_phone');
        }
      }
      if (field.errors['min'] || field.errors['max']) {
        if (fieldName === 'age') {
          return this.translateService.t('invalid_age');
        }
        if (fieldName === 'weight') {
          return this.translateService.t('invalid_weight');
        }
        if (fieldName === 'height') {
          return this.translateService.t('invalid_height');
        }
      }
    }
    return '';
  }

  // Prevent illegal characters from being typed
  onNameKeyPress(event: KeyboardEvent): boolean {
    const char = event.key;
    const allowedChars = /^[a-zA-Z\u0590-\u05FF\s\'\-\"]$/;
    return allowedChars.test(char) || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab';
  }

  onPhoneKeyPress(event: KeyboardEvent): boolean {
    const char = event.key;
    const allowedChars = /^[0-9\s\-\+\(\)]$/;
    return allowedChars.test(char) || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab';
  }

  onAgeKeyPress(event: KeyboardEvent): boolean {
    const char = event.key;
    const allowedChars = /^[0-9]$/;
    return allowedChars.test(char) || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab';
  }

  onWeightKeyPress(event: KeyboardEvent): boolean {
    const char = event.key;
    const allowedChars = /^[0-9]$/;
    return allowedChars.test(char) || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab';
  }

  onHeightKeyPress(event: KeyboardEvent): boolean {
    const char = event.key;
    const allowedChars = /^[0-9.]$/;
    return allowedChars.test(char) || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Tab';
  }
}
