import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { MatDialogRef } from '@angular/material/dialog';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dialog-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dialog-add-user.component.html',
  styleUrl: './dialog-add-user.component.scss'
})
export class DialogAddUserComponent {
  channel = new Channel();
  channelData: any = [];
  channelId!: string;
  userData: any = [];
  user = new User();
  selectedOption: string | null = null;

  constructor(public firestore: Firestore, public dialogRef: MatDialogRef<DialogAddUserComponent>) {
    //provisorisch
    this.channel.channelName = "Entwicklerteam";
    this.user.name = "Noah";
  }
  addUser() {
    console.log('user erstellt');
    this.dialogRef.close();
  }

}
