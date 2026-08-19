import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/crm/invite — inviter un closer externe (par email)
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { event_id, closer_name, closer_email } = body;

    if (!event_id || !closer_name?.trim() || !closer_email?.trim()) {
      return NextResponse.json({ error: 'event_id, closer_name et closer_email requis' }, { status: 400 });
    }

    // Vérifier que l'événement appartient au recruteur
    const { data: event } = await supabase
      .from('recruiter_events')
      .select('id, title')
      .eq('id', event_id)
      .eq('recruiter_id', user.id)
      .single();

    if (!event) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    // Vérifier si le closer existe déjà sur HUBClosing
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('email', closer_email.trim().toLowerCase())
      .maybeSingle();

    const closerId = existingUser?.id || null;

    // Vérifier pas de doublon
    if (closerId) {
      const { data: existing } = await supabase
        .from('event_assignments')
        .select('id')
        .eq('event_id', event_id)
        .eq('closer_id', closerId)
        .neq('status', 'removed')
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'Ce closer est déjà assigné à cet événement' }, { status: 409 });
      }
    } else {
      const { data: existingByEmail } = await supabase
        .from('event_assignments')
        .select('id')
        .eq('event_id', event_id)
        .eq('closer_email', closer_email.trim().toLowerCase())
        .neq('status', 'removed')
        .maybeSingle();

      if (existingByEmail) {
        return NextResponse.json({ error: 'Cet email est déjà invité à cet événement' }, { status: 409 });
      }
    }

    // Créer l'assignation
    const { data: assignment, error } = await supabase
      .from('event_assignments')
      .insert({
        event_id,
        closer_id: closerId,
        closer_name: closer_name.trim(),
        closer_email: closer_email.trim().toLowerCase(),
        status: closerId ? 'assigned' : 'invited',
        invited_at: new Date().toISOString(),
        joined_at: closerId ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Envoyer email d'invitation si le closer n'est pas sur la plateforme
    if (!closerId) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const recruiterName = (await supabase.from('users').select('full_name').eq('id', user.id).single()).data?.full_name || 'Un recruteur';

        await resend.emails.send({
          from: 'HUBClosing <noreply@hubclosing.fr>',
          to: closer_email.trim(),
          subject: `${recruiterName} vous invite sur HUBClosing — ${event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #0A0F08; font-size: 24px;">HUBClosing</h1>
              </div>
              <h2 style="color: #0A0F08;">Bonjour ${closer_name.trim()},</h2>
              <p style="color: #374151; line-height: 1.6;">
                <strong>${recruiterName}</strong> vous invite à rejoindre son équipe de closers
                pour l'événement <strong>"${event.title}"</strong> sur HUBClosing.
              </p>
              <p style="color: #374151; line-height: 1.6;">
                HUBClosing est la marketplace qui connecte les closers aux infopreneurs.
                Créez votre profil gratuitement pour rejoindre cet événement.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://hubclosing.fr/auth/register"
                  style="background-color: #F05A28; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                  Créer mon profil
                </a>
              </div>
              <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
                HUBClosing — La marketplace des closers
              </p>
            </div>
          `,
        });
      } catch {
        // L'invitation email est best-effort, ne pas bloquer si ça échoue
        console.error('Erreur envoi email invitation closer');
      }
    }

    return NextResponse.json({
      assignment,
      is_new_user: !closerId,
      message: closerId
        ? 'Closer assigné avec succès'
        : 'Invitation envoyée par email',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
