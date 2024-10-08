import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';  // Importiere HttpClient für die Verwendung in deiner Komponente
import { Component, Output, EventEmitter } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.class';


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

  constructor(private firestore: Firestore, private http: HttpClient, private userService: UserService) {
    console.log('Komponente wurde initialisiert');
  }




  validateEmail(email: string) {
    const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    this.buttonEnabled = emailPattern.test(email);
    this.emailNotFound = false;
  }






  async checkEmail(email: string, event: Event) {
    event.preventDefault(); // Verhindert, dass das Formular das Standardverhalten ausführt.
    
    console.log('Check wird ausgeführt');
    try {
      const q = query(collection(this.firestore, 'users'), where('mail', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        console.log('check');

        // Hier den gefundenen Benutzer setzen (angenommen, du hast User-Daten)
        const userDoc = querySnapshot.docs[0].data() as User;  // Den User aus den Firestore-Daten laden
        this.userService.setUser(userDoc);  // User im Service setzen


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

  async sendResetEmail(email: string) {
    const apiUrl = 'http://localhost:4200/sendMail.php';  // Für XAMPP/WAMP
    const body = {
      email: email,
      name: 'Benutzer',  // Optional: Hier könntest du den echten Benutzernamen einsetzen
      message: 'Passwort zurücksetzen'  // Dies ist nur für die PHP-Logik, um die Nachricht zu erzeugen
    };

    try {
      const response = await this.http.post(apiUrl, body).toPromise();
      console.log('E-Mail zum Zurücksetzen des Passworts wurde gesendet:', response);
    } catch (error) {
      console.error('Fehler beim Senden der E-Mail:', error);
    }
  }
  
  getBack() {
    this.switchToSignin.emit();
  }
}
