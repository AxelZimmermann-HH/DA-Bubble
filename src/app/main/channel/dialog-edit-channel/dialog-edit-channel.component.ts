import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../models/channel.class';
import { User } from '../../../models/user.class';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';


@Component({
  selector: 'app-dialog-edit-channel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatSidenavModule, MatInputModule, MatFormFieldModule,],
  templateUrl: './dialog-edit-channel.component.html',
  styleUrl: './dialog-edit-channel.component.scss'
})
export class DialogEditChannelComponent {
 
  channelData: any = [];
  channelId!: string;
  userData: any = [];
  user = new User();
  isEditing = false;
  isEditingDescription = false;
  newChannelName!: string;
  newChannelDescription!: string;

  constructor(public dialogRef: MatDialogRef<DialogEditChannelComponent>, public firestore: Firestore, @Inject(MAT_DIALOG_DATA) public channel: Channel) {

    this.user.name = 'Noah Braun';
    this.getAllChannels();
    this.newChannelName = this.channel.channelName;
  }

  toggleInputName() {
    this.isEditing = true; // Start editing
  }

  getAllChannels() {
    const channelCollection = collection(this.firestore, 'channels');
    onSnapshot(channelCollection, (snapshot) => {
      this.channelData = [];
      snapshot.forEach((doc) => {
        let channel = new Channel({ ...doc.data(), id: doc.id });
        this.channelData.push(channel);
      });
    });
  }
  async editChannelName() {

    if (this.newChannelName.trim()) {  // Only update if input is not empty
      if (this.newChannelName.trim()) {
        // Update the channel description in Firestore
        const channelDocRef = doc(this.firestore, 'channels', this.channel.id);
        updateDoc(channelDocRef, { channelName: this.newChannelName })
          .then(() => {
            console.log('Channel description updated successfully');
            this.channel.channelName = this.newChannelName
          })
          .catch((error) => {
            console.error('Error updating channel description: ', error);
          });
      }
    }
    this.isEditing = false;
  }

  toggleDescriptionEdit() { this.isEditingDescription = !this.isEditingDescription;; }

  saveChannelDescription() {
    if (this.newChannelDescription.trim()) {
      // Update the channel description in Firestore
      const channelDocRef = doc(this.firestore, 'channels', this.channel.id);
      updateDoc(channelDocRef, { channelDescription: this.newChannelDescription })
        .then(() => {
          console.log('Channel description updated successfully');
          this.channel.channelDescription = this.newChannelDescription
        })
        .catch((error) => {
          console.error('Error updating channel description: ', error);
        });
    }
    this.isEditingDescription = false; // Exit edit mode
  }
}

