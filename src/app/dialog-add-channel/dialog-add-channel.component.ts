import { Component, EventEmitter, Inject, Output } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { addDoc, collection, doc, Firestore, getDocs, onSnapshot, query, setDoc, where } from '@angular/fire/firestore';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Channel } from '../models/channel.class';
import { User } from '../models/user.class';
import { ChannelService } from '../services/channel.service';
import { ChatService } from '../services/chat.service';
import { CommonModule } from '@angular/common';
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';



@Component({
  selector: 'app-dialog-add-channel',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule],
  templateUrl: './dialog-add-channel.component.html',
  styleUrl: './dialog-add-channel.component.scss'
})

export class DialogAddChannelComponent {

  constructor(
    public dialogRef: MatDialogRef<DialogAddChannelComponent>,
    public dialog: MatDialog, public firestore: Firestore,
    @Inject(MAT_DIALOG_DATA) public data: { userId: string },
    public channelService: ChannelService,
    public chatService: ChatService) { }

  closeButtonIcon = 'close.png'

  channelName = new FormControl('', [Validators.required, Validators.minLength(2)]);
  channelDescription = new FormControl('', [Validators.required, Validators.minLength(2)]);

  channel: Channel = new Channel();
  channelData: any;

  creatorName!: string;
  userData: any = [];

  channelExists: boolean = false;

  @Output() channelCreated = new EventEmitter<any>();

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

  async createNewChannel() {
    const enteredName = this.channelName.value?.trim();
    if (!enteredName || await this.checkChannelExists(enteredName)) return;


    this.setChannelData(enteredName);
    await this.saveNewChannel(this.channel.toJson());
    this.channelCreated.emit(this.channel);
    this.resetAndCloseDialog();
    this.dialog.open(DialogAddUserComponent, { data: { channel: this.channel, source: 'createNewChannel' } });
  }

  setChannelData(channelName: string) {
    this.channel.channelName = channelName;
    this.channel.channelDescription = this.channelDescription.value!;
    this.channel.tagIcon = 'tag.png';
    this.channel.creatorName = this.creatorName;
  }

  resetAndCloseDialog() {
    this.channelName.setValue('');
    this.channelDescription.setValue('');
    this.dialogRef.close();
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

  async checkChannelExists(channelName: string) {
    const channelsCollection = collection(this.firestore, 'channels');
    const q = query(channelsCollection, where('channelName', '==', channelName));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;

  }

  async validateChannelName() {
    const enteredName = this.channelName.value?.trim();
    if (!enteredName) {
      this.channelExists = false;
      return;
    }
    this.channelExists = await this.checkChannelExists(enteredName);
  }
}