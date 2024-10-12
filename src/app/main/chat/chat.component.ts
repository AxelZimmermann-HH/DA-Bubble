import { AfterViewChecked, AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogUserProfilComponent } from '../dialog-user-profil/dialog-user-profil.component';
import { User } from '../../models/user.class';
import { UserService } from '../../services/user.service';
import { ActivatedRoute, Route } from '@angular/router';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, StorageReference, getMetadata } from '@angular/fire/storage';  // Firebase Storage imports
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatDialogModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements AfterViewInit, AfterViewChecked{

  directMessage = new FormControl('', [Validators.required, Validators.minLength(2)]);
  editedMessage = new FormControl('', [Validators.required, Validators.minLength(2)]);
  file = new FormControl('', [Validators.required, Validators.minLength(2)]);

  editingMessageId: string | null = null;
  currentUser: any|string;
  currentUserId: string = '';
  user = new User();
  chat: any;
 
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  

  constructor(
    public chatService: ChatService, 
    public dialog: MatDialog, 
    public userService: UserService,
    public route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}


  getAvatarForUser(userName: string):any {

    if (userName === this.user.name) {
      if (this.userService.isNumber(this.user.avatar)) {
        return './assets/avatars/avatar_' + this.user.avatar + '.png';  // Local asset avatar
      } else { 
        return this.user.avatar;  // External URL avatar
      }
    }
    return './assets/avatars/avatar_0.png';  // Default avatar when user not found
  }


  // Scrollen direkt nach dem Initialisieren der View
  ngAfterViewInit() {
    this.scrollToBottom();
  };


  // scrollen, wenn die View aktualisiert wird
  ngAfterViewChecked() {
    this.scrollToBottom();
  };


  async ngOnInit() {
    // Abonniere Benutzerdaten
    this.chatService.user$.subscribe((userData) => {
      if (userData) {
        this.user = userData;
      }
    });


    // Abonniere aktuellen Benutzer
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.currentUserId = user.userId;
      }
    });
    

    // Abonniere und lade den Chat
    this.chatService.chat$.subscribe((chatSubject) => {
      if (chatSubject && chatSubject.length > 0) {
        this.chatService.chatIsEmpty = false;
        this.chat = chatSubject;
      }
    });


    this.route.params.subscribe(params => {
      const userId = params['userId'];
  });
  };


  //sendet neue DM an den Chat Service
  async sendDirectMessage() {
    const newDm = this.directMessage.value!;
    const fileDownloadUrl = this.fileDownloadUrl;
    const fileName = this.selectedFileName;
    const fileType = this.selectedFileType;
    await this.chatService.setChatData(newDm, fileDownloadUrl, fileName, fileType, this.currentUserId);
    this.directMessage.setValue('');
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedFileType = '';
  };


  //scrollt das Chatfenster nach unten
  scrollToBottom(): void {
    if (!this.chatService.chatIsEmpty && this.chatContainer) {
      try {
          this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      } catch (err) {
        console.error('Scrollen fehlgeschlagen:', err);
      }
    }
  };


  //öffnet das User Profil im Chatfenster
  openUserProfil(user: any) {
    this.dialog.open(DialogUserProfilComponent, { data: user });
  };


  //checkt das Datum im Chatfenster, ob es mit dem heutigen übereinstimmt
  isToday(dateString: string): boolean {
    const today = new Date();
    const date = new Date(dateString);

    return today.getFullYear() === date.getFullYear() &&
           today.getMonth() === date.getMonth() &&
           today.getDate() === date.getDate();
  };

  
  // öffnet das Bearbeitungsfeld
  editDirectMessage(message:any){
    this.editingMessageId = message.messageId;
    this.editedMessage.setValue(message.text)
  }


  // schlie0t das Bearbeitungsfeld, ohne Speichern
  cancelEditing() {
    this.editingMessageId = null;
  }


  // setzt die bearbeitete Nachricht 
  async setEditedDirectMessage(message:any){
    const editedDM = this.editedMessage.value!;
    await this.chatService.setEditedChatData(editedDM, message);
    this.editedMessage.setValue('');
    this.editingMessageId = null;
  }


  //FILE-UPLOAD
  selectedFile: File | null = null;
  selectedFileName: string = '';  // Neuer Dateiname-String
  selectedFileType: string = '';
  fileDownloadUrl: string = '';


  //Datei hinzufügen
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;  // Dateiname speichern
      this.selectedFileType = input.files[0]['type'];
      this.uploadFile()
    }
    
  }


  //Datei ändern
  async onChangeFileSelected(event: Event, fileToDelete:string) {
    this.deleteFile(fileToDelete); //Alte Datei löschen
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;  // Dateiname speichern
      this.selectedFileType = input.files[0]['type'];
      await this.uploadFile()
    }
  }
  safeUrl: SafeResourceUrl | null = null;  // Sichere URL wird hier gespeichert
  
  async loadSafeFile(fileUrl: string) {
    if (!fileUrl) {
      console.error('Die Datei-URL ist ungültig.');
      return;
    }
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
  }

  //File in den Storage hochladen
  async uploadFile() {
    if (!this.selectedFile) return;

    try {
      // Initialisiere Firebase Storage
      const storage = getStorage();
      const storageRef = ref(storage, `files/${this.selectedFileName}`);
  
      // Lade die Datei hoch
      const snapshot = await uploadBytes(storageRef, this.selectedFile);

      // Hol die URL der hochgeladenen Datei
      const url = await getDownloadURL(snapshot.ref);
      this.fileDownloadUrl = url;
      
      if(this.selectedFileType == 'application/pdf'){
        console.log('Lade die Datei von URL:', this.fileDownloadUrl);
        await this.loadSafeFile(this.fileDownloadUrl)
      }
      if(this.selectedFileType == 'text/plain'){
        await this.chatService.fetchTextFile(this.fileDownloadUrl)
      }
      } catch (error) {
        console.error('Fehler beim Hochladen der Datei:', error);
      }
  }


  //File im Browser abrufen und laden
  downloadFile(fileDownloadUrl:string, fileName:string){
       // Erstellen eines unsichtbaren Links
       const link = document.createElement('a');
       link.href = fileDownloadUrl;
       link.target = '_blank';
       link.download = fileName;
       // Anhängen des Links an das Dokument
       document.body.appendChild(link);
   
       // Automatisches Klicken des Links, um den Download zu starten
       link.click();
   
       // Entfernen des Links nach dem Download
       document.body.removeChild(link);
  }


  //Datei löschen
  deleteFile(fileName: string) {
    // Firebase Storage initialisieren
    const storage = getStorage();
    const fileRef = ref(storage, '/files/' + fileName);

    // Datei löschen
    deleteObject(fileRef).then(() => {
      console.log('Datei erfolgreich gelöscht');
    }).catch((error) => {
      console.error('Fehler beim Löschen der Datei:', error);
    });
  }
}
