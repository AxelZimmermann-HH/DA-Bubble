import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';  // Importiere HttpClient für die Verwendung in deiner Komponente
import { Component, Output, EventEmitter } from '@angular/core';
import { Firestore, collection, getDocs, updateDoc, query, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.class';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { Router } from '@angular/router';  // Importiere den Router



@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './send-mail.component.html',
  styleUrl: './send-mail.component.scss'
})
export class SendMailComponent {
  @Output() switchToSignin = new EventEmitter<void>();
  @Output() switchToResetPw = new EventEmitter<void>();  // EventEmitter hinzufügen

  buttonEnabled: boolean = false;
  emailNotFound: boolean = false;
  email: string = ''; // Füge die Variable email hinzu
  success: boolean = false;

  constructor(private firestore: Firestore, private http: HttpClient, private userService: UserService, private auth: Auth, private router: Router) {
    console.log('Komponente wurde initialisiert');
  }


  validateEmail(email: string) {
    const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    this.buttonEnabled = emailPattern.test(email);
    this.emailNotFound = false;
  }


  async checkEmail(email: string, event: Event) {
    event.preventDefault();
    
    console.log('Check wird ausgeführt');
    try {
      const q = query(collection(this.firestore, 'users'), where('mail', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        console.log('Benutzer gefunden');
        
        // Sende die E-Mail, die auf deine eigene Seite weiterleitet
        await sendPasswordResetEmail(this.auth, email, {
          url: 'https://dabubble-364.developerakademie.net/angular-projects/da-bubble/reset',  // URL zu deiner eigenen Seite
          handleCodeInApp: true  // Nutzt deine App, um den Link zu verarbeiten
        });
        console.log('E-Mail zum Zurücksetzen des Passworts wurde gesendet.');

        this.success = true;
        setTimeout(() => {
          this.switchToSignin.emit();
        }, 1200);
      } else {
        console.log('Benutzer nicht gefunden');
        this.emailNotFound = true;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mail:', error);
    }
}
  
  getBack() {
    this.switchToSignin.emit();
  }
}
