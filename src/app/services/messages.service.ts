import { Injectable } from '@angular/core';
import { Message } from '../models/message.class';
import { addDoc, collection, doc, Firestore, onSnapshot, orderBy, query, Timestamp, updateDoc } from '@angular/fire/firestore';
import { UserService } from './user.service';
import { FileService } from './file.service';
import { ChatService } from './chat.service';
import { DatabaseService } from './database.service';
import { deleteDoc } from 'firebase/firestore';
import { ChannelService } from './channel.service';
import { SharedService } from './shared.service';

@Injectable({
    providedIn: 'root'
})
export class MessagesService {
    allMessages: any[] = [];
    message = new Message();
    emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    constructor(
        public firestore: Firestore,
        public userService: UserService,
        public fileService: FileService,
        public chatService: ChatService,
        public dbService: DatabaseService,
        public channelService: ChannelService,
        public sharedService: SharedService
    ) { }


    getAllMessages(channelId: string | null, callback: () => void) {
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

    async saveMessageEdit(message: Message, channelId: string | null) {
        if (!channelId || !message.messageId) return;
        const messageRef = doc(this.firestore, `channels/${channelId}/messages/${message.messageId}`);

        try {
            await updateDoc(messageRef, { text: message.editedText });
            message.text = message.editedText;
            if (!message.text.trim() && !message.fileUrl) {
                await this.deleteMessage(message.messageId, channelId);

            }
            else { message.isEditing = false; }

        } catch (error) {
            console.error('Fehler beim Speichern der Nachricht:', error);
        }
    }
    cancelMessageEdit(message: Message) {
        message.isEditing = false;
        message.editedText = message.text;
    }

    async sendChannelMessage(channelId: string | null, message: string, fileUrl: string | null, userId: string) {
        if (message.trim() === '' && !fileUrl) return;
        const messageData = {
            text: message,
            user: this.userService.findUserNameById(userId),
            timestamp: Timestamp.now(),
            fullDate: new Date().toDateString(),
            answers: [],
            ...(fileUrl && { fileUrl, fileType: this.fileService.selectedFile?.type, fileName: this.fileService.selectedFile?.name })
        };
        try {
            await addDoc(collection(this.firestore, `channels/${channelId}/messages`), messageData);
            this.fileService.selectedFile = null;
        } catch (error) {
            console.error('Fehler beim Senden der Nachricht an den Channel:', error);
        }
    }

    async sendChatMessage(chatId: string, messageText: string, fileUrl: string | null, userId: string) {
        const fileName = this.fileService.selectedFile ? this.fileService.selectedFile.name : '';
        const fileType = this.fileService.selectedFile ? this.fileService.selectedFile.type : '';
        const finalFileUrl = fileUrl || this.fileService.fileDownloadUrl;
        try {
            await this.chatService.sendMessageToChat(
                chatId,
                messageText,
                finalFileUrl,
                fileName,
                fileType,
                userId
            );
        } catch (error) {
            console.error('Fehler beim Senden der Nachricht:', error);
        }
    }
    async sendDirectMessage(recipientName: string, messageText: string, fileUrl: string | null, userId: string) {
        if (!messageText.trim() && !fileUrl) {
            return;
        }
        const receiverID = this.userService.getUserIdByname(recipientName);
        if (!receiverID) {
            return;
        }
        const chatId = await this.initializeChat(receiverID, userId);
        if (!chatId) return;
        await this.sendChatMessage(chatId, messageText, fileUrl, userId);
        this.resetInputFields();
    }

    async initializeChat(receiverID: string, userId: string) {
        const chatId = await this.chatService.createChatID(userId, receiverID);
        const chatExists = await this.chatService.doesChatExist(chatId);
        if (!chatExists) {
            await this.dbService.createNewChat(chatId, userId, receiverID);
        }
        return chatId;
    }

    resetInputFields() {
        this.fileService.selectedFile = null;
        this.fileService.fileDownloadUrl = '';
    }

    async updateMessages(channelId: string | null, messageId: string | null, newMessage: string) {

        const messageRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
        if (!channelId || !messageId || !newMessage) return;
        try {
            await updateDoc(messageRef, { text: newMessage })
            const message = this.allMessages.find(m => m.messageId === messageId);
            if (message) {
                message.text = newMessage;
                if (!message.text.trim()) {
                    this.deleteMessage(messageId, channelId);
                    return;
                }

                message.isEditing = false;


            }
        } catch (error) {
            console.error("Fehler beim Speichern der Nachricht: ", error);
        }
        return;
    }

    async deleteMessage(messageId: string | null, channelId: string | null) {
        if (!channelId) return;
        await deleteDoc(doc(this.firestore, `channels/${channelId}/messages/${messageId}`))
    }

    findMessageById(messageId: string) {
        return this.allMessages.find((message) => message.messageId === messageId);
    }

    async handleDirectMessageOrEmail(fileUrl: string | null, value: string, messageText: string, userId: string) {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const inputValue = value.trim();

        if (emailPattern.test(inputValue)) {
            await this.sendEmail(inputValue, messageText, fileUrl, userId);
        } else if (inputValue.startsWith('@')) {
            const userName = inputValue.slice(1).trim();
            await this.sendDirectMessage(userName, messageText, fileUrl, userId);
        } else if (inputValue.startsWith('#')) {
            const channelName = inputValue.slice(1).trim();
            const channelId = this.channelService.getChannelIdByName(channelName);
            if (channelId) {
                await this.sendChannelMessage(channelId, messageText, fileUrl, userId);
            }
        }

    }
    async sendEmail(email: string, message: string, fileUrl: string | null, userId: string) {
        try {
            const user = this.userService.findUserByEmail(email);
            if (!user) return;
            await this.sendDirectMessage(user.name, message, fileUrl, userId);
        } catch (error) {
            console.error("Fehler beim Suchen des Benutzers: ", error);
        }
    }
    async sendMessage(messageText: string, value: string, userId: string, isEditingOnMobile: boolean, selectedChannelId: string|null, editingMessageId: string|null) {
        const fileUrl = await this.fileService.uploadFiles();
        if (messageText.trim() === '' && !this.fileService.selectedFile && !isEditingOnMobile) return;

        await this.editMessageForMobile(isEditingOnMobile, messageText, editingMessageId, selectedChannelId);
        if (!fileUrl && !messageText.trim()) return;
        if (this.channelService.selectedChannel) {
            await this.sendChannelMessage(selectedChannelId, messageText, fileUrl, userId);
        } else {
            await this.handleDirectMessageOrEmail(fileUrl, value, messageText, userId);
        }
        await this.sendTaggedMessages(fileUrl, messageText, userId);
    }

    async sendTaggedMessages(fileUrl: string | null, newMessageText: string, userId: string) {
        const taggedUsernames = this.extractTaggedUsernames(newMessageText);
        for (const username of taggedUsernames) {
            await this.sendDirectMessage(username, newMessageText, fileUrl, userId);
        }
    }
    async editMessageForMobile(isEditingOnMobile: boolean, messageText: string, editingMessageId: string | null, selectedChannelId: string | null) {
        if (isEditingOnMobile) {
            console.log('message:', messageText, 'filservice edit:', this.fileService.selectedFile);

            if (!messageText.trim() && !this.fileService.selectedFile) {
                await this.deleteMessage(editingMessageId, selectedChannelId);
            }
            else {
                await this.updateMessages(selectedChannelId, editingMessageId, messageText);
            }
            messageText = '';
            isEditingOnMobile = false;
            editingMessageId = null;
            return;
        }
    }

    extractTaggedUsernames(message: string): string[] {
        const tagRegex = /@([A-Za-z0-9_]+)/g;
        const taggedUsernames = [];
        let match;
        while ((match = tagRegex.exec(message)) !== null) {
            taggedUsernames.push(match[1].trim());
        }
        return taggedUsernames;
    }

    async editDirectMessage(message: Message, newMessage: string, isEditingOnMobile: boolean, editingMessageId: string|null) {
        if (!this.sharedService.isMobile) {
            message.isEditing = true;
            message.editedText = message.text;
        } else {
            newMessage = message.text;
            isEditingOnMobile = true;
            editingMessageId = message.messageId;

            if (message.fileUrl) {
                this.fileService.fileUrl = this.fileService.getSafeUrl(message.fileUrl);
                const fakeFile = new File([''], message.fileName || 'Unbenannte Datei', {
                    type: message.fileType || 'application/octet-stream',
                });
                this.fileService.selectedFile = fakeFile;
            } else {
                this.fileService.closePreview();
            }

        }
    }

}