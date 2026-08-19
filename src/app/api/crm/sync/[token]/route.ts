import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Types de données CRM détectés
interface ParsedCrmData {
  source: string;
  closer_name?: string;
  closer_email?: string;
  revenue?: number;
  calls?: number;
  calls_completed?: number;
  no_shows?: number;
  deal_status?: string;
  deal_name?: string;
  raw_event?: string;
}

/**
 * Détecte le CRM source et extrait les données pertinentes
 */
function parseCrmPayload(body: Record<string, unknown>): ParsedCrmData {
  // GoHighLevel
  if (body.type && (body.locationId || body.location_id)) {
    return parseGoHighLevel(body);
  }

  // HubSpot (via webhook)
  if (body.subscriptionType || body.objectType === 'deal' || body.objectType === 'contact') {
    return parseHubSpot(body);
  }

  // Airtable (via webhook ou automation)
  if (body.base || body.webhook || (body.fields && typeof body.fields === 'object')) {
    return parseAirtable(body);
  }

  // Format générique — essayer d'extraire les champs courants
  return parseGeneric(body);
}

function parseGoHighLevel(body: Record<string, unknown>): ParsedCrmData {
  const data: ParsedCrmData = { source: 'gohighlevel', raw_event: String(body.type || '') };

  // Contact/Opportunity
  const contact = (body.contact || body.data || body) as Record<string, unknown>;
  const opportunity = (body.opportunity || body.data) as Record<string, unknown> | undefined;

  if (contact) {
    data.closer_name = String(contact.name || contact.full_name || contact.firstName || '').trim() || undefined;
    data.closer_email = String(contact.email || '').trim() || undefined;
  }

  if (opportunity && typeof opportunity === 'object') {
    data.revenue = Number(opportunity.monetaryValue || opportunity.monetary_value || opportunity.value || 0) || undefined;
    data.deal_status = String(opportunity.status || opportunity.stage || '');
    data.deal_name = String(opportunity.name || opportunity.title || '');
  }

  // Pipeline stage changes
  if (body.type === 'OpportunityStageUpdate' || body.type === 'OpportunityStatusUpdate') {
    data.deal_status = String(
      (body as Record<string, unknown>).newStage ||
      (body as Record<string, unknown>).new_stage ||
      (body as Record<string, unknown>).status || ''
    );
  }

  return data;
}

function parseHubSpot(body: Record<string, unknown>): ParsedCrmData {
  const data: ParsedCrmData = { source: 'hubspot', raw_event: String(body.subscriptionType || body.eventType || '') };

  const properties = (body.properties || body.objectProperties || {}) as Record<string, unknown>;

  data.closer_name = String(properties.dealname || properties.firstname || '').trim() || undefined;
  data.closer_email = String(properties.email || '').trim() || undefined;
  data.revenue = Number(properties.amount || properties.hs_closed_amount || 0) || undefined;
  data.deal_status = String(properties.dealstage || properties.hs_pipeline_stage || '');
  data.deal_name = String(properties.dealname || '');

  return data;
}

function parseAirtable(body: Record<string, unknown>): ParsedCrmData {
  const data: ParsedCrmData = { source: 'airtable' };

  const fields = (body.fields || body) as Record<string, unknown>;

  // Airtable a des noms de colonnes personnalisés — on cherche des patterns courants
  for (const [key, value] of Object.entries(fields)) {
    const keyLower = key.toLowerCase();
    if ((keyLower.includes('name') || keyLower.includes('nom')) && typeof value === 'string') {
      data.closer_name = data.closer_name || value.trim();
    }
    if ((keyLower.includes('email') || keyLower.includes('mail')) && typeof value === 'string') {
      data.closer_email = data.closer_email || value.trim();
    }
    if ((keyLower.includes('revenue') || keyLower.includes('ca') || keyLower.includes('montant') || keyLower.includes('amount')) && value) {
      data.revenue = data.revenue || Number(value) || undefined;
    }
    if ((keyLower.includes('appel') || keyLower.includes('call') || keyLower.includes('rdv')) && value) {
      data.calls = data.calls || Number(value) || undefined;
    }
    if ((keyLower.includes('status') || keyLower.includes('statut') || keyLower.includes('étape')) && typeof value === 'string') {
      data.deal_status = value;
    }
  }

  return data;
}

