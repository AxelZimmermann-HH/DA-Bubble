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

    filteredChannels: Channel[] = [];
    filteredUsers: User[] = [];
    showAutocomplete: boolean = false;

    constructor() { }

    showAutocompleteList() {
        this.showAutocomplete = true;
    }

    hideAutocompleteList() {
        this.showAutocomplete = false;
    }


    filterChannels(channels: any[], searchTerm: string) {
        this.filteredChannels = channels.filter(channel =>
            channel.channelName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    filterUsers(users: any[], searchTerm: string) {
        this.filteredUsers = users.filter(user =>
            user.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    filterEmails(users: any[], searchTerm: string) {
        this.filteredUsers = users.filter(user =>
            user.mail.includes(searchTerm)
        );
    }
}
