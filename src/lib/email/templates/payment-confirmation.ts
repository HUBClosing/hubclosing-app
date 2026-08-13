import { emailLayout, ctaButton, divider } from './base';

interface PaymentConfirmationEmailProps {
  fullName: string;
  tierName: string;  // "Starter", "Pro", "Elite", "Business", "Agence"
  amount: string;    // "9€/mois", "19€/mois", etc.
  appUrl: string;
}

const TIER_FEATURES: Record<string, string[]> = {
  starter: [
    'Candidatures illimit&eacute;es',
    'Acc&egrave;s aux offres standard',
    'Messagerie compl&egrave;te',
  ],
  pro: [
    'Tout Starter +',
    'Offres premium &amp; coaching',
    'Badge Pro sur le profil',
    'Statistiques avanc&eacute;es',
  ],
  elite: [
    'Tout Pro +',
    'Masterclass exclusives',
    'Badge &Eacute;lite &amp; priorit&eacute; matching',
    'Acc&egrave;s anticip&eacute; aux offres',
  ],
  solo: [
    '1 annonce (60 jours)',
    '3 d&eacute;blocages de profil',
    'Smart Sourcing IA',
    'Garantie republication',
  ],
  equipe: [
    '1 annonce (90 jours)',
    '5 profils d&eacute;bloqu&eacute;s',
    '1 boost inclus',
    'Smart Sourcing IA',
  ],
  campagne: [
    '1 annonce (120 jours)',
    '10 profils d&eacute;bloqu&eacute;s',
    '3 boosts inclus',
    'Smart Sourcing IA',
  ],
  agency: [
    'Annonces illimit&eacute;es',
    '20 d&eacute;blocages / mois',
    '5 boosts / mois',
    'Dashboard analytics',
  ],
};

/**
 * Email de confirmation de paiement / activation d'abonnement.
 */
export function paymentConfirmationEmail({
  fullName,
  tierName,
  amount,
  appUrl,
}: PaymentConfirmationEmailProps): {
  subject: string;
  html: string;
} {
  const firstName = fullName.split(' ')[0] || fullName;
  const tierKey = tierName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const features = TIER_FEATURES[tierKey] || TIER_FEATURES.starter;

  const subject = `Abonnement ${tierName} activé !`;
  const preheader = `Votre plan ${tierName} est actif. Profitez de toutes les fonctionnalités.`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#F5F5F0;letter-spacing:-0.5px;">
      Abonnement activ&eacute; 🚀
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#A5A59A;line-height:1.7;">
      ${firstName}, votre plan <strong style="color:#E8913A;">${tierName}</strong> est d&eacute;sormais actif.
    </p>

    <!-- Plan Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:linear-gradient(135deg,rgba(232,145,58,0.08),rgba(232,145,58,0.03));border:1px solid rgba(232,145,58,0.15);border-radius:12px;">
      <tr>
        <td style="padding:24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td>
                <p style="margin:0;font-size:20px;font-weight:800;color:#F5F5F0;">
                  HUBClosing ${tierName}
                </p>
              </td>
              <td align="right">
                <p style="margin:0;font-size:20px;font-weight:800;color:#E8913A;">
                  ${amount}
                </p>
              </td>
            </tr>
          </table>

          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:16px 0;">

          ${features.map(f => `
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="24" valign="top" style="color:#22C55E;font-size:14px;padding:4px 0;">✓</td>
              <td style="font-size:14px;color:#D8D5CC;padding:4px 0;">${f}</td>
            </tr>
          </table>
          `).join('')}
        </td>
      </tr>
    </table>

    ${ctaButton('Acc&eacute;der au Dashboard', `${appUrl}/dashboard`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#7A7A72;line-height:1.6;">
      Vous pouvez g&eacute;rer votre abonnement &agrave; tout moment depuis
      <a href="${appUrl}/dashboard/subscription" style="color:#E8913A;text-decoration:none;">vos param&egrave;tres</a>.
      La facturation est mensuelle et vous pouvez annuler quand vous voulez.
    </p>
  `;

  return { subject, html: emailLayout(content, preheader) };
}
