import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { Router } from '@angular/router'; 
import { UserService } from '../services/user.service';  
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth'; 




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

  constructor(public firestore: Firestore, private router: Router, private userService: UserService, private auth: Auth) {
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
    let enteredMail = this.user.mail;
    let enteredPassword = this.user.password;
    let user = this.userData.find((user: User) => user.mail === enteredMail);
  
    this.emptyValue();
  
    if (user) {
      if (user.password === enteredPassword) {
        this.handleSuccess(user, enteredMail);

      } else {
        this.falsePassword();
      }
    } else {
      this.falseMail();
    }
    
    this.returnError();
  }

  emptyValue() {
    this.user.mail = '';  
    this.user.password = '';  
    this.validMail = true;
    this.validPassword = true;
  }

  handleSuccess(user: User, enteredMail: string) {
    this.validMail = true;
    this.validPassword = true;
  
    this.userService.setUser(user);
    this.router.navigate(['/']);
  }

  falsePassword() {
    this.validMail = true;  
    this.validPassword = false;  
  }

  falseMail() {
    this.validMail = false;  
    this.validPassword = true;  
  }

  returnError() {
    if (!this.validMail || !this.validPassword) {
      return; 
    }
  }

  guestLogin() {
    // Erstelle einen Gast-Benutzer (anpassbar)
    const guestUser = new User();
    guestUser.name = 'Gast';
    guestUser.mail = 'guest@example.com';
    guestUser.avatar = "1";  // Oder eine beliebige Avatar-ID
  
    // Rufe handleSuccess auf und simuliere den Gast-Login
    this.handleSuccess(guestUser, guestUser.mail);
  }

  googleLogin() {
    console.log('Google Login gestartet');
    debugger;
    signInWithPopup(this.auth, new GoogleAuthProvider())
      .then((result) => {
        const googleUser = result.user;
        console.log(googleUser);

        // Erstelle einen neuen Benutzer aus den Google-Daten
        const user = new User();
        user.name = googleUser.displayName || 'Unbekannter Benutzer';
        user.mail = googleUser.email || 'Keine E-Mail';
        user.avatar = "1";

        // Setze den Benutzer im UserService und navigiere zur MainComponent
        
        this.handleSuccess(user, user.mail);
        
      })
      .catch((error) => {
        console.error('Fehler bei der Google-Authentifizierung:', error);
      });
  }
}