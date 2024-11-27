import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { collection, deleteDoc, doc, Firestore, getDoc, getDocs, query, updateDoc, where } from '@angular/fire/firestore';
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
import { ChannelService } from '../../../services/channel.service';


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
  channel!: Channel;
  userData: any = [];
  user = new User();
  currentUser: string | undefined;
  userId!: string;
  isEditing = false;
  isHovered = false;
  isEditingDescription = false;
  isHoveredDescription = false;
  newChannelName!: string;
  newChannelDescription!: string;
  errorMessage: string | null = null;
  constructor(
    public dialogRef: MatDialogRef<DialogEditChannelComponent>,
    public firestore: Firestore,
    @Inject(MAT_DIALOG_DATA) public data: { channel: Channel; userId: string },
    public sharedService: SharedService,
    public dialog: MatDialog,
    public channelService: ChannelService,
    public userService: UserService) {

    this.channel = data.channel;
    this.userId = data.userId;

    if (this.channel && this.channel.channelName) {
      this.newChannelName = this.channel.channelName;
    }
    this.channelService.getAllChannels();

  }

  ngOnInit() {
    this.currentUser = this.userService.findUserNameById(this.userId);
  }

  toggleInputName() {
    this.isEditing = true;
  }

  async editChannelName() {
    if (!this.newChannelName.trim()) return;
    if (await this.channelService.checkChannelExists(this.newChannelName.trim())) {
      this.errorMessage = 'Dieser Kanalname existiert bereits. Bitte wählen Sie einen anderen Namen.';
      return;
    }
    try {
      const channelDocRef = doc(this.firestore, 'channels', this.channel.id);
      await updateDoc(channelDocRef, { channelName: this.newChannelName.trim() });
      this.channel.channelName = this.newChannelName.trim();
      this.errorMessage = null;

    } catch (error) {
      console.error('Error updating channel name: ', error);
      this.errorMessage = 'Beim Aktualisieren des Kanalnamens ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';

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
      const channelDocRef = doc(this.firestore, 'channels', this.channel.id);
      updateDoc(channelDocRef, { channelDescription: this.newChannelDescription })
        .then(() => {
          this.channel.channelDescription = this.newChannelDescription
        })
        .catch((error) => {
          console.error('Error updating channel description: ', error);
        });
    }
    this.isEditingDescription = false;
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

  async leaveChannel(channelId: string) {
    const channelDocRef = doc(this.firestore, `channels/${channelId}`);
    try {
      const channelSnapshot = await getDoc(channelDocRef);
      if (channelSnapshot.exists()) {
        const channelData = channelSnapshot.data();
        const updatedMembers = (channelData['members'] || []).filter(
          (member: any) => member.userId !== this.userId
        );
        await updateDoc(channelDocRef, { members: updatedMembers });
      }
    } catch (error) {
      console.error('Fehler beim Verlassen des Channels:', error);
    }
    this.dialogRef.close();
  }

  async deleteChannel(channelId: string) {
    try {
      if (this.channel.creatorName !== this.currentUser) return;
      const channelDocRef = doc(this.firestore, 'channels', channelId);
      await deleteDoc(channelDocRef);
      this.channelService.getAllChannels();
    } catch (error) {
      console.error('Fehler beim Löschen des Channels', error);
    }
    this.dialogRef.close();
  }
}


