import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  // Observable für den Suchbegriff
  private searchTermSubject = new BehaviorSubject<string>('');
  searchTerm$ = this.searchTermSubject.asObservable();

  // Aktuellen Suchbegriff verwenden -> wird in der header component bei input angewendet
  updateSearchTerm(term: string) {
    this.searchTermSubject.next(term);
  }
}
