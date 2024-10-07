import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { addDoc, collection, doc, Firestore, getDoc, onSnapshot, query, Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'] // Fixed `styleUrl` to `styleUrls`
})
export class ThreadComponent  {

  user = new User();
  userId!: string;
  userData: User[] = [];
  newAnswerText!: string;
  channel = new Channel();
  channelData: Channel[] = [];
  allMessages: Message[] = [];

  timestamp?: Timestamp;

  
  @Output() threadClosed = new EventEmitter<void>();
  @Input() answer: Answer[] = [];
  @Input() selectedChannelId: string | null = null;
  @Input() channelName: string | undefined; 
  @Input() message!: Message;

 
  constructor(
    public firestore: Firestore, 
    public dialog: MatDialog, 
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.getAllUsers();
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });
    console.log('message id', this.message.messageId);
    
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedChannelId'] && this.selectedChannelId) {
    this.getMessagesForChannel(this.selectedChannelId);
    }
  }


  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    onSnapshot(userCollection, (snapshot) => {
      this.userData = snapshot.docs.map(doc => new User({ ...doc.data(), id: doc.id }));
    });
  }

  getMessagesForChannel(channelId: string) { 
    const messageCollection = collection(this.firestore, `channels/${channelId}/messages`);
    onSnapshot(messageCollection, (snapshot) => {
        this.allMessages = snapshot.docs.map((doc) => {
            const data = doc.data();
            console.log('Message ID:', doc.id); // Log the document ID
            console.log('Message Data:', data); // Log the data
            return new Message({ 
                ...data, 
                timestamp: data['timestamp'] 
            }, doc.id); // Create a new Message instance with the data and message ID
        });
        console.log('All Messages:', this.allMessages); // Log all messages after mapping
    });
}

 

saveAnswer(messageId: string) {
  if (!this.selectedChannelId || !this.newAnswerText.trim()) {
      console.error('Invalid channel or empty answer text.');
      return;
  }

  if (!messageId) {
      console.error('Message ID is empty. Cannot save answer.');
      // You can either skip saving or handle it accordingly
      return;
  }

  const answersRef = collection(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}/answers`);
  const answerData = {
      text: this.newAnswerText,
      user: this.user.name,
      timestamp: Timestamp.now(),
  };

  addDoc(answersRef, answerData)
      .then(() => {
          console.log('Answer successfully saved');
          this.newAnswerText = '';
      })
      .catch(error => {
          console.error('Error saving answer: ', error);
      });
}



  getAnswersForMessage(messageId: string) {
    if (!this.selectedChannelId) return;

    const answersQuery = query(collection(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}/answers`));
    onSnapshot(answersQuery, (snapshot) => {
      const answers = snapshot.docs.map(doc => new Answer(doc.data()));
      const message = this.allMessages.find((msg: Message) => msg.messageId === messageId);
      if (message) {
        message.answers = answers; 
      }
    });
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    return user ? user.avatar : 'default';
  }

  isCurrentUser(currentUser: string): boolean {
    const currentUserObj = this.userData.find(u => u.userId === this.userId);
    return currentUserObj ? currentUserObj.name === currentUser : false;
  }

  closeThread() {
    this.threadClosed.emit();
  }
}
