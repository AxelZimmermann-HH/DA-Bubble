import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { arrayUnion, collection, doc, Firestore, getDoc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ThreadService } from '../../services/thread.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EmojiData } from './../../models/emoji-data.models';
import {  getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, PickerComponent],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})
export class ThreadComponent {

  user = new User();
  userId!: string;
  userData: User[] = [];

  newAnswerText: string = "";

  channel = new Channel();
  channelData: Channel[] = [];

  allMessages: Message[] = [];

  showEmoji: boolean = false;
  showAnswerEmoji: boolean = false;

  fileUrl: SafeResourceUrl | null = null;
  selectedFile: File | null = null;
  fileDownloadUrl!: string;
  showEmojiPicker: boolean = false;

  taggedUser: boolean = false;

  @Output() threadClosed = new EventEmitter<void>();

  @Input() selectedChannelId: string | null = null;
  @Input() channelName: string | undefined;
  @Input() message!: Message;
  @Input() selectedAnswers: Answer[] = []


  constructor(
    public firestore: Firestore,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    public userService: UserService,
    public threadService: ThreadService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.userService.getAllUsers()
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });
    this.getAnswers(this.message.messageId);
   
   
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message && this.message.messageId) {
      this.getAnswers(this.message.messageId);
    }

    if (changes['selectedChannelId'] && !changes['selectedChannelId'].isFirstChange()) {
      this.selectedAnswers = []
    }
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
        this.selectedAnswers = [];
      }
    }, (error) => {
      console.error('Fehler beim Abrufen der Antworten: ', error);
    });
  }

  async addAnswer(messageId: string) {

    if (this.newAnswerText.trim() === '' && !this.selectedFile)return;

    const username = this.userService.findUserNameById(this.userId);
    if (!username) {
        this.newAnswerText = '';
        return;
    }

    let fileUrl = null;

    if (this.selectedFile) {
        const filePath = `files/${this.selectedFile.name}`;

        if (filePath) {
            const storageRef = ref(getStorage(), filePath);
            try {
                const snapshot = await uploadBytes(storageRef, this.selectedFile);
                fileUrl = await getDownloadURL(snapshot.ref); 
            } catch (error) {
                console.error('Fehler beim Hochladen der Datei:', error);
                return;
            }
        }
    }

    const answer = new Answer({
        text: this.newAnswerText,
        user: username,
        timestamp: new Date(),
        ...(fileUrl && { fileUrl, fileType: this.selectedFile?.type, fileName: this.selectedFile?.name }),
    });

    this.selectedAnswers.push(answer);
    this.saveAnswerToFirestore(messageId, answer); 
    this.getAnswers(messageId);
    this.newAnswerText = '';
    this.selectedFile = null;
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


  editDirectMessage(answer: any) {
    answer.isEditing = true;
    answer.editedText = answer.text;
  }

  saveEditAnswer(answer: Answer) {
    const messageRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${this.message.messageId}`);
    getDoc(messageRef).then((docSnap) => {
      if (docSnap.exists()) {
        const messageData = docSnap.data();
        if (Array.isArray(messageData['answers'])) {
          const updatedAnswers = messageData['answers'].map((a: any) => {
            if (a.text === answer.text && a.user === answer.user) {
              a.text = answer.editedText;
            }
            return a;
          });
          updateDoc(messageRef, { answers: updatedAnswers })
            .then(() => {
              answer.text = answer.editedText;
              answer.isEditing = false;
            })
            .catch((error) => {
              console.error("Fehler beim Speichern der Antwort: ", error);
            });
        }
      }
    }).catch((error) => {
      console.error('Fehler beim Abrufen der Nachricht: ', error);
    });
  }

  cancelEditAnswer(answer: Answer) {
    answer.isEditing = false;
    answer.editedText = answer.text;
  }

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  //messages
  toggleEmojiReaction(message: Message, emojiData: EmojiData) {
    const currentUserId = this.userId; // Aktuelle Benutzer-ID
    const currentUserIndex = emojiData.userIds.indexOf(currentUserId);

    if (currentUserIndex > -1) {

      emojiData.userIds.splice(currentUserIndex, 1);
    } else {
      emojiData.userIds.push(currentUserId);
    }
    this.updateEmojisInMessage(message);
  }

  updateEmojisInMessage(message: Message) {
    const messageRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${message.messageId}`);
    updateDoc(messageRef, {
      emojis: message.emojis
    });
  }
  toggleUserEmoji(message: Message, emoji: string, userId: string) {
    const emojiData = message.emojis.find((e: EmojiData) => e.emoji === emoji);

    if (!emojiData) {
      message.emojis.push({ emoji, userIds: [userId] });
    } else {
      const userIdIndex = emojiData.userIds.indexOf(userId);
      if (userIdIndex === -1) {
        emojiData.userIds.push(userId);
      } else {
        emojiData.userIds.splice(userIdIndex, 1);
      }
    }
    this.updateEmojisInMessage(message);
  }

  //answers
  toggleEmojiReactionForAnswer(answer: Answer, emojiData: EmojiData) {
    const currentUserId = this.userId;

    const currentUserIndex = emojiData.userIds.indexOf(currentUserId);
    if (currentUserIndex > -1) {

      emojiData.userIds.splice(currentUserIndex, 1);
    } else {
      emojiData.userIds.push(currentUserId);
    }
  
    this.updateEmojisInAnswer(answer);
  }

  updateEmojisInAnswer(answer: Answer) {
    const messageRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${this.message.messageId}`);

    getDoc(messageRef).then((docSnap) => {
        if (docSnap.exists()) {
            const messageData = docSnap.data();
            const updatedAnswers = messageData['answers'].map((a: any) => {
                if (a.text === answer.text && a.user === answer.user ) {
                    a.emojis = answer.emojis;
                }
                return a;
            });
            updateDoc(messageRef, { answers: updatedAnswers })
                .then(() => {
                    console.log("Emoji-Reaktionen für die Antwort erfolgreich gespeichert");
                })
                .catch((error) => {
                    console.error("Fehler beim Speichern der Emoji-Reaktionen für die Antwort: ", error);
                });
        }
    }).catch((error) => {
        console.error('Fehler beim Abrufen der Nachricht: ', error);
    });
}

  toggleUserEmojiAnswer(answer: Answer, emoji: string, userId: string) {
    const emojiData = answer.emojis.find((e: EmojiData) => e.emoji === emoji);
    if (!emojiData) {
      answer.emojis.push({ emoji, userIds: [userId] });
    } else {
      const userIdIndex = emojiData.userIds.indexOf(userId);
      if (userIdIndex === -1) {
        emojiData.userIds.push(userId);
      } else {
        emojiData.userIds.splice(userIdIndex, 1);
      }
    }
    this.updateEmojisInAnswer(answer)
  }

  getEmojiSrc(emoji: string): string {
    const emojiMap: { [key: string]: string } = {
      'nerd face': './assets/icons/emoji _nerd face_.png',
      'raising both hands': './assets/icons/emoji _person raising both hands in celebration_.png',
      'heavy check mark': './assets/icons/emoji _white heavy check mark_.png',
      'rocket': './assets/icons/emoji _rocket_.png'
    };
    return emojiMap[emoji] || '';
  }

  getEmojiReactionText(emojiData: EmojiData): string {
    const currentUserId = this.userId;
    const userNames = emojiData.userIds.map(userId => this.userService.findUserNameById(userId));

    const currentUserIndex = emojiData.userIds.indexOf(currentUserId);
    if (currentUserIndex > -1) {
      const currentUserName = this.userService.findUserNameById(currentUserId);
      const filteredUserNames = userNames.filter(name => name !== currentUserName);

      let nameList = filteredUserNames.join(", ");
      if (nameList.length > 0) {
        return `Du und ${nameList}` + (filteredUserNames.length > 1 ? "..." : "");
      } else {
        return "Du";
      }
    }
    return userNames.length > 0 ? userNames.join(", ") : "Keine Reaktionen";
  }

  toggleShowEmoji() { this.showEmoji = !this.showEmoji }

  toggleEmojitoAnswer() {
    this.showAnswerEmoji = !this.showAnswerEmoji;
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker
  }

  toggleAutoListe() {
    this.taggedUser = !this.taggedUser
  }

  addEmoji(event: any) {
    const emoji = event.emoji.native; 
    this.newAnswerText += emoji
    this.showEmojiPicker = false;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const objectUrl = URL.createObjectURL(file);  
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
      } else {
        this.fileUrl = null; 
      }
    }
  }

  closePreview() {
    this.fileUrl = null;
    this.selectedFile = null;
  }

  selectUser(user: User) {
    this.newAnswerText += `@${user.name}`;
    this.taggedUser = false;
  }


  closeThread() {
    this.threadClosed.emit();
  }

}