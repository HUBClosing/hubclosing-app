import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// GET /api/webhooks/token — récupérer ou créer le token incoming du recruteur
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    // Vérifier si le token existe déjà
    const { data: userData } = await supabase
      .from('users')
      .select('webhook_incoming_token')
      .eq('id', user.id)
      .single();

    if (userData?.webhook_incoming_token) {
      return NextResponse.json({
        token: userData.webhook_incoming_token,
        url: `https://hubclosing.fr/api/crm/sync/${userData.webhook_incoming_token}`,
      });
    }

    // Générer un nouveau token unique
    const token = `hc_${crypto.randomBytes(20).toString('hex')}`;

    const { error } = await supabase
      .from('users')
      .update({ webhook_incoming_token: token })
      .eq('id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      token,
      url: `https://hubclosing.fr/api/crm/sync/${token}`,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
