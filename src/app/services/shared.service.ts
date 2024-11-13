import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { DialogEditChannelComponent } from '../main/channel/dialog-edit-channel/dialog-edit-channel.component';
import { Channel } from '../models/channel.class';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  //Variablen für Mobile Ansicht, word in der app.component gecheckt
  isMobile:boolean = false;
  goBackHeader:boolean = false;

  // Observable für den Suchbegriff
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  // Observable für den Zustand des Logout-Containers
  private logoutContainerActiveSubject = new BehaviorSubject<boolean>(false);
  logoutContainerActive$ = this.logoutContainerActiveSubject.asObservable();

  constructor(public dialog: MatDialog){}
  // Aktuellen Suchbegriff verwenden -> wird in der header component bei input angewendet
  updateSearchTerm(term: string) {
    this.searchTermSubject.next(term);
  }

 

  // Methode zum Umschalten des Logout-Container-Zustands
  toggleLogoutContainer() {
    const currentStatus = this.logoutContainerActiveSubject.value;
    this.logoutContainerActiveSubject.next(!currentStatus);
  }

  // Methode zum Setzen des Logout-Container-Zustands
  setLogoutContainerActive(isActive: boolean) {
    this.logoutContainerActiveSubject.next(isActive);
  }


}
