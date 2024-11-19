import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Channel } from '../../../models/channel.class';
import { User } from '../../../models/user.class';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { SharedService } from '../../../services/shared.service';
import { UserService } from '../../../services/user.service';
import { DialogAddUserComponent } from '../../../dialog-add-user/dialog-add-user.component';


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
  isHovered = false;
  isEditingDescription = false;
  isHoveredDescription = false;
  newChannelName!: string;
  newChannelDescription!: string;

  constructor(
    public dialogRef: MatDialogRef<DialogEditChannelComponent>,
    public firestore: Firestore, @Inject(MAT_DIALOG_DATA)
    public channel: Channel,
    public sharedService: SharedService,
    public userService: UserService,
    public dialog: MatDialog) {


    if (this.channel && this.channel.channelName) {
      this.newChannelName = this.channel.channelName;
    } else {
      console.warn('No channel data passed to the dialog.');
      this.newChannelName = ''; // or handle this scenario appropriately
    }
    this.getAllChannels();
    // this.user.name = 'Noah Braun';
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

  toggleDescriptionEdit() {
    this.isEditingDescription = !this.isEditingDescription;
    if (this.isEditingDescription) {
      this.newChannelDescription = this.channel.channelDescription; 
    }
  }

  saveChannelDescription() {
    if (this.newChannelDescription && this.newChannelDescription.trim()) {
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

  getIconSrc() {
    return this.isEditingDescription
      ? this.isHoveredDescription
        ? './assets/icons/check_circle-1.png'
        : './assets/icons/check_circle.png'
      : this.isHoveredDescription
      ? './assets/icons/edit-1.png'
      : './assets/icons/edit.png';
  }

  openDialogAddUser() {
    this.dialogRef.close()
    this.dialog.open(DialogAddUserComponent, {
      data: { channel: this.channel, source: 'channelComponent' }
    });
  }
}

