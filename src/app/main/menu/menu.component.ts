import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { collection, doc, documentId, Firestore, getDocs, onSnapshot, query, setDoc, where } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../../dialog-add-channel/dialog-add-channel.component';
import { SharedService } from '../../services/shared.service';
import { ChatService } from '../../services/chat.service';
import { UserService } from '../../services/user.service';  
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(public firestore: Firestore, public route: ActivatedRoute,public dialog: MatDialog, private sharedService: SharedService, public chatService: ChatService, public userService: UserService){}

  newDmIcon = 'edit_square.png'
  channelIcon1:string = 'arrow_drop_down.png';
  channelIcon2:string = 'workspaces.png';
  addChannelIcon = 'add_circle.png';
  addChannelIcon1 = 'add-1.png';

  dmIcon1 ='arrow_drop_down.png'; 
  dmIcon2 = 'account_circle.png';

  openCloseIcon = "Hide-navigation.png";
  showMenu: boolean = true;
  openCloseButtonText = 'Workspace-Menü schließen';


  userData:any[] = [];
  filteredUsers: any[] = [];
  channelData:any[] = [];
  filteredChannels: any[] = [];
  showChannel: boolean = true;
  showUser: boolean = true;
  openChatWithID:string = '';

  currentUserId:string = '';
  currentUser:any;

  userId!:string

  @Output() channelSelected = new EventEmitter<any>();
  @Output() chatSelected = new EventEmitter<void>();


  async ngOnInit(){
    await this.getAllChannels('channels');
    await this.getAllUsers('users');
    this.subscribeToSearch();

    // Benutzer abonnieren und in currentUser speichern
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        //console.log('Angemeldeter Benutzer:', user);
        this.currentUserId = user.userId;
      }
    });

    this.route.params.subscribe(params => {
      this.userId = params['userId'];
    });
    
  }

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
            tagIcon: channel['tagIcon'],
          };
          
        });
        // Standardmäßig:
        this.filteredChannels = this.channelData;
        if (this.filteredChannels.length > 0) {
          this.onChannelClick(this.filteredChannels[0]); // Erster Kanal wird ausgewählt
        } else {
          console.warn('Keine Kanäle verfügbar');
          // Hier könntest du z.B. einen Platzhalter anzeigen oder eine Meldung, dass keine Kanäle verfügbar sind
        }
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
      },
      (error) => {
        console.error('Fehler beim laden der User-Daten:', error);
      }
    );
  }


  //öffnet und schließt die Untermenüs im Menü-Panel
  openCloseDiv(div: string){
    if(div == 'showChannel'){
      if(this.showChannel == true){
        this.showChannel = false
      }else{
        this.showChannel = true;
      }
    }
    if(div == 'showUser'){
      if(this.showUser == true){
        this.showUser = false
      }else{
        this.showUser = true;
      }
    }
  }


  //öffnet und schließt das Menü-Panel
  openCloseMenu(){
    if(this.showMenu){
      this.showMenu = false;
      this.openCloseButtonText = 'Workspace-Menü öffnen';
      this.openCloseIcon ='Hide-navigation-1.png'
    }else{
      this.showMenu = true;
      this.openCloseButtonText = 'Workspace-Menü schließen';
      this.openCloseIcon = 'Hide-navigation.png'
    }
  };


  //tauscht das Icon beim hovern
  setHoverIcon(){
    if(this.showMenu){
      this.openCloseIcon ='Frame 18.png'
    }else{
      this.openCloseIcon ='Frame 41.png'
    }
  };


  //tauscht das Icon beim hovern
  setUnhoverIcon(){
    if(this.showMenu){
      this.openCloseIcon ='Hide-navigation.png'
    }else{
      this.openCloseIcon ='Hide-navigation-1.png'
    }
  };


  //öffnet den Channel hinzufügen Dialog
  openDialogAddChannel() {
    this.dialog.open(DialogAddChannelComponent, {data:{userId:this.userId}})
  }


  //edit
  onChannelClick(channel: any) {
    this.channelSelected.emit(channel);  // Leitet das ausgewählte Kanal-Objekt weiter
    //console.log('channel name', channel.channelName )
  }
 

  trackByChannelId(index: number, channel: any): string {
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
  
  //öffnet den PvP Chat
  //async openDirectMessage(currentUserId:string, userId:string){
  //  
  //  this.chatService.chatIsEmpty = true;
  //  this.chatService.chatMessages = []
  //  const chatId = await this.createChatID(currentUserId, userId);
  //  const checkIfChatExists = query(collection(this.firestore, "chats"), where(documentId(), "==", chatId));
  //  const querySnapshot = await getDocs(checkIfChatExists);
  //  
  //  if (querySnapshot.empty) {
//
  //    //legt neuen Chat an, wenn kein Chat existiert
  //    await this.createNewChat(chatId, currentUserId, userId);
  //    this.chatService.chatId = chatId;
  //    console.log('chat nicht gefunden');
//
  //  } else {
//
  //    //öffnet den vorhanden Chat
  //    querySnapshot.forEach((doc) => {
  //      this.chatService.getChatData(chatId);
  //      console.log('chat gefunden:', doc.id, '=>', doc.data());
  //    });
//
  //  }
  //  this.chatService.getUserData(userId);
  //};
//
//
  ////erstellt eine Chat-ID aus den Nutzer ID's
  //async createChatID(myUserId:string, userId:string){
  //  return [myUserId, userId].sort().join('_');
  //};
//
//
  ////erstellt einen neuen Chat
  //async createNewChat(chatId: string, myUserId: string, userId:string){
//
  //  const collectionRef = "chats"; 
  //  try {
  //    const docRef = doc(this.firestore, collectionRef, chatId);
  //    await setDoc(docRef, {
  //      users: [myUserId, userId]
  //    });
  //    console.log("Chat erfolgreich hinzugefügt mit der ID:", chatId);
  //  } catch (error) {
  //    console.error("Fehler beim Hinzufügen des Chats: ", error);
  //  };
  //};
};//
