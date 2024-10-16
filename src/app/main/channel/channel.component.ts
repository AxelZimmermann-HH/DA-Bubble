import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { SharedService } from '../../services/shared.service';
import { ThreadComponent } from "../thread/thread.component";
import { DialogEditChannelComponent } from './dialog-edit-channel/dialog-edit-channel.component';
import { AddChannelUserComponent } from './add-channel-user/add-channel-user.component';
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { addDoc, collection, doc, Firestore, getDoc, onSnapshot, orderBy, query, Timestamp, updateDoc } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatComponent } from "../chat/chat.component";
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { ThreadService } from '../../services/thread.service';

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule,
    FormsModule,
    MatDialogModule,
    ThreadComponent,
    AddChannelUserComponent, PickerComponent, ChatComponent],
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

  answer = new Answer();
  allAnswers: any = [];

  channelMembers: any = [];
  newMessageText: string = '';

  showChannel: boolean = true;
  showChat: boolean = false;


  isLoading = false;
  inputText!: string;


  showEmojiPicker: boolean = false;

  @Input() selectedChannelId: string | null = null;
  @Output() chatSelected = new EventEmitter<void>();

  selectedChannel: Channel | any;
  isThreadOpen: boolean = false;
  selectedMessage = new Message();// Selected message for the thread
  selectedAnswers: Answer[] = [];

  constructor(public dialog: MatDialog,
    public firestore: Firestore,
    public sharedService: SharedService,
    public userService: UserService,
    private route: ActivatedRoute,
    public chatService: ChatService,
    private threadService: ThreadService) {
    this.subscribeToSearch();
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });
    this.getAllUsers().then(() => {
      this.findUserNameById(this.userId);
    });
    this.getAllChannels();
 

  }

  findUserNameById(userId: string) {
    const user = this.userData.find((user: User) => user.userId === userId);
    return user ? user.name : undefined;
  }

  ngOnChanges(): void {
    this.isLoading = true;
    if (this.selectedChannelId) {
      this.loadChannel(this.selectedChannelId).then(() => {
        this.getAllMessages();
        this.isLoading = false;
        this.threadService.threadClosed$.subscribe(isClosed => {
          this.isThreadOpen = !isClosed;
        });
      }).catch(error => {
        console.error('Fehler beim Laden des Channels:', error);
        this.isLoading = false;
        
      });
    }
    else {
      this.resetChannelState();
    }
  }

  resetChannelState() {
    this.selectedChannel = null;
    this.allMessages = [];
    this.channelMembers = [];
    this.isLoading = false;
  }

  async loadChannel(id: string) {
    const channelDocRef = doc(this.firestore, `channels/${id}`);
    onSnapshot(channelDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        this.selectedChannel = new Channel({ ...data, id });
        console.log('Channel-Daten aktualisiert:', this.selectedChannel);
        this.updateChannelMembers();
      } else {
        console.error('Channel not found');
        this.selectedChannel = null;
      }
    });
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
        resolve();
      });
    });
  }

  getAllChannels() {
    const channelCollection = collection(this.firestore, 'channels');
    onSnapshot(channelCollection, (snapshot) => {
      this.channelData = [];
      snapshot.forEach((doc) => {
        let channel = new Channel({ ...doc.data(), id: doc.id });
        this.channelData.push(channel);
      });
    });
  }

  updateChannelMembers() {
    if (this.selectedChannel) {
      const currentMemberIds = this.selectedChannel.members.map((member: any) => member.userId);
      const updatedMembers = this.selectedChannel.members.filter((member: any) =>
        this.userData.some((user: User) => user.userId === member.userId)
      );

      if (updatedMembers.length !== currentMemberIds.length) {
        const channelRef = doc(this.firestore, 'channels', this.selectedChannelId!);
        updateDoc(channelRef, { members: updatedMembers })
          .then(() => {
            this.selectedChannel.members = updatedMembers;
            console.log('Channel members updated:', this.selectedChannel.members);
          })
          .catch((error) => {
            console.error('Error updating channel members:', error);
          });
      }
    }
  }
  getAllMessages() {
    const messagesQuery = query(
      collection(this.firestore, `channels/${this.selectedChannelId}/messages`),
      orderBy('timestamp', 'asc')
    );

    this.allMessages = [];
    onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return new Message({
          text: data['text'],
          user: data['user'],
          timestamp: data['timestamp'],
          answers: data['answers'] || [],
          emojis: data['emojis'] || []
        }, doc.id);
      });
      const groupedMessages: { [date: string]: Message[] } = {};

      messagesData.forEach(message => {
        const messageDate = message.fullDate; // Verwende hier dein formatFullDate
        if (!groupedMessages[messageDate]) {
          groupedMessages[messageDate] = [];
        }
        groupedMessages[messageDate].push(message);
      });
      // Umwandeln des gruppierten Objekts in ein Array
      this.allMessages = Object.keys(groupedMessages).map(date => ({
        date,
        messages: groupedMessages[date]
      }));
    });
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png';  // Local asset avatar
      } else {
        return user.avatar;  // External URL avatar
      }
    }
    return './assets/avatars/avatar_0.png';  // Default avatar when user not found
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
    if (!userName) {
      this.newMessageText = '';
      return;
    }

    const currentDate = new Date();
    const messageData = {
      text: this.newMessageText,
      user: userName, // Use the found username
      timestamp: Timestamp.now(),
      fullDate: currentDate.toDateString(),
      answers: []
    };

    const messagesCollection = collection(this.firestore, `channels/${this.selectedChannelId}/messages`);
    addDoc(messagesCollection, messageData)
      .then((docRef) => {
        this.newMessageText = '';
      })
      .catch((error) => {
        console.error('Fehler beim Senden der Nachricht:', error);
      });
  }

  openUsersList(channelId: string) {
    this.dialog.open(AddChannelUserComponent, {
      data: {
        channelId: channelId,
        channel: this.selectedChannel
      }
    });
  }

  openDialogAddUser() {
    this.dialog.open(DialogAddUserComponent, {
      data: { channel: this.selectedChannel, source: 'channelComponent' }
    });
  }


  openDialogEditChannel(channel: any) {
    this.dialog.open(DialogEditChannelComponent, { data: channel });
  }

  onThreadClosed() {
    this.isThreadOpen = false;
    this.threadService.closeThread();
  }

  openThread(message: Message) {
    this.isThreadOpen = true;
    this.selectedMessage = message;
    this.threadService.openThread();
  }

  getAnswers(messageId: string) {
    const messageDocRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}`);

    onSnapshot(messageDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        this.selectedAnswers = data['answers']
          ? data['answers'].map((a: any) => new Answer(a))
          : [];
      } else {
        this.selectedAnswers = []; // Setze auf leer, wenn keine Antworten vorhanden

      }
    }, (error) => {
      console.error('Fehler beim Abrufen der Antworten: ', error);
    });
  }

  editDirectMessage(message: Message) {
    message.isEditing = true;
    message.editedText = message.text;
  }

  saveMessageEdit(message: Message) {
    const messageRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${message.messageId}`);
    updateDoc(messageRef, { text: message.editedText })
      .then(() => {
        message.text = message.editedText;  // Lokale Aktualisierung
        message.isEditing = false;
      })
      .catch((error) => {
        console.error("Fehler beim Speichern der Nachricht: ", error);
      });
  }

  cancelMessageEdit(message: Message) {
    message.isEditing = false;
    message.editedText = message.text;
  }



  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker
  }

  addEmojiToNewMessage(event: any) {
  }

  addEmojiToEditMessage(event: any) {
  }

  addEmojiToMessageReaction(event: any) {
  }

}
