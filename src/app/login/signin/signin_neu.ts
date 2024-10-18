import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, Firestore, onSnapshot, doc, updateDoc, getDoc, setDoc, query, where, getDocs, deleteDoc, documentId } from '@angular/fire/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage'; // Firebase Storage Funktionen
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
      const q = query(collection(this.firestore, 'users'), where('mail', '==', enteredMail));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        this.handleMailError();
      } else {
        this.validMail = true;
      }
    } catch (error) {
      this.handleMailError();
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

  // Debugging: Ausgabe der E-Mail vor der Validierung
  console.log('Eingegebene E-Mail:', enteredMail);

  if (!this.validateEmail(enteredMail)) {
      console.error('Ungültige E-Mail-Adresse:', enteredMail);
      return;  // Verhindere den Login, wenn die E-Mail ungültig ist
  }

  try {
      // Firebase Auth verwendet zur Anmeldung die E-Mail und das Passwort
      const userCredential = await signInWithEmailAndPassword(this.auth, enteredMail, enteredPassword);
      const firebaseUser = userCredential.user;

      // Debugging: Ausgabe der User-ID von Firebase Auth
      console.log('Firebase Auth userId:', firebaseUser.uid);

      // Prüfe, ob der Benutzer in Firestore existiert und handle die Anmeldung
      const userDocRef = doc(this.firestore, 'users/${firebaseUser.uid}');
      const userSnapshot = await getDoc(userDocRef);

      // Debugging: Ausgabe des Firestore-Pfads, den du abfragst
      console.log('Abfrage des Firestore-Dokuments unter Pfad:', 'users/${firebaseUser.uid}');

      if (userSnapshot.exists()) {
          const userData = userSnapshot.data() as User;
          this.handleSuccess(userData, enteredMail); // Erfolgshandling
          this.router.navigate(['/login', firebaseUser.uid]);
      } else {
          console.error('Benutzer in Firestore nicht gefunden.');
      }

      // Leere die Eingabefelder nach erfolgreicher Authentifizierung
      this.emptyValue();

  } catch (error: any) {
      console.error('Fehler bei der Anmeldung:', error);
      if (error.code === 'auth/wrong-password') {
          this.falsePassword();
      } else if (error.code === 'auth/user-not-found') {
          this.falseMail();
      }
  }
}

async onSubmitNeu(ngForm: NgForm) {
  let enteredMail = this.user.mail.trim();
  let enteredPassword = this.user.password;

  try {
    // Versuche, den Benutzer anzumelden
    const userCredential = await signInWithEmailAndPassword(this.auth, enteredMail, enteredPassword);
    const firebaseUser = userCredential.user;

    console.log('Erfolgreicher Login:', firebaseUser.uid);


    
    // Nach erfolgreichem Login weiterleiten
    this.router.navigate(['/login', firebaseUser.uid]);

    // Optional: Leere die Eingabefelder
    this.emptyValue();

  } catch (error: any) {
    // Unterdrücke den Konsolenfehler
    if (error.code === 'auth/wrong-password') {
      console.log('Fehler: Falsches Passwort');
      this.handlePasswordError();  // Leert das Passwortfeld und zeigt den Fehler an
    } else if (error.code === 'auth/user-not-found') {
      console.log('Fehler: Benutzer nicht gefunden');
      this.handleMailError();  // Leert das Mailfeld und zeigt den Fehler an
    } else {
      // Unbekannter Fehler
      console.log('Unbekannter Fehler:', error.message);
    }
  }
}

