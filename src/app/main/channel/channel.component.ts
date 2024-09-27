import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { collection, doc, Firestore, getDoc, onSnapshot } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { SharedService } from '../../services/shared.service';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ThreadComponent } from "../thread/thread.component";
import { DialogEditChannelComponent } from './dialog-edit-channel/dialog-edit-channel.component';
import { AddChannelUserComponent } from './add-channel-user/add-channel-user.component';


@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSidenavModule, MatToolbarModule, ThreadComponent,AddChannelUserComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
  userCount: number = 0;
  userData: any = [];
  user = new User();
  channel = new Channel();
  channelData: any = [];
  filteredChannels: any = [];
  message = new Message;
  allMessages: any = [];
  filteredMessages: any = [];
  showThread = false;
  showPopup = false;

  @Input() selectedChannelId: string | null = null;
  
  selectedChannel:  Channel | null = null;

  constructor(public dialog: MatDialog, public firestore: Firestore, private sharedService: SharedService) {
    this.getAllUsers();
    this.getAllChannels();
    this.getAllMessages();
    this.subscribeToSearch();
    if (this.selectedChannelId) {
      this.loadChannel(this.selectedChannelId);
    }
  }


  ngOnChanges(): void {
    if (this.selectedChannelId) {
      this.loadChannel(this.selectedChannelId);
    }
  }

  async loadChannel(id: string) {
    const channelDocRef = doc(this.firestore, `channels/${id}`);
    const channelSnapshot = await getDoc(channelDocRef);

    if (channelSnapshot.exists()) {
      const data = channelSnapshot.data();
      this.selectedChannel = new Channel(data);
    } else {
      console.error('Channel not found');
    }
  }

  subscribeToSearch() {
    this.sharedService.searchTerm$.subscribe((term) => {
      if (term.length >= 3) {
        this.filterData(term);
      } else {
        this.resetFilteredData();
      }
    });
  }

  filterData(term: string) {
    this.filteredMessages = this.allMessages.filter((message: any) =>
      message.text.toLowerCase().includes(term.toLowerCase()) ||
      message.user.toLowerCase().includes(term.toLowerCase())
    );
  }

  resetFilteredData() {
    this.filteredMessages = this.allMessages;
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

  getAllMessages() {
    const messageCollection = collection(this.firestore, 'messages');
    const readMessage = onSnapshot(messageCollection, (snapshot) => {
      this.allMessages = [];
      snapshot.forEach((doc) => {
        let message = ({ ...doc.data(), id: doc.id });
        this.allMessages.push(message);
      });
      this.filteredMessages = this.allMessages;
      console.log('current message', this.allMessages);
    });
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    return user ? user.avatar : 'default';
  }

  sendMessage() { }

  openUsersList() {
   this.dialog.open(AddChannelUserComponent)
  }

  openDialogAddUser() {
    this.dialog.open(DialogAddUserComponent);
  }
  openDialogEditChannel(channel:any) {
    this.dialog.open(DialogEditChannelComponent,{data:channel});
  }

}
