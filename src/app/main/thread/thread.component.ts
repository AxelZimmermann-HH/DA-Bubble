import { Component } from '@angular/core';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule,MatDialogModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {
  userData: any = [];
  user = new User();
  channel = new Channel();
  channelData: any = [];
  message = new Message();
  allMessages: any = [];



  constructor(public firestore: Firestore) {
    this.getAllUsers();
    this.getAllChannels();
    this.getAllMessages();
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

  getAllMessages() {
    const messageCollection = collection(this.firestore, 'messages');
    const readMessage = onSnapshot(messageCollection, (snapshot) => {
      this.allMessages = [];
      snapshot.forEach((doc) => {
        let message = ({ ...doc.data(), id: doc.id });



        this.allMessages.push(message);
      });

      console.log('current message', this.allMessages);
    });
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    return user ? user.avatar : 'default';
  }
  sendMessage(){}
}
