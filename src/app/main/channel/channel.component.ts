import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { DialogEditChannelComponent } from '../../dialog-edit-channel/dialog-edit-channel.component';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
  userCount: number = 0;
  userData: any = [];
  user = new User();
  channel = new Channel();
  channelData: any = [];

  constructor(public dialog: MatDialog, public firestore: Firestore) {
    this.getAllUsers();
    this.getAllChannels();
    //provisorisch
    this.channel.channelName = 'Entwicklerteam'
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

  getAllChannels() {
    const channelCollection = collection(this.firestore, 'channels');
    const readChannel = onSnapshot(channelCollection, (snapshot) => {
      this.channelData = [];
      snapshot.forEach((doc) => {
        let channel = new Channel({ ...doc.data(), id: doc.id });
        this.channelData.push(channel);
      });

      console.log('current channel', this.channelData);
    });
  }

  openDialogAddUser() {

  }
  openDialogEditChannel() {
    this.dialog.open(DialogEditChannelComponent)
  }
}
