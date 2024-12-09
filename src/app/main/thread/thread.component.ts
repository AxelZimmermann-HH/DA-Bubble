import { Component, ElementRef, EventEmitter, HostListener, Input, Output, SimpleChanges, ViewChild } from '@angular/core';
import { User } from '../../models/user.class';
import { Message } from '../../models/message.class';
import { addDoc, collection, deleteDoc, doc, Firestore, updateDoc } from '@angular/fire/firestore';
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
import { getDownloadURL, getStorage, ref, uploadBytes } from '@angular/fire/storage';
import { AnswersService } from '../../services/answers.service';
import { SharedService } from '../../services/shared.service';
import { FileService } from '../../services/file.service';
import { EmojisService } from '../../services/emojis.service';

@Component({
  selector: 'app-thread',
  standalone: true,
  imports: [CommonModule, MatDialogModule, FormsModule, PickerComponent],
  templateUrl: './thread.component.html',
  styleUrls: ['./thread.component.scss']
})
export class ThreadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('answersContainer') answersContainer!: ElementRef;

  userId!: string;

  newAnswerText: string = "";
  selectedFile: File | null = null;

  showEmoji: boolean = false;
  showAnswerEmoji: boolean = false;
  showAllAnswerEmoji: boolean = false;
  clickedAnswer: string = '';

  fileUrl: SafeResourceUrl | null = null;
  showEmojiPicker: boolean = false;
  editingAnswerId: string | null = null;
  taggedUser: boolean = false;
  errorMessage: string | null = null;
  filteredSearchAnswers: Answer[] = [];

  @Output() threadClosed = new EventEmitter<void>();

  @Input() selectedChannelId: string | null = null;
  @Input() channelName: string | undefined;
  @Input() message!: Message;

  selectedAnswers: Answer[] = []

  constructor(
    public firestore: Firestore,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    public userService: UserService,
    public threadService: ThreadService,
    public answersService: AnswersService,
    private sanitizer: DomSanitizer,
    public sharedService: SharedService,
    public fileService: FileService,
    public emojiService: EmojisService,
  ) { }

  ngOnInit(): void {
    this.route.params.subscribe(params => { this.userId = params['userId']; });
    this.subscribeToSearch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['message'] && this.message && this.message.messageId) {
      this.answersService.getAnswers(this.selectedChannelId, this.message.messageId, (answers) => {
        this.selectedAnswers = answers;
      });
    }
    if (changes['selectedChannelId'] && !changes['selectedChannelId'].isFirstChange()) {
      this.selectedAnswers = [];
      this.closeThread();
    }
  }

  subscribeToSearch() {
    this.sharedService.searchTerm$.subscribe((term) => {
      if (term.length >= 3) {
        this.filterAnswers(term);
      } else {
        this.resetFilteredAnswers();
      }
    });
  }

  deleteFile(answer: Answer) {
    this.answersService.deleteFile(answer);
    this.fileInput.nativeElement.value = '';
  }

  filterAnswers(term: string) {
    this.selectedAnswers = this.selectedAnswers.filter((answer: any) => {
      const matchesUser = answer.user?.toLowerCase().includes(term.toLowerCase());
      const matchesText = answer.text?.toLowerCase().includes(term.toLowerCase());
      return matchesUser || matchesText;
    });
  }

  resetFilteredAnswers() {
    this.filteredSearchAnswers = this.selectedAnswers;
  }

  async addAnswer(messageId: string) {
    const username = this.userService.findUserNameById(this.userId);
    const fileUrl = await this.uploadFileIfSelected();
    const answerData = {
      messageId,
      text: this.newAnswerText.trim(),
      user: username,
      timestamp: new Date(),
      emojis: [],
      ...(fileUrl && { fileUrl, fileType: this.selectedFile?.type, fileName: this.selectedFile?.name }),
    };
    if (this.editingAnswerId) {
      await this.editAnswer(messageId)
    } else {
      await this.answersService.addNewAnswer(messageId, answerData, this.selectedChannelId, this.newAnswerText);
      this.newAnswerText = '';
      this.selectedFile = null;
    }
  }

  async editAnswer(messageId: string) {
    const updateData: any = { text: this.newAnswerText.trim() };
    if (!this.selectedFile) {
      updateData.fileUrl = null;
      updateData.fileType = null;
      updateData.fileName = null;
    }
    try {
      const answerRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}/answers/${this.editingAnswerId}`);
      await updateDoc(answerRef, updateData);
      const answer = this.selectedAnswers.find(a => a.id === this.editingAnswerId);
      if (answer) {
        answer.text = this.newAnswerText.trim();
        answer.isEditing = false;
        if (!answer.text && !answer.fileUrl) {
          await this.answersService.deleteEditedAnswer(messageId, this.selectedChannelId, this.editingAnswerId);
        }
      }
      this.newAnswerText = '';
      this.selectedFile = null;
      this.editingAnswerId = null;
    } catch (error) {
      console.error('Fehler beim Bearbeiten der Antwort:', error);
    }
  }
  async uploadFileIfSelected() {
    if (!this.selectedFile) return null;
    const filePath = `files/${this.selectedFile.name}`;
    const storageRef = ref(getStorage(), filePath);
    try {
      const snapshot = await uploadBytes(storageRef, this.selectedFile);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
      throw error;
    }
  }

  editDirectAnswer(answer: Answer) {
    if (!this.sharedService.isMobile) {
      answer.isEditing = true;
      answer.editedText = answer.text;
    } else {
      this.newAnswerText = answer.text;
      this.editingAnswerId = answer.id;
      if (answer.fileUrl) {
        this.fileUrl = this.fileService.getSafeUrl(answer.fileUrl);
        const fakeFile = new File([''], answer.fileName || 'Unbenannte Datei', {
          type: answer.fileType || 'application/octet-stream',
        });
        this.selectedFile = fakeFile;
      } else {
        this.fileService.closePreview();
      }
    }
  }

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

  toggleEmojiReactionForAnswer(answer: Answer, emojiData: EmojiData) {
    if (!emojiData || !emojiData.userIds) {
      console.error('Ungültige Emoji-Daten:', emojiData);
   return;
    }
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
    if (!this.selectedChannelId || !answer.messageId || !answer.id) return;
    const answerRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${answer.messageId}/answers/${answer.id}`);
    updateDoc(answerRef, { emojis: answer.emojis });
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

  getRecentEmojis(answer: Answer): EmojiData[] {
    return answer.emojis
      .filter(emojiData => emojiData.userIds.length > 0)
      .sort((a, b) => b.userIds.length - a.userIds.length)
      .slice(0, 2);
  }

  toggleShowEmoji() { this.showEmoji = !this.showEmoji }

  toggleAllEmojitoAnswer(event: any, clickedAnswer: string) {
    event.stopPropagation();
    this.clickedAnswer = clickedAnswer
    this.showAllAnswerEmoji = !this.showAllAnswerEmoji;
  }

  toggleEmojiPicker(event: MouseEvent) {
    event.stopPropagation();
    this.showEmojiPicker = !this.showEmojiPicker
  }

  toggleAutoListe(event: MouseEvent) {
    event.stopPropagation();
    this.taggedUser = !this.taggedUser
  }

  addEmoji(event: any) {
    const emoji = event.emoji.native;
    this.newAnswerText += emoji
    this.showEmojiPicker = false;
  }

  addEmojiToAnswer(event: any, answer: Answer) {
    const emoji = event.emoji.native;
    answer.editedText += emoji;
    this.showAnswerEmoji = false;
  }

  toggleEmojitoAnswer(event: MouseEvent) {
    event.stopPropagation();
    this.showAnswerEmoji = !this.showAnswerEmoji;
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      if (!this.fileService.isFileSizeAllowed(file)) {
        this.errorMessage = 'Nur Bilder oder PDF-Dateien sind erlaubt.';
        this.fileService.resetFile();
        return;
      }
      if (!this.fileService.isFileTypeAllowed(file)) {
        this.errorMessage = 'Nur Bilder oder PDF-Dateien sind erlaubt.';
        this.fileService.resetFile();
        return;
      }
      this.selectedFile = file;
      const objectUrl = URL.createObjectURL(file);
      this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
      this.resetErrorMessage();
    } else {
      this.resetErrorMessage();
    }
  }

  resetErrorMessage(): void {
    this.errorMessage = null;
  }

  closePreview() {
    this.fileUrl = null;
    this.selectedFile = null;
    this.fileInput.nativeElement.value = '';
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
    if ((this.showEmojiPicker || this.showAnswerEmoji) && emojiPicker && !emojiPicker.contains(event.target as Node)) {
      this.showEmojiPicker = false;
      this.showAnswerEmoji = false;
    }
  }

  selectUser(user: User) {
    this.newAnswerText += `@${user.name}`;
    this.taggedUser = false;
  }

  ngAfterViewInit() {
    if (this.answersContainer?.nativeElement) {
      const observer = new MutationObserver(() => { this.scrollToBottom(); });
      observer.observe(this.answersContainer.nativeElement, { childList: true, subtree: true });
    }
  }

  scrollToBottom(): void {
    if (this.answersContainer?.nativeElement) {
      try {
        this.answersContainer.nativeElement.scrollTop = this.answersContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scrollen fehlgeschlagen:', err);
      }
    }
  }
  closeThread() {
    this.threadClosed.emit();
  }
}