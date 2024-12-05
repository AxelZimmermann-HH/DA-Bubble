import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, getDoc, getDocs, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from '@angular/fire/firestore';
import { Answer } from '../models/answer.class';
import { SharedService } from './shared.service';
import { FileService } from './file.service';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';


@Injectable({
  providedIn: 'root'
})
export class AnswersService {

  answer = new Answer();
  allAnswers: any = [];
  latestAnswerTimes = new Map<string, string | null>();

  constructor(public firestore: Firestore, public sharedService: SharedService, public fileService: FileService) { }

  editDirectAnswer(answer: Answer) {
    answer.isEditing = true;
    answer.editedText = answer.text;
  }

  getAnswers(channelId: string | null, messageId: string, callback: (answers: Answer[]) => void) {
    if (!channelId || !messageId) return;

    const answersCollectionRef = collection(
      this.firestore,
      `channels/${channelId}/messages/${messageId}/answers`
    );

    onSnapshot(
      answersCollectionRef,
      (querySnapshot) => {
        const answers = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (data) {
              return new Answer({ ...data, id: doc.id }); // ID hinzufügen
            }
            return null;
          })
          .filter((answer): answer is Answer => answer !== null) // Entfernt ungültige Antworten
          .sort((a, b) => (a.timestamp && b.timestamp ? a.timestamp.getTime() - b.timestamp.getTime() : 0)); // Sortierung nach Zeit

        callback(answers);
      },
      (error) => {
        console.error('Fehler beim Abrufen der Antworten:', error);
      }
    );
  }

  // async saveAnswer(answer: Answer, channelId:string|null) {
  //   if (!channelId || !answer.messageId || !answer.id) {
  //     return;
  //   }
  //   const answerRef = doc(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers/${answer.id}`);
  //   try {
  //     await updateDoc(answerRef, { text: answer.editedText });
  //     answer.text = answer.editedText;

  //     if (!answer.text.trim() && !answer.fileUrl) {
  //       await this.deleteAnswer(answer,channelId);
  //     } else {
  //       answer.isEditing = false;
  //     }
  //   } catch (error) {
  //     console.error('Fehler beim Speichern der Nachricht:', error);
  //   }
  // }

  async saveAnswer(answer: Answer, channelId: string | null, newAnswerText: string): Promise<void> {
    if (!channelId || !answer.messageId || !answer.id) {
      return;
    }
    if (this.sharedService.isMobile) {
      if (!answer.id) {
        if (!newAnswerText.trim() && !this.fileService.selectedFile) {
          return;
        }
        const newAnswer = {
          text: newAnswerText,
          fileUrl: this.fileService.selectedFile ? await this.fileService.uploadFiles() : null,
          fileName: this.fileService.selectedFile?.name || null,
          fileType: this.fileService.selectedFile?.type || null,
        };

        const answerCollection = collection(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers`);
        await addDoc(answerCollection, newAnswer);
        newAnswerText = '';
        this.fileService.resetFile();
      } else {
        const answerRef = doc(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers/${answer.id}`);
        await updateDoc(answerRef, { text: newAnswerText || answer.text });
        if (!newAnswerText.trim() && !this.fileService.selectedFile) {
          await this.deleteAnswer(answer, channelId);
        } else {
          answer.isEditing = false;
        }
      }
    } else {
      const answerRef = doc(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers/${answer.id}`);
      try {
        await updateDoc(answerRef, { text: answer.editedText });
        answer.text = answer.editedText;
        if (!answer.text.trim() && !answer.fileUrl) {
          await this.deleteAnswer(answer, channelId);
        } else {
          answer.isEditing = false;
        }
      } catch (error) {
        console.error('Fehler beim Speichern der Antwort:', error);
      }
    }
  }



  async deleteAnswer(answer: string | any, channelId: string | null) {
    try {
      const answerDocRef = doc(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers/${answer.id}`);
      await deleteDoc(answerDocRef);
    } catch (error) {
      console.error('Fehler beim Löschen der Antwort:', error);
    }
  }
  cancelEditAnswer(answer: Answer) {
    answer.isEditing = false;
    answer.editedText = answer.text;
  }


}




