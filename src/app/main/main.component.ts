import { Component } from '@angular/core';
import { ChannelComponent } from './channel/channel.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { ThreadComponent } from './thread/thread.component';
import { MatDialogModule } from '@angular/material/dialog';
import { ChatComponent } from "./chat/chat.component";

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [MenuComponent, ChannelComponent, HeaderComponent, ThreadComponent, MatDialogModule, ChatComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  selectedChannelId: string | null = null;

  onChannelSelected(channel: any) {
    this.selectedChannelId = channel.id;
  }

}
