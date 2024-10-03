export class directMessage {

    text!: string;
    senderId!: string;
    receiverId!: string;
    dayDateMonth!: string;
    time!: string;
    timestamp!: string;

    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.senderId = obj ? obj.senderID : '';
        this.receiverId = obj ? obj.receiverID : '';
        this.dayDateMonth = obj ? obj.dayDateMonth : '';
        this.time = obj ? obj.time : '';
        this.timestamp = obj ? obj.timestamp : '';
    }

    public toJson(){
        return{
            text:this.text,
            senderID:this.senderId,
            receiverID:this.receiverId,
            dayDateMonth:this.dayDateMonth,
            time:this.time,
            timestamp:this.timestamp,
        }
       
    }
}