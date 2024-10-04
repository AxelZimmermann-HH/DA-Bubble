import { Timestamp } from "@angular/fire/firestore";

export class Message {
    id!: string;
    text!: string;
    user!: string;
    timestamp!: string; // To store the formatted time

    constructor(obj?: any) {
        this.id = obj ? obj.id : '';
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
        this.timestamp = obj && obj.timestamp ? this.formatTime(obj.timestamp) : this.formatTime(new Date());
    }

   
    private formatTime(timestamp: any): string {
        // Überprüfe, ob timestamp ein Firestore Timestamp ist
        const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // 24-Stunden-Format
        };
    
        // Überprüfe, ob date ein gültiges Datum ist
        if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error('Ungültiges Datum:', date);
            return ''; // Gibt einen leeren String zurück, wenn das Datum ungültig ist
        }
    
        return new Intl.DateTimeFormat('de-DE', options).format(date) + ' Uhr';
    }
    

    public toJson() {
        return {
            id: this.id,
            text: this.text,
            user: this.user,
            timestamp: this.timestamp 
        };
    }
}
