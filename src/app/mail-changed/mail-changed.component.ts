import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../app/services/user.service';
import { User } from '../models/user.class';
import { getAuth, updatePassword, applyActionCode } from '@angular/fire/auth';  // Firebase Auth importieren
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';  // Router importieren
import { Auth, confirmPasswordReset, verifyPasswordResetCode } from '@angular/fire/auth';

@Component({
  selector: 'app-mail-changed',
  standalone: true,
  imports: [],
  templateUrl: './mail-changed.component.html',
  styleUrl: './mail-changed.component.scss'
})
export class MailChangedComponent {
  @Output() switchToMail = new EventEmitter<boolean>();
  buttonEnabled: boolean = false;
  isSuccess: boolean = false;
  isLoading = true;
  password1: string = '';  
  password2: string = '';
  user: User | null = null;  // Der Benutzer, der sein Passwort ändern möchte
  oobCode: string = '';
  mode: string = '';


  constructor(private userService: UserService, private route: ActivatedRoute, private auth: Auth, private router: Router) {}

  ngOnInit(): void {
    // Query-Parameter auslesen
    this.route.queryParams.subscribe((params) => {
      const oobCode = params['oobCode']; // Code von Firebase
      if (oobCode) {
        this.verifyEmailChange(oobCode); // Verifizierung starten
      } else {
        console.error('Kein oobCode gefunden.');
        this.isLoading = false;
      }
    });
  }

  private async verifyEmailChange(oobCode: string): Promise<void> {
    try {
      await applyActionCode(this.auth, oobCode); // Firebase-Code anwenden
      console.log('E-Mail erfolgreich geändert.');
      this.isSuccess = true;
    } catch (error) {
      console.error('Fehler beim Ändern der E-Mail-Adresse:', error);
      this.isSuccess = false;
    } finally {
      this.isLoading = false;
    }
  }


  getBack() {
    this.switchToMail.emit(true);
  }
}
