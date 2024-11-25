import { Injectable } from '@angular/core';
import {  doc, Firestore, getDoc, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { Answer } from '../models/answer.class';


@Injectable({
  providedIn: 'root'
})
export class AnswersService {

  answer = new Answer();
  allAnswers: any = [];

  constructor(public firestore: Firestore) { }

  getAnswers(messageId: string, channelId: string|null, selectedAnswers: Answer[]) {
    const messageDocRef = doc(this.firestore, `channels/${channelId}/messages/${messageId}`);

    onSnapshot(
      messageDocRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const messageData = docSnapshot.data();

          if (Array.isArray(messageData['answers'])) {
            selectedAnswers = messageData['answers'].map((a: any) => new Answer(a));
          } else {
            selectedAnswers = [];
          }
        }
      },
      (error) => {
        console.error('Fehler beim Abrufen der Antworten:', error);
      }
    );
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
          if (a.text === answer.text) {
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

  cancelEditAnswer(answer: Answer) {
    answer.isEditing = false;
    answer.editedText = answer.text;
  }
}