import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { addDoc, collection, doc, Firestore, onSnapshot, setDoc } from '@angular/fire/firestore';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import { ChannelService } from '../services/channel.service';



@Component({
  selector: 'app-dialog-add-channel',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './dialog-add-channel.component.html',
  styleUrl: './dialog-add-channel.component.scss'
})

export class DialogAddChannelComponent {

  constructor(public dialogRef: MatDialogRef<DialogAddChannelComponent>,
    public dialog: MatDialog, public firestore: Firestore,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string },
    public channelService: ChannelService) { }
  closeButtonIcon = 'close.png'

  channelName = new FormControl('', [Validators.required, Validators.minLength(2)]);
  channelDescription = new FormControl('', [Validators.required, Validators.minLength(2)]);

  channel: Channel = new Channel();
  channelData: any;

  creatorName!: string;
  userData: any = [];



  ngOnInit() {
    this.getAllUsers().then(() => {
      this.creatorName = this.findUserNameById(this.data.userId);
    });
  }

  findUserNameById(userId: string) {
    const user = this.userData.find((user: User) => user.userId === userId);
    return user ? user.name : undefined;
  }

  getAllUsers(): Promise<void> {
    return new Promise((resolve) => {
      const userCollection = collection(this.firestore, 'users');
      onSnapshot(userCollection, (snapshot) => {
        this.userData = [];
        snapshot.forEach((doc) => {
          let user = new User({ ...doc.data(), id: doc.id });
          this.userData.push(user);
        });
        this.creatorName = this.findUserNameById(this.data.userId);
        resolve();
      });
    });
  }

  createNewChannel() {
    this.channel.channelName = this.channelName.value!;
    this.channel.channelDescription = this.channelDescription.value!;
    this.channel.tagIcon = 'tag.png';
    this.channel.creatorName = this.creatorName;  // Setze den Ersteller des Channels

    const channelData = this.channel.toJson();

    this.saveNewChannel(channelData).then((result: any) => {
      this.channelName.setValue('');
      this.channelDescription.setValue('');
      this.dialogRef.close();
      this.dialog.open(DialogAddUserComponent, { data: { channel: this.channel, source: 'createNewChannel' } })
      this.channelService.selectedChannel = this.channel;

   
    });
  }

  async saveNewChannel(channelData: any) {
    try {
      const docRef = await addDoc(collection(this.firestore, 'channels'), channelData);
      await this.setChannelId(docRef.id, channelData)
    } catch (error: any) {
      console.error('Fehler beim erstellen des Channels:', error);
    }
  }

  async setChannelId(id: string, channelData: any) {
    this.channel.id = id;
    channelData = this.channel.toJson();
    await setDoc(doc(this.firestore, "channels", id), channelData)
  }
}
