import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormField, MatInputModule, MatSelectModule],
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


  constructor(public firestore: Firestore, public dialogRef: MatDialogRef<DialogAddUserComponent>, public userService: UserService, @Inject(MAT_DIALOG_DATA) public data: any) {
  
    if (data && data.channel) {
      this.channel = new Channel(data.channel);
      this.channelId = data.channel.id;
      this.getChannelMembers();
    } else {
      console.error('No channel data passed to the dialog');
    }

    // Überprüfen, von wo der Dialog geöffnet wurde
    if (data.source === 'createNewChannel') {
      console.log("Dialog opened from createNewChannel");
    } else if (data.source === 'channelComponent') {
      console.log("Dialog opened from channelComponent");
    }

    this.getAllUsers();
  }

  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    onSnapshot(userCollection, (snapshot) => {
      this.userData = [];
      snapshot.forEach((doc) => {
        let user = new User({ ...doc.data(), id: doc.id });
        this.userData.push(user);
      });
      console.log('current users', this.userData);
      this.updateChannelMembers();
    });
  }
  updateChannelMembers() {
    const currentMemberIds = this.channel.members.map((member: any) => member.userId);
    const updatedMembers = this.channel.members.filter((member: any) =>
      currentMemberIds.includes(member.userId)
    );
    if (updatedMembers.length !== this.channel.members.length) {
      const channelRef = doc(this.firestore, 'channels', this.channelId);
      updateDoc(channelRef, { members: updatedMembers }).then(() => {
        this.channel.members = updatedMembers;
        console.log('Channel members updated:', this.channel.members);
      }).catch((error) => {
        console.error('Error updating channel members:', error);
      });
    }
  }
  async addMember(user: User) {
    if (user) {
      const channelRef = doc(this.firestore, 'channels', this.channel.id);
      try {
        const currentMembers = this.channel.members || [];
        const isMemberAlready = currentMembers.some(member => member.userId === user.userId);

        if (isMemberAlready) {
          console.log(`${user.name} ist bereits ein Mitglied des Channels.`);
          this.dialogRef.close(false);
          return;
        }
        await updateDoc(channelRef, {
          members: [...currentMembers, user.toJson()]
        });

        console.log(`${user.name} wurde zum Channel hinzugefügt.`);
        this.dialogRef.close(true);
        return;

      } catch (error) {
        console.error('Fehler beim Hinzufügen des Mitglieds:', error);
      }
    }
  }


  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.dropdownOpen = false;
    console.log('selected user ', this.selectedUser.avatar);

  }

  removeSelectedUser(event: Event) {
    event.stopPropagation();
    this.selectedUser = null;
  }


  getChannelMembers() {
    const channelRef = doc(this.firestore, 'channels', this.channelId);
    onSnapshot(channelRef, (doc) => {
      if (doc.exists()) {
        this.channel.members = doc.data()?.['members'] || [];
        console.log('Aktualisierte Mitglied Liste', this.channel.members);
      }
      else {
        console.log('channel-Dokument existiert nicht ');
      }
    })
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png';
      } else {
        return user.avatar;
      }
    }
    return './assets/avatars/avatar_0.png';
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
