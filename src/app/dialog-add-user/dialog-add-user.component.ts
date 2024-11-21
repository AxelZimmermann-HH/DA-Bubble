import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { UserService } from '../services/user.service';
import { SharedService } from '../services/shared.service';
import { ChannelService } from '../services/channel.service';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, MatInputModule, MatSelectModule],
  templateUrl: './dialog-add-user.component.html',
  styleUrl: './dialog-add-user.component.scss'
})

export class DialogAddUserComponent {
  channel = new Channel();
  channelData: any = [];
  channelId!: string;

  userData: any = [];
  user = new User();

  selectedOption: string | null = null;
  selectedUser: any;
  dropdownOpen = false;


  constructor(
    public firestore: Firestore,
    public dialogRef: MatDialogRef<DialogAddUserComponent>,
    public userService: UserService,
    @Inject(MAT_DIALOG_DATA)
    public data: any,
    public sharedService: SharedService,
    public channelService : ChannelService
  ) {
    if (data && data.channel) {
      this.channel = new Channel(data.channel);
      this.channelId = data.channel.id;
      this.channelService.getChannelMembers(this.channelId);
      this.userService.getAllUsers();
    } else {
      console.error('No channel data passed to the dialog');
    }
  }

  updateChannelMembers() {
    if (this.userData.length === 0)      return;

    const currentMemberIds = this.channel.members.map((member: any) => member.userId);
    const updatedMembers = this.channel.members.filter((member: any) =>
      this.userData.some((user: User) => user.userId === member.userId)
    );

    if (updatedMembers.length !== currentMemberIds.length) {
      const channelRef = doc(this.firestore, 'channels', this.channelId);
      updateDoc(channelRef, { members: updatedMembers })
        .then(() => {
          this.channel.members = updatedMembers;
          console.log('Channel members updated:', this.channel.members);
        })
        .catch((error) => {
          console.error('Error updating channel members:', error);
        });
    }
  }

  async addMember() {
    const channelRef = doc(this.firestore, 'channels', this.channel.id);
    try {
      const currentMembers = this.channel.members || [];
      if (this.selectedOption === 'channel') {
        await this.addAllUsers(currentMembers, channelRef);

      } else if (this.selectedOption === 'user' || this.selectedUser) {
        await this.addSelectedUsers(currentMembers, channelRef)
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Mitglieds/der Mitglieder:', error);
    }
  }

  async addAllUsers(currentMembers: any[], channelRef: any) {
    const newMembers = this.userData
      .filter((user: any) => !currentMembers.some(member => member.userId === user.userId))
      .map((user: any) => user.toJson());
    if (newMembers.length > 0) {
      const updatedMembers = [...currentMembers, ...newMembers];
      await updateDoc(channelRef, { members: updatedMembers });
      this.dialogRef.close(true);
    } else {
      this.dialogRef.close(false);
    }
  }

  async addSelectedUsers(currentMembers: any[], channelRef: any) {
    const isMemberAlready = currentMembers.some(member => member.userId === this.selectedUser.userId);
    if (isMemberAlready) {
      this.dialogRef.close(false);
      return;
    }
    const updatedMembers = [...currentMembers, this.selectedUser.toJson()];
    await updateDoc(channelRef, { members: updatedMembers });
    this.dialogRef.close(true);
  }

  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.dropdownOpen = false;
  }

  removeSelectedUser(event: Event) {
    event.stopPropagation();
    this.selectedUser = null;
    this.dropdownOpen = false;
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
