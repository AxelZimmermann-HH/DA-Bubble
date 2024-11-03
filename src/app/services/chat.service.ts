import { Injectable } from '@angular/core';
import { addDoc, collection, doc, documentId, Firestore, getDocs, onSnapshot, query, setDoc, updateDoc, where } from '@angular/fire/firestore';
import { BehaviorSubject } from 'rxjs';
import { directMessage } from '../models/directMessage.class';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
  selectedChannelId: string | null = null;
  showChannel = true;
  showChat = true;
  textContent: string | null = null;
  safeUrl: SafeResourceUrl | null = null;  // Sichere URL wird hier gespeichert

  constructor(public firestore: Firestore, private sanitizer: DomSanitizer) {
    this.showChannel = true;
    this.showChat = false;
  }

  
  

  onChannelSelected(channel: any) {
    if (channel) {
      this.selectedChannelId = channel.id;
    this.showChannel = true;
    this.showChat = false;
    }
    else{
      this.selectedChannelId = null
    }
    
    
  }


  onChatSelected() {
    console.log('Chat selected in MainComponent');
    this.showChannel = false;
    this.showChat = true;
  }

  //öffnet den privaten Chat
  async openDirectMessage(currentUserId: string, userId: string) {
    this.chatIsEmpty = true;
    this.chatMessages = [];
    const chatId = await this.createChatID(currentUserId, userId);
    const checkIfChatExists = query(collection(this.firestore, "chats"), where(documentId(), "==", chatId));
    const querySnapshot = await getDocs(checkIfChatExists);

    if (querySnapshot.empty) {

      //legt neuen Chat an, wenn kein Chat existiert
      await this.createNewChat(chatId, currentUserId, userId);
      this.chatId = chatId;
      console.log('chat nicht gefunden');

    } else {

      //öffnet den vorhanden Chat
      querySnapshot.forEach((doc) => {
        this.getChatData(chatId);
        
        console.log('chat gefunden:', doc.id, '=>', doc.data());
      });
      await this.markMessagesAsRead(chatId);
              // Aktualisiere den Zähler für ungelesene Nachrichten
              this.updateUnreadCounts(chatId);
    }
    this.getUserData(userId);
  };

  // Methode zum Aktualisieren der ungelesenen Nachrichten-Zähler
