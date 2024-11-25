import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channel.class';
import { Message } from '../../models/message.class';
import { SharedService } from '../../services/shared.service';
import { ThreadComponent } from "../thread/thread.component";
import { Answer } from '../../models/answer.class';
import { ActivatedRoute } from '@angular/router';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../../services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ChatService } from '../../services/chat.service';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { MessagesService } from '../../services/messages.service';
import { ChannelService } from '../../services/channel.service';
import { FileService } from '../../services/file.service';
import { EmojisService } from '../../services/emojis.service';
import { DatabaseService } from '../../services/database.service';
import { DialogEditChannelComponent } from './dialog-edit-channel/dialog-edit-channel.component';

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

  @ViewChild('messageInput') messageInput: any;

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
    public dbService: DatabaseService,
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
          this.isLoading = false;
          this.focusInputField()
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

  focusInputField() {
    if (this.messageInput) {
      this.messageInput.nativeElement.focus();
    }
  }

  subscribeToFilteredData() {
    this.searchService.filteredData$.subscribe(data => {
      this.filteredUsers = data.users;
      this.filteredChannels = data.channels;
      this.filteredMessages = data.messages;
      this.showAutocomplete = data.showAutocomplete;
    });
  }

  openDialogEditChannel(channel: Channel) {
    if (channel && this.userId) {
      this.dialog.open(DialogEditChannelComponent, {
        data: {
          channel: channel,
          userId: this.userId,
        },
      });
    } else {
      console.error('Cannot open dialog: Channel or userId is missing.');
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
    try {
      const user = this.userService.findUserByEmail(email);
      if (!user) return;
      await this.messagesService.sendDirectMessage(user.name, message, fileUrl, this.userId);
    } catch (error) {
      console.error("Fehler beim Suchen des Benutzers: ", error);
    }
  }

  async sendMessage() {
    const fileUrl = await this.fileService.uploadFiles();
    if (this.newMessageText.trim() === '' && !this.fileService.selectedFile && !this.isEditingOnMobile) return;

    await this.editMessageForMobile();

    // const fileUrl = await this.fileService.uploadFiles();
    if (!fileUrl && !this.newMessageText.trim()) return;
    if (this.channelService.selectedChannel) {
      await this.messagesService.sendChannelMessage(this.selectedChannelId, this.newMessageText, fileUrl, this.userId);
    } else {
      await this.handleDirectMessageOrEmail(fileUrl);
    }

    // Senden von Direktnachrichten, falls Benutzernamen markiert wurden
    await this.sendTaggedMessages(fileUrl);

    this.resetInput();
  }

  async sendTaggedMessages(fileUrl: string | null) {
    const taggedUsernames = this.extractTaggedUsernames(this.newMessageText);
    for (const username of taggedUsernames) {
      await this.messagesService.sendDirectMessage(username, this.newMessageText, fileUrl, this.userId);
    }
  }
  async editMessageForMobile() {
    if (this.isEditingOnMobile) {
      console.log('message:', this.newMessageText, 'filservice edit:', this.fileService.selectedFile);

      if (!this.newMessageText.trim() && !this.fileService.selectedFile) {
        await this.messagesService.deleteMessage(this.editingMessageId, this.selectedChannelId);
      }
      else {
        await this.messagesService.updateMessages(this.selectedChannelId, this.editingMessageId, this.newMessageText);
      }
      this.newMessageText = '';
      this.isEditingOnMobile = false;
      this.editingMessageId = null;
      return;
    }
  }


  extractTaggedUsernames(message: string): string[] {
    const tagRegex = /@([A-Za-z0-9_]+)/g;
    const taggedUsernames = [];
    let match;
    while ((match = tagRegex.exec(message)) !== null) {
      taggedUsernames.push(match[1].trim());
    }
    return taggedUsernames;
  }

  resetInput() {
    this.inputValue = '';
    this.newMessageText = '';
    this.fileService.selectedFile = null;
    this.fileService.fileUrl = null;
    this.newMessageText = '';
    this.isEditingOnMobile = false;
    this.editingMessageId = null;
  }

  async handleDirectMessageOrEmail(fileUrl: string | null) {
    const inputValue = this.inputValue.trim();
    if (this.emailPattern.test(inputValue)) {
      await this.sendEmail(inputValue, this.newMessageText, fileUrl);
    } else if (inputValue.startsWith('@')) {
      const userName = inputValue.slice(1).trim();
      await this.messagesService.sendDirectMessage(userName, this.newMessageText, fileUrl, this.userId);
    } else if (inputValue.startsWith('#')) {
      const channelName = inputValue.slice(1).trim();
      const channelId = this.channelService.getChannelIdByName(channelName);
      if (channelId) {
        await this.messagesService.sendChannelMessage(channelId, this.newMessageText, fileUrl, this.userId);
      }
    }
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

  async editDirectMessage(message: Message) {
    if (!this.sharedService.isMobile) {
      message.isEditing = true;
      message.editedText = message.text;
    } else {
      this.newMessageText = message.text;
      this.isEditingOnMobile = true;
      this.editingMessageId = message.messageId;

      if (message.fileUrl) {
        this.fileService.fileUrl = this.fileService.getSafeUrl(message.fileUrl);
        const fakeFile = new File([''], message.fileName || 'Unbenannte Datei', {
          type: message.fileType || 'application/octet-stream',
        });
        this.fileService.selectedFile = fakeFile;
      } else {
        this.fileService.closePreview();
      }

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





