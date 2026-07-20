import { Resend } from 'resend';

/**
 * Client Resend pour l'envoi d'emails transactionnels.
 *
 * Clé API Resend requise dans .env.local :
 *   RESEND_API_KEY=re_xxxxxxxxx
 *
 * Domaine expéditeur configuré dans Resend Dashboard :
 *   noreply@hubclosing.fr
 */

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY manquante — configure-la dans .env.local');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// Expéditeur par défaut
const FROM_EMAIL = process.env.EMAIL_FROM || 'HUBClosing <noreply@hubclosing.fr>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

/**
 * Envoie un email via Resend.
 * Retourne l'ID du message ou null si l'envoi échoue (fail silencieux en dev).
 */
export async function sendEmail(options: SendEmailOptions): Promise<string | null> {
  // En développement sans clé, on log et on skip
  if (!process.env.RESEND_API_KEY) {
    console.log(`📧 [DEV] Email skipped (no RESEND_API_KEY):`);
    console.log(`  To: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
    console.log(`  Subject: ${options.subject}`);
    return null;
  }

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
    });

    if (error) {
      console.error('Resend error:', error);
      return null;
    }

    console.log(`📧 Email sent: ${options.subject} → ${options.to} (id: ${data?.id})`);
    return data?.id || null;
  } catch (err) {
    console.error('Email send failed:', err);
    return null;
  }
}
