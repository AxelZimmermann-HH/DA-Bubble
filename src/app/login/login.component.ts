import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { User } from '../models/user.class';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  @ViewChild('mailInput') mailInput!: ElementRef;
  userData: any = [];
  user = new User();
  userCount: number = 0;
  validMail: boolean = true;
  validPassword: boolean = true;

  constructor(public firestore: Firestore) {
    this.getAllUsers();
  }

  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    const readUsers = onSnapshot(userCollection, (snapshot) => {
      this.userData = [];
      snapshot.forEach((doc) => {
        let user = new User({ ...doc.data(), id: doc.id });
        this.userData.push(user);
      });
      this.userCount = this.userData.length;
      console.log('current users', this.userData);
    });
  }

  onSubmit(ngForm: NgForm) {
    const enteredMail = this.user.mail;
    const enteredPassword = this.user.password;
  
    const user = this.userData.find((user: User) => user.mail === enteredMail);
  
    // Leere in jedem Fall beide Felder
    this.user.mail = '';  // Leeren des Mail-Feldes
    this.user.password = '';  // Leeren des Passwort-Feldes
  
    // Initialisiere beide als ungültig
    this.validMail = true;
    this.validPassword = true;
  
    if (user) {
      // Wenn die E-Mail korrekt ist, überprüfe das Passwort
      if (user.password === enteredPassword) {
        console.log('Login successful for:', enteredMail);
        this.validMail = true;
        this.validPassword = true;
        // Hier kann der tatsächliche submit stattfinden
      } else {
        console.log('Falsches Passwort');
        this.validMail = true;  // E-Mail korrekt
        this.validPassword = false;  // Passwort falsch
      }
    } else {
      console.log('E-Mail nicht gefunden');
      this.validMail = false;  // E-Mail falsch
      this.validPassword = true;  // Passwort-Fehler wird zurückgesetzt
    }
  
    // Blockiere den erfolgreichen Submit, wenn eines der Felder falsch ist
    if (!this.validMail || !this.validPassword) {
      return;  // Verhindere den weiteren Ablauf, wenn eines ungültig ist
    }
  
    // Weiterführende Logik bei erfolgreichem Submit
  }

}
