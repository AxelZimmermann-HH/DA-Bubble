import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { FormsModule } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

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

  constructor(public firestore: Firestore, public dialogRef: MatDialogRef<DialogAddUserComponent>) {

    this.getAllUsers()
    //provisorisch
    this.channel.channelName = "Entwicklerteam";
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

  onSubmit() { }

  addUser(option: string, user?: any) {
    if (option === 'channel') {
      // Logic to add all users to the channel
      
      
    } else if (option === 'user' && user) {
      // Logic to add the selected user to the channel
  
    }

    this.dialogRef.close();
  }


  toggleDropdown() { this.dropdownOpen = !this.dropdownOpen; }
  selectUser(user: any) {
    this.selectedUser = user;
    this.dropdownOpen = false;
  }
}
