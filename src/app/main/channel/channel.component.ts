import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { SharedService } from '../../services/shared.service';
import { ThreadComponent } from "../thread/thread.component";
import { AddChannelUserComponent } from './add-channel-user/add-channel-user.component';
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { addDoc, collection, doc, Firestore, onSnapshot, Timestamp, updateDoc } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatComponent } from "../chat/chat.component";
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { MessagesService } from '../../services/messages.service';
import { ChannelService } from '../../services/channel.service';
import { FileService } from '../../services/file.service';
import { EmojisService } from '../../services/emojis.service';

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
    public emojiService: EmojisService,
    public chatService: ChatService,
    public searchService: SearchService,
    public fileService: FileService,

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

    const receiverID = this.userService.getUserIdByname(recipientName);
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



  openUsersList(channelId: string) {
    this.dialog.open(AddChannelUserComponent, {
      data: {
        channelId: channelId,
        channel: this.channelService.selectedChannel
      }
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
        this.selectedAnswers = []; 

      }
    }, (error) => {
      console.error('Fehler beim Abrufen der Antworten: ', error);
    });
  }

  //Emojis

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


  editDirectMessage(message: Message) {
    message.isEditing = true;
    message.editedText = message.text;
    if (message.fileUrl) {
      const filename = message.fileName || this.fileService.extractFileName(message.fileUrl);
      message.editedText += `\nDatei: ${filename}`;
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

  toggleAutoListe() {
    this.taggedUser = !this.taggedUser
  }

}





