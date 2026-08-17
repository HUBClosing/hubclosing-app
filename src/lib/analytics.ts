/**
 * Helper analytics — tracking GA4 + Clarity pour HUBClosing.
 *
 * Usage :
 *   import { trackEvent, trackPurchase } from '@/lib/analytics';
 *   trackEvent('cta_click', { button: 'publier_annonce' });
 *   trackPurchase('price_xxx', 49, 'Boost');
 */

// ─── Types GA4 ───
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

/**
 * Envoie un événement personnalisé à GA4.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

/**
 * Tracking e-commerce GA4 — à appeler après un paiement Stripe réussi.
 */
export function trackPurchase(
  priceId: string,
  amount: number,
  itemName: string
) {
  trackEvent('purchase', {
    currency: 'EUR',
    value: amount,
    items: JSON.stringify([{ item_id: priceId, item_name: itemName }]),
  });
}

/**
 * Tracking inscription réussie.
 */
export function trackSignUp(method: string = 'email') {
  trackEvent('sign_up', { method });
}

/**
 * Tracking connexion réussie.
 */
export function trackLogin(method: string = 'email') {
  trackEvent('login', { method });
}

/**
 * Tracking consultation d'une annonce.
 */
export function trackViewAnnonce(annonceId: string, titre: string) {
  trackEvent('view_item', {
    item_id: annonceId,
    item_name: titre,
    content_type: 'annonce',
  });
}

/**
 * Tracking candidature envoyée.
 */
export function trackCandidature(annonceId: string) {
  trackEvent('generate_lead', {
    item_id: annonceId,
    content_type: 'candidature',
  });
}

/**
 * Tag Clarity — marquer une session avec un tag personnalisé.
 * Utile pour segmenter les replays (ex: "closer", "manager", "premium").
 */
export function clarityTag(key: string, value: string) {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('set', key, value);
  }
}

/**
 * Identifier un utilisateur dans Clarity (pour associer les sessions).
 */
export function clarityIdentify(userId: string, userRole?: string) {
  if (typeof window !== 'undefined' && window.clarity) {
    window.clarity('identify', userId);
    if (userRole) {
      window.clarity('set', 'role', userRole);
    }
  }
}
