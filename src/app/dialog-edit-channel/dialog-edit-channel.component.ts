import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Channel } from '../models/channel.class';
import { doc, Firestore } from '@angular/fire/firestore';
import { updateDoc } from 'firebase/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User } from '../models/user.class';


@Component({
  selector: 'app-dialog-edit-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './dialog-edit-channel.component.html',
  styleUrl: './dialog-edit-channel.component.scss'
})
export class DialogEditChannelComponent {
  channel = new Channel();
  channelData: any = [];
  channelId!: string;
  userData: any = [];
  user = new User();

  constructor(public dialogRef: MatDialogRef<DialogEditChannelComponent>, public firestore: Firestore) {

    //provisorisch
    this.channel.channelName = 'Entwicklerteam';
    this.user.name = 'Noah Braun';
  }

  toggleInputName() { }

  async editChannelName() {
    try {
      const channelDocRef = doc(this.firestore, 'channels', this.channelId);
      await updateDoc(channelDocRef, this.channel.toJson());
      console.log('channel successfully updated');
    } catch (error) {
      console.error('Error updating channel: ', error);
    }
    finally {
      this.dialogRef.close();
    }


  }
}
