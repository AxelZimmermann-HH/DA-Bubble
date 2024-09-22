export class User {
    avatar!: number;
    mail!: string;
    name!: string;
    online!: boolean;
    userId!: string;

    constructor(obj?:any){
        this.avatar = obj? obj.avatar:'';
        this.mail = obj? obj.mail:'';
        this.name = obj? obj.name:'';
        this.online = obj? obj.online:'';
        this.userId = obj? obj.userId:'';
    }

    public toJson(){
        return {
            avatar:this.avatar,
            mail:this.mail,
            name:this.name,
            online:this.online,
            userId:this.userId
        }
    }
}