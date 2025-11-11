import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../../shared/components/app-header/app-header.component';
import { TPipe } from '../../shared/pipes/t.pipe';
import { TranslateService } from '../../shared/services/translate.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, AppHeaderComponent, TPipe],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent implements OnInit {
  
  constructor(private translateService: TranslateService) {}

  ngOnInit() {
    this.translateService.applyDir();
  }
  
  sendWhatsApp() {
    const message = 'Hello,\n\nI need help with the Brain Power app. Please provide assistance with:\n\n';
    const whatsappLink = `https://wa.me/972797291729?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappLink, '_blank');
  }
}
