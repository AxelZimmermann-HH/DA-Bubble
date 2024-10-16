import { CommonModule } from '@angular/common';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.class';
import { getAuth, updatePassword, Auth, verifyPasswordResetCode, confirmPasswordReset } from '@angular/fire/auth';  // Firebase Auth importieren
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
  user: User | null = null;  // Der Benutzer, der sein Passwort ändern möchte
  oobCode: string = '';  // Der einmalige Code für die Passwortzurücksetzung
  mode: string = '';     // Der Modus (z.B. 'resetPassword')
  newPassword: string = '';  // Das neue Passwort, das der Benutzer eingeben wird
  errorMessage: string = ''; // Fehlermeldung bei ungültigem Code


  constructor(private userService: UserService, private route: ActivatedRoute, private auth: Auth) {}

  // Hier wird der Benutzer abgerufen
  // ngOnInit() {
  //   this.user = this.userService.getUser();
  //   if (this.user) {
  //     console.log('Benutzer für Passwort-Änderung:', this.user);
  //   } else {
  //     console.error('Kein Benutzer gefunden.');
  //   }
  // }


  ngOnInit(): void {
    // Abonniere die Query-Parameter und hole 'oobCode' und 'mode' aus der URL
    this.route.queryParams.subscribe(params => {
      this.oobCode = params['oobCode'];
      this.mode = params['mode'];

      console.log('oobCode:', this.oobCode, 'mode:', this.mode); // Debugging

      // Verifiziere, ob es sich um die Passwortzurücksetzung handelt
      if (this.mode === 'resetPassword') {
        this.verifyPasswordResetCode();  // Verifiziere den oobCode
      }
    });
  }

  verifyPasswordResetCode() {
    verifyPasswordResetCode(this.auth, this.oobCode)
      .then(() => {
        console.log('Code verifiziert, Benutzer kann Passwort zurücksetzen.');
        // Hier kannst du das Formular zur Passwortänderung anzeigen
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
