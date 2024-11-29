import { Injectable, Input } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { Message } from '../models/message.class';
import { collection, doc, Firestore, getDocs, onSnapshot, query, updateDoc, where } from '@angular/fire/firestore';
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

    @Input() selectedChannelId: string | null = null;

    constructor(public firestore: Firestore,
        public dialog: MatDialog,
        public searchService: SearchService,
        public userService: UserService,
        public sharedService: SharedService,

    ) { }

    async loadChannel(id: string) {
        const channelDocRef = doc(this.firestore, `channels/${id}`);
        onSnapshot(channelDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                this.selectedChannel = new Channel({ ...data, id });
                this.updateChannelMembers();
            } else {
                this.selectedChannel = null;
            }
        });
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
    getChannelMembers(channelId:string) {
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
