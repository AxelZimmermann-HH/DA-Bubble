import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FirstpageComponent } from './firstpage/firstpage.component';
import { ChooseAvatarComponent } from './choose-avatar/choose-avatar.component';
import { User } from '../../models/user.class';  // User-Klasse importieren


@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FirstpageComponent, ChooseAvatarComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  firstPage: boolean = true;
  avatar: boolean = false;
  createdUser!: User;
}