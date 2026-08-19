import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerWebhooks } from '@/lib/webhooks';

// POST /api/webhooks/test — envoyer un webhook de test
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { webhook_id } = body;

    if (!webhook_id) {
      return NextResponse.json({ error: 'webhook_id requis' }, { status: 400 });
    }

    // Vérifier que le webhook appartient à l'utilisateur
    const { data: endpoint } = await supabase
      .from('webhook_endpoints')
      .select('id, url')
      .eq('id', webhook_id)
      .eq('user_id', user.id)
      .single();

    if (!endpoint) {
      return NextResponse.json({ error: 'Webhook non trouvé' }, { status: 404 });
    }

    // Envoyer un événement de test
    await triggerWebhooks(user.id, 'event.created', {
      _test: true,
      message: 'Ceci est un test depuis HUBClosing',
      event: {
        id: '00000000-0000-0000-0000-000000000000',
        title: 'Événement test',
        event_type: 'challenge',
        status: 'active',
        start_date: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook de test envoyé',
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
