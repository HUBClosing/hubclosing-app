import { emailLayout, ctaButton, divider, escapeHtml } from './base';

interface NewApplicationEmailProps {
  recruiterName: string;
  candidateName: string;
  offerTitle: string;
  offerId: string;
  candidateRole: string;  // 'closer' | 'setter'
  appUrl: string;
}

/**
 * Email envoyé au RECRUTEUR quand un candidat postule à son offre.
 */
export function newApplicationEmail({
  recruiterName,
  candidateName,
  offerTitle,
  offerId,
  candidateRole,
  appUrl,
}: NewApplicationEmailProps): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(recruiterName.split(' ')[0] || recruiterName);
  const safeCandidateName = escapeHtml(candidateName);
  const safeOfferTitle = escapeHtml(offerTitle);
  const safeCandidateRole = escapeHtml(candidateRole);
  const subject = `Nouvelle candidature pour "${offerTitle}"`;
  const preheader = `${candidateName} vient de postuler à votre offre.`;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#F5F5F0;letter-spacing:-0.5px;">
      Nouvelle candidature 📬
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#A5A59A;line-height:1.7;">
      ${firstName}, vous avez re&ccedil;u une nouvelle candidature !
    </p>

    <!-- Candidate Info Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(232,145,58,0.06);border:1px solid rgba(232,145,58,0.12);border-radius:12px;margin-bottom:8px;">
      <tr>
        <td style="padding:20px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#E8913A,#D4782E);text-align:center;line-height:48px;font-size:20px;font-weight:700;color:#FFF;">
                  ${safeCandidateName.charAt(0).toUpperCase()}
                </div>
              </td>
              <td style="padding-left:16px;vertical-align:top;">
                <p style="margin:0;font-size:16px;font-weight:700;color:#F5F5F0;">
                  ${safeCandidateName}
                </p>
                <p style="margin:4px 0 0;font-size:13px;color:#A5A59A;text-transform:capitalize;">
                  ${safeCandidateRole}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Offer Info -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7A7A72;text-transform:uppercase;letter-spacing:1px;">
            Offre concern&eacute;e
          </p>
          <p style="margin:0;font-size:15px;font-weight:600;color:#F5F5F0;">
            ${safeOfferTitle}
          </p>
        </td>
      </tr>
    </table>

    ${ctaButton('Voir la candidature', `${appUrl}/dashboard/offers/${offerId}/candidates`)}

    ${divider()}

    <p style="margin:0;font-size:13px;color:#7A7A72;line-height:1.6;">
      ⚡ Conseil : les candidats les plus engag&eacute;s sont ceux qui re&ccedil;oivent une r&eacute;ponse dans les 24h.
    </p>
  `;

  return { subject, html: emailLayout(content, preheader) };
}
