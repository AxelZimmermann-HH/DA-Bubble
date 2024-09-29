import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { collection, Firestore, onSnapshot, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { Router } from '@angular/router'; 
import { UserService } from '../services/user.service';  
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';
import { SigninComponent } from "./signin/signin.component"; 
import { SignupComponent } from './signup/signup.component';




@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, SigninComponent, SignupComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  signUp: boolean = false;

  onSignUpChange(newSignUpValue: boolean) {
    this.signUp = newSignUpValue; // aktualisiert die Variable in der Parent-Komponente
  }
}