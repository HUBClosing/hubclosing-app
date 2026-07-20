import { emailLayout, ctaButton, divider } from './base';

interface WelcomeEmailProps {
  fullName: string;
  role: 'candidate' | 'recruiter';
  appUrl: string;
}

export function welcomeEmail({ fullName, role, appUrl }: WelcomeEmailProps): {
  subject: string;
  html: string;
} {
  const firstName = fullName.split(' ')[0] || fullName;
  const isCandidate = role === 'candidate';

  const subject = `Bienvenue sur HUBClosing, ${firstName} !`;
  const preheader = isCandidate
    ? 'Votre carrière de closer passe au niveau supérieur.'
    : 'Recrutez les meilleurs closers du marché.';

  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#F5F5F0;letter-spacing:-0.5px;">
      Bienvenue ${firstName} ! 🎉
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#A5A59A;line-height:1.7;">
      Votre compte HUBClosing est cr&eacute;&eacute;. ${isCandidate
        ? 'Vous faites d&eacute;sormais partie de la premi&egrave;re marketplace d&eacute;di&eacute;e aux closers &amp; setters.'
        : 'Vous pouvez d&eacute;sormais recruter les meilleurs talents sales du march&eacute;.'
      }
    </p>

    ${divider()}

    <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#F5F5F0;">
      ${isCandidate ? '🚀 Vos prochaines &eacute;tapes' : '📋 Vos prochaines &eacute;tapes'}
    </h2>

    ${isCandidate ? `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#E8913A;font-weight:700;font-size:18px;vertical-align:middle;">1.</span>
          <span style="color:#F5F5F0;font-size:14px;padding-left:8px;vertical-align:middle;">Compl&eacute;tez votre profil (niches, exp&eacute;rience, r&eacute;sultats)</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#E8913A;font-weight:700;font-size:18px;vertical-align:middle;">2.</span>
          <span style="color:#F5F5F0;font-size:14px;padding-left:8px;vertical-align:middle;">Parcourez la marketplace et filtrez par niche / commission</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#E8913A;font-weight:700;font-size:18px;vertical-align:middle;">3.</span>
          <span style="color:#F5F5F0;font-size:14px;padding-left:8px;vertical-align:middle;">Postulez aux offres qui vous correspondent</span>
        </td>
      </tr>
    </table>
    ` : `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#E8913A;font-weight:700;font-size:18px;vertical-align:middle;">1.</span>
          <span style="color:#F5F5F0;font-size:14px;padding-left:8px;vertical-align:middle;">Compl&eacute;tez votre profil entreprise</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#E8913A;font-weight:700;font-size:18px;vertical-align:middle;">2.</span>
          <span style="color:#F5F5F0;font-size:14px;padding-left:8px;vertical-align:middle;">Publiez votre premi&egrave;re offre de closing / setting</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#E8913A;font-weight:700;font-size:18px;vertical-align:middle;">3.</span>
          <span style="color:#F5F5F0;font-size:14px;padding-left:8px;vertical-align:middle;">Consultez la CVth&egrave;que pour trouver des profils</span>
        </td>
      </tr>
    </table>
    `}

    ${ctaButton(
      isCandidate ? 'Voir les opportunités' : 'Publier une offre',
      isCandidate ? `${appUrl}/dashboard/marketplace` : `${appUrl}/dashboard/offers/new`
    )}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#7A7A72;line-height:1.6;">
      💬 Rejoignez aussi notre communaut&eacute; WhatsApp de +2 000 closers &amp; setters pour &eacute;changer tips et opportunit&eacute;s.
    </p>
  `;

  return { subject, html: emailLayout(content, preheader) };
}
