import { Component } from '@angular/core';
import { ChannelComponent } from './channel/channel.component';
import { HeaderComponent } from './header/header.component';
import { MenuComponent } from './menu/menu.component';

import { RouterOutlet } from '@angular/router';
import { ChatComponent } from "./chat/chat.component";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { DialogUserProfilComponent } from './dialog-user-profil/dialog-user-profil.component';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, MenuComponent, ChannelComponent, HeaderComponent, RouterOutlet, ChatComponent, MatDialogModule, DialogUserProfilComponent],

  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {

  constructor(private dialog:MatDialog, public chatService: ChatService){}

}
