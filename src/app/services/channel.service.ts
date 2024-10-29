import { Injectable } from '@angular/core';
import { User } from '../models/user.class';
import { Channel } from '../models/channel.class';
import { BehaviorSubject } from 'rxjs';
import { Message } from '../models/message.class';

@Injectable({
    providedIn: 'root'
})
export class ChannelService { }