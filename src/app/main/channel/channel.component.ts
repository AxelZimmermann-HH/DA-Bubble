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
import { addDoc, collection, doc, Firestore, getDocs, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatComponent } from "../chat/chat.component";
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';


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

  channel = new Channel();
  channelData: Channel[] = [];

  message = new Message();
  allMessages: any = [];
  filteredMessages: any = [];
  newMessageText: string = '';

  answer = new Answer();
  allAnswers: any = [];

  channelMembers: any = [];


  showChannel: boolean = true;
  showChat: boolean = false;


  isLoading = false;
  inputText!: string;
  inputValue: string = '';

  filteredUsers: User[] = [];
  showAutocomplete: boolean = false;
  filteredChannels: Channel[] = [];
  selectedUser: User | null = null;

  fileUrl: SafeResourceUrl | null = null;
  selectedFile: File | null = null;

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
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
    public searchService: SearchService,
    private sanitizer: DomSanitizer,
  ) {
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

  ngOnInit() {
    this.searchService.filteredUsers$.subscribe(users => {
      this.filteredUsers = users;
    });

    this.searchService.filteredChannels$.subscribe(channels => {
      this.filteredChannels = channels;
    });

    this.searchService.showAutocomplete$.subscribe(show => {
      this.showAutocomplete = show;
    });
  }

  ngOnChanges(): void {
    this.isLoading = true;
    if (this.selectedChannelId) {
      this.loadChannel(this.selectedChannelId).then(() => {
        this.getAllMessages();
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

onInput(event: any): void {
  const searchTerm = event.target.value;
  this.inputValue = searchTerm;

  if (searchTerm.startsWith('@')) {
      const query = searchTerm.slice(1).toLowerCase();
      this.searchService.filterUsers(this.userData, query);
  } else if (searchTerm.startsWith('#')) {
      const query = searchTerm.slice(1).toLowerCase();
      this.searchService.filterChannels(this.channelData, query);
  } else {
      const query = searchTerm.toLowerCase();
      this.searchService.filterEmails(this.userData, query);
  }

  this.searchService.showAutocompleteList();
}
  

  selectValue(value: any): void {
    if (this.inputValue.startsWith('@')) {
        console.log('Benutzername ausgewählt:', value);
        this.inputValue = '@' + value; 
    } else if (this.inputValue.startsWith('#')) {
        // Kanal ausgewählt
        console.log('Kanalname ausgewählt:', value);
        this.inputValue = '#' + value;
    } else {
        // E-Mail-Adresse ausgewählt
        console.log('E-Mail-Adresse ausgewählt:', value);
        this.inputValue = value; 
    }
    this.searchService.hideAutocompleteList();
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
          emojis: data['emojis'] || [],
          fileUrl: data['fileUrl'] || null // Hier wird fileUrl hinzugefügt
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

  async sendNewMessage() {
    if (this.newMessageText.trim() === '') {
      return; // Leere Nachrichten nicht senden
    }

    const inputValue = this.inputValue.trim(); // Eingabewert
    console.log('Neue Nachricht gesendet:', this.newMessageText);

    if (this.emailPattern.test(inputValue)) { // Hier verwenden wir das Muster für E-Mails
      console.log('Gesendet an Benutzer E-Mail:', inputValue);
    }
    else if (inputValue.startsWith('@')) {
      const userName = inputValue.slice(1).trim(); // Benutzername ohne '@'
      console.log('Gesendet an Benutzer:', userName);
    }
    else if (inputValue.startsWith('#')) {
      const channelName = inputValue.slice(1).trim(); // Kanalname ohne '#'
      console.log('Gesendet an Kanal:', channelName);

    }
    else {
      console.log('Ungültiger Empfänger:', inputValue);
    }
 
    this.inputValue = '';
    this.newMessageText = '';


    // let messageData: any;
    // const userName = this.findUserNameById(this.userId); // Benutzername ermitteln
    // if (!userName) {
    //   this.newMessageText = '';
    //   return;
    // }

    // const currentDate = new Date();
    // const timestamp = Timestamp.now();
    // if (inputValue.startsWith('#')) {

    //   const channelName = inputValue.slice(1); // Kanalnamen ohne #
    //   const channelRef = collection(this.firestore, 'channels');
    //   const q = query(channelRef, where('channelName', '==', channelName));

    //   getDocs(q).then(querySnapshot => {
    //     if (!querySnapshot.empty) {
    //       const channelDoc = querySnapshot.docs[0];
    //       const channelId = channelDoc.id;
    //       messageData = {
    //         text: this.newMessageText,
    //         user: userName,
    //         timestamp,
    //         fullDate: currentDate.toDateString(),
    //         answers: []
    //       };

    //       const messagesCollection = collection(this.firestore, `channels/${channelId}/messages`);
    //       addDoc(messagesCollection, messageData)
    //         .then(() => {
    //           this.newMessageText = '';
    //         })
    //         .catch((error) => {
    //           console.error('Fehler beim Senden der Nachricht:', error);
    //         });
    //     } else {
    //       console.error('Der angegebene Kanal existiert nicht:', channelName);
    //       this.newMessageText = '';
    //     }
    //   }).catch((error) => {
    //     console.error('Fehler beim Überprüfen des Kanals:', error);
    //   });
    // }
    // else if (inputValue.startsWith('@')) {
    //   const recipientUserName = inputValue.slice(1);
    //   console.log('recipient user', recipientUserName);
    //   const chatId = await this.chatService.createChatID(this.userId, recipientUserName);
    //   if (!chatId) {
    //     await this.chatService.createChatID(this.userId, recipientUserName);
    //   }

    //   const messageData = {
    //     text: this.newMessageText,
    //     user: userName,
    //     timestamp: Timestamp.now(),
    //     fullDate: new Date().toDateString(),
    //     answers: []
    //   };

    //   // Speichere die Nachricht in der Firestore-Collection
    //   addDoc(collection(this.firestore, 'chats', chatId, 'messages'), messageData)
    //     .then(() => {
    //       console.log('Nachricht erfolgreich gespeichert:', messageData);
    //     })
    //     .catch((error) => {
    //       console.error('Fehler beim Speichern der Nachricht:', error);
    //     });

    //   // Nachricht zurücksetzen
    //   this.newMessageText = '';
    // }
  }


  sendEmail(email: string, message: string) {
    // Implementiere hier deine Logik, um die E-Mail zu senden
    console.log(`E-Mail an ${email}: ${message}`);
  }

  // async sendMessage() {
  //   if (this.newMessageText.trim() === '' && !this.selectedFile) {
  //     return; // Don't send empty messages
  //   }
  //   const userName = this.findUserNameById(this.userId);
  //   if (!userName) {
  //     this.newMessageText = '';
  //     return;
  //   }

  //   let fileUrl = '';

  //   if (this.selectedFile) {
  //     try {
  //       // Datei hochladen
  //       const storage = getStorage();
  //       const storageRef = ref(storage, `files/${this.selectedFile.name}`);
  //       const snapshot = await uploadBytes(storageRef, this.selectedFile);

  //       // URL der hochgeladenen Datei abrufen
  //       fileUrl = await getDownloadURL(snapshot.ref);
  //       console.log('File URL:', fileUrl);
  //     } catch (error) {
  //       console.error('Fehler beim Hochladen der Datei:', error);
  //       return; // Datei konnte nicht hochgeladen werden, Nachricht nicht senden
  //     }
  //   }


  //   const currentDate = new Date();
  //   const messageData = {
  //     text: this.newMessageText,
  //     user: userName, // Use the found username
  //     timestamp: Timestamp.now(),
  //     fullDate: currentDate.toDateString(),
  //     answers: [],
  //     fileUrl: fileUrl
  //   };

  //   const messagesCollection = collection(this.firestore, `channels/${this.selectedChannelId}/messages`);
  //   addDoc(messagesCollection, messageData)
  //     .then(() => {
  //       this.newMessageText = '';
  //       this.selectedFile = null;
  //       this.fileUrl = null;
  //     })
  //     .catch((error) => {
  //       console.error('Fehler beim Senden der Nachricht:', error);
  //     });
  // }


  async sendMessage() {
    // Überprüfen, ob weder eine Nachricht noch eine Datei vorhanden ist
    if (this.newMessageText.trim() === '' && !this.selectedFile) {
      return; // Wenn keine Nachricht und keine Datei ausgewählt wurde, abbrechen
    }
  
    const userName = this.findUserNameById(this.userId);
    if (!userName) {
      this.newMessageText = '';
      return;
    }
  
    const currentDate = new Date();
    let fileUrl = null; // Variable für die Datei-URL
  
    if (this.selectedFile) {
      // Wenn eine Datei ausgewählt ist, lade sie zu Firebase Storage hoch
      const storage = getStorage(); // Initialisiere Firebase Storage
      const filePath = `channels/${this.selectedChannelId}/files/${this.selectedFile.name}`;
      const storageRef = ref(storage, filePath); // Erstelle eine Referenz zu dem Speicherort
  
      try {
        // Datei hochladen
        await uploadBytes(storageRef, this.selectedFile);
        // URL der hochgeladenen Datei abrufen
        fileUrl = await getDownloadURL(storageRef);
      } catch (error) {
        console.error('Fehler beim Hochladen der Datei:', error);
        return; // Wenn das Hochladen fehlschlägt, brich den Vorgang ab
      }
    }
  
    // Nachrichtendaten erstellen
    const messageData: any = {
      text: this.newMessageText,
      user: userName,
      timestamp: Timestamp.now(),
      fullDate: currentDate.toDateString(),
      answers: [],
      ...(fileUrl && { fileUrl, fileType: this.selectedFile?.type }) // Datei-URL und Dateityp speichern, wenn vorhanden
    };
  
    const messagesCollection = collection(this.firestore, `channels/${this.selectedChannelId}/messages`);
    addDoc(messagesCollection, messageData)
      .then(() => {
        this.newMessageText = '';
        this.fileUrl = null;
        this.selectedFile = null;
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
    console.log('gewähltes emojii:', event)
    const emoji = event.emoji.native; // Das ausgewählte Emoji
    this.newMessageText += emoji
    this.showEmojiPicker = false;
  }

  addEmojiToEditMessage(event: any, message: Message) {
    const emoji = event.emoji.native;
    if (message.isEditing) {
      message.editedText = `${message.editedText}${emoji}`;
      this.showEmojiPicker = false;
    }
  }

  // addEmojiToMessageReaction(event: any) {
  // }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file;  // Speichere die Datei
      const objectUrl = URL.createObjectURL(file);  // Erstelle eine Objekt-URL
      
      // Erstelle eine sichere URL für die Vorschau von Bildern und PDFs
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
      } else {
        // Für andere Dateitypen kann die Vorschau weggelassen werden
        this.fileUrl = null; // Keine Vorschau
      }
    }
  }
  

  setFileUrl(file: File) {
    this.selectedFile = file; // Setzt die ausgewählte Datei
    const objectUrl = URL.createObjectURL(file);
    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
    console.log('Selected file:', this.selectedFile); // Debugging: Protokolliere die ausgewählte Datei
  }
  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getFileNameFromUrl(fileUrl: string): string {
    return fileUrl.split('/').pop() || 'Datei';
  }

  closePreview() {
    this.fileUrl = null;
    this.selectedFile = null;
  }

}





