import { Injectable } from '@angular/core';

import { collection, doc, documentId, Firestore, getDocs, query, setDoc, where } from '@angular/fire/firestore';
import { User } from '../models/user.class';
import { BehaviorSubject } from 'rxjs';


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
  user:any[] = []
  chatMessages:any[] = [];

  chatIsEmpty:boolean = true

  async getUserData(userId:string){
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

  async getChatData(chatId: string){
  
    // LADE CHAT MIT CHAT_ID
    const loadChat = query(collection(this.firestore, "chats"), where(documentId(), "==", chatId));
    const chatSnapshot = await getDocs(loadChat);
  
    chatSnapshot.forEach(async (chatDoc) => {
      const chat = chatDoc.data();
  
      // MESSAGES COLLECTION
      const messagesCollection = collection(this.firestore, `chats/${chatDoc.id}/messages`);
      const messagesSnapshot = await getDocs(messagesCollection);
  
      
      messagesSnapshot.forEach((messageDoc) => {
        const messageData = messageDoc.data();
  
        const chatData = {
          chatId: chatDoc.id,
          messageId: messageDoc.id,
          senderId: messageData['senderID'],
          receiverId: messageData['receiverID'],
          timestamp: messageData['timestamp'],
          time: messageData['time'],
          dayDateMonth: messageData ['dayDateMonth'],
          text: messageData['text'],
        };
  
        this.chatSubject.next(chatData);
      });
    });
  }
  

  async getMyUserData(myUserId:string){
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
}
