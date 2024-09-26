import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { User } from '../models/user.class';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  userData: any = [];
  user = new User();
  userCount: number = 0;

  constructor(public firestore: Firestore) {
    this.getAllUsers();
  }

  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    const readUsers = onSnapshot(userCollection, (snapshot) => {
      this.userData = [];
      snapshot.forEach((doc) => {
        let user = new User({ ...doc.data(), id: doc.id });
        this.userData.push(user);
      });
      this.userCount = this.userData.length;
      console.log('current users', this.userData);
    });
  }

  onSubmit(ngForm: NgForm) {
    const enteredMail = ngForm.value.mailInput;
    
    const userExists = this.userData.some((user: User) => user.mail === enteredMail);
    
    
    if (userExists) {
      console.log('Login successful for:', enteredMail);
      // Hier könntest du weitere Logik einfügen, z.B. Navigation oder Session-Management
    } else {
      console.log('E-Mail nicht gefunden');
    }
  }

}