handlePasswordError() {
  this.user.password = ''; // Passwortfeld leeren
  this.validPassword = false;  // Fehler anzeigen
  setTimeout(() => {
    this.validPassword = true;  // Fehler nach 2 Sekunden zurücksetzen
  }, 2000);
}




  async onSubmit4(ngForm: NgForm) {
    let enteredMail = this.user.mail.trim();
    let enteredPassword = this.user.password;

    // Debugging: Ausgabe der E-Mail vor der Validierung
    console.log('Eingegebene E-Mail:', enteredMail);

    if (!this.validateEmail(enteredMail)) {
        this.validMail = false;
        return;  // Verhindere den Login, wenn die E-Mail ungültig ist
    }

    if (!enteredPassword) {
        // Wenn kein Passwort eingegeben wurde, setze validPassword auf false
        this.validPassword = false;
        setTimeout(() => {
          this.validPassword = true;
      }, 2000);
        return;
    }

    try {
        // Firebase Auth verwendet zur Anmeldung die E-Mail und das Passwort
        const userCredential = await signInWithEmailAndPassword(this.auth, enteredMail, enteredPassword);
        const firebaseUser = userCredential.user;

        // Debugging: Ausgabe der User-ID von Firebase Auth
        console.log('Firebase Auth userId:', firebaseUser.uid);

        // Prüfe, ob der Benutzer in Firestore existiert und handle die Anmeldung
        const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
        const userSnapshot = await getDoc(userDocRef);

        // Debugging: Ausgabe des Firestore-Pfads, den du abfragst
        console.log('Abfrage des Firestore-Dokuments unter Pfad:', `users/${firebaseUser.uid}`);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data() as User;
            this.handleSuccess(userData, enteredMail); // Erfolgshandling
            this.router.navigate(['/login', firebaseUser.uid]);
        } else {
            console.error('Benutzer in Firestore nicht gefunden.');
        }

        // Leere die Eingabefelder nach erfolgreicher Authentifizierung
        this.emptyValue();

    } catch (error: any) {
        console.error('Fehler bei der Anmeldung:', error);
        if (error.code === 'auth/wrong-password') {
            // Setze validPassword auf false, um den Fehler-Placeholder anzuzeigen
            this.validPassword = false;
            
        } else if (error.code === 'auth/user-not-found') {
            this.falseMail();
        }
    }
}




  async onSubmit2(ngForm: NgForm) {
    let enteredMail = this.user.mail.trim();
    let enteredPassword = this.user.password;

    // Debugging: Ausgabe der E-Mail vor der Validierung
    console.log('Eingegebene E-Mail:', enteredMail);

    if (!this.validateEmail(enteredMail)) {
        console.error('Ungültige E-Mail-Adresse:', enteredMail);
        return;  // Verhindere den Login, wenn die E-Mail ungültig ist
    }

    try {
        // Firebase Auth verwendet zur Anmeldung die E-Mail und das Passwort
        const userCredential = await signInWithEmailAndPassword(this.auth, enteredMail, enteredPassword);
        const firebaseUser = userCredential.user;

        // Debugging: Ausgabe der User-ID von Firebase Auth
        console.log('Firebase Auth userId:', firebaseUser.uid);

        // Prüfe, ob der Benutzer in Firestore existiert und handle die Anmeldung
        const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
        const userSnapshot = await getDoc(userDocRef);

        // Debugging: Ausgabe des Firestore-Pfads, den du abfragst
        console.log('Abfrage des Firestore-Dokuments unter Pfad:', `users/${firebaseUser.uid}`);

        if (userSnapshot.exists()) {
            const userData = userSnapshot.data() as User;
            this.handleSuccess(userData, enteredMail); // Erfolgshandling
            this.router.navigate(['/login', firebaseUser.uid]);
        } else {
            console.error('Benutzer in Firestore nicht gefunden.');
        }

        // Leere die Eingabefelder nach erfolgreicher Authentifizierung
        this.emptyValue();

    } catch (error: any) {
        if (error.code === 'auth/wrong-password') {
            this.falsePassword();
        } else if (error.code === 'auth/user-not-found') {
            this.falseMail();
        }
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
    //console.log('let user id',user.userId);
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
    const userCollection = collection(this.firestore, 'users');
    
    const guestUserId = '12345guest';
    const guestUserDocRef = doc(userCollection, guestUserId);

    // Erstelle einen Gast-Benutzer mit einer zufälligen ID
    const guestUser = new User();
    guestUser.name = 'Gast';
    guestUser.mail = 'guest@example.com';
    guestUser.avatar = 1;  // Oder eine beliebige Avatar-ID
    // guestUser.userId = guestUserDocRef.id;  // Generiere eine zufällige ID
    guestUser.userId = guestUserId;

    setDoc(guestUserDocRef, guestUser.toJson()).then(() => {
      console.log('Gastbenutzer angelegt:', guestUser);
  
      // Rufe handleSuccess auf und simuliere den Gast-Login
      this.handleSuccess(guestUser, guestUser.mail);
      this.deleteGuestChats();
    }).catch((error) => {
      console.error('Fehler beim Anlegen des Gastbenutzers:', error);
    });
  }

  deleteGuestChats() {
    console.log('RUN');
    const chatsCollection = collection(this.firestore, 'chats');
    
    // Abfrage für Dokumente, deren ID mit "12345guest" beginnt
    const startWithQuery = query(chatsCollection, where(documentId(), '>=', '12345guest'), where(documentId(), '<=', '12345guest\uf8ff'));
  
    getDocs(startWithQuery).then((snapshot) => {
      console.log('StartWithQuery: Anzahl der Dokumente:', snapshot.size);
      if (snapshot.empty) {
        console.log('Keine Dokumente gefunden, die mit "12345guest" beginnen.');
      } else {
        snapshot.forEach((doc) => {
          // Client-seitige Überprüfung, ob die ID wirklich mit "guest" endet
          if (doc.id.startsWith('12345guest') || doc.id.endsWith('12345guest')) {
            console.log('Dokument gefunden zum Löschen:', doc.id);
            // Lösche alle Subcollections vor dem Hauptdokument
            this.deleteSubcollections(doc.ref).then(() => {
              // Lösche das übergeordnete Chat-Dokument
              deleteDoc(doc.ref).then(() => {
                console.log('Chat gelöscht:', doc.id);
              }).catch((error) => {
                console.error('Fehler beim Löschen des Chats:', error);
              });
            }).catch((error) => {
              console.error('Fehler beim Löschen der Subcollection:', error);
            });
          }
        });
      }
    }).catch((error) => {
      console.error('Fehler bei der Abfrage der Chats:', error);
    });
  }
  
  // Rekursive Funktion zum Löschen der Subcollections
  async deleteSubcollections(chatRef: any) {
    const messagesCollection = collection(chatRef, 'messages');
    
    // Alle Nachrichten innerhalb des Chat-Dokuments abrufen
    const snapshot = await getDocs(messagesCollection);
  
    const deletePromises = snapshot.docs.map((messageDoc) => {
      return deleteDoc(messageDoc.ref);  // Lösche jede Nachricht in der "messages"-Subcollection
    });
  
    // Warte, bis alle Nachrichten gelöscht sind
    await Promise.all(deletePromises);
    console.log('Alle Nachrichten in der Subcollection gelöscht.');
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
    console.log('Neuer Benutzer angelegt:', newUser);
  
    this.handleSuccess(newUser, email);
  }

  goToSignUp() {
    this.signUpChange.emit(true); // sendet das Event nach oben
  }

  goToPasswordReset() {
    this.passwordChange.emit(true)
  }
}