function parseGeneric(body: Record<string, unknown>): ParsedCrmData {
  const data: ParsedCrmData = { source: 'unknown' };
  const flat = flattenObject(body);

  for (const [key, value] of Object.entries(flat)) {
    const keyLower = key.toLowerCase();
    if (!data.closer_name && (keyLower.includes('name') || keyLower.includes('nom')) && typeof value === 'string' && value.trim()) {
      data.closer_name = value.trim();
    }
    if (!data.closer_email && keyLower.includes('email') && typeof value === 'string' && value.includes('@')) {
      data.closer_email = value.trim();
    }
    if (!data.revenue && (keyLower.includes('revenue') || keyLower.includes('amount') || keyLower.includes('montant') || keyLower.includes('value')) && value) {
      const num = Number(value);
      if (!isNaN(num) && num > 0) data.revenue = num;
    }
    if (!data.calls && (keyLower.includes('call') || keyLower.includes('appel')) && value) {
      const num = Number(value);
      if (!isNaN(num) && num >= 0) data.calls = num;
    }
  }

  return data;
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

// POST /api/crm/sync/[token] — recevoir les données CRM entrantes
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Trouver l'utilisateur par token
    const { data: user } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('webhook_incoming_token', params.token)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    // Parser le payload
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Payload JSON invalide' }, { status: 400 });
    }

    const parsed = parseCrmPayload(body);

    // Trouver l'événement actif le plus récent du recruteur
    const { data: activeEvent } = await supabase
      .from('recruiter_events')
      .select('id, title')
      .eq('recruiter_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let result = 'Données reçues mais aucun événement actif trouvé';
    let processed = false;

    if (activeEvent && (parsed.closer_name || parsed.closer_email) && (parsed.revenue || parsed.calls)) {
      // Chercher une assignation correspondante
      let assignmentQuery = supabase
        .from('event_assignments')
        .select('id, closer_id, closer_name')
        .eq('event_id', activeEvent.id)
        .neq('status', 'removed');

      if (parsed.closer_email) {
        assignmentQuery = assignmentQuery.ilike('closer_email', parsed.closer_email);
      } else if (parsed.closer_name) {
        assignmentQuery = assignmentQuery.ilike('closer_name', `%${parsed.closer_name}%`);
      }

      const { data: assignment } = await assignmentQuery.maybeSingle();

      if (assignment) {
        // Créer une entrée de performance
        const perfData = {
          event_id: activeEvent.id,
          assignment_id: assignment.id,
          closer_id: assignment.closer_id,
          performance_date: new Date().toISOString().split('T')[0],
          calls_scheduled: parsed.calls || 0,
          calls_completed: parsed.calls_completed || parsed.calls || 0,
          revenue_collected: parsed.revenue || 0,
          revenue_invoiced: 0,
          no_shows: parsed.no_shows || 0,
          cancellations: 0,
          notes: `Sync auto ${parsed.source}${parsed.deal_name ? ` — ${parsed.deal_name}` : ''}`,
        };

        const { error: perfError } = await supabase
          .from('event_performances')
          .insert(perfData);

        if (!perfError) {
          result = `Performance créée pour ${assignment.closer_name} sur "${activeEvent.title}" — ${parsed.revenue ? parsed.revenue + '€' : ''} ${parsed.calls ? parsed.calls + ' appels' : ''}`;
          processed = true;
        } else {
          result = `Erreur création performance: ${perfError.message}`;
        }
      } else {
        result = `Closer "${parsed.closer_name || parsed.closer_email}" non trouvé dans l'événement "${activeEvent.title}"`;
      }
    } else if (activeEvent) {
      result = `Données reçues de ${parsed.source} mais insuffisantes (nom/email + revenue/calls requis)`;
    }

    // Logger
    await supabase.from('crm_sync_logs').insert({
      user_id: user.id,
      source_crm: parsed.source,
      event_type: parsed.raw_event || parsed.deal_status || null,
      raw_payload: body,
      processed,
      result,
    });

    console.log(`[CRM Sync] ${user.full_name}: ${result}`);

    return NextResponse.json({
      success: true,
      processed,
      message: result,
    });
  } catch (err) {
    console.error('[CRM Sync] Erreur:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET — retourner un message d'info (utile pour vérifier que l'URL fonctionne)
export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('webhook_incoming_token', params.token)
    .single();

  if (!user) {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
  }

  return NextResponse.json({
    status: 'active',
    message: 'Endpoint HUBClosing prêt à recevoir les données CRM. Envoyez vos webhooks en POST.',
    supported_crms: ['GoHighLevel', 'HubSpot', 'Airtable', 'Salesforce', 'Pipedrive', 'Zoho', 'Monday', 'Notion', 'Close', 'Freshsales', 'Sellsy', 'noCRM', 'Tout CRM avec webhooks'],
    documentation: 'https://hubclosing.fr/dashboard/settings/webhooks',
  });
}
