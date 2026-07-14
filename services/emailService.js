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

const isSmtpConfigured = () => {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
};

module.exports = { sendResetPasswordEmail, isSmtpConfigured, verifyConnection };
