import { User } from "./user.class";

export class Channel {
    channelName!: string;
    channelDescription!:string;
    id!: string;
    tagIcon!: string;
    members!: User[];
    creatorName!: string; 

    constructor(obj?: any) {
        this.channelName = obj ? obj.channelName : '';
        this.channelDescription = obj ? obj.channelDescription : '';
        this.id = obj ? obj.id : '';
        this.tagIcon = obj ? obj.tagIcon : '';
        this.members = Array.isArray(obj?.members) ? obj.members : []; 
        this.creatorName = obj ? obj.creatorName : '';
    }

    public toJson() {
        return {
            channelName:this.channelName,
            channelDescription: this.channelDescription,
            id:this.id,
            tagIcon:this.tagIcon,
            members: this.members,
            creatorName: this.creatorName
        }
    }
} 