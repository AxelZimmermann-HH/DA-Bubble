import { Timestamp } from "@angular/fire/firestore";

export class Message {

    text!: string;
    user!: string;
    timestamp!: string; // Formatiert für Uhrzeit
    fullDate!: string;  // Formatiert für das vollständige Datum

    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
        const date = obj && obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
        this.timestamp = this.formatTime(date); // Nur Uhrzeit
        this.fullDate = this.formatFullDate(date); // Volles Datum
    }

    // Funktion zum Abrufen eines gültigen Date-Objekts
    private getDateFromTimestamp(timestamp: any): Date {
        return timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    }

    // Funktion zur Zeitformatierung (Stunden, Minuten)
    private formatTime(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24-Stunden-Format
        };
        return new Intl.DateTimeFormat('de-DE', options).format(date) + ' Uhr';
    }

    // Funktion zur Datum-Formatierung
    private formatFullDate(date: Date): string {
        const today = new Date();
        // Wenn das Datum von heute ist, "Heute" anzeigen
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
            timestamp: this.timestamp,
            fullDate: this.fullDate
        };
    }
}
