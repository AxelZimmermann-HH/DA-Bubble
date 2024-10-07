import { Timestamp } from "@angular/fire/firestore";

export class Answer {
    text!: string;
    user!: string;
    timestamp!: Date;

    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
        const date = obj && obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
        this.timestamp = date; 
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
        };
    }
}
