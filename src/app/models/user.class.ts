export class User {
<<<<<<< HEAD
    avatar!: string;
=======
    avatar!: number | string;
>>>>>>> b02bec0afb9cc71f1ae046377ed6be2e77caa741
    mail!: string;
    name!: string;
    online!: boolean;
    password!: string;
    userId!: string;
    

    constructor(obj?:any){
        this.avatar = obj? obj.avatar:'';
        this.mail = obj? obj.mail:'';
        this.name = obj? obj.name:'';
        this.online = obj? obj.online:'';
        this.password = obj ? obj.password : '';
        this.userId = obj? obj.userId:'';
    }

    public toJson(){
        return {
            avatar:this.avatar,
            mail:this.mail,
            name:this.name,
            online:this.online,
            password: this.password,
            userId:this.userId
        }
    }
}