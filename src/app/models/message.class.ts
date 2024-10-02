export class Message {
    id!: string;
    text!: string;
    user!: string;
    timestamp!: string; // To store the formatted time

    constructor(obj?: any) {
        this.id = obj ? obj.id : '';
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
        this.timestamp = obj ? this.formatTime(obj.timestamp || new Date()) : ''; 
    }

   
    private formatTime(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Ensure 24-hour format
        };
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
