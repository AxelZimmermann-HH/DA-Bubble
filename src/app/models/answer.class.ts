import { Timestamp } from "@angular/fire/firestore";
import { EmojiData } from './emoji-data.models';

export class Answer {
    id!: string;
    messageId!: string;
    text!: string;
    user!: string;
    timestamp!: Date;
    isEditing: boolean = false;
    editedText: string = '';
    emojis: EmojiData[] = [];
    fileUrl?: string;
    fileType?: string;
    fileName?: string;


    constructor(obj?: any) {
        this.id = obj?.id;
        this.messageId = obj?.messageId; // ID der zugehörigen Nachricht

        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';

        const date = obj && obj.timestamp ? this.getDateFromTimestamp(obj.timestamp) : new Date();
        this.timestamp = date;

        this.editedText = this.text;

        this.emojis = (obj?.emojis || []).map((e: any) =>
            typeof e === 'string' ? { emoji: e, userIds: [] } : e
        );
        this.fileUrl = obj?.fileUrl;
        this.fileType = obj?.fileType;
        this.fileName = obj?.fileName;
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
        const json: any = {
            id: this.id,
            messageId: this.messageId,
            text: this.text,
            user: this.user,
            timestamp: this.timestamp,
            emojis: this.emojis,
        };

        if (this.fileUrl) json.fileUrl = this.fileUrl;
        if (this.fileType) json.fileType = this.fileType;
        if (this.fileName) json.fileName = this.fileName;

        return json;
    }
    public hasFile(): boolean {
        return !!this.fileUrl;
    }



}
