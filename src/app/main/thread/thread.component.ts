import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Answer } from '../../models/answer.class';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './thread.component.html',
  styleUrl: './thread.component.scss'
})
export class ThreadComponent {

  user = new User();
  channel = new Channel();
  userData: User[] = [];
  channelData: Channel[] = [];
  allMessages: Message[] = [];
  allAnswers: Answer[] = [];

  @Output() threadClosed = new EventEmitter<void>();
  @Input() message: Message | null = null;
  @Input() answer: Answer[] = [];
  @Input() selectedChannelId: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    // Check if the selectedChannelId changes to fetch messages for the new channel
    if (changes['selectedChannelId'] && this.selectedChannelId) {
      this.getMessagesForChannel(this.selectedChannelId);
    }
  }
  
  constructor(public firestore: Firestore, public dialog: MatDialog) {
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
  getMessagesForChannel(channelId: string){ const messageCollection = collection(this.firestore, `channels/${channelId}/messages`);
  const readMessages = onSnapshot(messageCollection, (snapshot) => {
    this.allMessages = [];
    snapshot.forEach((doc) => {
      let message = new Message({ ...doc.data(), id: doc.id });
      this.allMessages.push(message);
    });

    console.log('Messages in thread for channel', this.allMessages);
  });}
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
  sendMessage() { }

  closeThread() {
    this.threadClosed.emit();
  }
}
