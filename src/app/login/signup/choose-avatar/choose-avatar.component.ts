import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { collection, addDoc, updateDoc, Firestore, onSnapshot, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { User } from '../../../models/user.class';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';  // Firebase Storage imports


@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {
  @Input() user!: User;  // Empfange den User als Input
  @Output() switchToSignin = new EventEmitter<void>();

  @Output() closeAvatarPage = new EventEmitter<boolean>();  // EventEmitter erstellen
  @Output() openFirstPage = new EventEmitter<boolean>();
  
  buttonEnabled: boolean = false;
  selectedFile: File | null = null;
  selectedFileName: string = '';  // Neuer Dateiname-String
  downloadURL: string = '';
  success: boolean = false;

  constructor(private firestore: Firestore, public dialog: MatDialog) {}

  avatars: string[] = [
    '../../../assets/avatars/avatar_0.png',
    '../../../assets/avatars/avatar_1.png',
    '../../../assets/avatars/avatar_2.png',
    '../../../assets/avatars/avatar_3.png',
    '../../../assets/avatars/avatar_4.png',
    '../../../assets/avatars/avatar_5.png'
  ];

  selectedAvatar: string = '../../../assets/avatars/avatar_6.png';  

  async selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    this.buttonEnabled = true;
    const avatarId = parseInt(avatar.match(/\d+/)?.[0] || '0', 10);
    this.user.avatar = avatarId;

    try {
      const userDocRef = doc(this.firestore, `users/${this.user.userId}`);
      await updateDoc(userDocRef, { avatar: avatarId });
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Avatars in Firebase:', error);
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;  // Dateiname speichern
    }
  }

  async uploadFile() {
    if (!this.selectedFile) return;

    try {
      // Initialisiere Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `avatars/${this.user.userId}`);

      // Lade die Datei hoch
      const snapshot = await uploadBytes(storageRef, this.selectedFile);

      // Hol die URL der hochgeladenen Datei
      const url = await getDownloadURL(snapshot.ref);
      this.downloadURL = url;
      this.selectedAvatar = url;
      this.buttonEnabled = true;  

      // Speichere die URL des Bildes in Firestore
      const userDocRef = doc(this.firestore, `users/${this.user.userId}`);
      await updateDoc(userDocRef, { avatar: url });
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
    }
  }

  getBack() {
    this.openFirstPage.emit(true);
    this.closeAvatarPage.emit(false);
    console.log('check');
  }

  onSubmit(ngForm: NgForm) {
    this.success = true;
    setTimeout(() => {
      this.switchToSignin.emit();
    }, 2000);
  }
}
