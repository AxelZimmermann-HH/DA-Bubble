export class Channel {
    channelName!: string;
    channelDescription!:string;
    id!: string;
    tagIcon!: string;

    constructor(obj?: any) {
        this.channelName = obj ? obj.channelName : '';
        this.channelDescription = obj ? obj.channelDescription : '';
        this.id = obj ? obj.id : '';
        this.tagIcon = obj ? obj.tagIcon : '';
    }

    public toJson() {
        return {
            channelName:this.channelName,
            channelDescription: this.channelDescription,
            id:this.id,
            tagIcon:this.tagIcon
        }
    }

} 