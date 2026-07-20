import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRemainingContacts } from '@/types/database';

// UUID v4 regex pour validation
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/contacts
 * Body: { candidate_id: string }
 *
 * Initie un contact avec un candidat (MÉTHODE POST — pas GET pour éviter CSRF) :
 * 1. Valide le format UUID du candidate_id
 * 2. Vérifie que l'utilisateur est recruteur
 * 3. Vérifie si une conversation existe déjà
 * 4. Vérifie le quota contacts_per_month
 * 5. Crée la conversation + incrémente le compteur (atomique via RPC ou double-check)
 * 6. Notifie le candidat
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 1. Auth
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // 2. Parse body
  let body: { candidate_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 });
  }

  const candidateId = body.candidate_id;

  // 3. Validation UUID (anti-injection SQL)
  if (!candidateId || !UUID_RE.test(candidateId)) {
    return NextResponse.json({ error: 'candidate_id invalide' }, { status: 400 });
  }

  // 4. Récupérer le profil utilisateur
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 });
  }

  // 5. Vérifier rôle recruteur
  const isRecruiter =
    user.role_type === 'recruiter' ||
    (user.role_type === 'both' && user.active_role === 'recruiter') ||
    user.role === 'manager' ||
    user.role_type === 'admin';

  if (!isRecruiter) {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 });
  }

  // 6. Pas de self-contact
  if (candidateId === user.id) {
    return NextResponse.json({ error: 'Vous ne pouvez pas vous contacter vous-même' }, { status: 400 });
  }

  // 7. Check conversation existante (requêtes séparées, pas d'interpolation .or())
  const { data: conv1 } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_1', user.id)
    .eq('participant_2', candidateId)
    .maybeSingle();

  const { data: conv2 } = await supabase
    .from('conversations')
    .select('id')
    .eq('participant_1', candidateId)
    .eq('participant_2', user.id)
    .maybeSingle();

  const existingConv = conv1 || conv2;

  if (existingConv) {
    return NextResponse.json({ success: true, conversation_id: existingConv.id, existing: true });
  }

  // 8. Vérifier quota (sauf admin)
  if (user.role_type !== 'admin') {
    // Re-fetch le user pour avoir le count le plus à jour (anti race condition basique)
    const { data: freshUser } = await supabase
      .from('users')
      .select('monthly_contacts_count')
      .eq('id', user.id)
      .single();

    const freshCount = freshUser?.monthly_contacts_count || 0;
    const remaining = getRemainingContacts({ ...user, monthly_contacts_count: freshCount });

    if (remaining <= 0) {
      return NextResponse.json(
        { error: 'Quota de contacts atteint ce mois. Passez au tier supérieur.', code: 'CONTACTS_QUOTA_EXCEEDED' },
        { status: 403 }
      );
    }
  }

  // 9. Vérifier que le candidat existe et est actif
  const { data: candidate } = await supabase
    .from('users')
    .select('id, is_active, full_name')
    .eq('id', candidateId)
    .single();

  if (!candidate || !candidate.is_active) {
    return NextResponse.json({ error: 'Candidat introuvable ou inactif' }, { status: 404 });
  }

  // 10. Créer la conversation
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({
      participant_1: user.id,
      participant_2: candidateId,
      last_message_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (convError) {
    // Doublon possible si race condition → re-check
    const { data: recheck1 } = await supabase
      .from('conversations')
      .select('id')
      .eq('participant_1', user.id)
      .eq('participant_2', candidateId)
      .maybeSingle();
    if (recheck1) {
      return NextResponse.json({ success: true, conversation_id: recheck1.id, existing: true });
    }
    return NextResponse.json({ error: 'Erreur lors de la création de la conversation' }, { status: 500 });
  }

  // 11. Incrémenter le compteur de contacts
  // Tentative via RPC atomique, fallback sur update classique
  const { error: rpcErr } = await supabase.rpc('increment_monthly_contacts', { user_id_param: user.id });
  if (rpcErr) {
    // Fallback si la RPC n'existe pas encore
    await supabase
      .from('users')
      .update({
        monthly_contacts_count: (user.monthly_contacts_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
  }

  // 12. Notifier le candidat
  await supabase.from('notifications').insert({
    user_id: candidateId,
    type: 'message_received',
    title: 'Nouveau contact',
    body: `${user.full_name || 'Un recruteur'} souhaite échanger avec vous.`,
    link: '/dashboard/messages',
    metadata: { recruiter_id: user.id },
  });

  return NextResponse.json({
    success: true,
    conversation_id: newConv.id,
    existing: false,
  });
}
