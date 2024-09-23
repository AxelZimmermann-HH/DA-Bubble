export class Channel {
    channelName!: string;
    id!: string;
    tagIcon!: string;

    constructor(obj?: any) {
        this.channelName = obj ? obj.channelName : '';
        this.id = obj ? obj.id : '';
        this.tagIcon = obj ? obj.tagIcon : '';
    }

    public toJson() {
        return {
            channelName:this.channelName,
            id:this.id,
            tagIcon:this.tagIcon
        }
    }

} 