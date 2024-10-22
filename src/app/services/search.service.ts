import { Injectable } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})

export class SearchService {

    private filteredUsersSubject = new BehaviorSubject<User[]>([]);
    filteredUsers$ = this.filteredUsersSubject.asObservable();

    private filteredChannelsSubject = new BehaviorSubject<Channel[]>([]);
    filteredChannels$ = this.filteredChannelsSubject.asObservable();

    private showAutocompleteSubject = new BehaviorSubject<boolean>(false);
    showAutocomplete$ = this.showAutocompleteSubject.asObservable();

    constructor() { }

    showAutocompleteList() {
        this.showAutocompleteSubject.next(true);
    }

    hideAutocompleteList() {
        this.showAutocompleteSubject.next(false);
    }

    filterChannels(channels: Channel[], searchTerm: string) {
        const filteredChannels = channels.filter(channel =>
            channel.channelName.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.filteredChannelsSubject.next(filteredChannels);
    }

    filterUsers(users: User[], searchTerm: string) {
        const filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) // Filtere nach Benutzernamen
        );
        this.filteredUsersSubject.next(filteredUsers);
    }

    filterEmails(users: User[], searchTerm: string) {
        const filteredUsers = users.filter(user =>
            user.mail.toLowerCase().includes(searchTerm.toLowerCase()) // Filtere E-Mails
        );
        this.filteredUsersSubject.next(filteredUsers); // Gefilterte Benutzer aktualisieren
    }

    clearFilters() {
        this.filteredUsersSubject.next([]);
        this.filteredChannelsSubject.next([]);
        this.hideAutocompleteList();
    }
}
