import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY manquante dans .env.local');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

/**
 * Mapping tier HUBClosing → Stripe Price ID
 *
 * IMPORTANT : Crée ces produits + prix dans ton dashboard Stripe (ou via l'API)
 * puis remplace les IDs ci-dessous par les vrais price_XXX.
 *
 * En mode test, tu peux les créer depuis :
 * https://dashboard.stripe.com/test/products
 */
export const STRIPE_PRICE_IDS: Record<string, string> = {
  // Candidats
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  elite: process.env.STRIPE_PRICE_ELITE || 'price_elite_placeholder',
  // Recruteurs
  business: process.env.STRIPE_PRICE_BUSINESS || 'price_business_placeholder',
  agency: process.env.STRIPE_PRICE_AGENCY || 'price_agency_placeholder',
};

/**
 * Mapping inverse : Stripe Price ID → tier HUBClosing
 * Utilisé dans le webhook pour déterminer le tier à appliquer.
 */
export function getTierFromPriceId(priceId: string): string | null {
  for (const [tier, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) return tier;
  }
  return null;
}

/**
 * Mapping tier → nom affiché (pour Stripe Checkout metadata)
 */
export const TIER_NAMES: Record<string, string> = {
  starter: 'Starter (9€/mois)',
  pro: 'Pro (19€/mois)',
  elite: 'Élite (39€/mois)',
  business: 'Business (49€/mois)',
  agency: 'Agence (199€/mois)',
};
