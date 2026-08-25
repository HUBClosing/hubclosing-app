import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

const ADMIN_EMAIL = 'clcb.pro@gmail.com';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { context, error: errorMsg, userId, userEmail, metadata } = body;

    if (!context || !errorMsg) {
      return NextResponse.json({ error: 'Missing context or error' }, { status: 400 });
    }

    // Log to server console
    console.error(`[ERROR-REPORT] ${context}:`, {
      error: errorMsg,
      userId,
      userEmail,
      metadata,
      timestamp: new Date().toISOString(),
    });

    // Send alert email to admin
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 18px;">Erreur utilisateur sur HUBClosing</h2>
        </div>
        <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0 0 12px;"><strong>Contexte :</strong> ${context}</p>
          <p style="margin: 0 0 12px;"><strong>Erreur :</strong> <code style="background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 4px;">${errorMsg}</code></p>
          ${userId ? `<p style="margin: 0 0 12px;"><strong>User ID :</strong> ${userId}</p>` : ''}
          ${userEmail ? `<p style="margin: 0 0 12px;"><strong>Email :</strong> ${userEmail}</p>` : ''}
          ${metadata ? `<p style="margin: 0 0 12px;"><strong>Metadata :</strong> <pre style="background: #f9fafb; padding: 8px; border-radius: 4px; font-size: 12px;">${JSON.stringify(metadata, null, 2)}</pre></p>` : ''}
          <p style="margin: 12px 0 0; color: #6b7280; font-size: 13px;">${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}</p>
        </div>
      </div>
    `;

    sendEmail({
      to: ADMIN_EMAIL,
      subject: `[HUBCLOSING] Erreur: ${context}`,
      html,
    }).catch(() => {}); // fire and forget

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
