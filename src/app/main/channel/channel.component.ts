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
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';


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
  fileDownloadUrl!: string;

  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  showEmojiPicker: boolean = false;
  showEditEmojiPicker: boolean = false;

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
          fileUrl: data['fileUrl'] || null,
          fileType: data['fileType'] || null,
          fileName: data['fileName'] || null
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



  selectUser(user: User) {
    this.newMessageText += `@${user.name}`;
    this.tagUser = false;
  }

  async sendEmail(email: string, message: string, fileUrl: string | null) {
   
    console.log(`E-Mail an ${email} gesendet mit Nachricht: ${message}`);
  
  }

  getChannelIdByName(channelName: string): string | null {
    const channel = this.filteredChannels.find(channel => channel.channelName === channelName);
    return channel ? channel.id : null;
  }

  async sendMessage() {
    if (this.newMessageText.trim() === '' && !this.selectedFile) return;

    const userName = this.findUserNameById(this.userId);
    if (!userName) return;

    let fileUrl = null;

    if (this.selectedFile) {
    
      const filePath =  `files/${this.selectedFile.name}`;

      if (filePath) {
        const storageRef = ref(getStorage(), filePath);
        try {
          const snapshot = await uploadBytes(storageRef, this.selectedFile);
          fileUrl = await getDownloadURL(storageRef);
          const url = await getDownloadURL(snapshot.ref);
          this.fileDownloadUrl = url;
        } catch (error) {
          console.error('Fehler beim Hochladen der Datei:', error);
          return;
        }
      } 
    }

    if (this.selectedChannel) {
      await this.sendChannelMessage(this.selectedChannelId, this.newMessageText, fileUrl);
    } else {
      // Hier für den Fall, dass kein Channel ausgewählt ist
      const inputValue = this.inputValue.trim();

      if (this.emailPattern.test(inputValue)) {
        await this.sendEmail(inputValue, this.newMessageText, fileUrl);
      }

      else if (inputValue.startsWith('@')) {
        const userName = inputValue.slice(1).trim();
        console.log('Gesendet an Benutzer:', userName);
        await this.sendDirectMessage(userName);
      }

      else if (inputValue.startsWith('#')) {
        const channelName = inputValue.slice(1).trim(); // Kanalname ohne '#'
        const channelId = this.getChannelIdByName(channelName);
        if (channelId) {
          await this.sendChannelMessage(channelId, this.newMessageText, fileUrl);
        }
      }

      else {
        console.log('Ungültiger Empfänger:', inputValue);
      }

      this.inputValue = '';
      this.newMessageText = '';
      this.selectedFile = null;
    }
  }

  async sendChannelMessage(channelId: string | null, message: string, fileUrl: string | null) {
    // Überprüfen, ob die Nachricht oder die Datei leer ist
    if (message.trim() === '' && !fileUrl) return;

    const messageData = {
      text: message,
      user: this.findUserNameById(this.userId), // Benutzernamen finden
      timestamp: Timestamp.now(),
      fullDate: new Date().toDateString(),
      answers: [],
      ...(fileUrl && { fileUrl, fileType: this.selectedFile?.type, fileName: this.selectedFile?.name })
    };

    try {
      await addDoc(collection(this.firestore, `channels/${channelId}/messages`), messageData);
      this.newMessageText = '';
      this.selectedFile = null;
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht an den Channel:', error);
    }
  }

  async sendDirectMessage(recipientName: string) {
    const fileName = this.selectedFile ? this.selectedFile.name : ''; 
    const fileType = this.selectedFile ? this.selectedFile.type : ''; 
  
    if (this.selectedFile) {
      const filePath = `files/${this.selectedFile.name}`;
      const storageRef = ref(getStorage(), filePath);
      
      try {
        const snapshot = await uploadBytes(storageRef, this.selectedFile);
        this.fileDownloadUrl = await getDownloadURL(snapshot.ref);  // Datei-URL speichern
        console.log('Datei erfolgreich hochgeladen, URL:', this.fileDownloadUrl);  // Debugging-Log
      } catch (error) {
        console.error('Fehler beim Hochladen der Datei:', error);
        return; // Wenn der Upload fehlschlägt, abbrechen
      }
    } else {
      // Wenn keine Datei hochgeladen wurde, setze fileDownloadUrl auf einen leeren String
      this.fileDownloadUrl = '';
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
        this.fileDownloadUrl, 
        fileName, 
        fileType, 
        this.userId
      );
      console.log('Nachricht erfolgreich gesendet an:', receiverID);
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  
    // Eingabefelder zurücksetzen
    this.newMessageText = '';
    this.selectedFile = null;
    this.fileDownloadUrl = ''; 
  }
  
  

  getUserIdByname(userName: string) {
    const user = this.userData.find((user: User) => user.name === userName);
    return user ? user.userId : undefined;
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
  toggleEditEmojiPicker() { this.showEditEmojiPicker = !this.showEditEmojiPicker }
  addEmojiToNewMessage(event: any) {
    console.log('gewähltes emojii:', event)
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

  editDirectMessage(message: Message) {
    message.isEditing = true;
    message.editedText = message.text;

    if (message.fileUrl) {
      const filename = message.fileName || this.extractFileName(message.fileUrl);
      // Füge den Dateinamen unter dem Text hinzu
      message.editedText += `\nDatei: ${filename}`;
    }
  }
  removeFile(message: Message) {
    if (message.fileUrl) {
      const storage = getStorage();
      const fileRef = ref(storage, message.fileUrl);  // Referenz zur Datei

      deleteObject(fileRef)
        .then(() => {
          console.log('Datei erfolgreich gelöscht');
          // Entferne auch den Dateinamen aus der Nachricht
          message.fileUrl = '';
          message.fileName = '';
          message.fileType = '';
        })
        .catch((error) => {
          console.error('Fehler beim Löschen der Datei:', error);
        });
    }
  }

  extractFileName(fileUrl: string): string {
    if (!fileUrl) return '';
    const decodedUrl = decodeURIComponent(fileUrl);

    const parts = decodedUrl.split('/');
    const lastPart = parts[parts.length - 1];

    const fileName = lastPart.split('?')[0];
    return fileName;
  }
  tagUser: boolean = false;
  toggleAutoListe() {
    this.tagUser = !this.tagUser
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





