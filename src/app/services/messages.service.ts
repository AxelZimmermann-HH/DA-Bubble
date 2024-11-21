import { Injectable } from '@angular/core';
import { Message } from '../models/message.class';
import { collection, Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';

@Injectable({
    providedIn: 'root'
})
export class MessagesService {
    allMessages: any[] = [];
    message = new Message();
    constructor(public firestore: Firestore) { }

    getAllMessages(channelId:string|null, callback: () => void) {
        const messagesQuery = query(
            collection(this.firestore, `channels/${channelId}/messages`),
            orderBy('timestamp', 'asc')
        );
        this.allMessages = [];
        onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = snapshot.docs.map(doc => {
                const data = doc.data();
                return new Message({
                    text: data['text'],
                    user: data['user'],
                    timestamp: data['timestamp'],
                    answers: data['answers'] || [],
                    emojis: data['emojis'] || [],
                    fileUrl: data['fileUrl'] || null,
                    fileType: data['fileType'] || null,
                    fileName: data['fileName'] || null
                }, doc.id);
            });
            const groupedMessages: { [date: string]: Message[] } = {};

            messagesData.forEach(message => {
                const messageDate = message.fullDate;
                if (!groupedMessages[messageDate]) {
                    groupedMessages[messageDate] = [];
                }
                groupedMessages[messageDate].push(message);
            });

            this.allMessages = Object.keys(groupedMessages).map(date => ({
                date,
                messages: groupedMessages[date]
            }));

            callback()
        });
    }
}