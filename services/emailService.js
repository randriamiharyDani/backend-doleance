const nodemailer = require('nodemailer');

let transporter = null;

const createTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const verifyConnection = async () => {
  try {
    const t = createTransporter();
    await t.verify();
    console.log('✅ SMTP: Connexion vérifiée avec succès');
    return true;
  } catch (error) {
    console.warn('⚠️ SMTP: Impossible de se connecter —', error.message);
    console.warn('⚠️ Les emails ne seront pas envoyés. Le lien de réinitialisation sera retourné dans la réponse API (mode dev).');
    return false;
  }
};

const sendResetPasswordEmail = async (email, prenom, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: process.env.SMTP_FROM || `"DOLEANCE" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Réinitialisation de votre mot de passe — DOLEANCE',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.10);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F172A,#1E3A8A);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:600;">DOLEANCE</h1>
                    <p style="color:#D4AF37;font-size:12px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Commune Urbaine d'Antananarivo</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#0F172A;font-size:20px;margin:0 0 16px;">Bonjour ${prenom},</h2>
                    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
                      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
                    </p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 32px;">
                          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#1E3A8A,#2E4FA3);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                            Réinitialiser mon mot de passe
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0 0 8px;">
                      Ce lien expirera dans <strong style="color:#475569;">30 minutes</strong>.
                    </p>
                    <p style="color:#94A3B8;font-size:13px;line-height:1.6;margin:0;">
                      Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;">
                    <p style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
                      © ${new Date().getFullYear()} Commune Urbaine d'Antananarivo — Plateforme DOLEANCE
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email envoyé:', info.messageId);
  return info;
};

const sendTransferEmail = async (emailDirection, nomDirection, doleance) => {
  const transporter = createTransporter();

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const mailOptions = {
    from: process.env.SMTP_FROM || `"DOLEANCE" <${process.env.SMTP_USER}>`,
    to: emailDirection,
    subject: `Nouvelle doléance transférée — ${doleance.reference} — ${nomDirection}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.10);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F172A,#1E3A8A);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:600;">DOLEANCE</h1>
                    <p style="color:#D4AF37;font-size:12px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Commune Urbaine d'Antananarivo</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#0F172A;font-size:18px;margin:0 0 8px;">Nouvelle doléance transférée</h2>
                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                      Une doléance a été transférée vers la direction <strong>${nomDirection}</strong>. Veuillez prendre en charge le traitement dans les meilleurs délais.
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:6px 0;width:120px;color:#64748B;font-size:13px;">Référence</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;font-weight:600;font-family:monospace;">${doleance.reference}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#64748B;font-size:13px;">Titre</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;font-weight:600;">${doleance.titre}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#64748B;font-size:13px;">Catégorie</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;">${doleance.categorie || 'Non catégorisée'}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#64748B;font-size:13px;">Priorité</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;">${doleance.priorite || 'Moyenne'}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#64748B;font-size:13px;">Citoyen</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;">${doleance.citoyen_nom || 'Non renseigné'}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#64748B;font-size:13px;">Date de création</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;">${new Date(doleance.date_creation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</td>
                            </tr>
                            ${doleance.lieu_exact ? `
                            <tr>
                              <td style="padding:6px 0;color:#64748B;font-size:13px;">Lieu</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;">${doleance.lieu_exact}</td>
                            </tr>` : ''}
                          </table>
                        </td>
                      </tr>
                    </table>

                    <div style="background-color:#EFF6FF;border-radius:8px;border-left:4px solid #1E3A8A;padding:16px;margin-bottom:24px;">
                      <p style="color:#1E3A8A;font-size:13px;margin:0;font-weight:600;">Description</p>
                      <p style="color:#475569;font-size:13px;line-height:1.6;margin:8px 0 0;white-space:pre-wrap;">${doleance.description || 'Aucune description'}</p>
                    </div>

                    ${doleance.motif ? `
                    <div style="background-color:#FFFBEB;border-radius:8px;border-left:4px solid #D97706;padding:16px;margin-bottom:24px;">
                      <p style="color:#92400E;font-size:13px;margin:0;font-weight:600;">Motif du transfert</p>
                      <p style="color:#78350F;font-size:13px;line-height:1.6;margin:8px 0 0;">${doleance.motif}</p>
                    </div>` : ''}

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 16px;">
                          <a href="${baseUrl}/backoffice/direction/${doleance.id_direction}" style="display:inline-block;background:linear-gradient(135deg,#1E3A8A,#2E4FA3);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                            Traiter la doléance
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#94A3B8;font-size:12px;line-height:1.6;margin:16px 0 0;text-align:center;">
                      Vous pouvez modifier le statut et ajouter une réponse directement depuis l'application.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;">
                    <p style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
                      © ${new Date().getFullYear()} Commune Urbaine d'Antananarivo — Plateforme DOLEANCE
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email de transfert envoyé à:', emailDirection, '| MessageId:', info.messageId);
  return info;
};

