import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

// POST /api/admin/invite-coach — Inviter un coach par email
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  // Vérifier admin
  const serviceClient = getSupabaseAdmin();
  const { data: adminUser } = await serviceClient
    .from('users')
    .select('role, role_type')
    .eq('id', authUser.id)
    .single();

  if (!adminUser || (adminUser.role !== 'admin' && adminUser.role_type !== 'admin')) {
    return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 });
  }

  const body = await req.json();
  const { email, name } = body;

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  }

  // Vérifier qu'il n'existe pas déjà une invitation active pour cet email
  const { data: existing } = await serviceClient
    .from('coach_invitations')
    .select('id, used_at, expires_at')
    .eq('email', email.toLowerCase())
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'Une invitation active existe déjà pour cet email' }, { status: 409 });
  }

  // Générer un token unique
  const token = randomBytes(32).toString('hex');

  // Créer l'invitation
  const { data: invitation, error } = await serviceClient
    .from('coach_invitations')
    .insert({
      email: email.toLowerCase(),
      token,
      invited_by: authUser.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Erreur création invitation coach:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l\'invitation' }, { status: 500 });
  }

  // Envoyer l'email d'invitation via Resend
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hubclosing.fr';
  const registerUrl = `${appUrl}/auth/coach-register/${token}`;

  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'HUBClosing <noreply@hubclosing.fr>',
          to: email.toLowerCase(),
          subject: 'Invitation Coach — HUBClosing',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #D4A853;">
                <h1 style="color: #1B2A4A; margin: 0;">HUBClosing</h1>
              </div>
              <div style="padding: 30px 0;">
                <h2 style="color: #1B2A4A;">Bienvenue en tant que Coach !</h2>
                <p style="color: #555; line-height: 1.6;">
                  ${name ? `Bonjour ${name},` : 'Bonjour,'}<br><br>
                  Vous avez été invité(e) à rejoindre HUBClosing en tant que <strong>Coach</strong>.
                  Vous pourrez organiser des événements de coaching en ligne pour notre communauté de closers.
                </p>
                <div style="text-align: center; padding: 20px 0;">
                  <a href="${registerUrl}" style="display: inline-block; background: #D4A853; color: #1B2A4A; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                    Créer mon compte Coach
                  </a>
                </div>
                <p style="color: #888; font-size: 13px; text-align: center;">
                  Ce lien expire dans 7 jours.
                </p>
              </div>
              <div style="border-top: 1px solid #eee; padding-top: 15px; text-align: center;">
                <p style="color: #aaa; font-size: 12px;">© HUBClosing — La marketplace du closing</p>
              </div>
            </div>
          `,
        }),
      });
    }
  } catch (emailError) {
    console.error('Erreur envoi email invitation coach:', emailError);
    // L'invitation est créée même si l'email échoue
  }

  return NextResponse.json({
    success: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      register_url: registerUrl,
      expires_at: invitation.expires_at,
    },
  });
}

// GET /api/admin/invite-coach — Lister les invitations
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

  const serviceClient = getSupabaseAdmin();
  const { data: adminUser } = await serviceClient
    .from('users')
    .select('role, role_type')
    .eq('id', authUser.id)
    .single();

  if (!adminUser || (adminUser.role !== 'admin' && adminUser.role_type !== 'admin')) {
    return NextResponse.json({ error: 'Réservé aux administrateurs' }, { status: 403 });
  }

  const { data: invitations } = await serviceClient
    .from('coach_invitations')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ invitations: invitations || [] });
}
