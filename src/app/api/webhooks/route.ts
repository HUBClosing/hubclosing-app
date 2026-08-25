import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateWebhookSecret } from '@/lib/webhooks';
import type { WebhookEventType } from '@/types/database';
import { ALL_WEBHOOK_EVENTS } from '@/types/database';

// GET /api/webhooks — liste des webhooks de l'utilisateur
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) { console.error('[webhooks]', error.message); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/webhooks — créer un webhook
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { url, description, events } = body;

    if (!url?.trim()) {
      return NextResponse.json({ error: 'URL requise' }, { status: 400 });
    }

    // Valider l'URL + protection SSRF
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'https:') {
        return NextResponse.json({ error: 'URL doit être HTTPS' }, { status: 400 });
      }
      const h = parsed.hostname.toLowerCase();
      const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254', 'metadata.google.internal'];
      if (blocked.includes(h) || h.startsWith('10.') || h.startsWith('192.168.') || h.startsWith('172.16.') || h.startsWith('172.17.') || h.startsWith('172.18.') || h.startsWith('172.19.') || h.startsWith('172.2') || h.startsWith('172.30.') || h.startsWith('172.31.') || h.endsWith('.internal') || h.endsWith('.local')) {
        return NextResponse.json({ error: 'URL interne non autorisée' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
    }

    // Valider les événements
    const validEvents: WebhookEventType[] = (events || ALL_WEBHOOK_EVENTS).filter(
      (e: string) => ALL_WEBHOOK_EVENTS.includes(e as WebhookEventType)
    );

    if (validEvents.length === 0) {
      return NextResponse.json({ error: 'Au moins un événement requis' }, { status: 400 });
    }

    // Limiter à 5 webhooks par utilisateur
    const { count } = await supabase
      .from('webhook_endpoints')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Maximum 5 webhooks par compte' }, { status: 400 });
    }

    const secret = generateWebhookSecret();

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        user_id: user.id,
        url: url.trim(),
        secret,
        description: description?.trim() || null,
        events: validEvents,
        active: true,
      })
      .select()
      .single();

    if (error) { console.error('[webhooks]', error.message); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/webhooks — supprimer un webhook
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', webhookId)
      .eq('user_id', user.id);

    if (error) { console.error('[webhooks]', error.message); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH /api/webhooks — activer/désactiver un webhook
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await req.json();
    const { id, active, events, url, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (active !== undefined) updates.active = active;
    if (events !== undefined) {
      const validEvents = events.filter(
        (e: string) => ALL_WEBHOOK_EVENTS.includes(e as WebhookEventType)
      );
      if (validEvents.length === 0) {
        return NextResponse.json({ error: 'Au moins un événement requis' }, { status: 400 });
      }
      updates.events = validEvents;
    }
    if (url !== undefined) updates.url = url.trim();
    if (description !== undefined) updates.description = description?.trim() || null;

    // Si on réactive, reset le compteur d'échecs
    if (active === true) {
      updates.failure_count = 0;
    }

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) { console.error('[webhooks]', error.message); return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 }); }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
