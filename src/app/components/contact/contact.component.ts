import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, AppHeaderComponent, TPipe],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  contactForm = {
    message: ''
  };
  
  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.translateService.applyDir();
  }
  
  isFormValid(): boolean {
    return !!this.contactForm.message.trim();
  }
  
  submitContactForm() {
    if (!this.isFormValid()) {
      return;
    }
    
    // TODO: Implement email sending functionality
    // For now, just log the form data
    console.log('Contact form submitted:', this.contactForm);
    
    // Show success message (you can implement a toast/alert here)
    alert('Thank you for your message! We will get back to you soon.');
    
    // Reset form
    this.contactForm = {
      message: ''
    };
  }
}
