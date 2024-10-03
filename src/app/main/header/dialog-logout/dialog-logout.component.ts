import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { collection, Firestore, onSnapshot, doc, updateDoc, getDoc, setDoc } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from '../../../models/channel.class';
import { User } from '../../../models/user.class';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../../services/user.service';  

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dialog-logout.component.html',
  styleUrl: './dialog-logout.component.scss'
})
export class DialogLogoutComponent implements OnInit {
  channel = new Channel();
  channelData: any = [];
  channelId!: string;
  userData: any = [];
  user = new User();
  selectedOption: string | null = null;
  currentUser: User | null = null;


  constructor(public firestore: Firestore, public dialogRef: MatDialogRef<DialogLogoutComponent>, private route: Router, private userService: UserService,) {
    //provisorisch
    this.channel.channelName = "Entwicklerteam";
    this.user.name = "Noah";
  }

  ngOnInit() {
    // Benutzer abonnieren und in currentUser speichern
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        console.log('Angemeldeter Benutzer:', user);
      }
    });
  }

  addUser() {
    console.log('user erstellt');
    this.dialogRef.close();
  }

  async logOut() {
    if (this.currentUser) {
      const userDocRef = doc(this.firestore, `users/${this.currentUser.userId}`);
      await updateDoc(userDocRef, { online: false });
      this.dialogRef.close();
    } else {
      console.error('Kein Benutzer zum Ausloggen gefunden');
    }
  }
}
