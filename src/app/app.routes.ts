import { Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { LoginComponent } from './login/login.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { ImprintComponent } from './login/imprint/imprint.component';
import { PrivacyPolicyComponent } from './login/privacy-policy/privacy-policy.component';



export const routes: Routes = [
    { path: 'login', component: LoginComponent, },
    { path: 'login/:userId', component: MainComponent },
    { path: 'imprint', component: ImprintComponent },
    { path: 'privacy-policy', component: PrivacyPolicyComponent },
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'reset', component: PasswordResetComponent }
];
