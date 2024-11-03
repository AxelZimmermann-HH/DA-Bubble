import { Timestamp } from "@angular/fire/firestore";
import { EmojiData } from './emoji-data.models';

export class Answer {
    text!: string;
    user!: string;
    timestamp!: Date;
    isEditing: boolean = false;
    editedText: string = '';
    static isEditing: boolean;
    emojis: EmojiData[] = [];
    fileUrl?: string; // Neue Eigenschaft für die Datei-URL
    fileType?: string; // Neue Eigenschaft für den Dateityp
    fileName?: string; // Neue Eigenschaft für den Dateinamen


    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
        const date = obj && obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
        this.timestamp = date;
        this.editedText = this.text;
        this.emojis = (obj?.emojis || []).map((e: any) =>
            typeof e === 'string' ? { emoji: e, userIds: [] } : e
          );
          this.fileUrl = obj?.fileUrl; // Initialisiere die Datei-URL
          this.fileType = obj?.fileType; // Initialisiere den Dateityp
          this.fileName = obj?.fileName; // Initialisiere den Dateinamen
    }

    private getDateFromTimestamp(timestamp: any): Date {
        return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    }

    public formatTimestamp(): string {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24-Stunden-Format
        };
        return new Intl.DateTimeFormat('de-DE', options).format(this.timestamp) + ' Uhr';
    }

    public toJson() {
        return {
            text: this.text,
            user: this.user,
            timestamp: this.timestamp,
            emojis: this.emojis,
            fileUrl: this.fileUrl, // Füge die Datei-URL hinzu
            fileType: this.fileType, // Füge den Dateityp hinzu
            fileName: this.fileName // Füge den Dateinamen hinzu

        };
    }
}
