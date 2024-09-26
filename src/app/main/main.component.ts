import { Component } from '@angular/core';
import { ChannelComponent } from './channel/channel.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';
import { ThreadComponent } from './thread/thread.component';
import { RouterOutlet } from '@angular/router';
import { ChatComponent } from "./chat/chat.component";

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [MenuComponent, ChannelComponent, HeaderComponent, ThreadComponent, RouterOutlet, ChatComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {



}
