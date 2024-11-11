import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.class';
import { doc, Firestore, getDoc, updateDoc, collection, getDocs, onSnapshot } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { DialogUserProfilComponent } from '../main/dialog-user-profil/dialog-user-profil.component';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  userData: User[] = [];
  user = new User();
  userId!: string;

  constructor(private firestore: Firestore,
    public dialog: MatDialog,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      if (this.userId) {
        console.log('Initialized userId:', this.userId);
        this.loadUsers().then(() => {
          this.loadCurrentUser(this.userId);
        });
      } else {
        console.error('userId is not defined in route params');
      }
    });
  }

  async loadUsers2(): Promise<void> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersRef);
      this.userData = snapshot.docs.map(doc => new User(doc.data()));
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    }
  }

  async loadUsers(): Promise<void> {
    try {
      const usersRef = collection(this.firestore, 'users');
      const snapshot = await getDocs(usersRef);
      this.userData = snapshot.docs.map(doc => {
        const data = doc.data();
        return new User({
          name: data["name"],
          userId: doc.id,
          avatar: data["avatar"] || '',
          mail: data["mail"] || '',
          online: data["online"] || false,
          password: data["password"] || ''
        });
      });
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    }
  }

  getAllUsers(): Promise<void> {
    return new Promise((resolve) => {
      const userCollection = collection(this.firestore, 'users');
      onSnapshot(userCollection, (snapshot) => {
        this.userData = [];
        snapshot.forEach((doc) => {
          let user = new User({ ...doc.data(), id: doc.id });
          this.userData.push(user);
        });
        resolve();
      });
    });
  }

  getAvatarForUser(userName: string) {
    if (!this.userData || this.userData.length === 0) {
    
      return './assets/avatars/avatar_1.png';
    }

    const user = this.userData.find((u) => u.name === userName);
    if (user) {
      return this.isNumber(user.avatar)
        ? `./assets/avatars/avatar_${user.avatar}.png`
        : user.avatar;
    }
    return './assets/avatars/avatar_1.png';
  }

  setUser(user: User) {
    this.currentUserSubject.next(user);
  }

  getUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }

  loadCurrentUser(userId: string) {
    const userRef = doc(this.firestore, `users/${userId}`);
    getDoc(userRef).then(docSnap => {
      if (docSnap.exists()) {
        const user = new User(docSnap.data());
        this.setUser(user);
        console.log('Current user loaded:', user);
      } else {
        console.error('No such user!');
      }
    }).catch(error => {
      console.error('Error fetching user:', error);
    });
  }

  updateUser(updatedUser: User): void {
    const currentUser = this.getUser();
    if (currentUser) {
      const userRef = doc(this.firestore, `users/${currentUser.userId}`);

      updateDoc(userRef, updatedUser.toJson())
        .then(() => {

          const updatedUserInstance = new User({
            ...currentUser,
            ...updatedUser
          });
          this.setUser(updatedUserInstance);
          console.log('User profile updated in Firestore:', updatedUser);
        })
        .catch((error) => {
          console.error('Error updating user profile:', error);
        });
    } else {
      console.error('No current user to update');
    }
  }

  findUserNameById(userId: string): string {
    const user = this.userData.find((user: User) => user.userId === userId);
    return user ? user.name : 'Unbekannt';
  }

  isCurrentUser(currentUser: string, userid:string): boolean {
    const user = this.userData.find((u) => u.userId === userid);
    return user ? user.name === currentUser : false;
  }

  getUserIdByname(userName: string): string | undefined {

    const nameParts = userName.trim().split(' ');
  

    const user = this.userData.find((user: User) => {
        const userParts = user.name.toLowerCase().split(' ');

        return nameParts.every(part => userParts.some(userPart => userPart.toLowerCase().includes(part.toLowerCase())));
    });
    
    return user ? user.userId : undefined;
}


  findUserByName(userName: string): User | undefined {
    return this.userData.find(user => user.name === userName);
  }

  openUserProfil(member: any) {
    this.dialog.open(DialogUserProfilComponent, {
      data: { user: member, isEditable: false } // Not editable from "Add Channel User"
    });
    console.log('add channel user ', member.name);
  }

  
}

