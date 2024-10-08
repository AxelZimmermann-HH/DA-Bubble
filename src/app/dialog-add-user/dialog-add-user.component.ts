import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {  collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
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

  constructor(public firestore: Firestore, public dialogRef: MatDialogRef<DialogAddUserComponent>,public userService: UserService, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.channel = new Channel(data.channel); // Initialisiere das Channel-Objekt
    console.log('Channel:', this.channel);
    this.getAllUsers();

    this.user.name = "Noah";
  }
 
  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    const readUsers = onSnapshot(userCollection, (snapshot) => {
      this.userData = [];
      snapshot.forEach((doc) => {
        let user = new User({ ...doc.data(), id: doc.id });
        this.userData.push(user);
      });
      console.log('current users', this.userData);
    });
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
  }

  async addMember(user :User) {
    if (user) {
      const channelRef = doc(this.firestore,'channels', this.channel.id);
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

      } catch (error) {
        console.error('Fehler beim Hinzufügen des Mitglieds:', error);
      }
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
