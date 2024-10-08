import { AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogUserProfilComponent } from '../dialog-user-profil/dialog-user-profil.component';
import { User } from '../../models/user.class';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Route } from '@angular/router';
import { collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewInit, AfterViewChecked{

  directMessage = new FormControl('', [Validators.required, Validators.minLength(2)]);
  editedMessage = new FormControl('', [Validators.required, Validators.minLength(2)]);
  editingMessageId: string | null = null;
  currentUser: any|string;
  currentUserId: string = '';
  user = new User();
  chat: any;
 
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  

  constructor(
    public chatService: ChatService, 
    public dialog: MatDialog, 
    public userService: UserService,
    public route: ActivatedRoute
  ) {}


  getAvatarForUser(userName: string):any {

    if (userName === this.user.name) {
      if (this.userService.isNumber(this.user.avatar)) {
        return './assets/avatars/avatar_' + this.user.avatar + '.png';  // Local asset avatar
      } else { 
        return this.user.avatar;  // External URL avatar
      }
    }
    return './assets/avatars/avatar_0.png';  // Default avatar when user not found
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


    // Abonniere aktuellen Benutzer
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserId = user.userId;
      }
    });
    

    // Abonniere und lade den Chat
    this.chatService.chat$.subscribe((chatSubject) => {
      if (chatSubject && chatSubject.length > 0) {
        this.chatService.chatIsEmpty = false;
        this.chat = chatSubject;
      }
    });


    this.route.params.subscribe(params => {
      const userId = params['userId'];
  });
  };


  //sendet neue DM an den Chat Service
  async sendDirectMessage() {
    
    const newDm = this.directMessage.value!;
    await this.chatService.setChatData(newDm, this.currentUserId);
    this.directMessage.setValue('');
  };


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
    this.dialog.open(DialogUserProfilComponent, { data: user });
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
  editDirectMessage(message:any){
 
    this.editingMessageId = message.messageId;
    this.editedMessage.setValue(message.text)
  }


  // schlie0t das Bearbeitungsfeld, ohne Speichern
  cancelEditing() {
    this.editingMessageId = null;
  }


  // setzt die bearbeitete Nachricht 
  async setEditedDirectMessage(message:any){
    const editedDM = this.editedMessage.value!;
    await this.chatService.setEditedChatData(editedDM, message);
    this.editedMessage.setValue('');
    this.editingMessageId = null;
  }
}