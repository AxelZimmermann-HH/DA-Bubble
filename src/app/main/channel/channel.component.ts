import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { DialogEditChannelComponent } from '../../dialog-edit-channel/dialog-edit-channel.component';
import { User } from '../../models/user.class';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, FormsModule,MatDialogModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
userCount: number = 0;
userData:any=[];
user = new User();

constructor(public dialog: MatDialog, public firestore: Firestore){
this.getAllUsers()
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
    console.log('current users', this.userData);
  });
}

  openDialogAddUser(){
 
  }
  openDialogEditChannel(){
    this.dialog.open(DialogEditChannelComponent)
  }
}
