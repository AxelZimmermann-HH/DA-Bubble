import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { User } from '../models/user.class';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);  // Benutzer als Observable
  currentUser$ = this.currentUserSubject.asObservable();  // Observable, auf das andere Komponenten zugreifen können

  constructor() { }

  setUser(user: User) {
    this.currentUserSubject.next(user);
  }

  getUser(): User | null {
    return this.currentUserSubject.getValue();
  }

  isNumber(value: any): boolean {
    return typeof value === 'number';
  }
}
