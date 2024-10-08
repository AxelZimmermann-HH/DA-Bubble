import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../models/user.class';
import { CommonModule } from '@angular/common';
import { Channel } from '../../models/channel.class';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-dialog-user-profil',
  standalone: true,
  imports: [CommonModule,MatDialogModule],
  templateUrl: './dialog-user-profil.component.html',
  styleUrl: './dialog-user-profil.component.scss'
})
export class DialogUserProfilComponent {

  channel = new Channel();
  currentUser:any;
  currentUserId:string = '';
  chatPerson:any;

  @Output() chatSelected = new EventEmitter<void>();

  constructor(
    public dialogRef: MatDialogRef<DialogUserProfilComponent>, 
    public firestore: Firestore, 
    public chatService: ChatService,
    public userService: UserService,
    public sharedService: SharedService,
    @Inject(MAT_DIALOG_DATA) public user: User) {
  }

  selectedChannel: Channel | null = null;

  ngOnInit(){
    // Benutzer abonnieren und in currentUser speichern
    this.userService.currentUser$.subscribe(currentUser => {
      this.currentUser = currentUser;
      if (currentUser) {
        //console.log('Angemeldeter Benutzer:', user);
        this.currentUserId = currentUser.userId;
      }
    });
  }
}
