import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { SharedService } from '../../services/shared.service';
import { ThreadComponent } from "../thread/thread.component";
import { DialogEditChannelComponent } from './dialog-edit-channel/dialog-edit-channel.component';
import { AddChannelUserComponent } from './add-channel-user/add-channel-user.component';
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { collection, doc, Firestore, getDoc, onSnapshot } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';  


@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatDialogModule,
    ThreadComponent,
    AddChannelUserComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
  userCount: number = 0;

  userData: any = [];
  user = new User();
  userId!:string;

  channel = new Channel();
  channelData: any = [];
  filteredChannels: any = [];

  message = new Message;
  allMessages: any = [];
  filteredMessages: any = [];

  answer = new Answer();
  allAnswers: any = [];

  @Input() selectedChannelId: string | null = null;

  selectedChannel: Channel | null = null;
  isThreadOpen: boolean = true;
  selectedMessage: Message | null = null; // Selected message for the thread
  selectedAnswers: Answer[] = [];

  constructor(public dialog: MatDialog, public firestore: Firestore, private sharedService: SharedService, public userService: UserService, private route: ActivatedRoute) {
    this.getAllUsers();
    this.getAllChannels();
    this.getAllMessages();
    this.subscribeToSearch();

    this.route.params.subscribe(params => {
    this.userId = params['userId'];
      console.log("Benutzer-ID:", this.userId);
    });

  }

  ngOnChanges(): void {
    if (this.selectedChannelId) {
      this.loadChannel(this.selectedChannelId).then(() => {
        this.getAllMessages(); // Call after loading the channel
      });
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
    const messagesCollection = collection(this.firestore, `channels/${this.selectedChannelId}/messages`);
    const readMessages = onSnapshot(messagesCollection, (snapshot) => {
      this.allMessages = [];

      snapshot.forEach((doc) => {
        let message = new Message({ ...doc.data(), id: doc.id });
        this.allMessages.push(message);

        this.getAllAnswersForMessage(message.id);
      });
      console.log('Current messages in the channel:', this.allMessages);
    });
  }

  getAllAnswersForMessage(messageId: string) {

    const answersCollection = collection(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}/answers`);
    const readAnswers = onSnapshot(answersCollection, (snapshot) => {
      this.allAnswers = []

      snapshot.forEach((doc) => {
        let answer = new Answer({ ...doc.data() });
        this.allAnswers.push(answer);
      });

      console.log(`Current answers for message ${messageId}:`, this.allAnswers);
    });
  }



  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    return user ? user.avatar : 'default';
  }

  isCurrentUser(currentUser:string):boolean{
    const user = this.userData.find((u:any) => u.userId === this.userId );
    return user ? user.name === currentUser : false;
  }

  sendMessage() { }

  openUsersList() {
    this.dialog.open(AddChannelUserComponent)
  }

  openDialogAddUser() {
    this.dialog.open(DialogAddUserComponent);
  }
  openDialogEditChannel(channel: any) {
    this.dialog.open(DialogEditChannelComponent, { data: channel });
  }

  onThreadClosed() {
    this.isThreadOpen = false;
    this.selectedMessage = null;
    this.selectedAnswers = [];
  }
  
  openThread(message: Message, answers: Answer[]) { 
    this.isThreadOpen = true; 
  }
}
