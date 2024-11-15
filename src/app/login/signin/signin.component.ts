import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, Firestore, onSnapshot, doc, updateDoc, getDoc, setDoc, query, where, getDocs, deleteDoc, documentId } from '@angular/fire/firestore';
import { User } from '../../models/user.class';
import { Router } from '@angular/router'; 
import { UserService } from '../../services/user.service';  
import { Auth, signInWithPopup, signInWithEmailAndPassword, GoogleAuthProvider } from '@angular/fire/auth';

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss'
})

export class SigninComponent {
  @Output() signUpChange = new EventEmitter<boolean>();
  @Output() passwordChange = new EventEmitter<boolean>();
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
    });
  }

  async checkEmail() {
    const enteredMail = this.user.mail.trim();

    if (!this.validateEmail(enteredMail)) {
      this.handleMailError();
      return;
      }
      try {
        await this.searchEmailInDatabase(enteredMail);
      } catch (error) {
        this.handleMailError();
      }
  }

  async searchEmailInDatabase(email: string) {
    const q = query(collection(this.firestore, 'users'), where('mail', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      this.handleMailError();
    } else {
      this.validMail = true;
    }
  }

  validateEmail(email: string) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  }

  handleMailError() {
    this.user.mail = '';
    this.validMail = false;  
    setTimeout(() => {
      this.validMail = true;  
    }, 2000);
  }

  async onSubmit(ngForm: NgForm) {
    let enteredMail = this.user.mail.trim();
    let enteredPassword = this.user.password;

    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, enteredMail, enteredPassword);
      const firebaseUser = userCredential.user;
      await this.checkFirestore(firebaseUser);
      this.emptyValue();
    } catch (error: any) {
      this.handleAuthError(error);
    }
  }

  handleAuthError(error: any) {
    switch (error.code) {
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/too-many-requests':
        this.handlePasswordError();
        break;
      case 'auth/user-not-found':
        this.handleMailError();
        break;
      default:
        this.handlePasswordError();
    }
  }

  async checkFirestore(firebaseUser: any) {
    const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data() as User;
      this.handleSuccess(userData, firebaseUser.email);
      this.router.navigate(['/login', firebaseUser.uid]);
    } else {
      console.error('Benutzer in Firestore nicht gefunden.');
    }
  }

  emptyValue() {
    this.user.mail = '';  
    this.user.password = '';  
    this.validMail = true;
    this.validPassword = true;
  }

  async handleSuccess(user: User, enteredMail: string) {
    this.validMail = true;
    this.validPassword = true;
    const userDocRef = doc(this.firestore, `users/${user.userId}`);
    await updateDoc(userDocRef, { online: true });
    this.userService.setUser(user);
    this.router.navigate(['/login',user.userId]);
  }

  handlePasswordError() {
    this.validPassword = false;
    this.user.password = '';
    setTimeout(() => {
      this.validPassword = true;
    }, 2000);
  }

  guestLogin() {
    const userCollection = collection(this.firestore, 'users');
    const guestUserId = '12345guest';
    const guestUserDocRef = doc(userCollection, guestUserId);
    const guestUser = new User();
    guestUser.name = 'Gast';
    guestUser.mail = 'guest@example.com';
    guestUser.avatar = 1;  
    guestUser.userId = guestUserId;

    setDoc(guestUserDocRef, guestUser.toJson()).then(() => {
      this.handleSuccess(guestUser, guestUser.mail);
      this.deleteGuestChats();
    }).catch((error) => {
      console.error('Fehler beim Anlegen des Gastbenutzers:', error);
    });
  }

  deleteGuestChats() {
    const queryGuests = this.getGuestChatsQuery();
    getDocs(queryGuests).then((snapshot) => {
      snapshot.forEach((doc) => this.handleGuestChat(doc));
    }).catch((error) => console.error('Fehler bei der Abfrage der Chats:', error));
  }
  
  private getGuestChatsQuery() {
    const chatsCollection = collection(this.firestore, 'chats');
    return query(
      chatsCollection,
      where(documentId(), '>=', '12345guest'),
      where(documentId(), '<=', '12345guest\uf8ff')
    );
  }
  
  private handleGuestChat(doc: any) {
    if (doc.id.startsWith('12345guest') || doc.id.endsWith('12345guest')) {
      this.deleteSubcollections(doc.ref)
        .then(() => deleteDoc(doc.ref))
        .then(() => console.log('Chat gelöscht:', doc.id))
        .catch((error) => console.error('Fehler beim Löschen:', error));
    }
  }
  
  async deleteSubcollections(chatRef: any) {
    const messagesCollection = collection(chatRef, 'messages');
    const snapshot = await getDocs(messagesCollection);
    const deletePromises = snapshot.docs.map((messageDoc) => {
      return deleteDoc(messageDoc.ref);  
    });
  
    await Promise.all(deletePromises);
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
    newUser.avatar = googleUser.photoURL || "1";
    newUser.online = true;
    newUser.userId = userId;
  
    await setDoc(userDocRef, newUser.toJson());
    this.handleSuccess(newUser, email);
  }

  goToSignUp() {
    this.signUpChange.emit(true); 
  }

  goToPasswordReset() {
    this.passwordChange.emit(true)
  }
}