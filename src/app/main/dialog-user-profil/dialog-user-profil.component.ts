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

  currentUserId: string = '';
  chatPerson: any;

  isEditMode: boolean = false;
  isEditable: boolean; 

  @Output() chatSelected = new EventEmitter<void>();

  constructor(
    public dialogRef: MatDialogRef<DialogUserProfilComponent>,
    public firestore: Firestore,
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

  saveProfile(form: NgForm) {
    if (form.valid) {
      this.userService.updateUser(this.data.user); // Pass the updated user to the service
  
      console.log('Profile successfully saved:', this.data.user);
      this.toggleEditMode();  // Exit edit mode
      this.dialogRef.close()
    } else {
      console.error('Form is invalid');
    }
  }

  toggleEditMode() {
    if (!this.isEditMode) {
      this.originalAvatar = this.data.user.avatar;
    } else {
      this.data.user.avatar = this.originalAvatar;
      this.selectedAvatar = this.getAvatarForUser(this.data.user); // Vorschau zurücksetzen
    }
  
    this.isEditMode = !this.isEditMode;
  }
}