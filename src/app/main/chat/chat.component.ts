import { Component } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss'
})

export class ChatComponent {

  
  myUser:any;
  user:any;
  chat:any;
 

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
      
      if(chatSubject){
        this.chatService.chatIsEmpty = false;
        this.chat = chatSubject;
        this.chatService.chatMessages.push(chatSubject)
      }

      this.chatService.chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      //console.log(this.chatService.chatMessages)
    });
  }

  


//ANZEIGE WENN MESSAGES VORHANDEN
//ANZEIGE WENN KEINE MESSAGES VORHANDEN

  openUserProfile(){

  }
}
