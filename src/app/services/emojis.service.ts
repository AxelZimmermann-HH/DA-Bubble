import { Injectable } from '@angular/core';
import { Message } from '../models/message.class';
import { EmojiData } from '../models/emoji-data.models';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';
import { UserService } from './user.service';


@Injectable({
    providedIn: 'root'
})

export class EmojisService {

    constructor(public firestore: Firestore,
        public userService:UserService
    ) { }

    getEmojiSrc(emoji: string): string {
        const emojiMap: { [key: string]: string } = {
            'nerd face': './assets/icons/emoji _nerd face_.png',
            'raising both hands': './assets/icons/🦆 emoji _person raising both hands in celebration_.png',
            'heavy check mark': './assets/icons/emoji _white heavy check mark_.png',
            'rocket': './assets/icons/emoji _rocket_.png'
        };
        return emojiMap[emoji] || '';
    }

    toggleUserEmoji(message: Message, emoji: string, userId: string, channelId:string|null) {
        const emojiData = message.emojis.find((e: EmojiData) => e.emoji === emoji);

        if (!emojiData) {
            message.emojis.push({ emoji, userIds: [userId] });
        } else {
            const userIdIndex = emojiData.userIds.indexOf(userId);
            if (userIdIndex === -1) {
                emojiData.userIds.push(userId);
            } else {
                emojiData.userIds.splice(userIdIndex, 1);
            }
        }
        this.updateEmojisInFirebase(message, channelId);
    }

    updateEmojisInFirebase(message: Message, channelId:string|null) {
        const messageRef = doc(this.firestore, `channels/${channelId}/messages/${message.messageId}`);
        updateDoc(messageRef, {
            emojis: message.emojis 
        });
    }
  
    getEmojiReactionText(emojiData: EmojiData, userID:string) {
        const currentUserId = userID;
        const userNames = emojiData.userIds.map(userId => this.userService.findUserNameById(userId));
        const currentUserIndex = emojiData.userIds.indexOf(currentUserId);
        if (currentUserIndex > -1) {
          const currentUserName = this.userService.findUserNameById(currentUserId);
          const filteredUserNames = userNames.filter(name => name !== currentUserName);
    
          let nameList = filteredUserNames.join(", ");
          if (nameList.length > 0) {
            return `Du und ${nameList}` + (filteredUserNames.length > 1 ? "..." : "");
          } else {
            return "Du";
          }
        }
        return userNames.length > 0 ? userNames.join(", ") : "Keine Reaktionen";
      }

      toggleEmojiReaction(message: Message, emojiData: EmojiData, userID:string, selectedChannelId:string|null) {
        const currentUserId = userID;
        const currentUserIndex = emojiData.userIds.indexOf(currentUserId);
    
        if (currentUserIndex > -1) {
    
          emojiData.userIds.splice(currentUserIndex, 1);
        } else {
          emojiData.userIds.push(currentUserId);
        }
    
        this.updateEmojisInFirebase(message, selectedChannelId);
      }
}