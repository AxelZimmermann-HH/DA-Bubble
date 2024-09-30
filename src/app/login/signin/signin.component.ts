import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, Firestore, onSnapshot, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { Router } from '@angular/router'; 
import { UserService } from '../../services/user.service';  
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})
export class SigninComponent {
  @Output() signUpChange = new EventEmitter<boolean>();
  @Input() signUp: boolean = false;
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
    guestUser.avatar = 1;  // Oder eine beliebige Avatar-ID
  
    // Rufe handleSuccess auf und simuliere den Gast-Login
    this.handleSuccess(guestUser, guestUser.mail);
  }

  googleLogin() {
    signInWithPopup(this.auth, new GoogleAuthProvider())
      .then(async (result) => {
        const googleUser = result.user;
        const googleMail = googleUser.email;
        const googleUserId = googleUser.uid;
  
        if (googleMail && googleUserId) {
          await this.checkUserInFirestore(googleUserId, googleMail, googleUser);
        } else {
          console.error('Keine gültige E-Mail oder userId von Google erhalten');
        }
      })
      .catch((error) => {
        console.error('Fehler bei der Google-Authentifizierung:', error);
      });
  }
  
  async checkUserInFirestore(userId: string, email: string, googleUser: any) {
    const userDocRef = doc(this.firestore, 'users', userId);
  
    try {
      const docSnapshot = await getDoc(userDocRef);
      if (docSnapshot.exists()) {
        this.handleExistingUser(docSnapshot, email);
      } else {
        await this.createNewUser(userDocRef, googleUser, email, userId);
      }
    } catch (error) {
      console.error('Fehler bei der Firestore-Abfrage oder beim Anlegen des neuen Benutzers:', error);
    }
  }
  
  handleExistingUser(docSnapshot: any, email: string) {
    const existingUser = docSnapshot.data() as User;
    this.handleSuccess(existingUser, email);
  }
  
  async createNewUser(userDocRef: any, googleUser: any, email: string, userId: string) {
    const newUser = new User();
    newUser.name = googleUser.displayName || 'Unbekannter Benutzer';
    newUser.mail = email;
    newUser.avatar = googleUser.photoURL || 1;
    newUser.online = true;
    newUser.userId = userId;
  
    await setDoc(userDocRef, newUser.toJson());
    console.log('Neuer Benutzer angelegt:', newUser);
  
    this.handleSuccess(newUser, email);
  }

  goToSignUp() {
    this.signUpChange.emit(true); // sendet das Event nach oben
  }
}


