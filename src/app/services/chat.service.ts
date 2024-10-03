import { Injectable } from '@angular/core';
import { addDoc, collection, doc, documentId, Firestore, getDocs, onSnapshot, query, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { directMessage } from '../models/directMessage.class';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  private chatSubject = new BehaviorSubject<any>(null); // Haupt-Observable für den Chat
  chat$ = this.chatSubject.asObservable();

  chatId = '';
  userId = '';
  chatMessages: any[] = [];
  groupedMessages: { [key: string]: directMessage[] } = {};
  chatIsEmpty: boolean = true;

  constructor(public firestore: Firestore) {}

  // Benutzer-Daten abrufen
  async getUserData(userId: string) {
    this.userId = userId;
    const findUser = query(collection(this.firestore, "users"), where(documentId(), "==", userId));
    const querySnapshot = await getDocs(findUser);
    querySnapshot.forEach((doc) => {
      const user = doc.data();
      const userData = {
        userId: doc.id,
        name: user['name'],
        avatar: user['avatar'],
        mail: user['mail'],
        online: user['online'],
      };
      this.userSubject.next(userData);
    });
  };


  // Chat-Daten abrufen
  async getChatData(chatId: string) {
    this.chatId = chatId;
    const chatDocRef = doc(this.firestore, "chats", chatId);

    onSnapshot(chatDocRef, async (chatDoc) => {
      if (chatDoc.exists()) {
        const messagesCollection = collection(this.firestore, `chats/${chatDoc.id}/messages`);

        onSnapshot(messagesCollection, (messagesSnapshot) => {
          this.chatMessages = [];

          messagesSnapshot.forEach((messageDoc) => {
            const messageData = messageDoc.data();

            const chatData = {
              chatId: chatDoc.id,
              messageId: messageDoc.id,
              senderId: messageData['senderID'],
              receiverId: messageData['receiverID'],
              timestamp: messageData['timestamp'],
              time: messageData['time'],
              dayDateMonth: messageData['dayDateMonth'],
              text: messageData['text'],
            };

            this.chatMessages.push(chatData);
          });

          // Sortiere nach Timestamp und gruppiere nach Datum
          this.chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          this.groupMessagesByDate();
          console.log(this.groupedMessages)
          // Setze das Observable mit den gruppierten Nachrichten
          this.chatSubject.next(this.groupedMessages);
          this.chatIsEmpty = this.chatMessages.length === 0;
        });
      }
    });
  };


  // Nachrichten nach Datum gruppieren
  groupMessagesByDate(): void {
    this.groupedMessages = this.chatMessages.reduce((groups: any, message: any) => {
      const date = message.timestamp.split('T')[0]; // Extrahiere das Datum
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
  };


  // Nachricht senden
  async setChatData(newDm: string, currentUserId: string) {
    const newDirectMessage = new directMessage();
    newDirectMessage.senderId = currentUserId;
    newDirectMessage.receiverId = this.userId;
    newDirectMessage.text = newDm;
    newDirectMessage.timestamp = await this.getTimeStamp();
    newDirectMessage.time = newDirectMessage.timestamp.split('T')[1].slice(0, 5);
    newDirectMessage.dayDateMonth = await this.getFormattedDate();
    const dmData = newDirectMessage.toJson();

    // Nachricht speichern
    this.saveNewDirectMessage(dmData);
  };


  // Neue Nachricht speichern
  async saveNewDirectMessage(dmData: any) {
    try {
      await addDoc(collection(this.firestore, 'chats', this.chatId, 'messages'), dmData);
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Nachricht:', error);
    }
  };


  // Timestamp generieren
  async getTimeStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };
  

  // Formatiertes Datum generieren
  async getFormattedDate(): Promise<string> {
    const now = new Date();
    const daysOfWeek = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const dayOfWeek = daysOfWeek[now.getDay()];
    const day = now.getDate();
    const month = months[now.getMonth()];

    return `${dayOfWeek}, ${day}. ${month}`;
  }
}
