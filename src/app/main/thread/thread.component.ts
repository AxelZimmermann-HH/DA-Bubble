import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { addDoc, arrayUnion, collection, doc, Firestore, getDoc, onSnapshot, query, Timestamp, updateDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss'] // Fixed `styleUrl` to `styleUrls`
})
export class ThreadComponent {

  user = new User();
  userId!: string;
  userData: User[] = [];
  newAnswerText!: string;
  channel = new Channel();
  channelData: Channel[] = [];
  allMessages: Message[] = [];



  @Output() threadClosed = new EventEmitter<void>();


  @Input() selectedChannelId: string | null = null;
  @Input() channelName: string | undefined;
  @Input() message!: Message;
  @Input() selectedAnswers: Answer[]=[]


  constructor(
    public firestore: Firestore,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    public userService: UserService
  ) { }

  ngOnInit(): void {
    this.getAllUsers();
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });
    console.log('message id', this.message.messageId);
    this.getAnswers(this.message.messageId);
  }


  findUserNameById(userId: string) {
    const user = this.userData.find((user: User) => user.userId === userId);
    return user ? user.name : undefined;
  }


  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message && this.message.messageId) {
      console.log('message id', this.message.messageId);
      this.getAnswers(this.message.messageId);
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
          timestamp: data['timestamp'],
          answers: data['answers'] ? data['answers'].map((a:any) => new Answer(a)) : []
        }, doc.id); // Create a new Message instance with the data and message ID
      });
      console.log('All Messages:', this.allMessages); // Log all messages after mapping
    });
  }

  getAnswers(messageId: string) {
    const messageDocRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}`);
    
    onSnapshot(messageDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            this.selectedAnswers = data['answers'] 
              ? data['answers'].map((a: any) => new Answer(a)) 
              : [];
            console.log('Aktualisierte Antworten: ', this.selectedAnswers);
        } else {
            this.selectedAnswers = []; // Setze auf leer, wenn keine Antworten vorhanden
            console.log('Keine Antworten gefunden');
        }
    }, (error) => {
        console.error('Fehler beim Abrufen der Antworten: ', error);
    });
}


  
  
  addAnswer(messageId: any) {
    if (this.newAnswerText.trim() !== '') {
      const username = this.findUserNameById(this.userId);
      if (!username) {
        this.newAnswerText = '';
        return;
      }
  
      const answer = new Answer({
        text: this.newAnswerText,
        user: username,
        timestamp: new Date()
      });
  
      // Antworten zuerst lokal hinzufügen
      this.selectedAnswers.push(answer);
      
      // Dann die Antwort in Firestore speichern
      this.saveAnswerToFirestore(messageId, answer);
      this.getAnswers(messageId)
      // Textfeld zurücksetzen
      this.newAnswerText = '';
    }
  }
  
  saveAnswerToFirestore(messageId: string, answer: Answer) {
    const messageDocRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}`);
    
    updateDoc(messageDocRef, {
      answers: arrayUnion(answer.toJson())
    })
    .then(() => {
      console.log("Antwort erfolgreich gespeichert");
      
    })
    .catch(error => {
      console.error("Fehler beim Speichern der Antwort: ", error);
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
    const currentUserObj = this.userData.find(u => u.userId === this.userId);
    return currentUserObj ? currentUserObj.name === currentUser : false;
  }

  closeThread() {
    this.threadClosed.emit();
  }
}
