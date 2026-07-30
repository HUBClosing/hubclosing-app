import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase admin (service_role) — BYPASS RLS.
 * À utiliser UNIQUEMENT côté serveur pour les opérations cross-user :
 * - Notifications pour un autre utilisateur
 * - Webhooks Stripe
 * - Opérations admin
 *
 * ⚠️  JAMAIS dans un composant 'use client' ou côté navigateur.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let adminClient: SupabaseClient<any, 'public', any> | null = null;

export function getSupabaseAdmin() {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante — nécessaire pour les opérations admin');
  }

  adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}

/**
 * Helper : créer une notification pour n'importe quel utilisateur.
 * Bypass RLS via service_role — à utiliser dans les API routes serveur.
 */
export async function createNotification(data: {
  user_id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('notifications').insert(data);
  if (error) {
    console.error('[notifications] insert error:', error.message);
  }
  return { error };
}
