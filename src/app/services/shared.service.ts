import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { DialogEditChannelComponent } from '../main/channel/dialog-edit-channel/dialog-edit-channel.component';
import { Channel } from '../models/channel.class';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  // Observable für den Suchbegriff
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  constructor(public dialog: MatDialog){}
  // Aktuellen Suchbegriff verwenden -> wird in der header component bei input angewendet
  updateSearchTerm(term: string) {
    this.searchTermSubject.next(term);
  }

  openDialogEditChannel(channel: any) {
    if (channel) {
      this.dialog.open(DialogEditChannelComponent, { data: channel });
    } else {
      console.error('No channel selected.');
    }
  }


}
