export class directMessage {

    text!: string;
    senderId!: string;
    receiverId!: string;
    dayDateMonth!: string;
    time!: string;
    timestamp!: string;
    messageId!: string;
    chatId!: string;
    fileDownloadUrl!: string;
    fileName!: string;


    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.senderId = obj ? obj.senderID : '';
        this.receiverId = obj ? obj.receiverID : '';
        this.dayDateMonth = obj ? obj.dayDateMonth : '';
        this.time = obj ? obj.time : '';
        this.timestamp = obj ? obj.timestamp : '';
        this.messageId = obj ? obj.messageId : '';
        this.chatId = obj ? obj.chatId : '';
        this.fileDownloadUrl = obj ? obj.fileDownloadUrl : '';
        this.fileName = obj ? obj.fileName : '';
    }

    public toJson(){
        return{
            text:this.text,
            senderID:this.senderId,
            receiverID:this.receiverId,
            dayDateMonth:this.dayDateMonth,
            time:this.time,
            timestamp:this.timestamp,
            messageId:this.messageId,
            chatId:this.chatId,
            fileDownloadUrl:this.fileDownloadUrl,
            fileName:this.fileName,
        }
       
    }
}