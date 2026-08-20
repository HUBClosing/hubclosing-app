/**
 * Couleurs thématiques pour les niches d'annonces HUBClosing.
 *
 * Chaque niche possède :
 *  - `bg`   : fond du badge (Tailwind class)
 *  - `text`  : couleur du texte (Tailwind class)
 *  - `dot`   : pastille ronde optionnelle (Tailwind class)
 *
 * Les niches sont regroupées par famille :
 *  🏠 Immobilier                     → blue
 *  💰 Finance / Trading / Crypto / Assurance → emerald
 *  🧠 Coaching / Dév. perso / Bien-être     → purple
 *  📚 Formation / Consulting                → indigo
 *  💻 SaaS / E-commerce / Marketing Digital → orange
 *  🏥 Santé                                 → rose
 *  🎯 Infoproduit / High Ticket             → amber
 *  🏢 B2B / B2C / Agence                   → cyan / teal
 */

export interface NicheColor {
  bg: string;
  text: string;
  dot: string;
  border: string;
}

const NICHE_COLOR_MAP: Record<string, NicheColor> = {
  // 🏠 Immobilier — bleu
  'Immobilier': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    dot: 'bg-blue-500',
    border: 'border-blue-200',
  },

  // 💰 Finance — émeraude
  'Finance': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  'Trading': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    border: 'border-emerald-200',
  },
  'Crypto': {
    bg: 'bg-green-50',
    text: 'text-green-700',
    dot: 'bg-green-500',
    border: 'border-green-200',
  },
  'Assurance': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    dot: 'bg-teal-500',
    border: 'border-teal-200',
  },

  // 🧠 Développement personnel — violet
  'Coaching': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    dot: 'bg-purple-500',
    border: 'border-purple-200',
  },
  'Développement personnel': {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    dot: 'bg-violet-500',
    border: 'border-violet-200',
  },
  'Bien-être': {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-700',
    dot: 'bg-fuchsia-500',
    border: 'border-fuchsia-200',
  },

  // 📚 Formation / Consulting — indigo
  'Formation': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500',
    border: 'border-indigo-200',
  },
  'Consulting': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    dot: 'bg-indigo-400',
    border: 'border-indigo-200',
  },

  // 💻 Digital / Tech — orange
  'SaaS': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
    border: 'border-orange-200',
  },
  'E-commerce': {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    dot: 'bg-orange-400',
    border: 'border-orange-200',
  },
  'Marketing Digital': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  // Normalisation casse alternative
  'Marketing digital': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },

  // 🏥 Santé — rose
  'Santé': {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
  },

  // 🎯 Infoproduit / High Ticket — jaune/or
  'Infoproduit': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    dot: 'bg-yellow-500',
    border: 'border-yellow-200',
  },
  'High Ticket': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    dot: 'bg-yellow-400',
    border: 'border-yellow-300',
  },
  'High-ticket': {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    dot: 'bg-yellow-400',
    border: 'border-yellow-300',
  },

  // 🏢 Business model — cyan/slate
  'B2B': {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    dot: 'bg-cyan-500',
    border: 'border-cyan-200',
  },
  'B2C': {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
    border: 'border-sky-200',
  },
  'Agence': {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    dot: 'bg-slate-500',
    border: 'border-slate-200',
  },
};

/** Couleur par défaut pour les niches non répertoriées */
const DEFAULT_COLOR: NicheColor = {
  bg: 'bg-gray-100',
  text: 'text-gray-600',
  dot: 'bg-gray-400',
  border: 'border-gray-200',
};

/**
 * Renvoie les classes Tailwind associées à une niche.
 * La recherche est case-insensitive avec fallback sur le mapping exact.
 */
export function getNicheColor(niche: string): NicheColor {
  // Exact match first
  if (NICHE_COLOR_MAP[niche]) return NICHE_COLOR_MAP[niche];

  // Case-insensitive fallback
  const lower = niche.toLowerCase();
  for (const [key, value] of Object.entries(NICHE_COLOR_MAP)) {
    if (key.toLowerCase() === lower) return value;
  }

  return DEFAULT_COLOR;
}

/**
 * Composant-helper : classes CSS pour un badge niche (fond + texte + bordure).
 */
export function getNicheBadgeClasses(niche: string): string {
  const c = getNicheColor(niche);
  return `${c.bg} ${c.text} ${c.border} border`;
}
