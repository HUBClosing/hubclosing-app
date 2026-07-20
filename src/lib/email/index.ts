/**
 * Module email HUBClosing
 *
 * Usage:
 *   import { sendEmail } from '@/lib/email';
 *   import { welcomeEmail } from '@/lib/email/templates/welcome';
 *
 *   const { subject, html } = welcomeEmail({ ... });
 *   await sendEmail({ to: 'user@example.com', subject, html });
 */

export { sendEmail } from './resend';
export type { SendEmailOptions } from './resend';
