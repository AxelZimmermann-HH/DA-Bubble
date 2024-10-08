import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.class';
import { getAuth, updatePassword } from '@angular/fire/auth';  // Firebase Auth importieren


@Component({
  selector: 'app-reset-pw',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reset-pw.component.html',
  styleUrl: './reset-pw.component.scss'
})
export class ResetPwComponent {
  @Output() switchToMail = new EventEmitter<boolean>();
  buttonEnabled: boolean = false;
  success: boolean = false;
  password1: string = '';  
  password2: string = '';
  user: User | null = null;  // Der Benutzer, der sein Passwort ändern möchte


  constructor(private userService: UserService) {}

  // Hier wird der Benutzer abgerufen
  ngOnInit() {
    this.user = this.userService.getUser();
    if (this.user) {
      console.log('Benutzer für Passwort-Änderung:', this.user);
    } else {
      console.error('Kein Benutzer gefunden.');
    }
  }

  validatePasswords() {
    const minLength = 5;
    this.buttonEnabled = 
      this.password1.length >= minLength && 
      this.password1 === this.password2;
  }

  async changePassword() {
    const auth = getAuth();
    const currentUser = auth.currentUser;  // Aktueller authentifizierter Benutzer

    if (currentUser) {
      try {
        // Ändere das Passwort des Benutzers in Firebase
        await updatePassword(currentUser, this.password1);
        this.success = true;  // Erfolgsmeldung anzeigen
        console.log('Passwort erfolgreich geändert!');
      } catch (error) {
        console.error('Fehler beim Ändern des Passworts:', error);
      }
    } else {
      console.error('Kein authentifizierter Benutzer gefunden.');
    }
  }
  

  getBack() {
    this.switchToMail.emit(true);
  }

}
