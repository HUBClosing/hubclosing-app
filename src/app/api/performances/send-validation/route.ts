import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/performances/[id]/send-validation — envoyer un email de validation au HOS
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const { id } = params;
  const body = await req.json();
  const hosEmail = body.hos_email?.trim();

  if (!hosEmail) {
    return NextResponse.json({ error: 'Email du HOS requis' }, { status: 400 });
  }

  // Récupérer la performance
  const { data: perf } = await supabase
    .from('performance_records')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!perf) {
    return NextResponse.json({ error: 'Performance non trouvée' }, { status: 404 });
  }

  if (perf.is_verified) {
    return NextResponse.json({ error: 'Déjà vérifiée' }, { status: 400 });
  }

  // Mettre à jour l'email HOS et régénérer le token
  const { data: updated, error: updateErr } = await supabase
    .from('performance_records')
    .update({
      hos_email: hosEmail,
      validation_token: crypto.randomUUID(),
      validation_token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({ error: 'Erreur mise à jour token' }, { status: 500 });
  }

  // Récupérer le nom du candidat
  const { data: candidat } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user.id)
    .single();

  const candidatName = candidat?.full_name || candidat?.email || 'Un candidat';
  const validationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hubclosing.fr'}/validate-performance/${updated.validation_token}`;

  // Envoyer l'email via Resend
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'HUBClosing <noreply@hubclosing.fr>',
      to: hosEmail,
      subject: `Validation de performance — ${candidatName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; background: #F05A28; color: white; font-size: 24px; font-weight: bold; width: 50px; height: 50px; line-height: 50px; border-radius: 12px;">H</div>
            <h1 style="color: #0A0F08; margin-top: 10px;">HUBClosing</h1>
          </div>

          <p style="color: #333;">Bonjour ${perf.hos_name},</p>

          <p style="color: #333;"><strong>${candidatName}</strong> vous demande de valider ses performances pour l'événement suivant :</p>

          <div style="background: #f9f9f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #666;">Événement</td><td style="padding: 6px 0; font-weight: bold;">${perf.event_name}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Type</td><td style="padding: 6px 0;">${perf.event_type}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Date</td><td style="padding: 6px 0;">${new Date(perf.event_date).toLocaleDateString('fr-FR')}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Calls agenda</td><td style="padding: 6px 0;">${perf.calls_scheduled}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Calls pris</td><td style="padding: 6px 0;">${perf.calls_completed}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">CA encaissé</td><td style="padding: 6px 0;">${Number(perf.revenue_collected).toLocaleString('fr-FR')} €</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">CA facturé</td><td style="padding: 6px 0;">${Number(perf.revenue_invoiced).toLocaleString('fr-FR')} €</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">No-shows</td><td style="padding: 6px 0;">${perf.no_shows}</td></tr>
              <tr><td style="padding: 6px 0; color: #666;">Annulations</td><td style="padding: 6px 0;">${perf.cancellations}</td></tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${validationUrl}" style="display: inline-block; background: #F05A28; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px;">
              Valider ces performances
            </a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center;">
            Ce lien est valable 30 jours. Si vous n'êtes pas concerné, vous pouvez ignorer cet email.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'Email envoyé' });
  } catch (emailErr: any) {
    console.error('Email send error:', emailErr);
    // Même si l'email échoue, on retourne le lien de validation
    return NextResponse.json({
      success: true,
      message: 'Token généré (erreur envoi email)',
      validation_url: validationUrl,
    });
  }
}
