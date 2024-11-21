import { Injectable } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { Message } from '../models/message.class';
import { ChatService } from './chat.service';
import { getDownloadURL, uploadBytes } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})

export class FileService {

  fileUrl: SafeResourceUrl | null = null;
  selectedFile: File | null = null;
  fileDownloadUrl: string = '';

  constructor(
    private sanitizer: DomSanitizer,
    private chatService: ChatService) { }

  extractFileName(fileUrl: string): string {
    if (!fileUrl) return '';
    const decodedUrl = decodeURIComponent(fileUrl);

    const parts = decodedUrl.split('/');
    const lastPart = parts[parts.length - 1];

    const fileName = lastPart.split('?')[0];
    return fileName;
  }

  removeFile(message: Message) {
    if (message.fileUrl) {
      const storage = getStorage();
      const fileRef = ref(storage, message.fileUrl);  

      deleteObject(fileRef)
        .then(() => {
          message.fileUrl = '';
          message.fileName = '';
          message.fileType = '';
        })
        .catch((error) => {
          console.error('Fehler beim Löschen der Datei:', error);
        });
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.selectedFile = file; 
      const objectUrl = URL.createObjectURL(file);  
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
      } else {
        this.fileUrl = null;
      }
    }
  }

  setFileUrl(file: File) {
    this.selectedFile = file;
    const objectUrl = URL.createObjectURL(file);
    this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
  }

  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  getFileNameFromUrl(fileUrl: string): string {
    return fileUrl.split('/').pop() || 'Datei';
  }

  closePreview() {
    this.fileUrl = null;
    this.selectedFile = null;
  }
  
  //CHAT-FILE-UPLOAD
  selectedFileName: string = '';  // Neuer Dateiname-String
  selectedFileType: string = '';
  safeFileUrl: SafeResourceUrl | null = null;  // Sichere URL wird hier gespeichert
  fileSize: boolean = false;
  fileType: boolean = false;

  //Datei hinzufügen
  onFileSelectedChat(event: Event) {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return; // Keine Datei ausgewählt
    }

    const file = input.files[0]
    const maxSize = 500 * 1024; // 500 kB in Bytes
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (input.files && input.files[0]) {
      if(!allowedTypes.includes(file.type)){
        this.fileType = true;
        setTimeout(() => {
          this.fileType = false;
        }, 3000);
        return;
      }
      if(file.size > maxSize){
        this.fileSize = true;
        setTimeout(() => {
          this.fileSize = false;
        }, 3000);
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;  // Dateiname speichern
      this.selectedFileType = file.type;
      this.uploadFile()
    }
  }


  //Datei ändern
  async onChangeFileSelected(event: Event, fileToDelete: string) {
    this.deleteFile(fileToDelete); //Alte Datei löschen
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return; // Keine Datei ausgewählt
    }

    const file = input.files[0]
    const maxSize = 500 * 1024; // 500 kB in Bytes
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (input.files && input.files[0]) {
      if(!allowedTypes.includes(file.type)){
        this.fileType = true;
        setTimeout(() => {
          this.fileType = false;
        }, 3000);
        return;
      }
      if(file.size > maxSize){
        this.fileSize = true;
        setTimeout(() => {
          this.fileSize = false;
        }, 3000);
        return;
      }
      this.selectedFile = file;
      this.selectedFileName = file.name;  // Dateiname speichern
      this.selectedFileType = file.type;
      this.uploadFile()
    }
  }
  

  //Holt sich eine sichere URL
  async loadSafeFile(fileUrl: string, fileType:string) {
    if (!fileUrl) {
      console.error('Die Datei-URL ist ungültig.');
      return;
    }
    if(fileType == 'image/png' || 'image/jpeg' || 'application/pdf'){
      this.safeFileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
    }
  }


  //File in den Storage hochladen
  async uploadFile() {
    if (!this.selectedFile) return;

    try {
      const storage = getStorage();
      const storageRef = ref(storage, `files/${this.selectedFileName}`);
      const snapshot = await uploadBytes(storageRef, this.selectedFile);
      const url = await getDownloadURL(snapshot.ref);
      this.fileDownloadUrl = url;

      if (this.selectedFileType == 'application/pdf') {
        console.log('Lade die Datei von URL:', this.fileDownloadUrl);
        await this.loadSafeFile(this.fileDownloadUrl, this.selectedFileType)
      }

      if (this.selectedFileType == 'text/plain') {
        await this.chatService.fetchTextFile(this.fileDownloadUrl)
      }
    } catch (error) {
      console.error('Fehler beim Hochladen der Datei:', error);
    }
  }


  //File im Browser abrufen und laden
  downloadFile(fileDownloadUrl: string, fileName: string) {
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