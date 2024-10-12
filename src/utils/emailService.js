const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const sendVerificationEmail = async (to, token) => {
  const verificationUrl = `${BASE_URL}/verify-email?token=${token}`;
  
  await transporter.sendMail({
    from: '"Couchsurfing MVP" <noreply@qrdcorp.com>',
    to: to,
    subject: "Vérifiez votre adresse email",
    html: `
      <h1>Bienvenue sur Couchsurfing MVP</h1>
      <p>Cliquez sur le lien suivant pour vérifier votre adresse email :</p>
      <a href="${verificationUrl}">${verificationUrl}</a>
      <p>Ce lien expirera dans 24 heures.</p>
    `
  });
};

const sendPasswordResetEmail = async (to, token) => {
  const resetUrl = `${BASE_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: '"Couchsurfing MVP" <noreply@qrdcorp.com>',
    to: to,
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <h1>Réinitialisation de mot de passe</h1>
      <p>Vous avez demandé une réinitialisation de mot de passe. Cliquez sur le lien suivant pour réinitialiser votre mot de passe :</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>Ce lien expirera dans 1 heure.</p>
      <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
    `
  });
};

const sendBookingConfirmationEmail = async (to, bookingDetails) => {
  await transporter.sendMail({
    from: '"Couchsurfing MVP" <noreply@qrdcorp.com>',
    to: to,
    subject: "Confirmation de votre réservation",
    html: `
      <h1>Confirmation de réservation</h1>
      <p>Votre réservation a été confirmée :</p>
      <ul>
        <li>Hébergement : ${bookingDetails.listingTitle}</li>
        <li>Hôte : ${bookingDetails.hostName}</li>
        <li>Date d'arrivée : ${bookingDetails.startDate}</li>
        <li>Date de départ : ${bookingDetails.endDate}</li>
      </ul>
      <p>Profitez de votre séjour !</p>
    `
  });
};

const sendEmailWrapper = async (emailFunction, ...args) => {
  try {
    await emailFunction(...args);
    console.log(`Email sent successfully to ${args[0]}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendVerificationEmail: (...args) => sendEmailWrapper(sendVerificationEmail, ...args),
  sendPasswordResetEmail: (...args) => sendEmailWrapper(sendPasswordResetEmail, ...args),
  sendBookingConfirmationEmail: (...args) => sendEmailWrapper(sendBookingConfirmationEmail, ...args)
};