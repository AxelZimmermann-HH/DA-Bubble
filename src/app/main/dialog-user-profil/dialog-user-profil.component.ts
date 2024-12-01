import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { CommonModule } from '@angular/common';
import { Channel } from '../../models/channel.class';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { FormsModule, NgForm } from '@angular/forms';
import { Auth, verifyBeforeUpdateEmail, updateEmail, sendEmailVerification, EmailAuthProvider, reauthenticateWithCredential } from '@angular/fire/auth';
import { doc, setDoc } from '@angular/fire/firestore';



@Component({
  selector: 'app-dialog-user-profil',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './dialog-user-profil.component.html',
  styleUrl: './dialog-user-profil.component.scss'
})
export class DialogUserProfilComponent {

  channel = new Channel();
  currentUser: any;
  currentPassword: string = '';

  currentUserId: string = '';
  chatPerson: any;

  isEditMode: boolean = false;
  isEditable: boolean; 

  emailChanged: boolean = false;

  @Output() chatSelected = new EventEmitter<void>();

  constructor(
    public dialogRef: MatDialogRef<DialogUserProfilComponent>,
    public firestore: Firestore,
    public auth: Auth,
    public chatService: ChatService,
    public userService: UserService,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public data: { user: User, isEditable: boolean }) { 
    this.isEditable = data.isEditable; 
  }

  avatars: string[] = [
    '../../../assets/avatars/avatar_0.png',
    '../../../assets/avatars/avatar_1.png',
    '../../../assets/avatars/avatar_2.png',
    '../../../assets/avatars/avatar_3.png',
    '../../../assets/avatars/avatar_4.png',
    '../../../assets/avatars/avatar_5.png'
  ];

  selectedAvatar: string = '../../../assets/avatars/avatar_6.png';  
  originalAvatar: string | number = '';

  selectedChannel: Channel | null = null;

  ngOnInit() {
    this.userService.currentUser$.subscribe(currentUser => {
      this.currentUser = currentUser;
      if (currentUser) {
        this.currentUserId = currentUser.userId;
      }
    });
  }

  getAvatarForUser(user: any) {

    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png';  // Local asset avatar
      } else {
        return user.avatar;  // External URL avatar
      }
    }
    return './assets/avatars/avatar_0.png';  // Default avatar when user not found
  }

  async selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    const avatarId = parseInt(avatar.match(/\d+/)?.[0] || '0', 10);
    this.data.user.avatar = avatarId;
  }


  checkEmailBlur() {
    const enteredEmail = this.data.user.mail; // Aktuelle Eingabe im E-Mail-Feld
    const currentEmail = this.auth.currentUser?.email; // Aktuelle E-Mail aus Auth
  
    if (enteredEmail === currentEmail) {
      console.log('Die eingegebene E-Mail-Adresse stimmt mit der aktuellen überein.');
      this.emailChanged = false;
      console.log(this.emailChanged);
    } else {
      console.log('Die eingegebene E-Mail-Adresse ist anders als die aktuelle.');
      this.emailChanged = true;
      console.log(this.emailChanged);
    }
  }

  saveProfile(form: NgForm) {
    if (this.emailChanged == true) {
      this.handleMailChange(form) 
    } else {
      this.handleSmallChanges(form)
    }
  }

  handleSmallChanges(form: NgForm) {
    if (form.valid) {
      this.userService.updateUser(this.data.user);
  
      console.log('Profile successfully saved:', this.data.user);
      this.toggleEditMode();  // Exit edit mode
      this.dialogRef.close()
      window.location.reload();
    } else {
      console.error('Form is invalid');
    }
  }

  handleMailChange(form: NgForm) {
    if (form.valid) {
      const user = this.auth.currentUser;
  
      if (user) {
        const currentPassword = this.currentPassword; // Vom Benutzer eingegeben
        const newEmail = this.data.user.mail; // Neue E-Mail-Adresse aus dem Formular
  
        // Schritt 1: Re-Authentifizierung
        const credentials = EmailAuthProvider.credential(user.email!, currentPassword);
  
        reauthenticateWithCredential(user, credentials)
          .then(() => {
            console.log('Re-Authentifizierung erfolgreich.');
  
            // Schritt 2: Verifizierung vor E-Mail-Update
            return verifyBeforeUpdateEmail(user, newEmail, {
              url: 'http://localhost:4200/mail-changed',
              handleCodeInApp: true,
            });
          })
          .then(() => {
            console.log('Verifizierungs-Mail an neue E-Mail-Adresse gesendet:', newEmail);

            return this.userService.updateUser(this.data.user);
          })
          .then(() => {
            console.log('Profil erfolgreich in Firestore gespeichert:', this.data.user);

            // Erfolgsdialog anzeigen
            this.sharedService.setMailChangeSuccess(true);

            // Schritt 4: Popup schließen und Edit-Modus verlassen
            this.toggleEditMode();
            this.dialogRef.close();
          })
          .catch((error) => {
            console.error('Fehler beim Aktualisieren der E-Mail-Adresse:', error);
  
            if (error.code === 'auth/invalid-email') {
              alert('Die eingegebene E-Mail-Adresse ist ungültig.');
            } else if (error.code === 'auth/email-already-in-use') {
              alert('Diese E-Mail-Adresse wird bereits verwendet.');
            } else if (error.code === 'auth/wrong-password') {
              alert('Das eingegebene Passwort ist falsch.');
            } else if (error.code === 'auth/requires-recent-login') {
              alert('Die Sitzung ist abgelaufen. Bitte loggen Sie sich erneut ein.');
            } else {
              alert('Ein unbekannter Fehler ist aufgetreten: ' + error.message);
            }
          });
      } else {
        console.error('Kein Benutzer angemeldet.');
        alert('Sie müssen angemeldet sein, um diese Aktion auszuführen.');
      }
    } else {
      alert('Formular ist ungültig.');
    }
  }

  toggleEditMode() {
    if (!this.isEditMode) {
      this.originalAvatar = this.data.user.avatar;
    } else {
      this.data.user.avatar = this.originalAvatar;
      this.selectedAvatar = this.getAvatarForUser(this.data.user);
    }
  
    this.isEditMode = !this.isEditMode;
  }
}