import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-send-mail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './send-mail.component.html',
  styleUrl: './send-mail.component.scss'
})
export class SendMailComponent {
  buttonEnabled: boolean = false;
  emailNotFound: boolean = false;
  email: string = ''; // Füge die Variable email hinzu

  constructor(private firestore: Firestore) {
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
