export class Message {

    text!: string;
    user!: string;

    constructor(obj?: any) {
        this.text = obj ? obj.text : '';
        this.user = obj ? obj.user : '';
    }

    public toJson(){
        return{
            text:this.text,
            user:this.user
        }
       
    }
}