updateUnreadCounts(chatId: string) {
  // Hier kannst du den Zähler für ungelesene Nachrichten zurücksetzen, da der Chat geöffnet wurde
  this.unreadCountMap.set(chatId, 0);
  this.unreadCount$.next(new Map(this.unreadCountMap)); // Benachrichtige die UI
}


  //erstellt eine Chat-ID aus den Nutzer ID's
  async createChatID(myUserId: string, userId: string) {
    return [myUserId, userId].sort().join('_');
  };


  //erstellt einen neuen Chat
  async createNewChat(chatId: string, myUserId: string, userId: string) {

    const collectionRef = "chats";
    try {
      const docRef = doc(this.firestore, collectionRef, chatId);
      await setDoc(docRef, {
        users: [myUserId, userId]
      });
      console.log("Chat erfolgreich hinzugefügt mit der ID:", chatId);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Chats: ", error);
    };
  };


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
              fileDownloadUrl: messageData['fileDownloadUrl'],
              fileName: messageData['fileName'],
              fileType: messageData['fileType'],
              safeUrl: this.sanitizer.bypassSecurityTrustResourceUrl(messageData['fileDownloadUrl']),
              reactionCelebrate: messageData['reactionCelebrate'],
              reactionCheck: messageData['reactionCheck'],
              reactionNerd: messageData['reactionNerd'],
              reactionRocket: messageData['reactionRocket'],
              isRead: messageData['isRead']
            };

            this.chatMessages.push(chatData);
            if (chatData.fileType == 'text/plain') {
              this.textContent = '';
              this.fetchTextFile(chatData.fileDownloadUrl)
            }
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


  // Dateiinhalt als Text laden
  async fetchTextFile(url: string) {

    fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Fehler beim Laden der Datei');
        }
        return response.text();  // Dateiinhalt als Text lesen
      })
      .then(text => {
        this.textContent = text;  // Inhalt im Template anzeigen
      })
      .catch(error => {
        console.error('Fehler beim Lesen der Textdatei:', error);
        this.textContent = 'Fehler beim Laden der Textdatei.';
      });
  }


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
  async setChatData(newDm: string, fileDownloadUrl: string, selectedFileName: string, fileType: string, currentUserId: string) {
    const newDirectMessage = new directMessage();
    newDirectMessage.chatId = this.chatId;
    newDirectMessage.senderId = currentUserId;
    newDirectMessage.receiverId = this.userId;
    newDirectMessage.text = newDm;
    newDirectMessage.timestamp = await this.getTimeStamp();
    newDirectMessage.time = newDirectMessage.timestamp.split('T')[1].slice(0, 5);
    newDirectMessage.dayDateMonth = await this.getFormattedDate();
    newDirectMessage.fileName = selectedFileName;
    newDirectMessage.fileDownloadUrl = fileDownloadUrl;
    newDirectMessage.fileType = fileType;
    const dmData = newDirectMessage.toJson();

    await this.saveNewDirectMessage(dmData);
    await this.getChatData(this.chatId)
  };


  // Neue Nachricht speichern
  async saveNewDirectMessage(dmData: any) {
    try {
      console.log('Speichere neue Direktnachricht mit Daten:', dmData);
      const docRef = await addDoc(collection(this.firestore, 'chats', this.chatId, 'messages'), dmData);
      await updateDoc(docRef, { messageId: docRef.id });
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Nachricht:', error);
    }
  };


  // Setze Daten für den editierten Chat
  async setEditedChatData(editedDM: string, message: any) {
    debugger
    const chatId = message.chatId;
    const messageId = message.messageId;
    const text = editedDM;
    this.saveEditedMessage(chatId, messageId, text);
  };


  // Bearbeitete Nachricht speichern
  async saveEditedMessage(chatId: string, messageId: string, text: any) {
    try {
      await updateDoc(doc(this.firestore, 'chats', chatId, 'messages', messageId), {
        'text': text}
      );
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

  async doesChatExist(chatId: string): Promise<boolean> {
    const checkIfChatExists = query(collection(this.firestore, "chats"), where(documentId(), "==", chatId));
    const querySnapshot = await getDocs(checkIfChatExists);
    return !querySnapshot.empty;
  }

  currentUserId: string = ''; // ID des aktuell eingeloggten Benutzers
  currentOpenChatId: string | null = null; // Aktuell geöffneter Chat


  // Senden der Nachricht an mehrere User
  async sendMessageToChat(chatId: string, newDm: string, fileDownloadUrl: string, fileName: string, fileType: string, currentUserId: string) {
    const newDirectMessage = new directMessage();
    newDirectMessage.chatId = chatId;
    newDirectMessage.senderId = currentUserId;
    newDirectMessage.receiverId = this.userId;
    newDirectMessage.text = newDm;
    newDirectMessage.timestamp = await this.getTimeStamp();
    newDirectMessage.time = newDirectMessage.timestamp.split('T')[1].slice(0, 5);
    newDirectMessage.dayDateMonth = await this.getFormattedDate();
    newDirectMessage.fileName = fileName;
    newDirectMessage.fileDownloadUrl = fileDownloadUrl;
    newDirectMessage.fileType = fileType;
    const dmData = newDirectMessage.toJson();

    try {
      await addDoc(collection(this.firestore, 'chats', chatId, 'messages'), dmData);
      console.log(`Nachricht erfolgreich im Chat ${chatId} gespeichert`);
    } catch (error: any) {
      console.error('Fehler beim Erstellen der Nachricht:', error);
    }
  }

  //VERSION: OLIVER >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  private unreadCountMap = new Map<string, number>(); // Map für ungelesene Nachrichten pro Chat
  unreadCount$ = new BehaviorSubject<Map<string, number>>(this.unreadCountMap); // Observable für die UI

  // Initialisiere die Abfrage, um alle ungelesenen Nachrichten zu überwachen
  initializeUnreadCounts(currentUserId: string) {
  const chatsCollection = collection(this.firestore, 'chats');

  // Abfrage aller Chats für den aktuellen Benutzer
  const userChatsQuery = query(
   chatsCollection,
   where('users', 'array-contains', currentUserId) // Angenommen, `participants` ist ein Array mit den Benutzer-IDs
  );

  // Hole alle Chats des Benutzers
  onSnapshot(userChatsQuery, (snapshot) => {
   this.unreadCountMap.clear(); // Map zurücksetzen

   snapshot.forEach(async (chatDoc) => {
     const chatId = chatDoc.id;
     const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);

     const unreadMessagesQuery = query(
       messagesCollection,
       where('receiverID', '==', currentUserId),
       where('isRead', '==', false)
     );

     // Abonniere die ungelesenen Nachrichten in diesem Chat
     onSnapshot(unreadMessagesQuery, (messageSnapshot) => {
       const unreadCount = messageSnapshot.size; // Anzahl der ungelesenen Nachrichten
       console.log(unreadCount)
       if (unreadCount > 0) {
         this.unreadCountMap.set(chatId, unreadCount);
       } else {
         this.unreadCountMap.delete(chatId); // Entferne den Zähler, wenn keine ungelesenen Nachrichten vorhanden sind
       }
       console.log(this.unreadCountMap)
       // Aktualisiere die Map, damit alle Abonnenten benachrichtigt werden
       this.unreadCount$.next(new Map(this.unreadCountMap));
       console.log('ungelesen:', this.unreadCountMap)
       
      });
   });
  });
}

  // Ungelesene Nachrichten zählen, die an den aktuellen Benutzer gesendet wurden
  getUnreadCount(chatId: string) {
    const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);
    
    const unreadMessagesQuery = query(
      messagesCollection, 
      where('isRead', '==', false), 
      where('receiverID', '==', this.currentUserId)
    );

    // Echtzeit-Listener für ungelesene Nachrichten
    onSnapshot(unreadMessagesQuery, (snapshot) => {
      const unreadCount = snapshot.size;
      this.unreadCountMap.set(chatId, unreadCount);
      this.unreadCount$.next(this.unreadCountMap);
    });
  }

  // Setze alle Nachrichten als gelesen für den aktuellen Benutzer im geöffneten Chat
  markMessagesAsRead(chatId: string) {
    const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);
    const unreadMessagesQuery = query(
      messagesCollection, 
      where('isRead', '==', false), 
      where('receiverID', '==', this.currentUserId)
    );

    onSnapshot(unreadMessagesQuery, (snapshot) => {
      // Prüfen, ob Nachrichten gefunden wurden
      if (snapshot.empty) {
        console.log(`Keine ungelesenen Nachrichten gefunden für chatId: ${chatId}`);
      } else {
        console.log(`Gefundene Nachrichten: ${snapshot.size}`);
      }

      snapshot.forEach((messageDoc) => {
        const messageRef = doc(this.firestore, `chats/${chatId}/messages/${messageDoc.id}`);
        
        console.log(`Aktualisiere Nachricht mit ID: ${messageDoc.id}`);
        
        updateDoc(messageRef, { isRead: true })
          .then(() => {
            console.log(`Nachricht ${messageDoc.id} erfolgreich als gelesen markiert.`);
          })
          .catch((error) => {
            console.error(`Fehler beim Aktualisieren von Nachricht ${messageDoc.id}:`, error);
          });
      });

      // Zähler zurücksetzen, nachdem alle Nachrichten als gelesen markiert wurden
      this.unreadCountMap.set(chatId, 0);
      this.unreadCount$.next(this.unreadCountMap);
    });
    
  }





  // VERSION: AXEL>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //Im ChatService
