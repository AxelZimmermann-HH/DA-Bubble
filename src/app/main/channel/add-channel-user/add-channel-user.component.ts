import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { User } from '../../../models/user.class';
import { Channel } from '../../../models/channel.class';
import { UserService } from '../../../services/user.service';
import { DialogUserProfilComponent } from '../../dialog-user-profil/dialog-user-profil.component';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-add-channel-user',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './add-channel-user.component.html',
  styleUrl: './add-channel-user.component.scss'
})
export class AddChannelUserComponent {

  userData: any = [];
  user = new User();
  channel = new Channel();
  userId!: string;
  channelUsers = [];

  @Output() chatSelected = new EventEmitter<void>();
  constructor(public firestore: Firestore, private router: Router, private route: ActivatedRoute, public chatService: ChatService, public dialogRef: MatDialogRef<AddChannelUserComponent>, public userService: UserService, public dialog: MatDialog, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.getAllUsers();
    this.channel = new Channel(data.channel);
    console.log('hallo', this.channel.members);

    this.route.params.subscribe(params => {
      const currentUser = params['userId'];
      console.log('Aktuelle userId:', currentUser); // Füge diese Zeile hinzu
    });

  }

  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    const readUsers = onSnapshot(userCollection, (snapshot) => {
      this.userData = [];
      snapshot.forEach((doc) => {
        let user = new User({ ...doc.data(), id: doc.id });
        this.userData.push(user);
      });
      console.log('current users', this.userData);
    });
  }

  openUserProfil(member: any) {
this.dialog.open(DialogUserProfilComponent, { data: member });
console.log('add channel user ', member.name);
  }
}
