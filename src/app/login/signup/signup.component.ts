import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FirstpageComponent } from './firstpage/firstpage.component';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FirstpageComponent],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  firstPage: boolean = true;
}
