import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';  // Importiere HttpClient für die Verwendung in deiner Komponente
import { Component, Output, EventEmitter } from '@angular/core';
import { Firestore, collection, getDocs, updateDoc, query, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.class';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';


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

  constructor(private firestore: Firestore, private http: HttpClient, private userService: UserService, private auth: Auth) {
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
          this.switchToResetPw.emit();
        }, 1200);
      } else {
        console.log('Benutzer nicht gefunden');
        this.emailNotFound = true;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mail:', error);
    }
}

  async checkEmail3(email: string, event: Event) {
    event.preventDefault(); // Verhindert, dass das Formular das Standardverhalten ausführt.
    
    console.log('Check wird ausgeführt');
    try {
      // Überprüfen, ob der Benutzer existiert
      const q = query(collection(this.firestore, 'users'), where('mail', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        console.log('Benutzer gefunden');
        
        // Hole die User-ID aus Firestore
        const userDoc = querySnapshot.docs[0].data() as User;
        const userId = querySnapshot.docs[0].id;

        // Verwende Firebase, um die E-Mail zum Zurücksetzen zu senden
        await sendPasswordResetEmail(this.auth, email, {
          url: 'https://dabubble-364.developerakademie.net/reset',  // URL zu deiner Reset-Seite
          handleCodeInApp: true  // Nutzt deine App, um den Link zu verarbeiten
        });
        console.log('E-Mail zum Zurücksetzen des Passworts wurde gesendet.');

        this.success = true;
        setTimeout(() => {
          this.switchToResetPw.emit(); // Event zum Umschalten zur Reset-Seite
        }, 1200);
      } else {
        console.log('Benutzer nicht gefunden');
        this.emailNotFound = true;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mail:', error);
    }
  }



  async checkEmail2(email: string, event: Event) {
    event.preventDefault(); // Verhindert, dass das Formular das Standardverhalten ausführt.
    
    console.log('Check wird ausgeführt');
    try {
      const q = query(collection(this.firestore, 'users'), where('mail', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        console.log('check');

        // Hier den gefundenen Benutzer setzen (angenommen, du hast User-Daten)
        // const userDocRef = querySnapshot.docs[0].ref;
        // const userDoc = querySnapshot.docs[0].data() as User;  // Den User aus den Firestore-Daten laden
        // this.userService.setUser(userDoc);  // User im Service setzen

        // await updateDoc(userDocRef, { password: "n3u35PW" });
        // console.log('Passwort erfolgreich geändert.');

        const userDoc = querySnapshot.docs[0].data() as User;
            const userId = querySnapshot.docs[0].id;

            // Rufe die PHP-Datei auf, um die E-Mail zu senden
            const apiUrl = 'https://dabubble-364.developerakademie.net/sendmail.php';  // Setze den korrekten Serverpfad

            const body = { email, userId };  // Daten für den Mailversand

            await this.http.post(apiUrl, body).toPromise();
            console.log('Die E-Mail zum Zurücksetzen des Passworts wurde gesendet.');


        this.success = true;
        setTimeout(() => {
          this.switchToResetPw.emit();
        }, 1200);

      } else {
        console.log('nix');
        this.emailNotFound = true;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mail:', error);
    }
  }


  // async sendResetEmail(email: string) {
  //   const apiUrl = 'http://localhost:4200/sendMail.php';  // Für XAMPP/WAMP
  //   const body = {
  //     email: email,
  //     name: 'Benutzer',  // Optional: Hier könntest du den echten Benutzernamen einsetzen
  //     message: 'Passwort zurücksetzen'  // Dies ist nur für die PHP-Logik, um die Nachricht zu erzeugen
  //   };

  //   try {
  //     const response = await this.http.post(apiUrl, body).toPromise();
  //     console.log('E-Mail zum Zurücksetzen des Passworts wurde gesendet:', response);
  //   } catch (error) {
  //     console.error('Fehler beim Senden der E-Mail:', error);
  //   }
  // }
  
  getBack() {
    this.switchToSignin.emit();
  }
}
