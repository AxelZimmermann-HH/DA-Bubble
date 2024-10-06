import { Timestamp } from "@angular/fire/firestore";

export class Message {
    text!: string;
    user!: string;
    timestamp!: Date; // Dies bleibt ein Date-Objekt
    fullDate!: string; 

    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
        const date = obj && obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
        this.timestamp = date; // Speichere als Date-Objekt
        this.fullDate = this.formatFullDate(date);
    }

    private getDateFromTimestamp(timestamp: any): Date {
        return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    }

    // Funktion zur Formatierung des Zeitstempels
    public formatTimestamp(): string {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24-Stunden-Format
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
            text: this.text,
            user: this.user,
            timestamp: this.timestamp, // Dies bleibt als Date-Objekt
            fullDate: this.fullDate
        };
    }
}
