import { CommonModule } from '@angular/common';
import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.class';
import { getAuth, updatePassword, Auth, verifyPasswordResetCode } from '@angular/fire/auth';  // Firebase Auth importieren
import { ActivatedRoute } from '@angular/router';

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
  user: User | null = null;  
  oobCode: string = '';  
  mode: string = '';     
  newPassword: string = '';  
  errorMessage: string = ''; 

  constructor(private userService: UserService, private route: ActivatedRoute, private auth: Auth) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.oobCode = params['oobCode'];
      this.mode = params['mode'];

      if (this.mode === 'resetPassword') {
        this.verifyPasswordResetCode(); 
      }
    });
  }

  verifyPasswordResetCode() {
    verifyPasswordResetCode(this.auth, this.oobCode)
      .then(() => {
        console.log('Code verifiziert, Benutzer kann Passwort zurücksetzen.');
      })
      .catch(error => {
        this.errorMessage = 'Ungültiger oder abgelaufener Code';
        console.error('Fehler beim Verifizieren des oobCodes:', error);
      });
  }

  validatePasswords() {
    const minLength = 5;
    this.buttonEnabled = 
      this.password1.length >= minLength && 
      this.password1 === this.password2;
  }

  async changePassword() {
    const auth = getAuth();
    const currentUser = auth.currentUser; 

    if (currentUser) {
      try {
        await updatePassword(currentUser, this.password1);
        this.success = true;  
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