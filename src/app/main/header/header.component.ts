import { Component } from '@angular/core';
import { SharedService } from '../../services/shared.service'; // Pfad zum Service anpassen

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private sharedService: SharedService) {}

  onSearchInput(event: any) {
    const searchTerm = event.target.value;
  
    if (searchTerm.length >= 3) {
      this.sharedService.updateSearchTerm(searchTerm);
    } else {
      this.sharedService.updateSearchTerm('');
    }
  }
}
