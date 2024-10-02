import { Component, Inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { User } from '../models/user.class';
import { CommonModule } from '@angular/common';
import { Channel } from '../models/channel.class';

@Component({
  selector: 'app-dialog-user-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dialog-user-profil.component.html',
  styleUrl: './dialog-user-profil.component.scss'
})
export class DialogUserProfilComponent {

  channel = new Channel();
 

  constructor(public dialogRef: MatDialogRef<DialogUserProfilComponent>, public firestore: Firestore, @Inject(MAT_DIALOG_DATA) public user: User) {
    
  }
}
