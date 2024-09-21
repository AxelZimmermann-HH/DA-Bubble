import { Component } from '@angular/core';
import { collection, Firestore, onSnapshot } from '@angular/fire/firestore';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss'
})
export class MenuComponent {
  constructor(public db: Firestore){}

  userData:any[] = [];

  async ngOnInit(){
    await this.getAllUser('users');
  }

  async getAllUser(users: string) {
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
}
