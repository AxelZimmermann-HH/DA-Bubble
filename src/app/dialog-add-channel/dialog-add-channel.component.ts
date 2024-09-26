import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { addDoc, collection, doc, Firestore, setDoc } from '@angular/fire/firestore';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Channel } from '../models/channel.class';

@Component({
  selector: 'app-dialog-add-channel',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule],
  templateUrl: './dialog-add-channel.component.html',
  styleUrl: './dialog-add-channel.component.scss'
})

export class DialogAddChannelComponent {

  constructor(public dialogRef: MatDialogRef<DialogAddChannelComponent>, public firestore: Firestore){}
  closeButtonIcon = 'close.png'

  channelName = new FormControl('', [Validators.required, Validators.minLength(2)]);
  channelDescription = new FormControl('', [Validators.required, Validators.minLength(2)]);

  channel: Channel= new Channel();
  channelData:any;

  createNewChannel(){
    this.channel.channelName = this.channelName.value!;
    this.channel.channelDescription  = this.channelDescription.value!;
    this.channel.tagIcon = 'tag.png';
    
    const channelData = this.channel.toJson();

    this.saveNewChannel(channelData).then((result: any) => {
      this.channelName.setValue('');
      this.channelDescription.setValue('');
      this.dialogRef.close();
    });
  }

  async saveNewChannel(channelData:any){
    try {
      const docRef = await addDoc(collection(this.firestore, 'channels'), channelData);
      await this.setChannelId(docRef.id, channelData)
    }catch (error: any) {
      console.error('Fehler beim erstellen des Channels:', error);
    }
  }

  async setChannelId(id:string, channelData:any){
    this.channel.id = id;
    channelData = this.channel.toJson();
    await setDoc(doc(this.firestore, "channels", id), channelData)
  }
}
