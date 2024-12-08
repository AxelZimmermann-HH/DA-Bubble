import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
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
import { DialogEditChannelComponent } from './dialog-edit-channel/dialog-edit-channel.component';
import { SafeResourceUrl } from '@angular/platform-browser';
import { AnswersService } from '../../services/answers.service';

interface MessageGroup {
  date: string;
  messages: any[];
}

@Component({
  selector: 'app-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, ThreadComponent, PickerComponent],
  templateUrl: './channel.component.html',
  styleUrl: './channel.component.scss'
})

export class ChannelComponent implements AfterViewInit {

  userId!: string;
  newMessageText: string = '';
  isLoading = false;
  editingMessageId: string | null = null;

  inputValue: string = '';

  filteredUsers: User[] = [];
  filteredMessages: Message[] = [];
  filteredSearchMessages: MessageGroup[] = [];
  showAutocomplete: boolean = false;
  filteredChannels: Channel[] = [];
  selectedUser: User | null = null;

  taggedUser: boolean = false;
  showEmojiPicker: boolean = false;
  showEditEmojiPicker: boolean = false;

  selectedFile: File | null = null;
  fileUrl: SafeResourceUrl | null = null;

  @Input() selectedChannelId: string | null = null;
  @Output() chatSelected = new EventEmitter<void>();

  @ViewChild('messageInput') messageInput: any;
  @ViewChild('fileInput') fileInput!: ElementRef;

  isThreadOpen: boolean = false;
  selectedMessage = new Message();
  selectedAnswers: Answer[] = [];
  lastAnswerTime!: string;

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
    public answerService: AnswersService
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
    this.subscribeToFilteredData();
    this.loadAnswersForMessages();
  }

  ngOnChanges(): void {
    this.isLoading = true;
    if (this.selectedChannelId) {
      this.loadChannelData();

    } else {
      this.resetChannelState();
    }
  }

  loadChannelData() {
    if (this.selectedChannelId) {
      this.channelService.loadChannel(this.selectedChannelId)
        .then(() => this.loadMessages())
        .catch(error => {
          console.error('Fehler beim Laden des Channels:', error);
          this.isLoading = false;
        })
    }
  }

  loadMessages() {
    this.messagesService.getAllMessages(this.selectedChannelId, () => {
      this.filteredSearchMessages = this.messagesService.allMessages;
      this.isLoading = false;
      this.focusInputField();
      this.loadAnswersForMessages();
    });
  }

  loadAnswersForMessages() {
    this.filteredSearchMessages.forEach(group => {
      group.messages.forEach(message => {
        this.loadAnswers(message);
      });
    });
  }

  loadAnswers(message: any) {
    this.answerService.getAnswers(this.selectedChannelId, message.messageId, (answers) => {
      message.answersCount = answers.length;
      if (answers.length > 0) {
        const lastAnswer = answers[answers.length - 1];
        this.lastAnswerTime = lastAnswer.formatTimestamp()
      }
    });
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
        data: { channel: channel, userId: this.userId }
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
        this.filteredSearchMessages = this.messagesService.allMessages;
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
    if (this.inputValue.startsWith('@')) { this.inputValue = '@' + value; }
    else if (this.inputValue.startsWith('#')) { this.inputValue = '#' + value; }
    else { this.inputValue = value; }
    this.searchService.hideAutocompleteList();
  }

  async sendMessage(selectedChannelId: string | null, editingMessageId: string | null) {
    if (editingMessageId) {
      await this.messagesService.editMessageForMobile(this.newMessageText, editingMessageId, selectedChannelId);
      this.resetInput();
      this.scrollToBottom();
      return;
    }
    await this.messagesService.sendMessage(this.newMessageText, this.inputValue, this.userId, selectedChannelId, editingMessageId);
    this.scrollToBottom();
    this.resetInput();
  }

  async editDirectMessage(message: Message) {
    if (!this.sharedService.isMobile) {
      message.isEditing = true;
      message.editedText = message.text;
    } else {
      this.newMessageText = message.text;
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

  async saveMessage(message: Message) {
    this.messagesService.saveMessageEdit(message, this.selectedChannelId);
    if (this.selectedMessage.messageId === message.messageId) {
      this.isThreadOpen = false;
    }
  }

  resetInput() {
    this.inputValue = '';
    this.newMessageText = '';
    this.fileService.selectedFile = null;
    this.fileService.fileUrl = null;
    this.newMessageText = '';
    this.editingMessageId = null;
  }

  resetFileInput() {
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  onClosePreview() {
    this.fileService.closePreview();
    this.resetFileInput();
  }

  isValidInput(): boolean {
    const trimmedValue = this.inputValue.trim();
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (emailPattern.test(trimmedValue)) {
      return true;
    }
    if (trimmedValue.startsWith('#')) {
      const channelName = trimmedValue.slice(1).trim();
      return this.filteredChannels.some(channel => channel.channelName === channelName);
    }
    if (trimmedValue.startsWith('@')) {
      const userName = trimmedValue.slice(1).trim();
      return this.userService.userData.some(user => user.name === userName);
    }
    return false;
  }

  onThreadClosed() {
    this.isThreadOpen = false;
  }

  openThread(message: Message) { 
    this.isThreadOpen = true;
    this.selectedMessage = message;
  
    if (this.sharedService.isMobile) {
      this.dialog.closeAll();
    }
  }

  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker
  }

  toggleEditEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    this.showEditEmojiPicker = !this.showEditEmojiPicker
  }

  addEmojiToNewMessage(event: any) {
    const emoji = event.emoji.native; 
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
    const reactionContainer = document.querySelector('.add-reaction-container');

    if (this.taggedUser && searchList && taggedUserDiv &&
      !searchList.contains(event.target as Node) && !taggedUserDiv.contains(event.target as Node)) {
      this.taggedUser = false;
    }
    if ((this.showEmojiPicker || this.showEditEmojiPicker) && emojiPicker && !emojiPicker.contains(event.target as Node)) {
      this.showEmojiPicker = false;
      this.showEditEmojiPicker = false;
    }
    if (reactionContainer && !reactionContainer.contains(event.target as Node)) {
      this.emojiService.showReactionContainer = false;
    }
  }

  onFileSelected(event: any): void {
    this.fileService.onFileSelected(event);
    this.selectedFile = this.fileService.selectedFile;
    this.fileUrl = this.fileService.fileUrl;
  }

  selectUser(user: User) {
    this.newMessageText += `@${user.name}`;
    this.taggedUser = false;
  }

  toggleAutoListe(event: MouseEvent) {
    event.stopPropagation();
    this.taggedUser = !this.taggedUser;
  }

  removeFile(message: any) {
    this.fileService.removeFile(message);
    this.fileInput.nativeElement.value = '';
  }

  @ViewChild('chatContainer') chatContainer!: ElementRef;
  ngAfterViewInit() {
    if (this.chatContainer?.nativeElement) {
      const observer = new MutationObserver(() => {
        this.scrollToBottom(); 
      });

      observer.observe(this.chatContainer.nativeElement, { childList: true, subtree: true });
    }
  }

  scrollToBottom(): void {
    if (this.chatContainer?.nativeElement) {
      try {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scrollen fehlgeschlagen:', err);
      }
    }
  }
}