private newMessageCountSubject = new BehaviorSubject<{ [userId: string]: number }>({});
newMessageCount$ = this.newMessageCountSubject.asObservable();

// Beispiel für eine modifizierte Methode im ChatService
async startListeningForNewMessages(currentUserId: string, lastLoginTimestamp: Date) {
  const usersRef = collection(this.firestore, 'users');
  const usersSnapshot = await getDocs(usersRef);

  usersSnapshot.forEach(async (userDoc) => {
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Erstelle die Chat-ID basierend auf dem aktuellen Nutzer und dem Datenbank-Nutzer
    const chatId = await this.createChatID(currentUserId, userId);
    const messagesCollection = collection(this.firestore, `chats/${chatId}/messages`);

    // Überwache die Nachrichten im Chat
    onSnapshot(messagesCollection, (messagesSnapshot) => {
      const newMessages = messagesSnapshot.docs.filter(doc => {
        const messageData = doc.data();
        const messageTimestamp = new Date(messageData["timestamp"]);
        return messageData["senderID"] !== currentUserId && messageTimestamp > lastLoginTimestamp;
      });

      // Aktualisiere den Zähler der neuen Nachrichten für diesen Nutzer
      const newMessageCount = newMessages.length;
      const currentCounts = this.newMessageCountSubject.value;
      this.newMessageCountSubject.next({ ...currentCounts, [userId]: newMessageCount });
    });
  });
}

}


