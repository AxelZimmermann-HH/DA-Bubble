import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, addDoc, Firestore, onSnapshot, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { User } from '../../../models/user.class';
import { Router } from '@angular/router'; 
import { UserService } from '../../../services/user.service';  

@Component({
  selector: 'app-firstpage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './firstpage.component.html',
  styleUrl: './firstpage.component.scss'
})
export class FirstpageComponent {
  @Output() closeFirstPage = new EventEmitter<boolean>();  // EventEmitter erstellen
  @Output() openAvatarPage = new EventEmitter<boolean>();
  @Output() userCreated = new EventEmitter<User>();  // Neuer Emitter für den erstellten Benutzer




  user = new User();
  validName: boolean = true;
  validMail: boolean = true;
  checked: boolean = false;
  buttonEnabled: boolean = false;

  constructor(private firestore: Firestore) {}


  validateName(): void {
    const nameParts = this.user.name.trim().split(/\s+/);
    if (nameParts.length < 2) {
      this.validName = false;
      this.user.name = ''; 
      setTimeout(() => {
        this.validName = true; 
        this.activateButton();  // Buttonstatus nach Timeout erneut prüfen

      }, 2000);
    } else {
      this.validName = true;
      this.activateButton();  // Direkt nach erfolgreicher Validierung den Buttonstatus prüfen

    }
  }

  validateMail(): void {
    let emailPattern = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(this.user.mail)) {
      this.validMail = false;
      this.user.mail = ''; 
      setTimeout(() => {
        this.validMail = true; 
        this.activateButton();  // Buttonstatus nach Timeout erneut prüfen

      }, 2000);
    } else {
      this.validMail = true;
      this.activateButton();  // Direkt nach erfolgreicher Validierung den Buttonstatus prüfen

    }
  }

  togglePrivacy(): void {
    this.checked = !this.checked;
    this.activateButton();  // Buttonstatus direkt nach der Checkbox-Änderung prüfen
  }

  activateButton(): void {
    console.log('Valid Name:', this.validName);
  console.log('Valid Mail:', this.validMail);
  console.log('Password length >= 5:', this.user.password.length >= 5); // Prüfen, ob Passwort mindestens 5 Zeichen lang ist
  console.log('Checked:', this.checked);
    // Button aktivieren, wenn Name, Mail, Passwort valide sind und die Checkbox angeklickt ist
    this.buttonEnabled = this.validName && this.validMail && this.user.password.length >= 5 && this.checked;
    console.log('Button enabled:', this.buttonEnabled);  // Für Debugging-Zwecke
  }

  async onSubmit(ngForm: NgForm) {
    if (this.buttonEnabled) {
      try {
        // Die User-Daten aus dem Formular setzen
        const newUser = new User({
          name: this.user.name,
          mail: this.user.mail,
          password: this.user.password,
        });

        // Den neuen User in Firestore anlegen
        const userCollection = collection(this.firestore, 'users');
        const docRef = await addDoc(userCollection, newUser.toJson());

        newUser.userId = docRef.id;


        // Erfolgsmeldung und Ausgabe des erstellten Users
        console.log('User created with ID: ', docRef.id);
        console.log('Created User: ', newUser);
        this.closeFirstPage.emit(false);  // Setzt firstPage auf false in der übergeordneten Komponente
        this.userCreated.emit(newUser);  // Benutzer übergeben
        this.openAvatarPage.emit(true);

      } catch (error) {
        console.error('Error adding document: ', error);
      }
    }
  }

}