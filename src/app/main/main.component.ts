import { Component } from '@angular/core';
import { ChannelComponent } from './channel/channel.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { ThreadComponent } from './thread/thread.component';
<<<<<<< HEAD
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from "./chat/chat.component";
=======
import { MatDialogModule } from '@angular/material/dialog';
>>>>>>> a1d5f825845eacb8d3915c5f6d40a975ff70d52c

@Component({
  selector: 'app-main',
  standalone: true,
<<<<<<< HEAD
  imports: [MenuComponent, ChannelComponent, HeaderComponent, ThreadComponent, RouterOutlet, ChatComponent],
=======
  imports: [MenuComponent,ChannelComponent,HeaderComponent,ThreadComponent,MatDialogModule],
>>>>>>> a1d5f825845eacb8d3915c5f6d40a975ff70d52c
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  selectedChannelId: string | null = null;

  onChannelSelected(channel: any) {
    this.selectedChannelId = channel.id;
  }

}
