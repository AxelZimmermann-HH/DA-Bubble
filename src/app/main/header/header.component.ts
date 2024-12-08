import { Component, OnInit, HostListener } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { DialogLogoutComponent } from './dialog-logout/dialog-logout.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.class';
import { collection, doc, Firestore, getDoc, onSnapshot } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  isMobile = false;
  currentUser: User | null = null;
  userData: any = [];
  userId!: string;

  constructor(
    public dialog: MatDialog, 
    public sharedService: SharedService, 
    public chatService: ChatService,
    public userService: UserService, 
    public firestore: Firestore, 
    public route: ActivatedRoute,
    private cdr: ChangeDetectorRef) { }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = window.innerWidth <= 600;
  }

  ngOnInit() {
    this.isMobile = window.innerWidth <= 600;
    const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.cdr.detectChanges(); 
      }
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.getUserById(this.userId);
    });

    this.getAllUsers(); 
  }

  getAllUsers() {
    const userCollection = collection(this.firestore, 'users');
    onSnapshot(userCollection, (snapshot) => {
      this.userData = [];
      snapshot.forEach((doc) => {
        let user = new User({ ...doc.data(), id: doc.id });
        this.userData.push(user);
      });
    });
  }

  getUserById(userId: string) {
    const userCollection = collection(this.firestore, 'users');
    const userDoc = doc(userCollection, userId);
    getDoc(userDoc).then((doc) => {
      if (doc.exists()) {
        this.currentUser = new User({ ...doc.data(), userId: doc.id });
      } else {
        console.log('Keine Benutzerdaten gefunden');
      }
    }).catch(error => {
      console.error('Fehler beim Abrufen des Benutzers:', error);
    });
  }

  onSearchInput(event: any) {
    const searchTerm = event.target.value;

    if (searchTerm.length >= 3) {
      this.sharedService.updateSearchTerm(searchTerm);
    } else {
      this.sharedService.updateSearchTerm('');
    }
  }

  openDialogLogout() {    
    this.dialog.open(DialogLogoutComponent, {
      data: { user: this.currentUser }
    })
  }

  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png'; 
      } else {
        return user.avatar;  
      }
    }
    return './assets/avatars/avatar_0.png'; 
  }

  hideChatChannel(){
    this.chatService.showChannel = false;
    this.chatService.showChat = false;
    this.chatService.showMenu = true;
    this.sharedService.goBackHeader = false;
  }

  getAvatarSrc(): string {
    if (!this.currentUser) {
      return './assets/avatars/avatar_1.png'; 
    }
  
    const avatar = this.currentUser.avatar.toString();
  
    return this.userService.isNumber(this.currentUser.avatar)
      ? `./assets/avatars/avatar_${avatar}.png`
      : avatar;
  }
}
