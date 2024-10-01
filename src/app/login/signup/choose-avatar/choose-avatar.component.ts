import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, addDoc, updateDoc, Firestore, onSnapshot, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { User } from '../../../models/user.class';

@Component({
  selector: 'app-choose-avatar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './choose-avatar.component.html',
  styleUrl: './choose-avatar.component.scss'
})
export class ChooseAvatarComponent {
  @Input() user!: User;  // Empfange den User als Input

  constructor(private firestore: Firestore) {}


  buttonEnabled: boolean = false;

  avatars: string[] = [
    '../../../assets/avatars/avatar_0.png',
    '../../../assets/avatars/avatar_1.png',
    '../../../assets/avatars/avatar_2.png',
    '../../../assets/avatars/avatar_3.png',
    '../../../assets/avatars/avatar_4.png',
    '../../../assets/avatars/avatar_5.png'
  ];

  selectedAvatar: string = '../../../assets/avatars/avatar_6.png';  // Start mit dem Standardbild

  async selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
    const avatarId = parseInt(avatar.match(/\d+/)?.[0] || '0', 10);
    this.user.avatar = avatarId;

    try {
      // Firebase-Dokument des Benutzers aktualisieren
      const userDocRef = doc(this.firestore, `users/${this.user.userId}`);
      await updateDoc(userDocRef, { avatar: avatarId });

      console.log(`Avatar ${avatarId} wurde dem Benutzer ${this.user.name} zugewiesen und in Firebase gespeichert.`);
    } catch (error) {
      console.error('Fehler beim Aktualisieren des Avatars in Firebase:', error);
    }
  }

  onSubmit(ngForm: NgForm) {

  }
}
