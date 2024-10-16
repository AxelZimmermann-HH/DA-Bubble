import { Timestamp } from "@angular/fire/firestore";
import { Answer } from "./answer.class";

export interface MessageData {
  text?: string;
  user?: string;
  timestamp?: any; // Use a more specific type if applicable
  answers?: Answer[];
  emojis?: string[];
  fileUrl?: string;
}

export class Message {
  messageId!: string;
  text!: string;
  user!: string;
  timestamp!: Date;
  fullDate!: string;
  answers: Answer[] = []; 
  emojis: string[] = [];
  fileUrl?: string;
  isEditing: boolean = false;
  editedText: string = '';

  
  constructor(obj: MessageData = {}, messageId: string = '') {
    this.messageId = messageId; // should be set from Firestore
    this.text = obj.text || '';
    this.user = obj.user || '';
    const date = obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
    this.timestamp = date;
    this.fullDate = this.formatFullDate(date);
    this.answers = Array.isArray(obj.answers) ? obj.answers.map(a => new Answer(a)) : []; // Initialize answers
    this.emojis = obj.emojis || []
    this.fileUrl = obj.fileUrl || '';
    this.editedText = this.text; 
}

public getLastAnswerTimestamp():string|any {
  if (this.answers.length === 0) {
    return null; // Keine Antworten vorhanden
  }

  const lastAnswer = this.answers[this.answers.length - 1];
  return lastAnswer.formatTimestamp(); // Formatierter Zeitstempel der letzten Antwort
}
  private getDateFromTimestamp(timestamp: any): Date {
    return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  }

  public formatTimestamp(): string {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    };
    return new Intl.DateTimeFormat('de-DE', options).format(this.timestamp) + ' Uhr';
  }

  private formatFullDate(date: Date): string {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    }
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    };
    return new Intl.DateTimeFormat('de-DE', options).format(date);
  }

  public toJson() {
    return {
      messageId: this.messageId,
      text: this.text,
      user: this.user,
      timestamp: this.timestamp,
      fullDate: this.fullDate,
      answers: this.answers,
      emojis:this.emojis,
      fileUrl: this.fileUrl
    };
  }
}
