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
import { addDoc, collection, doc, Firestore, getDoc, onSnapshot, Timestamp } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';


@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatDialogModule,
    ThreadComponent,
    AddChannelUserComponent, PickerComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})
export class ChannelComponent {
  userData: any = [];
  user = new User();
  userId!: string;

  channel = new Channel();
  channelData: any = [];

  message = new Message();
  allMessages: any = [];
  filteredMessages: any = [];
  groupedMessages: { [key: string]: Message[] } = {};


  answer = new Answer();
  allAnswers: any = [];

  channelMembers: any = [];
  newMessageText: string = '';

  @Input() selectedChannelId: string | null = null;

  selectedChannel: Channel | null = null;
  isThreadOpen: boolean = true;
  selectedMessage: Message | null = null; // Selected message for the thread
  selectedAnswers: Answer[] = [];

  constructor(public dialog: MatDialog, public firestore: Firestore, private sharedService: SharedService, public userService: UserService, private route: ActivatedRoute) {
    this.subscribeToSearch();
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      console.log('Aktuelle userId:', this.userId); // Füge diese Zeile hinzu
    });
  
    this.getAllUsers().then(() => {
      const userName = this.findUserNameById(this.userId);
      if (userName) {
        console.log('Benutzername:', userName);
      } else {
        console.log('Benutzer nicht gefunden');
      }
    });
    
  }

  findUserNameById(userId: string) {
    const user = this.userData.find((user: User) => user.userId === userId);
    return user ? user.name : undefined;
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

  getAllUsers(): Promise<void> {
    return new Promise((resolve) => {
      const userCollection = collection(this.firestore, 'users');
      onSnapshot(userCollection, (snapshot) => {
        this.userData = [];
        snapshot.forEach((doc) => {
          let user = new User({ ...doc.data(), id: doc.id });
          this.userData.push(user);
        });
        console.log('Geladene Benutzerdaten:', this.userData); // Ausgabe zur Überprüfung
        resolve(); // Löse das Promise, wenn die Daten geladen sind
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
    onSnapshot(messagesCollection, (snapshot) => {
      let messages: Message[] = [];
      snapshot.forEach((doc) => {
        let messageData = doc.data(); // Get the message data
        let messageId = doc.id;       // Get the message document ID from Firestore
  
        // Create a new Message object, including the Firestore document ID
        let message = new Message({ ...messageData, id: messageId });
     
        messages.push(message);
        console.log('message id' , messageId)
      });

      // Sort messages by timestamp
      this.allMessages = messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Group messages by fullDate
      this.groupedMessages = this.groupMessagesByDate(this.allMessages);
      console.log('this messgaes', this.allMessages)
    });
  }

  // Group messages by fullDate
 
  groupMessagesByDate(messages: Message[]): { [key: string]: Message[] } {
    const groupedMessages: { [key: string]: Message[] } = {};
  
    // Group messages by fullDate
    messages.forEach(message => {
      if (!groupedMessages[message.fullDate]) {
        groupedMessages[message.fullDate] = [];
      }
      groupedMessages[message.fullDate].push(message);
    });
  
    // Get today's date string for comparison
    const today = new Date().toDateString();
  
    // Sort the groups by date, making sure today's messages come last
    const sortedGroupKeys = Object.keys(groupedMessages).sort((a, b) => {
      if (a === 'Heute') return 1;  // "Heute" should come last
      if (b === 'Heute') return -1; // "Heute" should come last
  
      // Compare fullDate strings
      const parsedDateA = new Date(a);
      const parsedDateB = new Date(b);
  
      return parsedDateA.getTime() - parsedDateB.getTime();
    });
  
    // Sort the messages within each group by timestamp
    sortedGroupKeys.forEach(key => {
      groupedMessages[key].sort((messageA, messageB) => {
        // Compare timestamps as Date objects
        const timeA = new Date(messageA.timestamp).getTime();
        const timeB = new Date(messageB.timestamp).getTime();
        return timeA - timeB;
      });
    });
  
    // Create a new object with sorted groups
    const sortedGroupedMessages: { [key: string]: Message[] } = {};
    sortedGroupKeys.forEach(key => {
      sortedGroupedMessages[key] = groupedMessages[key];
    });
  
    return sortedGroupedMessages;
  }
  

  // getAllAnswersForMessage(messageId: string) {
  //   const answersCollection = collection(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}/answers`);
  //   const readAnswers = onSnapshot(answersCollection, (snapshot) => {
  //     this.allAnswers = []
  //     snapshot.forEach((doc) => {
  //       let answer = new Answer({ ...doc.data() });
  //       this.allAnswers.push(answer);
  //     });
  //   });
  // }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    return user ? user.avatar : 'default';
  }

  isCurrentUser(currentUser: string): boolean {
    const user = this.userData.find((u: any) => u.userId === this.userId);
    return user ? user.name === currentUser : false;
  }

  sendMessage() {
    if (this.newMessageText.trim() === '') {
      return; // Don't send empty messages
    }
    const userName = this.findUserNameById(this.userId);
    if (!userName || 'Gast') {
      console.log('Benutzer nicht gefunden');
      this.newMessageText = ''
      return; 
    }
    const currentDate = new Date();
    const messageData = {
      text: this.newMessageText,
      user: userName, // Verwende den gefundenen Benutzernamen
      timestamp: Timestamp.now(),
      fullDate: currentDate.toDateString()
  };

    const messagesCollection = collection(this.firestore, `channels/${this.selectedChannelId}/messages`);
    addDoc(messagesCollection, messageData)
      .then((docRef) => {
        console.log('Nachricht erfolgreich gesendet:', docRef.id);
        this.newMessageText = ''; // Leere das Eingabefeld nach dem Senden
      })
      .catch((error) => {
        console.error('Fehler beim Senden der Nachricht:', error);
      });
    
  }

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


  showEmojiPicker = false;

  openEmojiPicker() {
    this.showEmojiPicker = true;
  }

  addEmoji(event: any) {
    console.log('emoji :',event.emoji.native); // Hier kannst du das ausgewählte Emoji verwenden
    this.showEmojiPicker = false;
  }
}
