import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from '../../../models/channel.class';
import { User } from '../../../models/user.class';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-logout.component.html',
  styleUrl: './dialog-logout.component.scss'
})
export class DialogLogoutComponent {
  channel = new Channel();
  channelData: any = [];
  channelId!: string;
  userData: any = [];
  user = new User();
  selectedOption: string | null = null;

  constructor(public firestore: Firestore, public dialogRef: MatDialogRef<DialogLogoutComponent>) {
    //provisorisch
    this.channel.channelName = "Entwicklerteam";
    this.user.name = "Noah";
  }
  addUser() {
    console.log('user erstellt');
    this.dialogRef.close();
  }

}
