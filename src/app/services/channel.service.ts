import { Injectable, Input } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { Message } from '../models/message.class';
import { collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { DialogEditChannelComponent } from '../main/channel/dialog-edit-channel/dialog-edit-channel.component';
import { MatDialog } from '@angular/material/dialog';
import { SearchService } from './search.service';
import { DialogAddUserComponent } from '../dialog-add-user/dialog-add-user.component';
import { UserService } from './user.service';
import { SharedService } from './shared.service';
import { AddChannelUserComponent } from '../main/channel/add-channel-user/add-channel-user.component';
import { BreakpointObserver } from '@angular/cdk/layout';

@Injectable({
    providedIn: 'root'
})
export class ChannelService {

    selectedChannel: Channel | any;
    userData: User[] = [];

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
        private breakpointObserver: BreakpointObserver
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

    // openDialogEditChannel(channel: any) {
    //     this.dialog.open(DialogEditChannelComponent, { data: channel });
    // }

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

    // openDialogAddUser() {
    //     const isMobile = this.breakpointObserver.isMatched('(max-width: 600px)');
    //     const dialogConfig = {
    //         data: { channel: this.selectedChannel, source: 'channelComponent' },
    //         panelClass: isMobile ? 'full-screen-dialog' : '', // Wenn mobile Ansicht, dann die 'full-screen-dialog' Klasse
    //         width:isMobile ? '100vw' : '514px',  // 100% Breite für mobile Geräte, sonst Standardgröße
    //         maxWidth: '100vw',  // Maximale Breite auf mobilen Geräten
    //         height: isMobile ? 'auto' : '294px',  // Auto-Höhe für mobile Geräte
    //         position: isMobile ? { bottom: '0', left: '0' } : { top: '50%', left: '50%' }, // Dialog unten positionieren bei mobilen Geräten
    //     };

    //     // Öffnen Sie den Dialog mit der angegebenen Konfiguration
    //     this.dialog.open(DialogAddUserComponent, dialogConfig);

    // }


    openDialogEditChannel(channel: any) {

        if (channel) {
            this.dialog.open(DialogEditChannelComponent, { data: channel });
          } else {
            console.error('No channel selected.');
          }
        }
    }
