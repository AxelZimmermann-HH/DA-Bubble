import { Component, Output, EventEmitter } from '@angular/core';
import { SendMailComponent } from './send-mail/send-mail.component';
import { ResetPwComponent } from "./reset-pw/reset-pw.component";
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';


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

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Überprüfe, ob die URL "reset-password" enthält
    const urlSegments = this.route.snapshot.url.map(segment => segment.path);
    if (urlSegments.includes('reset-password')) {
      this.reset = true;  // Setzt den Zustand, um "app-reset-pw" anzuzeigen
    }
  }

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
