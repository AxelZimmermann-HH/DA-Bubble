import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../../dialog-add-channel/dialog-add-channel.component';
import { SharedService } from '../../services/shared.service';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';


@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(
    public firestore: Firestore,
    public route: ActivatedRoute,
    public dialog: MatDialog,
    public sharedService: SharedService,
    public chatService: ChatService,
    public userService: UserService,
    private breakpointObserver: BreakpointObserver
  ) { }

  newDmIcon = 'edit_square.png'
  channelIcon1: string = 'arrow_drop_down.png';
  channelIcon2: string = 'workspaces.png';
  addChannelIcon = 'add_circle.png';
  addChannelIcon1 = 'add-1.png';
  dmIcon1 = 'arrow_drop_down.png';
  dmIcon2 = 'account_circle.png';
  openCloseIcon = "Hide-navigation.png";
  showMenu: boolean = true;
  openCloseButtonText = 'Workspace-Menü schließen';
  userData: any[] = [];
  filteredUsers: any[] = [];
  channelData: any[] = [];
  filteredChannels: any[] = [];
  showChannel: boolean = true;
  showUser: boolean = true;
  openChatWithID: string = '';
  currentUserId: string = '';
  currentUser: any;
  userId!: string;
  selectedChannel: any = null;
  public unreadCounts = new Map<string, number>();

  @Output() channelSelected = new EventEmitter<any>();
  @Output() chatSelected = new EventEmitter<void>();

  async ngOnInit() {
    await this.getAllChannels('channels');
    await this.getAllUsers('users');
    this.subscribeToSearch();

    // Benutzer abonnieren und in currentUser speichern
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserId = user.userId;
        this.chatService.currentUserId = this.currentUserId;
        this.chatService.initializeUnreadCounts(this.currentUserId); // Verschiebe hierher
      }
    });

    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.currentUserId = this.userId;
    });
    this.userService.getAllUsers().then(() => {
      this.currentUser = this.userService.findUserNameById(this.userId);
    });
    // Abonniere die ungelesenen Zähler für alle Chats
    this.chatService.unreadCount$.subscribe((counts) => {
      this.unreadCounts = counts;
    });
  }


  createChatID(myUserId: string, userId: string) {
    return [myUserId, userId].sort().join('_');
  };


  subscribeToSearch() {
    this.sharedService.searchTerm$.subscribe((term) => {
      if (term.length >= 3) {
        this.filterData(term);
      } else {
        this.resetFilteredData(); // Setze gefilterte Daten auf Original zurück
      }
    });
  }


  filterData(term: string) {
    this.filteredChannels = this.channelData.filter((channel: any) =>
      channel.channelName.toLowerCase().includes(term.toLowerCase())
    );
    this.filteredUsers = this.userData.filter((user: any) =>
      user.name.toLowerCase().includes(term.toLowerCase())
    );
  }


  resetFilteredData() {
    this.filteredChannels = this.channelData;
    this.filteredUsers = this.userData;
  }


  //Channel-Abruf
  async getAllChannels(channels: string) {
    try {
      const channelsCollectionRef = collection(this.firestore, channels);
      this.getChannelDataOnSnapshot(channelsCollectionRef);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
    }
  }


  //Channel-Daten abrufen und speichern
  getChannelDataOnSnapshot(channelsCollectionRef: any) {
    onSnapshot(
      channelsCollectionRef,
      (snapshot: { docs: any[] }) => {
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

        Standardmäßig:
        // this.filteredChannels = this.channelData;  
        this.filteredChannels = this.channelData.filter(channel => {
          return channel.members.some((member: any) =>
            member.userId === this.currentUserId ||
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


  //User-Abfruf
  async getAllUsers(users: string) {
    try {
      const usersCollectionRef = collection(this.firestore, users);
      this.getUsersDataOnSnapshot(usersCollectionRef);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
    }
  }


  //User-Daten abspeichern
  getUsersDataOnSnapshot(usersCollectionRef: any) {
    onSnapshot(
      usersCollectionRef,
      (snapshot: { docs: any[] }) => {
        this.userData = [];
        this.userData = snapshot.docs.map((doc) => {
          const user = doc.data();

          return {
            userId: doc.id,
            name: user['name'],
            avatar: user['avatar'],
            mail: user['mail'],
            online: user['online'],
          };
        });

        this.filteredUsers = this.userData;
        this.filteredUsers.forEach(user => {
          user.chatId = this.createChatID(this.currentUserId, user.userId);
        });
      },
      (error) => {
        console.error('Fehler beim laden der User-Daten:', error);
      }
    );
  }


  //öffnet und schließt die Untermenüs im Menü-Panel
  openCloseDiv(div: string) {
    if (div == 'showChannel') {
      if (this.showChannel == true) {
        this.showChannel = false
      } else {
        this.showChannel = true;
      }
    }
    if (div == 'showUser') {
      if (this.showUser == true) {
        this.showUser = false
      } else {
        this.showUser = true;
      }
    }
  }


  //öffnet und schließt das Menü-Panel
  openCloseMenu() {
    if (this.showMenu) {
      this.showMenu = false;
      this.openCloseButtonText = 'Workspace-Menü öffnen';
      this.openCloseIcon = 'Hide-navigation-1.png'
    } else {
      this.showMenu = true;
      this.openCloseButtonText = 'Workspace-Menü schließen';
      this.openCloseIcon = 'Hide-navigation.png'
    }
  };


  //tauscht das Icon beim hovern
  setHoverIcon() {
    if (this.showMenu) {
      this.openCloseIcon = 'Frame 18.png'
    } else {
      this.openCloseIcon = 'Frame 41.png'
    }
  };


  //tauscht das Icon beim hovern
  setUnhoverIcon() {
    if (this.showMenu) {
      this.openCloseIcon = 'Hide-navigation.png'
    } else {
      this.openCloseIcon = 'Hide-navigation-1.png'
    }
  };

  //öffnet den Channel hinzufügen Dialog
  openDialogAddChannel() {
    const isMobile = this.breakpointObserver.isMatched('(max-width: 600px)');

    const dialogConfig = {
      width: isMobile ? '100vw' : '600px',
      height: isMobile ? '100vh' : 'auto',
      maxWidth: '100vw',
      panelClass: isMobile ? 'full-screen-dialog' : '', // Mobile CSS-Klasse
      data: { userId: this.userId }        // Weitergabe von Daten an den Dialog
    };
    const dialogRef = this.dialog.open(DialogAddChannelComponent, dialogConfig);
    dialogRef.componentInstance.channelCreated.subscribe((channel: any) => {
      this.onChannelClick(channel);
    });
  }

  //öffnet einen ausgewählten channel
  onChannelClick(channel: any) {
    this.selectedChannel = channel;
    this.channelSelected.emit(channel);
    this.selectedChannel.id = channel.id;
  }

  //Öffnet eine neue Nachricht
  onNewMessageClick() {
    if (this.chatService.showChat) {
      this.chatService.showChat = false;
      this.chatService.showChannel = true
      this.channelSelected.emit(null);
    }
    this.channelSelected.emit(null);
  }


  trackByChannelId(channel: any): string {
    return channel.id;  // Optimiert die Performance von *ngFor
  }


  selectChat() {
    this.chatSelected.emit();
  }


  getAvatarForUser(userName: string) {
    const user = this.userData.find((u: { name: string; }) => u.name === userName);
    if (user) {
      if (this.userService.isNumber(user.avatar)) {
        return './assets/avatars/avatar_' + user.avatar + '.png';  // Local asset avatar
      } else {
        return user.avatar;  // External URL avatar
      }
    }
    return './assets/avatars/avatar_0.png';  // Default avatar when user not found
  }
};