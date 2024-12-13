import { Injectable, Input } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { Message } from '../models/message.class';
import { collection, doc, Firestore, getDoc, getDocs, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { SearchService } from './search.service';
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import { UserService } from './user.service';
import { SharedService } from './shared.service';
import { AddChannelUserComponent } from '../main/channel/add-channel-user/add-channel-user.component';

@Injectable({
    providedIn: 'root'
})
export class ChannelService {

    selectedChannel: Channel | any;
    userData: User[] = [];
    userId!: string;
    channelMembers: any = [];
    message = new Message();
    channel = new Channel();
    channelData: Channel[] = [];
    filteredChannels: Channel[] = [];
    enableScroll: boolean = true;

    @Input() selectedChannelId: string | null = null;

    constructor(public firestore: Firestore,
        public dialog: MatDialog,
        public searchService: SearchService,
        public userService: UserService,
        public sharedService: SharedService,

    ) { }

    async loadChannel(id: string): Promise<void> {
        const channelDocRef = doc(this.firestore, `channels/${id}`);
        try {
            const docSnapshot = await getDoc(channelDocRef); // Verwende getDoc für synchrone Datenabfrage
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                this.selectedChannel = new Channel({ ...data, id });
                console.log('Channel geladen:', this.selectedChannel); // Debugging-Ausgabe
            } else {
                console.log('Channel nicht gefunden');
                this.selectedChannel = null;
            }
        } catch (error) {
            console.error('Fehler beim Laden des Channels:', error);
            this.selectedChannel = null;
        }
    }
    updateMembers(): void {
        if (this.selectedChannel && this.selectedChannel.members) {
            const updatedMembers = this.selectedChannel.members.map((member:any) => {
                const user = this.userService.userData.find(
                    (user) => user.userId === member.userId
                );
                if (user) {
                    const updatedUser = new User(user);
                    return updatedUser;
                }
                return member;
            });
            this.selectedChannel.members = updatedMembers;
        }
    }

    async updateChannelMembers() {
        if (this.selectedChannel && this.userData?.length > 0) {
            const currentMemberIds = this.selectedChannel.members.map((member: any) => member.userId);
            const updatedMembers = this.selectedChannel.members.filter((member: any) =>
                this.userData.some((user: User) => user.userId === member.userId)
            );
            if (updatedMembers.length !== currentMemberIds.length) {
                try {
                    const channelRef = doc(this.firestore, 'channels', this.selectedChannelId!);
                    await updateDoc(channelRef, { members: updatedMembers });
                    this.selectedChannel.members = updatedMembers;
                } catch (error) {
                    console.error('Error updating channel members:', error);
                }
            }
        }
    }
    // async updateChannelMembers2(channelId: string, updatedMembers: User[]): Promise<void> {
    //     try {
    //       const channelRef = doc(this.firestore, 'channels', channelId);

    //       // Wandeln Sie die Mitglieder in ein Array von JSON-Objekten um
    //       const membersJson = updatedMembers.map(user => user.toJson());

    //       // Aktualisiere die Mitglieder im Channel-Dokument
    //       await updateDoc(channelRef, {
    //         members: membersJson
    //       });

    //       console.log('Mitglieder erfolgreich aktualisiert!');
    //     } catch (error) {
    //       console.error('Fehler beim Aktualisieren der Mitglieder:', error);
    //     }
    //   }
    getAllChannels() {
        const channelCollection = collection(this.firestore, 'channels');
        onSnapshot(channelCollection, (snapshot) => {
            this.channelData = [];
            snapshot.forEach((doc) => {
                let channel = new Channel({ ...doc.data(), id: doc.id });
                this.channelData.push(channel);
            });
        });
    }

    getChannelIdByName(channelName: string): string | null {
        this.searchService.filteredChannels$.subscribe(channels => {
            this.filteredChannels = channels;
        });
        const channel = this.filteredChannels.find(channel => channel.channelName === channelName);
        return channel ? channel.id : null;
    }

    openUsersList(channelId: string) {
        this.updateChannelMembers();
        this.dialog.open(AddChannelUserComponent, {
            data: {
                channelId: channelId,
                channel: this.selectedChannel
            }
        });
    }

    openDialogAddUser() {
        if (this.sharedService.isMobile) {
            this.openUsersList(this.selectedChannel.id)
        }
        else {
            this.dialog.open(DialogAddUserComponent, {
                data: { channel: this.selectedChannel, source: 'channelComponent' }
            });
        }
    }

    getChannelMembers(channelId: string) {
        const channelRef = doc(this.firestore, 'channels', channelId);
        onSnapshot(channelRef, (doc) => {
            if (doc.exists()) {
                this.channel.members = doc.data()?.['members'] || [];
                console.log('Aktualisierte Mitglied Liste', this.channel.members);
                this.updateChannelMembers();
            }
            else {
                console.log('channel-Dokument existiert nicht ');
            }
        })
    }

    async checkChannelExists(channelName: string) {
        const channelsCollection = collection(this.firestore, 'channels');
        const q = query(channelsCollection, where('channelName', '==', channelName));
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    }
}
