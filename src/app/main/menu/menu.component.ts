import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(public db: Firestore){}
  newDmIcon = 'edit_square.png'
  channelIcon1:string = 'arrow_drop_down.png';
  channelIcon2:string = 'workspaces.png';
  addChannelIcon = 'add_circle.png';
  addChannelIcon1 = 'add-1.png';

  dmIcon1 ='arrow_drop_down.png'; 
  dmIcon2 = 'account_circle.png';

  userData:any[] = [];
  channelData:any[] = [];
  showChannel: boolean = true;
  showUser: boolean = true;


  async ngOnInit(){
    await this.getAllChannels('channels');
    await this.getAllUsers('users');
  }

  async getAllChannels(channels: string) {
    try {
      const channelsCollectionRef = collection(this.db, channels);
      this.getChannelDataOnSnapshot(channelsCollectionRef);
      console.log(this.userData)
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
            channelID: doc.id,
            channelName: channel['channelName'],
            tagIcon: channel['tagIcon'],
          };
          
        });
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
      console.log(this.userData)
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

  showMenu: boolean = true;

  openCloseMenu(){
    if(this.showMenu){
      this.showMenu = false;
    }else{
      this.showMenu = true;
    }
  }
}
