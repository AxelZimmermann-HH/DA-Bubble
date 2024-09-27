import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../models/user.class';
import { DialogUserProfilComponent } from '../../../dialog-user-profil/dialog-user-profil.component';

@Component({
  selector: 'app-add-channel-user',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './add-channel-user.component.html',
  styleUrl: './add-channel-user.component.scss'
})
export class AddChannelUserComponent {
  userData: any = [];
  user = new User();

  constructor(public firestore: Firestore, public dialogRef: MatDialogRef<AddChannelUserComponent>, public dialog:MatDialog) {
    this.getAllUsers();
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

  openUserProfil(user:string){
    this.dialog.open(DialogUserProfilComponent,{data:user});
  }
}
