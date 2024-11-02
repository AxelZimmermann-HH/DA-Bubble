import * as nodemailer from 'nodemailer';
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Konfiguration für den E-Mail-Versand
const transporter = nodemailer.createTransport({
  service: 'Gmail', // Du kannst auch andere SMTP-Dienste verwenden
  auth: {
    user: 'deine-email@gmail.com', // Deine E-Mail-Adresse
    pass: 'dein-passwort', // Dein E-Mail-Passwort (achte auf die Sicherheit!)
  },
});

// Firebase Function zum Versenden der E-Mail
export const sendEmail = onRequest(async (request, response) => {
  const { email, message, fileUrl } = request.body;

  const mailOptions = {
    from: 'deine-email@gmail.com',
    to: email,
    subject: 'Nachricht von deiner App',
    text: message,
    html: fileUrl ? `<p>${message}</p><p><a href="${fileUrl}">Hier ist dein Anhang</a></p>` : message,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`E-Mail wurde an ${email} gesendet.`);
    response.status(200).send('E-Mail wurde gesendet');
  } catch (error) {
    logger.error('Fehler beim Senden der E-Mail:', error);
    response.status(500).send('Fehler beim Senden der E-Mail');
  }
});

