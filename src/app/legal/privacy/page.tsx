import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et protection des données personnelles de HUBClosing.',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '20px', fontWeight: 700, color: '#F5F5F0',
  marginTop: '40px', marginBottom: '12px', letterSpacing: '-0.5px',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', color: '#A5A59A', lineHeight: 1.8, marginBottom: '16px',
};
const tableCell: React.CSSProperties = {
  padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  fontSize: '14px', color: '#A5A59A', verticalAlign: 'top',
};

export default function PrivacyPage() {
  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#E8913A', fontWeight: 600 }}>
          Confidentialit&eacute;
        </span>
      </div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F5F5F0', letterSpacing: '-1px', marginBottom: '8px' }}>
        Politique de confidentialit&eacute;
      </h1>
      <p style={{ fontSize: '14px', color: '#7A7A72', marginBottom: '40px' }}>
        Derni&egrave;re mise &agrave; jour : 30 juillet 2026
      </p>

      <p style={paragraph}>
        La pr&eacute;sente politique de confidentialit&eacute; d&eacute;crit comment HUBClosing collecte, utilise et prot&egrave;ge vos donn&eacute;es personnelles, conform&eacute;ment au R&egrave;glement G&eacute;n&eacute;ral sur la Protection des Donn&eacute;es (RGPD) et &agrave; la loi Informatique et Libert&eacute;s.
      </p>

      <h2 style={sectionTitle}>1. Responsable du traitement</h2>
      <p style={paragraph}>
        Le responsable du traitement des donn&eacute;es personnelles est Ecom France (entrepreneur individuel), SIRET 885 334 334 00020, domicili&eacute;e en France. Contact : contact@hubclosing.fr.
      </p>

      <h2 style={sectionTitle}>2. Donn&eacute;es collect&eacute;es</h2>
      <p style={paragraph}>
        Nous collectons les donn&eacute;es suivantes dans le cadre de l&apos;utilisation de la plateforme :
      </p>
      <div style={{ background: '#141F0E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden', marginBottom: '16px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <th style={{ ...tableCell, color: '#E8913A', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Donn&eacute;e</th>
              <th style={{ ...tableCell, color: '#E8913A', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Finalit&eacute;</th>
              <th style={{ ...tableCell, color: '#E8913A', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Base l&eacute;gale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ ...tableCell, color: '#F5F5F0' }}>Nom, pr&eacute;nom, email</td>
              <td style={tableCell}>Cr&eacute;ation et gestion du compte</td>
              <td style={tableCell}>Ex&eacute;cution du contrat</td>
            </tr>
            <tr>
              <td style={{ ...tableCell, color: '#F5F5F0' }}>Profil professionnel</td>
              <td style={tableCell}>Mise en relation sur la marketplace</td>
              <td style={tableCell}>Ex&eacute;cution du contrat</td>
            </tr>
            <tr>
              <td style={{ ...tableCell, color: '#F5F5F0' }}>Donn&eacute;es de paiement</td>
              <td style={tableCell}>Gestion des abonnements</td>
              <td style={tableCell}>Ex&eacute;cution du contrat</td>
            </tr>
            <tr>
              <td style={{ ...tableCell, color: '#F5F5F0' }}>Candidatures, messages</td>
              <td style={tableCell}>Fonctionnement de la marketplace</td>
              <td style={tableCell}>Ex&eacute;cution du contrat</td>
            </tr>
            <tr>
              <td style={{ ...tableCell, color: '#F5F5F0' }}>Donn&eacute;es de connexion</td>
              <td style={tableCell}>S&eacute;curit&eacute; et d&eacute;bogage</td>
              <td style={tableCell}>Int&eacute;r&ecirc;t l&eacute;gitime</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 style={sectionTitle}>3. Sous-traitants et transferts</h2>
      <p style={paragraph}>
        Vos donn&eacute;es peuvent &ecirc;tre trait&eacute;es par les prestataires suivants, tous conformes au RGPD ou au cadre de protection UE-US (DPF) :
      </p>
      <p style={paragraph}>
        <strong style={{ color: '#F5F5F0' }}>Supabase</strong> (base de donn&eacute;es, authentification) &mdash; Singapour/USA, DPF certifi&eacute;.<br />
        <strong style={{ color: '#F5F5F0' }}>Vercel</strong> (h&eacute;bergement) &mdash; USA, DPF certifi&eacute;.<br />
        <strong style={{ color: '#F5F5F0' }}>Stripe</strong> (paiement) &mdash; USA, PCI-DSS Level 1, DPF certifi&eacute;.<br />
        <strong style={{ color: '#F5F5F0' }}>Resend</strong> (emails transactionnels) &mdash; USA, DPF certifi&eacute;.<br />
        <strong style={{ color: '#F5F5F0' }}>Google</strong> (authentification OAuth) &mdash; USA, DPF certifi&eacute;.
      </p>
      <p style={paragraph}>
        Les donn&eacute;es de paiement (num&eacute;ro de carte, etc.) sont trait&eacute;es exclusivement par Stripe et ne transitent jamais par nos serveurs.
      </p>

      <h2 style={sectionTitle}>4. Dur&eacute;e de conservation</h2>
      <p style={paragraph}>
        Les donn&eacute;es de compte sont conserv&eacute;es pendant la dur&eacute;e d&apos;utilisation du service, puis 3 ans apr&egrave;s la derni&egrave;re connexion.
        Les donn&eacute;es de facturation sont conserv&eacute;es 10 ans conform&eacute;ment aux obligations comptables.
        Les logs de connexion sont conserv&eacute;s 12 mois.
      </p>

      <h2 style={sectionTitle}>5. Vos droits (RGPD)</h2>
      <p style={paragraph}>
        Conform&eacute;ment aux articles 15 &agrave; 22 du RGPD, vous disposez des droits suivants :
      </p>
      <div style={{ background: '#141F0E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <p style={{ ...paragraph, marginBottom: '8px' }}>
          <strong style={{ color: '#E8913A' }}>Acc&egrave;s</strong> &mdash; obtenir une copie de vos donn&eacute;es personnelles
        </p>
        <p style={{ ...paragraph, marginBottom: '8px' }}>
          <strong style={{ color: '#E8913A' }}>Rectification</strong> &mdash; corriger des donn&eacute;es inexactes
        </p>
        <p style={{ ...paragraph, marginBottom: '8px' }}>
          <strong style={{ color: '#E8913A' }}>Suppression</strong> &mdash; demander l&apos;effacement de vos donn&eacute;es
        </p>
        <p style={{ ...paragraph, marginBottom: '8px' }}>
          <strong style={{ color: '#E8913A' }}>Portabilit&eacute;</strong> &mdash; r&eacute;cup&eacute;rer vos donn&eacute;es dans un format structur&eacute;
        </p>
        <p style={{ ...paragraph, marginBottom: '8px' }}>
          <strong style={{ color: '#E8913A' }}>Opposition</strong> &mdash; vous opposer &agrave; certains traitements
        </p>
        <p style={{ ...paragraph, marginBottom: '0' }}>
          <strong style={{ color: '#E8913A' }}>Limitation</strong> &mdash; restreindre le traitement de vos donn&eacute;es
        </p>
      </div>
      <p style={paragraph}>
        Pour exercer vos droits, contactez-nous &agrave; contact@hubclosing.fr. Nous r&eacute;pondrons dans un d&eacute;lai de 30 jours. Vous pouvez &eacute;galement d&eacute;poser une r&eacute;clamation aupr&egrave;s de la CNIL (www.cnil.fr).
      </p>

      <h2 style={sectionTitle}>6. S&eacute;curit&eacute;</h2>
      <p style={paragraph}>
        Nous mettons en &oelig;uvre des mesures techniques et organisationnelles pour prot&eacute;ger vos donn&eacute;es : chiffrement des donn&eacute;es en transit (TLS) et au repos, authentification s&eacute;curis&eacute;e (OAuth 2.0, JWT), contr&ocirc;le d&apos;acc&egrave;s par r&ocirc;les (Row Level Security), et audits r&eacute;guliers de s&eacute;curit&eacute;.
      </p>

      <h2 style={sectionTitle}>7. Cookies</h2>
      <p style={paragraph}>
        HUBClosing utilise uniquement des cookies strictement n&eacute;cessaires au fonctionnement du service (cookies de session, authentification). Aucun cookie de suivi publicitaire ou analytique tiers n&apos;est utilis&eacute;. Aucun consentement sp&eacute;cifique n&apos;est donc requis pour ces cookies essentiels, conform&eacute;ment aux directives de la CNIL.
      </p>

      <h2 style={sectionTitle}>8. Contact DPO</h2>
      <p style={paragraph}>
        Pour toute question concernant la protection de vos donn&eacute;es personnelles, contactez notre D&eacute;l&eacute;gu&eacute; &agrave; la Protection des Donn&eacute;es &agrave; l&apos;adresse : contact@hubclosing.fr.
      </p>
    </>
  );
}
