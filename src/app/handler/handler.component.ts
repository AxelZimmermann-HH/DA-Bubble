import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-handler',
  template: `<p>Verarbeite Anfrage...</p>`,
})
export class HandlerComponent implements OnInit {
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    // Query-Parameter auslesen
    this.route.queryParams.subscribe((params) => {
      const mode = params['mode']; // z. B. verifyAndChangeEmail, resetPassword
      const oobCode = params['oobCode']; // Firebase-Aktionscode

      if (!mode || !oobCode) {
        console.error('Ungültige oder fehlende Parameter');
        return;
      }

      // Weiterleitung basierend auf dem Modus
      if (mode === 'verifyAndChangeEmail') {
        this.router.navigate(['/mail-changed'], { queryParams: { oobCode } });
      } else if (mode === 'resetPassword') {
        this.router.navigate(['/reset'], { queryParams: { oobCode } });
      } else {
        console.error('Unbekannter Modus:', mode);
      }
    });
  }
}

