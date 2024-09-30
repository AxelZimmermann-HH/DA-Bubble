import { Component, OnInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { DialogAddUserComponent } from '../../dialog-add-user/dialog-add-user.component';
import { DialogLogoutComponent } from './dialog-logout/dialog-logout.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user.service';  
import { User } from '../../models/user.class';  

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {

  currentUser: User | null = null;

  constructor(public dialog: MatDialog, private sharedService: SharedService, private userService: UserService) {}

  isNumber(value: any): boolean {
    return typeof value === 'string';
  }

  ngOnInit() {
    // Benutzer abonnieren und in currentUser speichern
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        console.log('Angemeldeter Benutzer:', user);
      }
    });
  }

  onSearchInput(event: any) {
    const searchTerm = event.target.value;
  
    if (searchTerm.length >= 3) {
      this.sharedService.updateSearchTerm(searchTerm);
    } else {
      this.sharedService.updateSearchTerm('');
    }
  }

  openDialogLogout() {
    this.dialog.open(DialogLogoutComponent)
  }
}


