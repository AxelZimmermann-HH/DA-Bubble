import { Injectable, Input } from '@angular/core';
import { arrayUnion, doc, Firestore, getDoc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { Answer } from '../models/answer.class';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AnswersService {

  answer = new Answer();
  allAnswers: any = [];

  @Input() selectedChannelId: string | null = null;

  constructor(public firestore: Firestore) { }

  getAnswers(messageId: string, channelId: string) {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    return new Observable<Answer[]>(observer => {
      onSnapshot(messageDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const answers = data['answers'] ? data['answers'].map((a: any) => new Answer(a)) : [];
          observer.next(answers);
        } else {
          observer.next([]);
        }
      }, (error) => {
        console.error("Fehler beim Abrufen der Antworten:", error);
        observer.error(error); // Fehlerbehandlung hinzufügen
      });
    });
  }


  editDirectAnswer(answer: Answer) {
    answer.isEditing = true;
    answer.editedText = answer.text;
  }

  async saveEditAnswer(messageId: string, answer: Answer, updatedAnswer: Answer, channelId: string) {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);
    try {
      const messageDoc = await getDoc(messageDocRef);
      if (messageDoc.exists()) {
        const updatedAnswers = messageDoc.data()?.['answers'].map((a: any) => {
          if (a.text === answer.text && a.user === answer.user) {
            a.text = updatedAnswer.text;
            a.isEditing = false;
          }
          return a;
        });
        await updateDoc(messageDocRef, { answers: updatedAnswers });
      }
    } catch (error) {
      console.error("Fehler beim Bearbeiten der Antwort: ", error);
    }
  }
}