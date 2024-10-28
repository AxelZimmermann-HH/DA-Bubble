import { Injectable } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../models/message.class';

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

    private filteredMessagesSubject = new BehaviorSubject<Message[]>([]);
    filteredMessages$ = this.filteredMessagesSubject.asObservable();

    private searchTermSubject = new BehaviorSubject<string>('');
    searchTerm$ = this.searchTermSubject.asObservable();

    constructor() { }

    showAutocompleteList() {
        this.showAutocompleteSubject.next(true);
    }

    hideAutocompleteList() {
        this.showAutocompleteSubject.next(false);
    }


    filterByType(searchTerm: string, users: User[], channels: Channel[], messages: Message[]) {
        const query = searchTerm.toLowerCase();
    
        if (searchTerm.startsWith('@')) {
            const filteredUsers = users.filter(user =>
                user.name.toLowerCase().includes(query.slice(1)) 
            );
            this.filteredUsersSubject.next(filteredUsers);
        } else if (searchTerm.startsWith('#')) {
            const filteredChannels = channels.filter(channel =>
                channel.channelName.toLowerCase().includes(query.slice(1))
            );
            this.filteredChannelsSubject.next(filteredChannels);
        } else {
            
            const filteredEmails = users.filter(user =>
                user.mail.toLowerCase().includes(query) 
            );
            this.filteredUsersSubject.next(filteredEmails);
    
            const filteredMessages = messages.filter(message =>
                message.text.toLowerCase().includes(query)
            );
            this.filteredMessagesSubject.next(filteredMessages);
        }
    
    }
    

    updateSearchTerm(term: string) {
        this.searchTermSubject.next(term);
    }


    clearFilters() {
        this.filteredUsersSubject.next([]);
        this.filteredChannelsSubject.next([]);
        this.filteredMessagesSubject.next([]);
        this.hideAutocompleteList();
    }
}
