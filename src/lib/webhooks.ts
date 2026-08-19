import crypto from 'crypto';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { WebhookEventType, WebhookPayload } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Génère la signature HMAC-SHA256 du payload
 */
function signPayload(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Envoie un webhook à un endpoint spécifique
 * Fire-and-forget : ne bloque pas l'appelant
 */
async function sendToEndpoint(
  endpointId: string,
  url: string,
  secret: string,
  payload: WebhookPayload
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, secret);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-HubClosing-Signature': `sha256=${signature}`,
        'X-HubClosing-Event': payload.event,
        'X-HubClosing-Delivery': endpointId,
        'User-Agent': 'HUBClosing-Webhook/1.0',
      },
      body,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    return {
      success: response.ok,
      statusCode: response.status,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Erreur inconnue',
    };
  }
}

/**
 * Déclenche les webhooks pour un événement donné
 * Cherche tous les endpoints actifs de l'utilisateur abonnés à cet événement
 *
 * @param recruiterId - ID du recruteur
 * @param eventType - Type d'événement (ex: 'event.created')
 * @param data - Données de l'événement
 */
export async function triggerWebhooks(
  recruiterId: string,
  eventType: WebhookEventType,
  data: Record<string, unknown>
): Promise<void> {
  try {
    // Utiliser le service role pour lire les webhooks (bypass RLS)
    const supabase = createServiceClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les endpoints actifs abonnés à cet événement
    const { data: endpoints, error } = await supabase
      .from('webhook_endpoints')
      .select('id, url, secret')
      .eq('user_id', recruiterId)
      .eq('active', true)
      .contains('events', [eventType]);

    if (error || !endpoints || endpoints.length === 0) return;

    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        recruiter_id: recruiterId,
        source: 'hubclosing',
        version: '1.0',
      },
    };

    // Envoyer à tous les endpoints en parallèle (fire-and-forget)
    const results = await Promise.allSettled(
      endpoints.map(async (ep) => {
        const result = await sendToEndpoint(ep.id, ep.url, ep.secret, payload);

        // Logger le résultat
        await supabase.from('webhook_logs').insert({
          endpoint_id: ep.id,
          event_type: eventType,
          payload: payload as unknown as Record<string, unknown>,
          status_code: result.statusCode || null,
          success: result.success,
          error_message: result.error || null,
        });

        // Mettre à jour le dernier statut de l'endpoint
        const updateData: Record<string, unknown> = {
          last_triggered_at: new Date().toISOString(),
          last_status_code: result.statusCode || null,
        };

        if (result.success) {
          updateData.failure_count = 0;
        } else {
          // Incrémenter le compteur d'échecs
          const { data: current } = await supabase
            .from('webhook_endpoints')
            .select('failure_count')
            .eq('id', ep.id)
            .single();

          const newCount = (current?.failure_count || 0) + 1;
          updateData.failure_count = newCount;

          // Désactiver après 10 échecs consécutifs
          if (newCount >= 10) {
            updateData.active = false;
          }
        }

        await supabase
          .from('webhook_endpoints')
          .update(updateData)
          .eq('id', ep.id);

        return result;
      })
    );

    // Log en console pour debug (visible dans les logs Vercel)
    const succeeded = results.filter(
      (r) => r.status === 'fulfilled' && (r.value as { success: boolean }).success
    ).length;
    if (endpoints.length > 0) {
      console.log(
        `[Webhooks] ${eventType}: ${succeeded}/${endpoints.length} envoyés pour ${recruiterId}`
      );
    }
  } catch (err) {
    // Ne jamais bloquer l'opération principale si les webhooks échouent
    console.error('[Webhooks] Erreur:', err);
  }
}

/**
 * Génère un secret aléatoire pour un nouvel endpoint
 */
export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(24).toString('hex')}`;
}
