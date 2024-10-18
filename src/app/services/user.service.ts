import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.class';
import { doc, Firestore, getDoc, updateDoc } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);  // Benutzer als Observable
  currentUser$ = this.currentUserSubject.asObservable();  // Observable, auf das andere Komponenten zugreifen können
  userData: User[] = [];
  constructor(private firestore: Firestore) { }

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
      
      // Use the toJson method to get the updated data
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
}
