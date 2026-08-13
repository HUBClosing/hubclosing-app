/**
 * Template de base pour tous les emails HUBClosing.
 * Design responsive, compatible Gmail/Outlook/Apple Mail.
 * Charte : fond sombre (#0A0F08), accents amber (#E8913A), texte cream (#F5F5F0).
 */

/** Échappe les caractères HTML dangereux pour éviter l'injection XSS dans les emails. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function emailLayout(content: string, preheader?: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>HUBClosing</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#0A0F08;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <!--[if mso]>
  <style>body,table,td{font-family:Arial,Helvetica,sans-serif!important;}</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0A0F08;font-family:'Plus Jakarta Sans',Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0A0F08;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;">

          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding:0 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:28px;font-weight:800;letter-spacing:-1px;">
                    <span style="color:#F5F5F0;">HUB</span><span style="color:#E8913A;">Closing</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:11px;font-weight:600;letter-spacing:1px;color:#F5A623;padding-top:2px;">
                    Opportunit&eacute;s
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Card -->
          <tr>
            <td style="background-color:#141F0E;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 0 0;text-align:center;">
              <p style="margin:0 0 8px;font-size:13px;color:#7A7A72;line-height:1.6;">
                HUBClosing &mdash; La marketplace des closers &amp; managers
              </p>
              <p style="margin:0 0 16px;font-size:12px;color:#4A4A42;">
                <a href="https://hubclosing.fr" style="color:#E8913A;text-decoration:none;">hubclosing.fr</a>
              </p>
              <p style="margin:0;font-size:11px;color:#4A4A42;line-height:1.5;">
                Vous recevez cet email car vous avez un compte HUBClosing.<br>
                <a href="https://hubclosing.fr/dashboard/settings" style="color:#7A7A72;text-decoration:underline;">G&eacute;rer mes notifications</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Bouton CTA amber */
export function ctaButton(text: string, url: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
      <tr>
        <td align="center" style="background:linear-gradient(135deg,#E8913A,#D4782E);border-radius:10px;">
          <a href="${url}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#FFFFFF;text-decoration:none;border-radius:10px;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
            ${text}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Ligne de séparation subtile */
export function divider(): string {
  return `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;">`;
}

/** Badge de statut */
export function statusBadge(text: string, color: string): string {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:700;color:${color};background:${color}15;letter-spacing:0.5px;">${text}</span>`;
}
