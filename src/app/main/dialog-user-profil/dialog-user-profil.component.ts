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
    this.isEditMode = !this.isEditMode;
  }
}