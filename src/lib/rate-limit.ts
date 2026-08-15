/**
 * Rate limiter en mémoire pour les API routes.
 * Fonctionne par instance serverless — protection basique contre le spam.
 * Pour une protection avancée, utiliser @upstash/ratelimit avec Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Nettoyage périodique des entrées expirées (toutes les 60s)
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

interface RateLimitConfig {
  /** Nombre max de requêtes autorisées dans la fenêtre */
  maxRequests: number;
  /** Durée de la fenêtre en secondes */
  windowSeconds: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Vérifie si une requête est autorisée selon le rate limit.
 * @param identifier — Clé unique (IP, userId, etc.)
 * @param config — Configuration du rate limit
 * @returns RateLimitResult
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const key = identifier;
  const entry = store.get(key);

  // Nouvelle fenêtre ou fenêtre expirée
  if (!entry || now > entry.resetAt) {
    const resetAt = now + config.windowSeconds * 1000;
    store.set(key, { count: 1, resetAt });
    return { success: true, remaining: config.maxRequests - 1, resetAt };
  }

  // Fenêtre en cours
  if (entry.count < config.maxRequests) {
    entry.count++;
    return { success: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
  }

  // Limite atteinte
  return { success: false, remaining: 0, resetAt: entry.resetAt };
}

/**
 * Configurations prédéfinies pour les routes critiques.
 */
export const RATE_LIMITS = {
  /** Checkout Stripe — 5 requêtes / 60 secondes par utilisateur */
  checkout: { maxRequests: 5, windowSeconds: 60 },
  /** API générales — 30 requêtes / 60 secondes par IP */
  api: { maxRequests: 30, windowSeconds: 60 },
  /** Auth (login/register) — 10 requêtes / 300 secondes par IP */
  auth: { maxRequests: 10, windowSeconds: 300 },
} as const;
