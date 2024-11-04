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
import { addDoc, collection, doc, Firestore, onSnapshot, Timestamp, updateDoc } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatComponent } from "../chat/chat.component";
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { EmojiData } from './../../models/emoji-data.models';
import { MessagesService } from '../../services/messages.service';
import { ChannelService } from '../../services/channel.service';
import { FileService } from '../../services/file.service';

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
  userData: User[] = [];
  user = new User();
  userId!: string;


  filteredMessages: Message[] = [];
  newMessageText: string = '';

  answer = new Answer();
  allAnswers: any = [];

  showChannel: boolean = true;
  showChat: boolean = false;

  isLoading = false;
  inputText!: string;
  inputValue: string = '';

  filteredUsers: User[] = [];
  showAutocomplete: boolean = false;
  filteredChannels: Channel[] = [];
  selectedUser: User | null = null;

  taggedUser: boolean = false;

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  showEmojiPicker: boolean = false;
  showEditEmojiPicker: boolean = false;

  @Input() selectedChannelId: string | null = null;
  @Output() chatSelected = new EventEmitter<void>();


  isThreadOpen: boolean = false;
  selectedMessage = new Message();
  selectedAnswers: Answer[] = [];

  constructor(public dialog: MatDialog,
    public firestore: Firestore,
    public sharedService: SharedService,
    public userService: UserService,
    public channelService: ChannelService,
    public messagesService: MessagesService,
    private route: ActivatedRoute,
    public chatService: ChatService,
    public searchService: SearchService,
    public fileService:FileService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });

    this.userService.getAllUsers().then(() => {
      this.userService.findUserNameById(this.userId);
    });

    this.subscribeToSearch();
    this.subscribeToFilteredData();
    this.subscribeToSearchTerm();
    this.channelService.getAllChannels();

  }

  ngOnChanges(): void {
    this.isLoading = true;
    if (this.selectedChannelId) {
      this.channelService.loadChannel(this.selectedChannelId).then(() => {
        this.messagesService.getAllMessages(this.selectedChannelId);
        this.isLoading = false;
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
    this.channelService.selectedChannel = null;
    this.messagesService.allMessages = [];
    this.isLoading = false;
  }

  subscribeToFilteredData() {
    this.searchService.filteredUsers$.subscribe(users => {
      this.filteredUsers = users;
    });

    this.searchService.filteredChannels$.subscribe(channels => {
      this.filteredChannels = channels;
    });

    this.searchService.filteredMessages$.subscribe(messages => {
      this.filteredMessages = messages;
    });

    this.searchService.showAutocomplete$.subscribe(show => {
      this.showAutocomplete = show;
    });
  }

  subscribeToSearchTerm() {
    this.searchService.searchTerm$.subscribe(term => {
      if (term.length >= 3) {
        this.showAutocomplete = true;
      } else {
        this.showAutocomplete = false;
      }
    });
  }


  //search from header
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
    this.filteredMessages = this.messagesService.allMessages.filter((message: any) =>
      message.text.toLowerCase().includes(term.toLowerCase())
    );

  }
  resetFilteredData() {
    this.filteredMessages = this.messagesService.allMessages;
    this.filteredUsers = this.userData;
  }


  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target.value;
    this.inputValue = searchTerm;
    if (!searchTerm) {
      this.searchService.clearFilters();
      return;
    }
    this.searchService.filterByType(searchTerm, this.userData, this.channelService.channelData, this.messagesService.allMessages);
  }

  selectValue(value: any): void {
    if (this.inputValue.startsWith('@')) {
      this.inputValue = '@' + value;
    } else if (this.inputValue.startsWith('#')) {
      this.inputValue = '#' + value;
    } else {
      this.inputValue = value;
    }
    this.searchService.hideAutocompleteList();
  }

  selectUser(user: User) {
    this.newMessageText += `@${user.name}`;
    this.taggedUser = false;
  }

  async sendEmail(email: string, message: string, fileUrl: string | null) {
    console.log(`E-Mail an ${email} gesendet mit Nachricht: ${message}`);
  }



  async sendMessage() {
    if (this.newMessageText.trim() === '' && !this.fileService.selectedFile) return;

    const userName = this.userService.findUserNameById(this.userId);
    if (!userName) return;

    let fileUrl = null;

    if (this.fileService.selectedFile) {

      const filePath = `files/${this.fileService.selectedFile.name}`;

      if (filePath) {
        const storageRef = ref(getStorage(), filePath);
        try {
          const snapshot = await uploadBytes(storageRef, this.fileService.selectedFile);
          fileUrl = await getDownloadURL(storageRef);
          const url = await getDownloadURL(snapshot.ref);
          this.fileService.fileDownloadUrl = url;
        } catch (error) {
          console.error('Fehler beim Hochladen der Datei:', error);
          return;
        }
      }
    }

    if (this.channelService.selectedChannel) {
      await this.sendChannelMessage(this.selectedChannelId, this.newMessageText, fileUrl);
    } else {
      // Hier für den Fall, dass kein Channel ausgewählt ist
      const inputValue = this.inputValue.trim();

      if (this.emailPattern.test(inputValue)) {
        await this.sendEmail(inputValue, this.newMessageText, fileUrl);
      }

      else if (inputValue.startsWith('@')) {
        const userName = inputValue.slice(1).trim();
        await this.sendDirectMessage(userName);
      }

      else if (inputValue.startsWith('#')) {
        const channelName = inputValue.slice(1).trim();
        const channelId = this.channelService.getChannelIdByName(channelName);
        if (channelId) {
          await this.sendChannelMessage(channelId, this.newMessageText, fileUrl);
        }
      }
      this.inputValue = '';
      this.newMessageText = '';
      this.fileService.selectedFile = null;
    }
  }

  async sendChannelMessage(channelId: string | null, message: string, fileUrl: string | null) {

    if (message.trim() === '' && !fileUrl) return;

    const messageData = {
      text: message,
      user: this.userService.findUserNameById(this.userId),
      timestamp: Timestamp.now(),
      fullDate: new Date().toDateString(),
      answers: [],
      ...(fileUrl && { fileUrl, fileType: this.fileService.selectedFile?.type, fileName: this.fileService.selectedFile?.name })
    };

    try {
      await addDoc(collection(this.firestore, `channels/${channelId}/messages`), messageData);
      this.newMessageText = '';
      this.fileService.selectedFile = null;
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht an den Channel:', error);
    }
  }

  async sendDirectMessage(recipientName: string) {
    const fileName = this.fileService.selectedFile ? this.fileService.selectedFile.name : '';
    const fileType = this.fileService.selectedFile ? this.fileService.selectedFile.type : '';

    if (this.fileService.selectedFile) {
      const filePath = `files/${this.fileService.selectedFile.name}`;
      const storageRef = ref(getStorage(), filePath);

      try {
        const snapshot = await uploadBytes(storageRef, this.fileService.selectedFile);
        this.fileService.fileDownloadUrl = await getDownloadURL(snapshot.ref);  // Datei-URL speichern
      } catch (error) {
        console.error('Fehler beim Hochladen der Datei:', error);
        return;
      }
    } else {
      this.fileService.fileDownloadUrl = '';
    }

    // Fortfahren mit dem Senden der Nachricht
    const receiverID = this.getUserIdByname(recipientName);
    if (!receiverID) {
      console.error('Empfänger-ID konnte nicht gefunden werden.');
      return;
    }

    const chatId = await this.chatService.createChatID(this.userId, receiverID);
    const chatExists = await this.chatService.doesChatExist(chatId);

    if (!chatExists) {
      await this.chatService.createNewChat(chatId, this.userId, receiverID);
    }

    try {
      await this.chatService.sendMessageToChat(
        chatId,
        this.newMessageText,
        this.fileService.fileDownloadUrl,
        fileName,
        fileType,
        this.userId
      );
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }

    // Eingabefelder zurücksetzen
    this.newMessageText = '';
    this.fileService.selectedFile = null;
    this.fileService.fileDownloadUrl = '';
  }

  getUserIdByname(userName: string) {
    const user = this.userData.find((user: User) => user.name === userName);
    return user ? user.userId : undefined;
  }

  openUsersList(channelId: string) {
    this.dialog.open(AddChannelUserComponent, {
      data: {
        channelId: channelId,
        channel: this.channelService.selectedChannel
      }
    });
  }

  openDialogAddUser() {
    this.dialog.open(DialogAddUserComponent, {
      data: { channel: this.channelService.selectedChannel, source: 'channelComponent' }
    });

  }

  onThreadClosed() {
    this.isThreadOpen = false;
  }

  openThread(message: Message) {
    this.isThreadOpen = true;
    this.selectedMessage = message;
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

  isCurrentUser(currentUser: string): boolean {
    const user = this.userService.userData.find((u: any) => u.userId === this.userId);
    return user ? user.name === currentUser : false;
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

  toggleEditEmojiPicker() {
    this.showEditEmojiPicker = !this.showEditEmojiPicker
  }

  addEmojiToNewMessage(event: any) {
    const emoji = event.emoji.native; // Das ausgewählte Emoji
    this.newMessageText += emoji
    this.showEmojiPicker = false;
  }

  addEmojiToEditMessage(event: any, message: Message) {
    const emoji = event.emoji.native;
    if (message.isEditing) {
      message.editedText = `${message.editedText} ${emoji}`;
      this.showEditEmojiPicker = false;
    }
  }

  toggleUserEmoji(message: Message, emoji: string, userId: string) {
    const emojiData = message.emojis.find((e: EmojiData) => e.emoji === emoji);

    if (!emojiData) {
      message.emojis.push({ emoji, userIds: [userId] });
    } else {
      const userIdIndex = emojiData.userIds.indexOf(userId);
      if (userIdIndex === -1) {
        emojiData.userIds.push(userId); // Benutzer fügt Emoji hinzu
      } else {
        emojiData.userIds.splice(userIdIndex, 1); // Benutzer entfernt Emoji
      }
    }
    this.updateEmojisInFirebase(message);
  }



  updateEmojisInFirebase(message: Message) {
    const messageRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${message.messageId}`);
    updateDoc(messageRef, {
      emojis: message.emojis  // Aktualisiert die Emoji-Daten in Firebase
    });
  }
  getEmojiSrc(emoji: string): string {
    const emojiMap: { [key: string]: string } = {
      'nerd face': './assets/icons/emoji _nerd face_.png',
      'raising both hands': './assets/icons/🦆 emoji _person raising both hands in celebration_.png',
      'heavy check mark': './assets/icons/emoji _white heavy check mark_.png',
      'rocket': './assets/icons/emoji _rocket_.png'
    };
    return emojiMap[emoji] || '';
  }

  getEmojiCount(message: Message, emoji: string): number {
    return message.emojis.filter(e => e.emoji === emoji).length;
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


  toggleEmojiReaction(message: Message, emojiData: EmojiData) {
    const currentUserId = this.userId; // Aktuelle Benutzer-ID
    const currentUserIndex = emojiData.userIds.indexOf(currentUserId);

    if (currentUserIndex > -1) {

      emojiData.userIds.splice(currentUserIndex, 1);
    } else {
      emojiData.userIds.push(currentUserId);
    }

    this.updateEmojisInFirebase(message);
  }

  editDirectMessage(message: Message) {
    message.isEditing = true;
    message.editedText = message.text;

    if (message.fileUrl) {
      const filename = message.fileName || this.fileService.extractFileName(message.fileUrl);
      message.editedText += `\nDatei: ${filename}`;
    }
  }

 
  toggleAutoListe() {
    this.taggedUser = !this.taggedUser
  }




  // extractFileName(fileUrl: string): string {
  //   if (!fileUrl) return '';
  //   const decodedUrl = decodeURIComponent(fileUrl);

  //   const parts = decodedUrl.split('/');
  //   const lastPart = parts[parts.length - 1];

  //   const fileName = lastPart.split('?')[0];
  //   return fileName;
  // }


  // removeFile(message: Message) {
  //   if (message.fileUrl) {
  //     const storage = getStorage();
  //     const fileRef = ref(storage, message.fileUrl);  // Referenz zur Datei

  //     deleteObject(fileRef)
  //       .then(() => {
  //         message.fileUrl = '';
  //         message.fileName = '';
  //         message.fileType = '';
  //       })
  //       .catch((error) => {
  //         console.error('Fehler beim Löschen der Datei:', error);
  //       });
  //   }
  // }

  // onFileSelected(event: any) {
  //   const file: File = event.target.files[0];
  //   if (file) {
  //     this.selectedFile = file;  // Speichere die Datei
  //     const objectUrl = URL.createObjectURL(file);  // Erstelle eine Objekt-URL
  //     if (file.type.startsWith('image/') || file.type === 'application/pdf') {
  //       this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
  //     } else {
  //       this.fileUrl = null;
  //     }
  //   }
  // }


  // setFileUrl(file: File) {
  //   this.selectedFile = file; // Setzt die ausgewählte Datei
  //   const objectUrl = URL.createObjectURL(file);
  //   this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
  // }

  // getSafeUrl(url: string) {
  //   return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  // }

  // getFileNameFromUrl(fileUrl: string): string {
  //   return fileUrl.split('/').pop() || 'Datei';
  // }

  // closePreview() {
  //   this.fileUrl = null;
  //   this.selectedFile = null;
  // }

}





