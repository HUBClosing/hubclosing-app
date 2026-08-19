import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/webhooks/logs — historique des envois
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const endpointId = searchParams.get('endpoint_id');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Récupérer les endpoints de l'utilisateur pour filtrer
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('id')
      .eq('user_id', user.id);

    if (!endpoints || endpoints.length === 0) {
      return NextResponse.json([]);
    }

    const endpointIds = endpoints.map((e) => e.id);

    let query = supabase
      .from('webhook_logs')
      .select('*')
      .in('endpoint_id', endpointIds)
      .order('sent_at', { ascending: false })
      .limit(Math.min(limit, 100));

    if (endpointId && endpointIds.includes(endpointId)) {
      query = query.eq('endpoint_id', endpointId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
