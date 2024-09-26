import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { DialogAddChannelComponent } from '../../dialog-add-channel/dialog-add-channel.component';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(public db: Firestore, public dialog: MatDialog, private sharedService: SharedService){}
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

  @Output() channelSelected = new EventEmitter<any>();

  async ngOnInit(){
    await this.getAllChannels('channels');
    await this.getAllUsers('users');
   
    this.subscribeToSearch();
    
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

  async getAllChannels(channels: string) {
    try {
      const channelsCollectionRef = collection(this.db, channels);
      this.getChannelDataOnSnapshot(channelsCollectionRef);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
    }
  }
  
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

  async getAllUsers(users: string) {
    try {
      const usersCollectionRef = collection(this.db, users);
      this.getUsersDataOnSnapshot(usersCollectionRef);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Daten:', error);
    }
  }
  
  getUsersDataOnSnapshot(usersCollectionRef: any) {
    onSnapshot(
      usersCollectionRef,
      (snapshot: { docs: any[] }) => {
        this.userData = [];
        this.userData = snapshot.docs.map((doc) => {
          const user = doc.data();
      
          return {
            userID: doc.id,
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
  }

  setHoverIcon(){
    if(this.showMenu){
      this.openCloseIcon ='Frame 18.png'
    }else{
      this.openCloseIcon ='Frame 41.png'
    }
  }

  setUnhoverIcon(){
    if(this.showMenu){
      this.openCloseIcon ='Hide-navigation.png'
    }else{
      this.openCloseIcon ='Hide-navigation-1.png'
    }
  }

  openDialogAddChannel() {
    this.dialog.open(DialogAddChannelComponent)
  }




  //edit
  onChannelClick(channel: any) {
    this.channelSelected.emit(channel);  // Leitet das ausgewählte Kanal-Objekt weiter
    console.log('channel name', channel.channelName )
  }

  trackByChannelId(index: number, channel: any): string {
    return channel.id;  // Optimiert die Performance von *ngFor
  }
}
