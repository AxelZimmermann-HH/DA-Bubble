import { AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogUserProfilComponent } from '../../dialog-user-profil/dialog-user-profil.component';
import { User } from '../../models/user.class';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewInit, AfterViewChecked{

  directMessage = new FormControl('', [Validators.required, Validators.minLength(2)]);
  currentUser: any;
  currentUserId: string = '';
  user = new User();
  chat: any;
 
  @ViewChild('chatContainer') chatContainer!: ElementRef;

  constructor(
    public chatService: ChatService, 
    public dialog: MatDialog, 
    public userService: UserService
  ) {}

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
}