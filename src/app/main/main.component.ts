import { Component } from '@angular/core';
import { ChannelComponent } from './channel/channel.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { ThreadComponent } from './thread/thread.component';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from "./chat/chat.component";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { DialogUserProfilComponent } from './dialog-user-profil/dialog-user-profil.component';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, MenuComponent, ChannelComponent, HeaderComponent, ThreadComponent, RouterOutlet, ChatComponent, MatDialogModule, DialogUserProfilComponent],

  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  selectedChannelId: string | null = null;
  showChannel = true;
  showChat = true;

 constructor(private dialog:MatDialog){}

  onChannelSelected(channel: any) {
    this.selectedChannelId = channel.id;
    this.showChannel = true;
    this.showChat = false;
  }

  onChatSelected() {
    console.log('Chat selected in MainComponent');
    this.showChannel = false;
    this.showChat = true;
  }

  onChatEvent() {
    this.showChannel = false; // Hide channel when chat is selected
    this.showChat = true; // Show chat
  }
}
