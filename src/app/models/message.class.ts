

export class Message {
    id!: string;
    text!: string;
    user!: string;
    
    constructor(obj?: any) {
        this.id = obj ? obj.id : '';
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
    }

    public toJson() {
        return {
            id: this.id,
            text: this.text,
            user: this.user
        }

    }
}