export class Channel {
    channelName!: string;
    channelDescription!:string;
    id!: string;
    tagIcon!: string;
    member!:[];

    constructor(obj?: any) {
        this.channelName = obj ? obj.channelName : '';
        this.channelDescription = obj ? obj.channelDescription : '';
        this.id = obj ? obj.id : '';
        this.tagIcon = obj ? obj.tagIcon : '';
        this.member = obj ? obj.member : [];
    }

    public toJson() {
        return {
            channelName:this.channelName,
            channelDescription: this.channelDescription,
            id:this.id,
            tagIcon:this.tagIcon,
            member:this.member
        }
    }
} 