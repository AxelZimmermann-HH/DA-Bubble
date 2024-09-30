import { Injectable } from '@angular/core';

import { addDoc, collection, doc, documentId, Firestore, getDocs, onSnapshot, query, setDoc, where } from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { BehaviorSubject } from 'rxjs';
import { directMessage } from '../models/directMessage.class';


@Injectable({
  providedIn: 'root'
})
export class ChatService {
  userData: any;

  private userSubject = new BehaviorSubject<any>(null); // Observable für die User-Daten
  user$ = this.userSubject.asObservable(); // Observable, das von Komponenten abonniert werden kann

  private meSubject = new BehaviorSubject<any>(null); // Observable für Meinen Benutzer
  me$ = this.meSubject.asObservable(); // Observable, das von Komponenten abonniert werden kann

  private chatSubject = new BehaviorSubject<any>(null); // Observable für die Chat-Daten
  chat$ = this.chatSubject.asObservable(); // Observable, das von Komponenten abonniert werden kann

  constructor(public firestore: Firestore) { }

 
  chatId = '';
  myUserId = '';
  userId = '';
  user:any[] = []
  chatMessages:any[] = [];

  chatIsEmpty:boolean = true

  async getUserData(userId:string){
    this.userId = userId;
    const findUser = query(collection(this.firestore, "users"), where(documentId(), "==", userId));
    const querySnapshot = await getDocs(findUser);
    querySnapshot.forEach((doc) => {
      
      const user = doc.data()
      const userData = {
        userId: doc.id,
        name: user['name'],
        avatar: user['avatar'],
        mail: user['mail'],
        online: user['online'],
      };
      
      this.userSubject.next(userData);
    });
  }

  async getChatData(chatId: string) {
    this.chatId = chatId;

    const chatDocRef = doc(this.firestore, "chats", chatId);

    onSnapshot(chatDocRef, async (chatDoc) => {
      if (chatDoc.exists()) {
        const chat = chatDoc.data();
  
        // MESSAGES COLLECTION:
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
  
          this.chatMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
          this.chatSubject.next(this.chatMessages);
        });
      }
    });
  }
  

  async getMyUserData(myUserId:string){
    this.myUserId = myUserId;
    const findUser = query(collection(this.firestore, "users"), where(documentId(), "==", myUserId));
    const querySnapshot = await getDocs(findUser);
    querySnapshot.forEach((doc) => {
      
      const my = doc.data()
      const myUserData = {
        userId: doc.id,
        name: my['name'],
        avatar: my['avatar'],
        mail: my['mail'],
        online: my['online'],
      };
      
      this.meSubject.next(myUserData);
    });
  }

  newDirectMessage: directMessage = new directMessage();

  async setChatData(newDm: string){
   
    console.log(newDm, this.chatId)

    this.newDirectMessage.senderID = this.myUserId;
    this.newDirectMessage.receiverID  = this.userId;
    this.newDirectMessage.text = newDm;
    this.newDirectMessage.timestamp = await this.getTimeStamp();
    this.newDirectMessage.time = this.newDirectMessage.timestamp.split('T')[1].slice(0, 5);
    this.newDirectMessage.dayDateMonth = await this.getFormattedDate();
    
    const dmData = this.newDirectMessage.toJson();
    console.log('Neuer Nachricht erstellt', dmData)
    this.saveNewDirectMessage(dmData);
    this.chatSubject.next(dmData); 
  }

  async saveNewDirectMessage(dmData:any){
    try {
      const docRef = await addDoc(collection(this.firestore, 'chats', this.chatId, 'messages'), dmData);
      
      //await this.setChannelId(docRef.id, dmData)
    }catch (error: any) {
      console.error('Fehler beim erstellen des Channels:', error);
    }
  }

  async getTimeStamp(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  async getFormattedDate(): Promise<string> {
    const now = new Date();
    const daysOfWeek = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  
    const dayOfWeek = daysOfWeek[now.getDay()]; // Wochentag
    const day = now.getDate(); // Tag
    const month = months[now.getMonth()]; // Monat
  
    return `${dayOfWeek}, ${day}. ${month}`;
  }
}
