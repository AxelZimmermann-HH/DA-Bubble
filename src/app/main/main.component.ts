import { Component } from '@angular/core';
import { ChannelComponent } from './channel/channel.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { ThreadComponent } from './thread/thread.component';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from "./chat/chat.component";
import { MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, MenuComponent, ChannelComponent, HeaderComponent, ThreadComponent, RouterOutlet, ChatComponent, MatDialogModule],

  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  selectedChannelId: string | null = null;
  showChannel = true;
  showChat = true;

  onChannelSelected(channel: any) {
    this.selectedChannelId = channel.id;
    this.showChannel = true;
    this.showChat = false;
  }

  onChatSelected() {
    this.showChannel = false;
    this.showChat = true;
  }
}
