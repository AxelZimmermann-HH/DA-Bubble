import { Component, OnInit, HostListener, EventEmitter, Output } from '@angular/core';
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
  showUsers: boolean = false;
  showChannels: boolean = false;
  userList: User[] = [];
  filteredUserList: User[] = [];
  searchTerm: string = '';
  channelData: any[] = [];
  filteredChannels: any[] = [];
  selectedChannel: any = null;

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

  async ngOnInit() {
    await this.getAllChannels('channels');

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
    this.filteredUserList = [];  
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

  handleInput(event: any) {
    const searchTerm = event.target.value;
  
    if (searchTerm.startsWith('@')) {
      const query = searchTerm.slice(1); 
      this.filterUsers(query); 
      this.toggleUserList();
    } else if (searchTerm.startsWith('#')) { 
      const query = searchTerm.slice(1);

      if (query === '') {
        // Keine Eingabe nach `#` -> Zurücksetzen auf initiale Filterung
        this.filteredChannels = this.channelData.filter(channel => {
          return channel.members.some((member: any) =>
          member.userId === this.currentUser?.userId ||
          member.name === this.currentUser ||
          channel.creatorName === this.currentUser);
        });
        console.log(this.filteredChannels);
      
      } else {
        // Dynamisches Filtern basierend auf der aktuellen Eingabe
        this.filterFurtherChannels(query);
        
      }
      this.showChannels = true;
    } else {
      this.onSearchInput(event);
    } 

    if (!searchTerm.includes('@')) {
      this.showUsers = false;
    }
    if (!searchTerm.includes('#')) {
      this.showChannels = false;
    }
  }

  toggleUserList() {
    if (this.userList.length === 0) {
      this.userService.loadUsers()
        .then(() => {
          this.userList = this.userService.userData;
          this.filteredUserList = [...this.userList];        
          this.showUsers = true; 
        })
        .catch(error => {
          console.error('Fehler beim Laden der Benutzer:', error);
        });
    } else {
      this.showUsers = true;
    }
  }

  filterUsers(searchTerm: string) {
    const searchQuery = searchTerm.toLowerCase(); 
    this.filteredUserList = this.userList.filter(user =>
      user.name.toLowerCase().includes(searchQuery)
    );
  }

  filterChannels(term: string) {
    this.filteredChannels = this.channelData.filter((channel: any) =>
      channel.channelName.toLowerCase().includes(term.toLowerCase())
    );
  }

  filterFurtherChannels(term: string) {
    const searchQuery = term.toLowerCase();
    this.filteredChannels = this.channelData.filter(channel =>
      channel.channelName.toLowerCase().includes(searchQuery)
    );
  }

  resetFilteredChannels() {
    this.filteredChannels = this.channelData;
  }

  changeToUser(user: User) {
    if (!this.currentUser?.userId) {
      console.error('Fehler: Der aktuelle Benutzer ist nicht definiert.');
      return;
    }

    this.userService.loadCurrentUser(this.currentUser.userId)

    this.showUsers = false;
    this.searchTerm = '';
    // Chat mit dem Benutzer öffnen
    const currentUserId = this.currentUser.userId; // Aktueller Benutzer
    const userId = user.userId; // Ausgewählter Benutzer

    this.chatService.openDirectMessage(currentUserId, userId)
      .then(() => {
        console.log(`Chat mit ${user.name} erfolgreich geöffnet.`);
        this.chatService.onChatSelected();
      })
      .catch(error => {
        console.error('Fehler beim Öffnen des Chats:', error);
      });
  }

  onSearchInput(event: any) {
    const searchTerm = event.target.value;

    if (searchTerm.length >= 3) {
      this.sharedService.updateSearchTerm(searchTerm);
    } else {
      this.sharedService.updateSearchTerm('');
      this.resetFilteredChannels();
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

  async getAllChannels(channels: string) {
    try {
      const channelsCollectionRef = collection(this.firestore, channels);
      this.getChannelDataOnSnapshot(channelsCollectionRef);
      console.log(this.channelData);
      
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
    }
  }


  //Channel-Daten abrufen und speichern
  getChannelDataOnSnapshot(channelsCollectionRef: any) {
    onSnapshot(
      channelsCollectionRef,
      (snapshot: { docs: any[] }) => {
        console.log('Snapshot-Daten:', snapshot.docs); // Überprüfe, ob Firestore Daten liefert

        this.channelData = [];

        this.channelData = snapshot.docs.map((doc) => {
          const channel = doc.data();
          
          return {
            id: doc.id,
            channelName: channel['channelName'],
            creatorName: channel['creatorName'],
            tagIcon: channel['tagIcon'],
            members: channel['members'] || [],
          };
        });

        this.filteredChannels = this.channelData;  
        this.filteredChannels = this.channelData.filter(channel => {
          return channel.members.some((member: any) =>
            member.userId === this.currentUser?.userId ||
            member.name === this.currentUser ||
            channel.creatorName === this.currentUser);
          }
        );
      },
      (error) => {
        console.error('Fehler beim laden der Channel-Daten:', error);
      }
    );
  }

  changeToChannel(channel: any) {
    this.showChannels = false;
    this.searchTerm = '';
    try {
      this.chatService.onChannelSelected(channel);
    } catch (error) {
      console.error('Fehler beim Öffnen des Channels:', error);
    }
  }
}