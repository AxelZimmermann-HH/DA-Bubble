import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { getFunctions, provideFunctions } from '@angular/fire/functions';
import { getStorage, provideStorage } from '@angular/fire/storage';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideFirebaseApp(() => 
    initializeApp({"projectId":"da-bubble-8cc28",
    "appId":"1:380502943179:web:4f36bdcdc4230e89ccc24e",
    "storageBucket":"da-bubble-8cc28.appspot.com",
    "apiKey":"AIzaSyATkchfPwpyL6G3Y4_K1awoeA1M52agBmk",
    "authDomain":"da-bubble-8cc28.firebaseapp.com",
    "messagingSenderId":"380502943179"})), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore()), 
    provideAnimationsAsync(), provideAnimationsAsync()]
};
