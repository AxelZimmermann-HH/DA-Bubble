import { Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})

export class ChatComponent {

  directMessage = new FormControl('', [Validators.required, Validators.minLength(2)])
  myUser:any;
  user:any;
  chat:any;
 
  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  constructor(public chatService: ChatService){}

  async ngOnInit(){
    
    this.chatService.user$.subscribe((userData) => {
      if(userData){
        this.user = userData;
        //console.log(this.user)
      }
    });
    
    this.chatService.me$.subscribe((myUserData) => {
      if(myUserData){
        this.myUser = myUserData;

        //console.log(this.myUser)
      }
    });

    //CHAT LADEN
    this.chatService.chat$.subscribe((chatSubject) => {
      if(chatSubject !== null){
        if(chatSubject.length > 0){
          this.chatService.chatIsEmpty = false;
          this.chat = chatSubject;
          this.chatService.chatMessages.push(chatSubject)
        }
      }
      this.chatService.chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
  }

  async sendDirectMessage(){
    const newDm = this.directMessage.value!;
    await this.chatService.setChatData(newDm)
    this.directMessage.setValue('');
  }

  ngAfterViewChecked() {        
    this.scrollToBottom();        
  }

  scrollToBottom(): void {
    if(!this.chatService.chatIsEmpty){
      try {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scrollen fehlgeschlagen:', err);
      }
    }

  }

  openUserProfile(){

  }
}
