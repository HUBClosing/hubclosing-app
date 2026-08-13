import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY manquante dans .env.local');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
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
  // Candidats (abonnements mensuels)
  starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_placeholder',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
  elite: process.env.STRIPE_PRICE_ELITE || 'price_elite_placeholder',
  // Recruteurs — packs (one-time sauf agence)
  solo: process.env.STRIPE_PRICE_SOLO || 'price_solo_placeholder',
  equipe: process.env.STRIPE_PRICE_EQUIPE || 'price_equipe_placeholder',
  campagne: process.env.STRIPE_PRICE_CAMPAGNE || 'price_campagne_placeholder',
  agency: process.env.STRIPE_PRICE_AGENCY || 'price_agency_placeholder',
  // Recruteurs — add-ons (one-time)
  deblocage_1: process.env.STRIPE_PRICE_DEBLOCAGE_1 || 'price_deblocage1_placeholder',
  deblocage_5: process.env.STRIPE_PRICE_DEBLOCAGE_5 || 'price_deblocage5_placeholder',
  boost: process.env.STRIPE_PRICE_BOOST || 'price_boost_placeholder',
  annonce_sup: process.env.STRIPE_PRICE_ANNONCE_SUP || 'price_annoncesupp_placeholder',
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
  // Candidats
  starter: 'Starter (9€/mois)',
  pro: 'Pro (19€/mois)',
  elite: 'Élite (39€/mois)',
  // Recruteurs — packs
  solo: 'Solo (49€)',
  equipe: 'Équipe (79€)',
  campagne: 'Campagne (129€)',
  agency: 'Agence (199€/mois)',
  // Add-ons
  deblocage_1: '1 Déblocage (12€)',
  deblocage_5: '5 Déblocages (49€)',
  boost: 'Boost (9€)',
  annonce_sup: 'Annonce supplémentaire (29€)',
};
