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
  userData: any = [];
  user = new User();
  userId!: string;

  channel = new Channel();
  channelData: any = [];

  message = new Message;
  allMessages: any = [];
  filteredMessages: any = [];

  answer = new Answer();
  allAnswers: any = [];

  channelMembers: any = [];

  @Input() selectedChannelId: string | null = null;

  selectedChannel: Channel | null = null;
  isThreadOpen: boolean = true;
  selectedMessage: Message | null = null; // Selected message for the thread
  selectedAnswers: Answer[] = [];

  constructor(public dialog: MatDialog, public firestore: Firestore, private sharedService: SharedService, public userService: UserService, private route: ActivatedRoute) {
    this.getAllUsers();
    this.subscribeToSearch();
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });
  //console.log('channels', this.selectedChannel);
  
  }

  ngOnChanges(): void {
    if (this.selectedChannelId) {
      this.loadChannel(this.selectedChannelId).then(() => {
        this.getAllMessages();
        
      }).catch(error => {
        console.error('Fehler beim Laden des Channels:', error);
      });
    }
  }

  async loadChannel(id: string) {
    const channelDocRef = doc(this.firestore, `channels/${id}`);
    const channelSnapshot = await getDoc(channelDocRef);

    if (channelSnapshot.exists()) {
      const data = channelSnapshot.data();
      this.selectedChannel = new Channel({ ...data, id });
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
    });
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    return user ? user.avatar : 'default';
  }

  isCurrentUser(currentUser: string): boolean {
    const user = this.userData.find((u: any) => u.userId === this.userId);
    return user ? user.name === currentUser : false;
  }

  sendMessage() { }

  async getChannelData(channelId: string): Promise<Channel> {
    const channelDocRef = doc(this.firestore, 'channels', channelId);
  
    try {
      const docSnap = await getDoc(channelDocRef);
      if (docSnap.exists()) {
        return new Channel({ ...docSnap.data(), id: docSnap.id });
      } else {
        throw new Error('Channel not found');
      }
    } catch (error) {
      console.error('Error fetching channel data:', error);
      throw error;
    }
  }
  
  openDialog(component: any, channelId: string) {
    this.getChannelData(channelId).then(channelData => {
      this.dialog.open(component, {
        data: {
          channelId: channelId,
          channel: channelData  // Pass the Channel object
        }
      });
    }).catch(error => {
      console.error("Error opening dialog:", error);
    });
  }
  
  openUsersList(channelId: string) {
    this.openDialog(AddChannelUserComponent, channelId);
  }
  
  openDialogAddUser(channelId: string) {
    this.openDialog(DialogAddUserComponent, channelId);
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