const sendStatusUpdateEmail = async (emailCitoyen, prenomCitoyen, doleance, nouveauStatut, commentaire) => {
  const transporter = createTransporter();

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const statutCouleurs = {
    'En traitement': '#9C27B0',
    'Résolue': '#4CAF50',
    'Rejetée': '#F44336',
    'En attente': '#FFC107',
    'Assignée': '#2196F3',
    'Clôturée': '#9E9E9E'
  };

  const couleur = statutCouleurs[nouveauStatut] || '#6B7280';

  const mailOptions = {
    from: process.env.SMTP_FROM || `"DOLEANCE" <${process.env.SMTP_USER}>`,
    to: emailCitoyen,
    subject: `Mise à jour de votre doléance ${doleance.reference} — ${nouveauStatut}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F1F5F9;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,23,42,0.10);">
                <tr>
                  <td style="background:linear-gradient(135deg,#0F172A,#1E3A8A);padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;font-size:22px;margin:0;font-weight:600;">DOLEANCE</h1>
                    <p style="color:#D4AF37;font-size:12px;margin:6px 0 0;letter-spacing:2px;text-transform:uppercase;">Commune Urbaine d'Antananarivo</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#0F172A;font-size:18px;margin:0 0 8px;">Bonjour ${prenomCitoyen},</h2>
                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">
                      Le statut de votre doléance a été mis à jour.
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                      <tr>
                        <td align="center" style="padding:16px;">
                          <span style="display:inline-block;background-color:${couleur};color:#ffffff;padding:10px 28px;border-radius:8px;font-size:16px;font-weight:700;">
                            ${nouveauStatut}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;margin-bottom:24px;">
                      <tr>
                        <td style="padding:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:6px 0;width:120px;color:#64748B;font-size:13px;">Référence</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;font-weight:600;font-family:monospace;">${doleance.reference}</td>
                            </tr>
                            <tr>
                              <td style="padding:6px 0;color:#64748B;font-size:13px;">Titre</td>
                              <td style="padding:6px 0;color:#0F172A;font-size:13px;">${doleance.titre}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    ${commentaire ? `
                    <div style="background-color:#EFF6FF;border-radius:8px;border-left:4px solid #1E3A8A;padding:16px;margin-bottom:24px;">
                      <p style="color:#1E3A8A;font-size:13px;margin:0;font-weight:600;">Commentaire</p>
                      <p style="color:#475569;font-size:13px;line-height:1.6;margin:8px 0 0;white-space:pre-wrap;">${commentaire}</p>
                    </div>` : ''}

                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 16px;">
                          <a href="${baseUrl}/suivi-doleance/${doleance.reference}" style="display:inline-block;background:linear-gradient(135deg,#1E3A8A,#2E4FA3);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
                            Suivre ma doléance
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="background-color:#F8FAFC;padding:24px 40px;border-top:1px solid #E2E8F0;">
                    <p style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
                      © ${new Date().getFullYear()} Commune Urbaine d'Antananarivo — Plateforme DOLEANCE
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log('✅ Email de mise à jour envoyé à:', emailCitoyen, '| MessageId:', info.messageId);
  return info;
};

const isSmtpConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

module.exports = { sendResetPasswordEmail, sendTransferEmail, sendStatusUpdateEmail, isSmtpConfigured, verifyConnection };
