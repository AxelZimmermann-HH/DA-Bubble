import { Injectable } from '@angular/core';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { Message } from '../models/message.class';

@Injectable({
  providedIn: 'root'
})

export class FileService {

  fileUrl: SafeResourceUrl | null = null;
  selectedFile: File | null = null;
  fileDownloadUrl!: string;

  constructor(private sanitizer: DomSanitizer) { }

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
}