export class directMessage {

    text!: string;
    senderID!: string;
    receiverID!: string;
    dayDateMonth!: string;
    time!: string;
    timestamp!: string;

    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.senderID = obj ? obj.senderID : '';
        this.receiverID = obj ? obj.receiverID : '';
        this.dayDateMonth = obj ? obj.dayDateMonth : '';
        this.time = obj ? obj.time : '';
        this.timestamp = obj ? obj.timestamp : '';
    }

    public toJson(){
        return{
            text:this.text,
            senderID:this.senderID,
            receiverID:this.receiverID,
            dayDateMonth:this.dayDateMonth,
            time:this.time,
            timestamp:this.timestamp,
        }
       
    }
}