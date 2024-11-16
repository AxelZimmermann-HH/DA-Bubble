import { AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogUserProfilComponent } from '../dialog-user-profil/dialog-user-profil.component';
import { User } from '../../models/user.class';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ActivatedRoute, Route } from '@angular/router';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, StorageReference, getMetadata } from '@angular/fire/storage';  // Firebase Storage imports
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';

interface MessageGroup {
  date: string;
  messages: any[]; 
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule, PickerComponent],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewInit, AfterViewChecked {

  directMessage = new FormControl('', [Validators.required, Validators.minLength(2)]);
  editedMessage = new FormControl('', [Validators.required, Validators.minLength(2)]);
  file = new FormControl('', [Validators.required, Validators.minLength(2)]);

  editingMessageId: string | null = null;
  currentUser: any | string;
  currentUserId: string = '';
  user = new User();
  chat: any;
  userList: User[] = [];

  showUsers: boolean = false;
  hasNames: boolean = false;
  selectedNames: { name: string; userId: string }[] = [];

  filteredSearchMessages: MessageGroup[] = [];



  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('nameContainerRef', { static: false }) nameContainerRef!: ElementRef;


  constructor(
    public chatService: ChatService,
    public dialog: MatDialog,
    public userService: UserService,
    public sharedService: SharedService, 
    public route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    public firestore: Firestore,
    private cdr: ChangeDetectorRef
  ) { }


  getAvatarForUser(userName: string): any {
    if (!this.user || !this.user.name) {
      return './assets/avatars/avatar_0.png'; 
    }
  
    // Eigener User im Chat
    if (userName.trim().toLowerCase() === this.currentUser.name.trim().toLowerCase()) {
      return this.getCurrentUserAvatar();
    }
  
    // Anderer User
    if (userName.trim().toLowerCase() === this.user.name.trim().toLowerCase()) {
      return this.getChatPartnerAvatar();
    }

    return './assets/avatars/avatar_0.png'; 
  }

  private getCurrentUserAvatar(): string {
    if (this.userService.isNumber(this.currentUser.avatar)) {
      return './assets/avatars/avatar_' + String(this.currentUser.avatar) + '.png';  // Typkonvertierung zu string
    } else {
      return String(this.currentUser.avatar);  // Typkonvertierung zu string
    }
  }

  private getChatPartnerAvatar(): string {
    if (this.userService.isNumber(this.user.avatar)) {
      return './assets/avatars/avatar_' + String(this.user.avatar) + '.png';  // Typkonvertierung zu string
    } else {
      return String(this.user.avatar);  // Typkonvertierung zu string
    }
  }

  // Scrollen direkt nach dem Initialisieren der View
  ngAfterViewInit() {
    this.scrollToBottom();
  };


  // scrollen, wenn die View aktualisiert wird
  ngAfterViewChecked() {
    this.scrollToBottom();
  };


  async ngOnInit() {
    // Abonniere Benutzerdaten
    this.chatService.user$.subscribe((userData) => {
      if (userData) {
        this.user = userData;
      }
    });


    // Abonniere und lade den Chat
    this.chatService.chat$.subscribe((chatSubject) => {
      if (chatSubject && chatSubject.length > 0) {
        this.chatService.chatIsEmpty = false;
        this.chat = chatSubject;

        // Initialisiere filteredSearchMessages mit allen Nachrichten
        this.filteredSearchMessages = chatSubject;
      }
    });

  
    this.route.params.subscribe(params => {
      const userId = params['userId'];
      if (userId) {
        this.currentUserId = userId;
        // Lade den aktuellen Benutzer basierend auf der userId
        this.userService.loadCurrentUser(userId);   
        // Falls du weiterhin den Benutzer in einer Variable speichern willst
        this.userService.currentUser$.subscribe(user => {
          this.currentUser = user;
        });
      }
    });

    this.subscribeToSearch();
  }

  subscribeToSearch() {
    this.sharedService.searchTerm$.subscribe((term) => {
      if (term.length >= 3) {
        this.filterMessages(term);
      } else {
        this.resetFilteredMessages();
      }
    });
  }

  filterMessages(term: string) {
    const groupedMessagesArray = Object.keys(this.chatService.groupedMessages).map(date => ({
      date,
      messages: this.chatService.groupedMessages[date]
    }));
  
    this.filteredSearchMessages = groupedMessagesArray.map(group => ({
      ...group,
      messages: group.messages.filter((message: any) => {
        const senderName = this.userService.getUserNameById(message.senderId);
        return (
          (message.text && message.text.toLowerCase().includes(term.toLowerCase())) ||
          (senderName && senderName.toLowerCase().includes(term.toLowerCase()))
        );
      })
    })).filter(group => group.messages.length > 0);
  }

  resetFilteredMessages() {
    const groupedMessagesArray = Object.keys(this.chatService.groupedMessages).map(date => ({
      date,
      messages: this.chatService.groupedMessages[date]
    }));
    this.filteredSearchMessages = groupedMessagesArray;
  }


  async sendDirectMessage() {
    const newDm = this.directMessage.value!;
    const fileDownloadUrl = this.fileDownloadUrl;
    const fileName = this.selectedFileName;
    const fileType = this.selectedFileType;
    const audioDownloadUrl = this.audioDownloadUrl;
  
    // Nachricht an den aktuellen Chat-Partner senden
    await this.chatService.setChatData(newDm, fileDownloadUrl, fileName, fileType, this.currentUserId, audioDownloadUrl);
  
    this.directMessage.setValue('');
    this.selectedFile = null;
    this.selectedFileName = '';
    this.fileDownloadUrl = '';
    this.audioDownloadUrl = '';
  
    // Nachricht an mehrere Benutzer senden
    await this.sendMessagesToMultipleUsers(newDm, fileDownloadUrl, fileName, fileType);  
    
    this.selectedNames = [];
    this.hasNames = false;
  }
  

  async sendMessagesToMultipleUsers(newDm: string, fileDownloadUrl: string, fileName: string, fileType: string) {
    for (const user of this.selectedNames) {
      const chatId = await this.chatService.createChatID(this.currentUserId, user.userId);
      const chatExists = await this.chatService.doesChatExist(chatId);
  
      if (!chatExists) {
        await this.chatService.createNewChat(chatId, this.currentUserId, user.userId);
      }
  
      await this.chatService.sendMessageToChat(chatId, newDm, fileDownloadUrl, fileName, fileType, this.currentUserId);
      console.log('Nachricht gesendet an:', user.name);
    }
  }
  


  //scrollt das Chatfenster nach unten
  scrollToBottom(): void {
    if (!this.chatService.chatIsEmpty && this.chatContainer) {
      try {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scrollen fehlgeschlagen:', err);
      }
    }
  };


  //öffnet das User Profil im Chatfenster
  openUserProfil(user: any) {
    this.dialog.open(DialogUserProfilComponent, { data: {user: user} });
  };


  //checkt das Datum im Chatfenster, ob es mit dem heutigen übereinstimmt
  isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);

    return today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate();
  };


  // öffnet das Bearbeitungsfeld
  editDirectMessage(message: any) {
    this.editingMessageId = message.messageId;
    this.editedMessage.setValue(message.text)
  }


  // schlie0t das Bearbeitungsfeld, ohne Speichern
  cancelEditing() {
    this.editingMessageId = null;
  }


  // setzt die bearbeitete Nachricht 
  async setEditedDirectMessage(message: any) {
    const editedDM = this.editedMessage.value!;
    await this.chatService.setEditedChatData(editedDM, message);
    this.editedMessage.setValue('');
    this.editingMessageId = null;
  }


  //FILE-UPLOAD
  selectedFile: File | null = null;
  selectedFileName: string = '';  // Neuer Dateiname-String
  selectedFileType: string = '';
  fileDownloadUrl: string = '';

  //Datei hinzufügen
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;  // Dateiname speichern
      this.selectedFileType = input.files[0]['type'];
      this.uploadFile()
    }
  }


  //Datei ändern
  async onChangeFileSelected(event: Event, fileToDelete: string) {
    this.deleteFile(fileToDelete); //Alte Datei löschen
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;  // Dateiname speichern
      this.selectedFileType = input.files[0]['type'];
      await this.uploadFile()
    }
  }
  safeFileUrl: SafeResourceUrl | null = null;  // Sichere URL wird hier gespeichert
  safeAudioUrl: SafeResourceUrl | null = null;  // Sichere URL wird hier gespeichert

  //Holt sich eine sichere URL
  async loadSafeFile(fileUrl: string, fileType:string) {
    if (!fileUrl) {
      console.error('Die Datei-URL ist ungültig.');
      return;
    }
    if(fileType == 'image/png' || 'image/jpeg' || 'application/pdf'){
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    }
    if(fileType == 'audio/mpeg'){
      this.safeAudioUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    }
  }


  //File in den Storage hochladen
  async uploadFile() {
    if (!this.selectedFile) return;

    try {
      // Initialisiere Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `files/${this.selectedFileName}`);

      // Lade die Datei hoch
      const snapshot = await uploadBytes(storageRef, this.selectedFile);

      // Hol die URL der hochgeladenen Datei
      const url = await getDownloadURL(snapshot.ref);
      this.fileDownloadUrl = url;

      if (this.selectedFileType == 'application/pdf') {
        console.log('Lade die Datei von URL:', this.fileDownloadUrl);
        await this.loadSafeFile(this.fileDownloadUrl, this.selectedFileType)
      }
      if (this.selectedFileType == 'text/plain') {
        await this.chatService.fetchTextFile(this.fileDownloadUrl)
      }
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
    }
  }


  //File im Browser abrufen und laden
  downloadFile(fileDownloadUrl: string, fileName: string) {
    // Erstellen eines unsichtbaren Links
    const link = document.createElement('a');
    link.href = fileDownloadUrl;
    link.target = '_blank';
    link.download = fileName;
    // Anhängen des Links an das Dokument
    document.body.appendChild(link);

    // Automatisches Klicken des Links, um den Download zu starten
    link.click();

    // Entfernen des Links nach dem Download
    document.body.removeChild(link);
  }


  //Datei löschen
  deleteFile(fileName: string) {
    // Firebase Storage initialisieren
    const storage = getStorage();
    const fileRef = ref(storage, '/files/' + fileName);

    // Datei löschen
    deleteObject(fileRef).then(() => {
      console.log('Datei erfolgreich gelöscht');
    }).catch((error) => {
      console.error('Fehler beim Löschen der Datei:', error);
    });
  }

  //Audio Nachricht>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isTouchEvent = false; // Verhindert doppelte Ausführung bei Touch und Maus
  recordingAudio: boolean = false;

  async startRecording(event: MouseEvent | TouchEvent){
    // Prüfen, ob es sich um ein Touch-Event handelt
    if (event.type === 'touchstart') {
      this.isTouchEvent = true;
    }

    // Verhindert Doppelereignisse (z. B. auf Touch-Laptops)
    if (this.isTouchEvent && event.type === 'mousedown') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.safeAudioUrl = '';
    this.audioDownloadUrl = '';
    this.recordingAudio = true;
    this.startTimer();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
  }
  
  stopRecording(event: MouseEvent | TouchEvent){
    // Prüfen, ob es sich um ein Touch-Event handelt
    if (event.type === 'touchend') {
      this.isTouchEvent = true;
    }

    // Verhindert Doppelereignisse (z. B. auf Touch-Laptops)
    if (this.isTouchEvent && event.type === 'mouseup') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.mediaRecorder?.stop();
    this.recordingAudio = false;
    this.resetTimer();
    this.mediaRecorder?.addEventListener("stop", () => {
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/mpeg' });
      this.uploadAudio(audioBlob);
    });
      // Zurücksetzen für zukünftige Ereignisse
    if (event.type === 'touchend' || event.type === 'mouseup') {
      this.isTouchEvent = false;
    }
  }

  private seconds: number = 0;
  private timerInterval: any;

  displayTime: string = '00:00';

  startTimer(){

    this.timerInterval = setInterval(() => {
      this.seconds++;
      this.updateDisplay();
    }, 1000);
  }
  
  stopTimer(): void {
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  resetTimer(): void {
    this.stopTimer();
    this.seconds = 0;
    this.updateDisplay();
  }

  private updateDisplay(): void {
    const minutes = Math.floor(this.seconds / 60);
    const remainingSeconds = this.seconds % 60;
    this.displayTime = 
      `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  audioDownloadUrl: string = '';
  fileType: string = '';

  async uploadAudio(audioBlob: Blob) {
    const storage = getStorage();
    const audioRef = ref(storage, `audios/${Date.now()}.mp3`);

    // Datei zu Firebase Storage hochladen
    const snapshot = await uploadBytes(audioRef, audioBlob);
    const url = await getDownloadURL(snapshot.ref);
    this.audioDownloadUrl = url;
    this.fileType = audioBlob.type;
    await this.loadSafeFile(this.audioDownloadUrl, this.fileType)
  }

    //Audio löschen
    deleteAudio(audioName: string) {
      // Firebase Storage initialisieren
      const storage = getStorage();
      const fileRef = ref(storage, audioName);
  
      // Datei löschen
      deleteObject(fileRef).then(() => {
        console.log('Datei erfolgreich gelöscht');
      }).catch((error) => {
        console.error('Fehler beim Löschen der Datei:', error);
      });
    }

  //Emojis>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  showEmojis: boolean = false;

  toogleEmojis() {
    this.showEmojis = !this.showEmojis;
  }


  onEmojiSelect(event: any) {
    console.log('gewähltes emojii:', event)
    const emoji = event.emoji.native; // Das ausgewählte Emoji
    const currentMessageValue = this.directMessage.value || '';
    this.directMessage.setValue(currentMessageValue + emoji);
    this.showEmojis = false;
  }

  // @ Users 
  toggleUserList() {
    if (this.userList.length === 0) {
      this.userService.loadUsers().then(() => {
        this.userList = this.userService.userData;
        this.showUsers = !this.showUsers;
      }).catch(error => {
        console.error('Fehler beim Laden der Benutzer:', error);
      });
    } else {
      this.showUsers = !this.showUsers;
    }
  }

  // Klick-Event auf das gesamte Dokument
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const isInsideUsersDialog = target.closest('.users-dialog');
    const isToggleButton = target.classList.contains('add-mail');
    if (!isInsideUsersDialog && !isToggleButton && this.showUsers) {
      this.toggleUserList();
    }
  }

  insertName(userName: string) {
    if (this.selectedNames.some(user => user.name === userName)) {
      return;
    }
  
    const user = this.userService.userData.find(u => u.name === userName);

    if (user) {
      this.selectedNames.push({ name: user.name, userId: user.userId });
      this.hasNames = true;
      this.cdr.detectChanges();
    }

    this.toggleUserList();
  }


  removeName(index: number) {
    this.selectedNames.splice(index, 1); 
    this.hasNames = this.selectedNames.length > 0; 
    this.cdr.detectChanges();
  }
  
  //Reactions
  //if: wenn der aktuelle Nutzer noch nicht die angeklickte Reaktion gewählt hat, wird er dieser Reaktion hinzugefügt
  //else: wenn schon gewählt, dann wird er wieder entfernt

  //isHovered:boolean = false;
  hoveredMessageId: string | null = null;  // Speichert die ID des gehoverten Elements
  hoveredReaction: string | null = null;

  hoveredElement: { messageId: string | null; reactionType: string | null } = {
    messageId: null,
    reactionType: null,
  };

  // Funktion, um das gehoverte Element zu setzen
  isHovered(messageId: string | null, reactionType: string | null) {
    this.hoveredElement = { messageId, reactionType };
  }

  // Funktion, um die Sichtbarkeit zu prüfen
  isBubbleVisible(messageId: string, reactionType: string): boolean {
    return (
      this.hoveredElement.messageId === messageId &&
      this.hoveredElement.reactionType === reactionType
    );
  }

  async addReaction(currentUser: User, message: any, reaction: string) {
    debugger
    console.log(message); // Nachricht prüfen
    const currentUsers = message[reaction] || [];
    
    const currentUserReactedAlready = currentUsers.some((user: { userId: string; }) => user.userId === this.currentUserId);
    const chatDocRef = doc(this.firestore, 'chats', message.chatId, 'messages', message.messageId);
  
    if (!currentUserReactedAlready) {
      await updateDoc(chatDocRef, {
        [reaction]: [...currentUsers, currentUser.toJson()]  // Sicherstellen, dass user im richtigen Format ist
      });
    } else {
      const updatedUsers = currentUsers.filter((user: User) => user.userId !== this.currentUserId);
      await updateDoc(chatDocRef, {
        [reaction]: updatedUsers  
      });
    }
  }

  
}
