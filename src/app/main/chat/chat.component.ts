import { AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild, HostListener, Renderer2, OnDestroy } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogUserProfilComponent } from '../dialog-user-profil/dialog-user-profil.component';
import { User } from '../../models/user.class';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { ActivatedRoute } from '@angular/router';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { Firestore } from '@angular/fire/firestore';
import { ChangeDetectorRef } from '@angular/core';
import { AudioService } from '../../services/audio.service';
import { FileService } from '../../services/file.service';
import { DatabaseService } from '../../services/database.service';
import { ReactionService } from '../../services/reaction.service';

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

export class ChatComponent implements AfterViewInit, AfterViewChecked, OnDestroy {
  private documentClickListener?: () => void;
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
  @ViewChild('customInput') customInput: any;

  constructor(
    public chatService: ChatService,
    public dialog: MatDialog,
    public userService: UserService,
    public sharedService: SharedService, 
    public route: ActivatedRoute,
    public firestore: Firestore,
    private cdr: ChangeDetectorRef,
    public audioService: AudioService,
    public fileService: FileService,
    public dbService: DatabaseService,
    private renderer: Renderer2,
    private elementRef: ElementRef,
    public reactionService: ReactionService
  ) { }


  getAvatarForUser(userName: string): any {
    if (!this.user || !this.user.name) {
      return './assets/avatars/avatar_0.png'; 
    }

    if (userName.trim().toLowerCase() === this.currentUser.name.trim().toLowerCase()) {
      return this.getCurrentUserAvatar();
    }
  
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
      this.focusInputField();
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

     // Listener auf das gesamte Dokument
     this.documentClickListener = this.renderer.listen('document', 'click', (event: MouseEvent) => {
      const emojiPicker = this.elementRef.nativeElement.querySelector('.chat-emoji-picker');
      
      // Prüfen, ob der Klick außerhalb des Emoji-Pickers ist
      if (
        (this.showEmojis || this.showEditEmojis) &&
        emojiPicker &&
        !emojiPicker.contains(event.target as Node)
      ) {
        this.closeEmojiPicker();
      }
    });
  }

  ngOnDestroy() {
    // Entfernt den Listener, um Speicherlecks zu vermeiden
    if (this.documentClickListener) {
      this.documentClickListener();
    }
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
    const fileDownloadUrl = this.fileService.fileDownloadUrl;
    const fileName = this.fileService.selectedFileName;
    const fileType = this.fileService.selectedFileType;
    const audioDownloadUrl = this.audioService.audioDownloadUrl;
  
    await this.chatService.setChatData(newDm, fileDownloadUrl, fileName, fileType, this.currentUserId, audioDownloadUrl);
    await this.resetDirectMessage();
    await this.sendMessagesToMultipleUsers(newDm, fileDownloadUrl, fileName, fileType);  
    this.selectedNames = [];
    this.hasNames = false;
  }
  

  async resetDirectMessage(){
    this.directMessage.setValue('');
    this.fileService.selectedFile = null;
    this.fileService.selectedFileName = '';
    this.fileService.fileDownloadUrl = '';
    this.audioService.audioDownloadUrl = '';
  }


  async sendMessagesToMultipleUsers(newDm: string, fileDownloadUrl: string, fileName: string, fileType: string) {
    for (const user of this.selectedNames) {
      const chatId = await this.chatService.createChatID(this.currentUserId, user.userId);
      const chatExists = await this.chatService.doesChatExist(chatId);
  
      if (!chatExists) {
        await this.dbService.createNewChat(chatId, this.currentUserId, user.userId);
      }
  
      await this.chatService.sendMessageToChat(chatId, newDm, fileDownloadUrl, fileName, fileType, this.currentUserId);
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


  //Emojis>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  showEmojis: boolean = false;
  showEditEmojis: boolean = false;

  private closeEmojiPicker() {
    this.showEmojis = false;
    this.showEditEmojis = false;
  }


  toggleEmojis(event: any) {
    event.stopPropagation();
    this.showEmojis = !this.showEmojis;
  }

  toggleEmojisEdit(event: any){
    event.stopPropagation();
    this.showEditEmojis = !this.showEditEmojis;
  }


  onEmojiSelect(event: any) {
    const emoji = event.emoji.native; // Das ausgewählte Emoji
    const currentMessageValue = this.directMessage.value || '';
    this.directMessage.setValue(currentMessageValue + emoji);
    this.showEmojis = false;
  }


  onEmojiSelectEdit(event: any){
    const emoji = event.emoji.native; // Das ausgewählte Emoji
    const currentMessageValue = this.editedMessage.value || '';
    this.editedMessage.setValue(currentMessageValue + emoji);
    this.showEditEmojis = false;
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
  

  focusInputField() {
    if (this.customInput) {
      this.customInput.nativeElement.focus();
    }
  }
}
