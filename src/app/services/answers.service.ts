import { Injectable } from '@angular/core';
import { addDoc, collection, deleteDoc, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { Answer } from '../models/answer.class';
import { SharedService } from './shared.service';
import { FileService } from './file.service';
import { SafeResourceUrl } from '@angular/platform-browser';


@Injectable({
  providedIn: 'root'
})
export class AnswersService {

  answer = new Answer();
  allAnswers: any = [];
  latestAnswerTimes = new Map<string, string | null>();
  selectedFile: File | null = null;

  constructor(public firestore: Firestore, public sharedService: SharedService, public fileService: FileService) { }

  editDirectAnswer(answer: Answer, newAnswerText: string, editingAnswerId: string | null, fileUrl: SafeResourceUrl | null) {
    if (!this.sharedService.isMobile) {
      answer.isEditing = true;
      answer.editedText = answer.text;
    } else {
      newAnswerText = answer.text;
      editingAnswerId = answer.id;
      if (answer.fileUrl) {
        fileUrl = this.fileService.getSafeUrl(answer.fileUrl);
        const fakeFile = new File([''], answer.fileName || 'Unbenannte Datei', {
          type: answer.fileType || 'application/octet-stream',
        });
        this.selectedFile = fakeFile;
      } else {
        this.fileService.closePreview();
      }
    }
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

  async saveAnswer(answer: Answer, channelId: string | null) {
    if (!channelId || !answer.messageId || !answer.id) {
      return;
    }
    const answerRef = doc(this.firestore, `channels/${channelId}/messages/${answer.messageId}/answers/${answer.id}`);
    try {
      const updateData: any = { text: answer.editedText };
      if (!answer.fileUrl) {
        updateData.fileUrl = null;
        updateData.fileType = null;
        updateData.fileName = null;
      }
      await updateDoc(answerRef, updateData);
      answer.text = answer.editedText;

      if (!answer.text.trim() && !answer.fileUrl) {
        await this.deleteAnswer(answer, channelId);
      } else {
        answer.isEditing = false;
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Nachricht:', error);
    }
  }

  resetFile(answer: Answer) {
    this.selectedFile = null;
    answer.fileUrl = '';
    answer.fileName = '';
    answer.fileType = '';
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

  async addNewAnswer(messageId: string, answerData: any, channelId: string | null, newAnswerText: string) {
    try {
      const answersCollectionRef = collection(
        this.firestore,
        `channels/${channelId}/messages/${messageId}/answers`
      );
      await addDoc(answersCollectionRef, answerData);
      newAnswerText = '';
      this.selectedFile = null;
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Antwort:', error);
    }
  }

  async deleteEditedAnswer(messageId: string, channelId: string | null, editingAnswerId: string | null) {
    try {
      const answerRef = doc(
        this.firestore,
        `channels/${channelId}/messages/${messageId}/answers/${editingAnswerId}`
      );
      await deleteDoc(answerRef);  // Löschen der Antwort
    } catch (error) {
      console.error('Fehler beim Löschen der Antwort:', error);
    }
  }

  async editAnswer(messageId: string, newAnswerText: string, ChannelId: string | null, editingAnswerId: string | null) {
    const updateData: any = { text: newAnswerText.trim() };
    if (!this.selectedFile) {
      updateData.fileUrl = null;
      updateData.fileType = null;
      updateData.fileName = null;
    }
    try {
      const answerRef = doc(
        this.firestore,
        `channels/${ChannelId}/messages/${messageId}/answers/${editingAnswerId}`
      );
      await updateDoc(answerRef, updateData);
      const answer = this.allAnswers.find((a: any) => a.id === editingAnswerId);
      if (answer) {
        answer.text = newAnswerText.trim();
        answer.isEditing = false;
        if (!answer.text && !answer.fileUrl) {
          await this.deleteEditedAnswer(messageId, ChannelId, editingAnswerId);
        }
      }
      newAnswerText = '';
      this.selectedFile = null;
      editingAnswerId = null;

    } catch (error) {
      console.error('Fehler beim Bearbeiten der Antwort:', error);
    }
  }
  deleteFile(answer: Answer) {
    if (!answer.fileUrl) return;
    answer.fileUrl = '';
    answer.fileName = '';
    answer.fileType = '';
    this.selectedFile = null;
  }

}




