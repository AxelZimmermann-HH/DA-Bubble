import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { SharedService } from '../../services/shared.service';
import { ThreadComponent } from "../thread/thread.component";
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { addDoc, collection, doc, Firestore, Timestamp, updateDoc } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { MessagesService } from '../../services/messages.service';
import { ChannelService } from '../../services/channel.service';
import { FileService } from '../../services/file.service';
import { EmojisService } from '../../services/emojis.service';
import { DatabaseService } from '../../services/database.service';

interface MessageGroup {
  date: string;
  messages: any[];
}

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    ThreadComponent,
    PickerComponent
  ],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})

export class ChannelComponent {

  user = new User();
  userId!: string;

  newMessageText: string = '';

  answer = new Answer();
  allAnswers: any = [];

  showChannel: boolean = true;
  showChat: boolean = false;

  isLoading = false;
  isEditingOnMobile: boolean = false;
  editingMessageId: string | null = null;

  inputValue: string = '';

  filteredUsers: User[] = [];
  filteredMessages: Message[] = [];
  filteredSearchMessages: MessageGroup[] = [];
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
    public emojiService: EmojisService,
    public chatService: ChatService,
    public searchService: SearchService,
    public fileService: FileService,
    public dbService: DatabaseService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });

    this.userService.getAllUsers().then(() => {
      this.userService.findUserNameById(this.userId);
    });

    this.subscribeToSearch();
    this.channelService.getAllChannels();

    this.messagesService.getAllMessages('channelId', () => {
      this.filteredSearchMessages = this.messagesService.allMessages;
    });


    this.subscribeToFilteredData();



  }

  ngOnChanges(): void {
    this.isLoading = true;
    if (this.selectedChannelId) {
      this.channelService.loadChannel(this.selectedChannelId).then(() => {
        this.messagesService.getAllMessages(this.selectedChannelId, () => {
          this.filteredSearchMessages = this.messagesService.allMessages;
          console.log('filtered messages: ', this.filteredSearchMessages);
          this.isLoading = false;
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
    this.channelService.selectedChannel = null;
    this.messagesService.allMessages = [];
    this.isLoading = false;
  }

  subscribeToFilteredData() {
    this.searchService.filteredData$.subscribe(data => {
      this.filteredUsers = data.users;
      this.filteredChannels = data.channels;
      this.filteredMessages = data.messages;
      this.showAutocomplete = data.showAutocomplete;
    });
  }

  ///////////////////////////search from header/////////////////////////////////
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
    this.filteredSearchMessages = this.messagesService.allMessages
      .map(group => ({
        ...group,
        messages: group.messages.filter((message: any) =>
          (message.user && message.user.toLowerCase().includes(term.toLowerCase())) ||
          (message.text && message.text.toLowerCase().includes(term.toLowerCase()))
        )
      }))

      .filter(group => group.messages.length > 0);
  }

  resetFilteredMessages() {
    this.filteredSearchMessages = this.messagesService.allMessages;
  }
  //////////////////////////////////////////////////////////////////////////////


  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const searchTerm = target.value;
    this.inputValue = searchTerm;
    if (!searchTerm) {
      this.searchService.clearFilters();
      return;
    }
    this.searchService.filterByType(searchTerm, this.userService.userData, this.channelService.channelData, this.messagesService.allMessages);
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

  async sendEmail(email: string, message: string, fileUrl: string | null) {
    console.log(`E-Mail an ${email} gesendet mit Nachricht: ${message}`);
    try {
      const user =  this.userService.findUserByEmail(email);
      if (!user) {
        console.error(`Kein Benutzer mit der E-Mail-Adresse ${email} gefunden.`);
        return;
      }
  
      await this.sendDirectMessage(user.name, this.newMessageText, fileUrl);
    } catch (error) {
      console.error("Fehler beim Suchen des Benutzers: ", error);
    }
  }

  async sendMessage() {
    if (this.newMessageText.trim() === '' && !this.fileService.selectedFile) return;

    if (this.isEditingOnMobile && this.editingMessageId) {
      const messageRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${this.editingMessageId}`);
      await updateDoc(messageRef, { text: this.newMessageText })
        .then(() => {
          const message = this.messagesService.allMessages.find(m => m.messageId === this.editingMessageId);
          if (message) {
            message.text = this.newMessageText;
            message.isEditing = false;
          }
          this.isEditingOnMobile = false;
          this.editingMessageId = null;
          this.newMessageText = '';
        })
        .catch((error) => {
          console.error("Fehler beim Speichern der Nachricht: ", error);
        });
      return;
    }


    const taggedUsernames = this.extractTaggedUsernames(this.newMessageText);

    const userName = this.userService.findUserNameById(this.userId);
    if (!userName) return;

    const fileUrl = await this.uploadFile();

    if (!fileUrl && !this.newMessageText.trim()) return;


    if (this.channelService.selectedChannel) {
      await this.sendChannelMessage(this.selectedChannelId, this.newMessageText, fileUrl);
    } else {
      await this.handleDirectMessageOrEmail(fileUrl);
    }

    for (const username of taggedUsernames) {
      await this.sendDirectMessage(username, this.newMessageText, fileUrl);
    }

    this.resetInput();
  }

  extractTaggedUsernames(message: string): string[] {
    const tagRegex = /@([A-Za-z0-9_]+)/g; // Akzeptiert auch Namen mit Leerzeichen
    const taggedUsernames = [];
    let match;

    while ((match = tagRegex.exec(message)) !== null) {
      taggedUsernames.push(match[1].trim());  // Den getaggten Namen hinzufügen
    }

    return taggedUsernames;
  }

  async uploadFile(): Promise<string | null> {
    if (!this.fileService.selectedFile) return null;

    const filePath = `files/${this.fileService.selectedFile.name}`;
    const storageRef = ref(getStorage(), filePath);

    try {
      const snapshot = await uploadBytes(storageRef, this.fileService.selectedFile);
      const fileUrl = await getDownloadURL(snapshot.ref);

      this.fileService.fileDownloadUrl = fileUrl;
      return fileUrl;
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      return null;
    }
  }

  async handleDirectMessageOrEmail(fileUrl: string | null) {
    const inputValue = this.inputValue.trim();

    if (this.emailPattern.test(inputValue)) {
      await this.sendEmail(inputValue, this.newMessageText, fileUrl);
    } else if (inputValue.startsWith('@')) {
      const userName = inputValue.slice(1).trim();
      await this.sendDirectMessage(userName, this.newMessageText, fileUrl);
    } else if (inputValue.startsWith('#')) {
      const channelName = inputValue.slice(1).trim();
      const channelId = this.channelService.getChannelIdByName(channelName);
      if (channelId) {
        await this.sendChannelMessage(channelId, this.newMessageText, fileUrl);
      }
    }
  }

  resetInput() {
    this.inputValue = '';
    this.newMessageText = '';
    this.fileService.selectedFile = null;
    this.newMessageText = '';
    this.isEditingOnMobile = false;
    this.editingMessageId = null;
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

  async sendDirectMessage(recipientName: string, messageText: string, fileUrl: string | null) {
    if (!messageText.trim() && !fileUrl) {
      return;
    }

    const receiverID = this.userService.getUserIdByname(recipientName);
    if (!receiverID) {
      return;
    }

    const chatId = await this.initializeChat(receiverID);
    if (!chatId) return;


    await this.sendChatMessage(chatId, messageText, fileUrl);

    this.resetInputFields();
  }


  async initializeChat(receiverID: string) {
    const chatId = await this.chatService.createChatID(this.userId, receiverID);

    const chatExists = await this.chatService.doesChatExist(chatId);

    if (!chatExists) {
      await this.dbService.createNewChat(chatId, this.userId, receiverID);
    }
    return chatId;
  }

  async sendChatMessage(chatId: string, messageText: string, fileUrl: string | null) {

    const fileName = this.fileService.selectedFile ? this.fileService.selectedFile.name : '';
    const fileType = this.fileService.selectedFile ? this.fileService.selectedFile.type : '';
    const finalFileUrl = fileUrl || this.fileService.fileDownloadUrl;

    try {
      await this.chatService.sendMessageToChat(
        chatId,
        messageText,
        finalFileUrl,
        fileName,
        fileType,
        this.userId
      );
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error);
    }
  }

  resetInputFields() {
    this.fileService.selectedFile = null;
    this.fileService.fileDownloadUrl = '';
  }

  onThreadClosed() {
    this.isThreadOpen = false;
  }

  openThread(message: Message) {
    if (!this.sharedService.isMobile) {
      this.isThreadOpen = true;
      this.selectedMessage = message;
    }
    else {
      this.isThreadOpen = true;
      this.selectedMessage = message;
      this.dialog.closeAll()
    }
  }

  //Emojis
  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker
  }

  toggleEditEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
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

  editDirectMessage(message: Message) {
    if (!this.sharedService.isMobile) {
      message.isEditing = true;
      message.editedText = message.text;
    } else {
      this.newMessageText = message.text;
      this.isEditingOnMobile = true;
      this.editingMessageId = message.messageId;
    }
  }


  cancelMessageEdit(message: Message) {
    message.isEditing = false;
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

  @HostListener('document:click', ['$event'])
  onClick(event: MouseEvent) {
    const searchList = document.querySelector('.searchListe');
    const taggedUserDiv = document.querySelector('.tagged-user-list');
    const emojiPicker = document.querySelector('.emoji-picker');

    if (this.taggedUser && searchList && taggedUserDiv &&
      !searchList.contains(event.target as Node) && !taggedUserDiv.contains(event.target as Node)) {
      this.taggedUser = false;
    }

    if ((this.showEmojiPicker || this.showEditEmojiPicker) && emojiPicker && !emojiPicker.contains(event.target as Node)) {
      this.showEmojiPicker = false;
      this.showEditEmojiPicker = false;
    }
  }

  selectUser(user: User) {
    this.newMessageText += `@${user.name}`;
    this.taggedUser = false;
  }

  toggleAutoListe(event: MouseEvent) {
    event.stopPropagation();
    this.taggedUser = !this.taggedUser;
  }

}





