import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';


@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './send-mail.component.html',
  styleUrl: './send-mail.component.scss'
})
export class SendMailComponent {
  buttonEnabled: boolean = false;
  emailNotFound: boolean = false;

  constructor(private firestore: Firestore) {
    console.log('Komponente wurde initialisiert');
  }

  validateEmail(email: string) {
    const emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    this.buttonEnabled = emailPattern.test(email);
    this.emailNotFound = false;
  }

  async checkEmail(email: string) {
    debugger;
    console.log('Check wird ausgeführt'); // Diese Zeile stellt sicher, dass die Funktion aufgerufen wird
    try {
      // const userCollection = collection(this.firestore, 'users');
      const q = query(collection(this.firestore, 'users'), where('mail', '==', email));
      const querySnapshot = await getDocs(q);
  
      console.log('Query abgeschlossen'); // Diese Zeile prüft, ob die Abfrage abgeschlossen wird
  
      if (querySnapshot) {
        console.log('check');
      } else {
        console.log('nix');
        this.emailNotFound = true;
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der E-Mail:', error);
    }
  }
  
  getBack() {

  }
}
