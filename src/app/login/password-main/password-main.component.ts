import { Component, Output, EventEmitter } from '@angular/core';
import { SendMailComponent } from './send-mail/send-mail.component';
import { ResetPwComponent } from "./reset-pw/reset-pw.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-password-main',
  standalone: true,
  imports: [SendMailComponent, ResetPwComponent, CommonModule],
  templateUrl: './password-main.component.html',
  styleUrl: './password-main.component.scss'
})
export class PasswordMainComponent {
  @Output() switchToSignin = new EventEmitter<void>();
  reset: boolean = false;

  handleSwitchToSignin() {
    this.switchToSignin.emit();  // Event an die login-Komponente weiterleiten
  }

  handleSwitchToMail() {
    this.reset = false;  // Setzt "reset" auf false, um "app-send-mail" anzuzeigen
  }

  handleSwitchToResetPw() {
    this.reset = true;  // Setzt "reset" auf true, um "app-reset-pw" anzuzeigen
  }

}
