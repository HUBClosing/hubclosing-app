import { emailLayout, ctaButton, divider, statusBadge, escapeHtml } from './base';

type ApplicationStatus = 'reviewing' | 'accepted' | 'rejected' | 'completed';

interface ApplicationStatusEmailProps {
  candidateName: string;
  offerTitle: string;
  recruiterName: string;
  status: ApplicationStatus;
  message?: string;  // Message personnalisé du recruteur
  appUrl: string;
}

const STATUS_CONFIG: Record<ApplicationStatus, {
  label: string;
  color: string;
  emoji: string;
  description: string;
}> = {
  reviewing: {
    label: 'En cours de review',
    color: '#F5A623',
    emoji: '👀',
    description: 'Votre profil est en cours d\'examen. Le recruteur revient vers vous rapidement.',
  },
  accepted: {
    label: 'Acceptée',
    color: '#22C55E',
    emoji: '🎉',
    description: 'Vous avez été sélectionné(e) ! Le recruteur va vous contacter pour les prochaines étapes.',
  },
  rejected: {
    label: 'Non retenue',
    color: '#EF4444',
    emoji: '💪',
    description: 'Votre candidature n\'a pas été retenue cette fois. Continuez à postuler, la bonne opportunité vous attend !',
  },
  completed: {
    label: 'Mission terminée',
    color: '#8B5CF6',
    emoji: '✅',
    description: 'La mission est marquée comme terminée. N\'oubliez pas de laisser un avis !',
  },
};

/**
 * Email envoyé au CANDIDAT quand le statut de sa candidature change.
 */
export function applicationStatusEmail({
  candidateName,
  offerTitle,
  recruiterName,
  status,
  message,
  appUrl,
}: ApplicationStatusEmailProps): {
  subject: string;
  html: string;
} {
  const firstName = escapeHtml(candidateName.split(' ')[0] || candidateName);
  const safeOfferTitle = escapeHtml(offerTitle);
  const safeRecruiterName = escapeHtml(recruiterName);
  const safeMessage = message ? escapeHtml(message) : undefined;
  const config = STATUS_CONFIG[status];
  const subject = `${config.emoji} Candidature ${config.label.toLowerCase()} — ${offerTitle}`;
  const preheader = config.description;

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#F5F5F0;letter-spacing:-0.5px;">
      ${config.emoji} Mise &agrave; jour candidature
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#A5A59A;line-height:1.7;">
      ${firstName}, votre candidature a &eacute;t&eacute; mise &agrave; jour.
    </p>

    <!-- Status Card -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:12px;">
      <tr>
        <td style="padding:20px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#7A7A72;text-transform:uppercase;letter-spacing:1px;">
            Offre
          </p>
          <p style="margin:0 0 16px;font-size:16px;font-weight:700;color:#F5F5F0;">
            ${safeOfferTitle}
          </p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7A7A72;text-transform:uppercase;letter-spacing:1px;">
            Recruteur
          </p>
          <p style="margin:0 0 16px;font-size:14px;color:#A5A59A;">
            ${safeRecruiterName}
          </p>
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#7A7A72;text-transform:uppercase;letter-spacing:1px;">
            Statut
          </p>
          ${statusBadge(config.label, config.color)}
        </td>
      </tr>
    </table>

    <p style="margin:20px 0 0;font-size:14px;color:#A5A59A;line-height:1.7;">
      ${config.description}
    </p>

    ${safeMessage ? `
    ${divider()}
    <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#7A7A72;text-transform:uppercase;letter-spacing:1px;">
      Message du recruteur
    </p>
    <div style="background:rgba(255,255,255,0.03);border-left:3px solid #E8913A;padding:16px;border-radius:0 8px 8px 0;margin:0;">
      <p style="margin:0;font-size:14px;color:#D8D5CC;line-height:1.7;font-style:italic;">
        "${safeMessage}"
      </p>
    </div>
    ` : ''}

    ${ctaButton(
      status === 'completed' ? 'Laisser un avis' : 'Voir mes candidatures',
      status === 'completed' ? `${appUrl}/dashboard/candidatures` : `${appUrl}/dashboard/candidatures`
    )}
  `;

  return { subject, html: emailLayout(content, preheader) };
}
