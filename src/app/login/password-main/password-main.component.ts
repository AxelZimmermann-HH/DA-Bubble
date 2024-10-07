import { Component } from '@angular/core';
import { SendMailComponent } from './send-mail/send-mail.component';

@Component({
  selector: 'app-password-main',
  standalone: true,
  imports: [SendMailComponent],
  templateUrl: './password-main.component.html',
  styleUrl: './password-main.component.scss'
})
export class PasswordMainComponent {

}
