import { Injectable, Input } from '@angular/core';
import { Message } from '../models/message.class';
import { arrayUnion, collection, doc, Firestore, getDoc, onSnapshot, orderBy, query, updateDoc } from '@angular/fire/firestore';
import { Answer } from '../models/answer.class';


@Injectable({
    providedIn: 'root'
})
export class AnswersService {
    
    answer = new Answer();
    allAnswers: any = [];

    @Input() selectedChannelId: string | null = null;

    constructor(public firestore: Firestore) { }
    
    getAnswers(messageId: string ,answers:Answer[]) {
        const messageDocRef = doc(this.firestore, `channels/${this.selectedChannelId}/messages/${messageId}`);
    
        onSnapshot(messageDocRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            answers = data['answers']
              ? data['answers'].map((a: any) => new Answer(a))
              : [];
    
          } else {
            answers = [];
          }
        }, (error) => {
          console.error('Fehler beim Abrufen der Antworten: ', error);
        });
      }

      saveAnswerToFirestore(messageId: string, answer: Answer, channelId:string|null) {
        const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    
        updateDoc(messageDocRef, {
          answers: arrayUnion(answer.toJson())
        })
          .then(() => {
            console.log("Antwort erfolgreich gespeichert");
          })
          .catch(error => {
            console.error("Fehler beim Speichern der Antwort: ", error);
          });

          
      }

      editDirectAnswer(answer: Answer) {
        answer.isEditing = true;
        answer.editedText = answer.text;
      }

      
  saveEditAnswer(answer: Answer, channelId:string|null,message:Message) {
    const messageRef = doc(this.firestore, `channels/${channelId}/messages/${message.messageId}`);
    getDoc(messageRef).then((docSnap) => {
      if (docSnap.exists()) {
        const messageData = docSnap.data();
        if (Array.isArray(messageData['answers'])) {
          const updatedAnswers = messageData['answers'].map((a: any) => {
            if (a.text === answer.text && a.user === answer.user) {
              a.text = answer.editedText;
            }
            return a;
          });
          updateDoc(messageRef, { answers: updatedAnswers })
            .then(() => {
              answer.text = answer.editedText;
              answer.isEditing = false;
            })
            .catch((error) => {
              console.error("Fehler beim Speichern der Antwort: ", error);
            });
        }
      }
    }).catch((error) => {
      console.error('Fehler beim Abrufen der Nachricht: ', error);
    });
  }
}