import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales',
  description: 'Mentions légales de HUBClosing, marketplace de closers et managers dans l\'infoproduit.',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '20px', fontWeight: 700, color: '#F5F5F0',
  marginTop: '40px', marginBottom: '12px', letterSpacing: '-0.5px',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', color: '#A5A59A', lineHeight: 1.8, marginBottom: '16px',
};
const label: React.CSSProperties = {
  fontSize: '13px', fontWeight: 600, color: '#E8913A', marginBottom: '4px',
};

/**
 * Mentions légales — Obligatoire pour tout site commercial en France
 * (Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique)
 *
 * NOTE : Les informations ci-dessous sont des placeholders.
 * Céline doit les remplacer par ses vraies coordonnées d'entreprise.
 */
export default function MentionsLegalesPage() {
  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#E8913A', fontWeight: 600 }}>
          L&eacute;gal
        </span>
      </div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F5F5F0', letterSpacing: '-1px', marginBottom: '8px' }}>
        Mentions l&eacute;gales
      </h1>
      <p style={{ fontSize: '14px', color: '#7A7A72', marginBottom: '40px' }}>
        Derni&egrave;re mise &agrave; jour : 20 juillet 2026
      </p>

      <h2 style={sectionTitle}>1. &Eacute;diteur du site</h2>
      <div style={{ background: '#141F0E', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <p style={label}>Raison sociale</p>
        <p style={{ ...paragraph, color: '#F5F5F0', marginBottom: '12px' }}>[NOM DE L&apos;ENTREPRISE] &mdash; [FORME JURIDIQUE]</p>
        <p style={label}>Si&egrave;ge social</p>
        <p style={{ ...paragraph, marginBottom: '12px' }}>[ADRESSE COMPL&Egrave;TE]</p>
        <p style={label}>SIRET / SIREN</p>
        <p style={{ ...paragraph, marginBottom: '12px' }}>[NUM&Eacute;RO SIRET]</p>
        <p style={label}>Directeur de la publication</p>
        <p style={{ ...paragraph, marginBottom: '12px' }}>C&eacute;line &mdash; clcb.pro@gmail.com</p>
        <p style={label}>Contact</p>
        <p style={{ ...paragraph, marginBottom: '0' }}>contact@hubclosing.fr</p>
      </div>
      <p style={{ ...paragraph, fontSize: '13px', color: '#7A7A72', fontStyle: 'italic' }}>
        &#x26A0; Remplacez les champs entre crochets par vos vraies informations d&apos;entreprise.
      </p>

      <h2 style={sectionTitle}>2. H&eacute;bergement</h2>
      <p style={paragraph}>
        Le site hubclosing.fr est h&eacute;berg&eacute; par Vercel Inc., dont le si&egrave;ge social est situ&eacute; au 440 N Baxter St, Covina, CA 91723, &Eacute;tats-Unis.
        La base de donn&eacute;es est h&eacute;berg&eacute;e par Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992.
      </p>

      <h2 style={sectionTitle}>3. Propri&eacute;t&eacute; intellectuelle</h2>
      <p style={paragraph}>
        L&apos;ensemble du contenu du site hubclosing.fr (textes, images, logo, interface, code source) est prot&eacute;g&eacute; par le droit d&apos;auteur et les lois relatives &agrave; la propri&eacute;t&eacute; intellectuelle. Toute reproduction, m&ecirc;me partielle, est interdite sans autorisation pr&eacute;alable &eacute;crite.
      </p>
      <p style={paragraph}>
        La marque HUBClosing, le logo et le slogan &laquo; Connectez. Closez. &Eacute;voluez. &raquo; sont la propri&eacute;t&eacute; exclusive de l&apos;&eacute;diteur.
      </p>

      <h2 style={sectionTitle}>4. Donn&eacute;es personnelles</h2>
      <p style={paragraph}>
        Le traitement des donn&eacute;es personnelles est d&eacute;taill&eacute; dans notre{' '}
        <a href="/legal/privacy" style={{ color: '#E8913A', textDecoration: 'none' }}>Politique de confidentialit&eacute;</a>.
        Conform&eacute;ment au RGPD et &agrave; la loi Informatique et Libert&eacute;s, vous disposez d&apos;un droit d&apos;acc&egrave;s, de rectification et de suppression de vos donn&eacute;es.
      </p>

      <h2 style={sectionTitle}>5. Cookies</h2>
      <p style={paragraph}>
        Le site utilise des cookies strictement n&eacute;cessaires au fonctionnement (authentification, session utilisateur). Aucun cookie publicitaire ou de tracking tiers n&apos;est utilis&eacute;.
      </p>

      <h2 style={sectionTitle}>6. Limitation de responsabilit&eacute;</h2>
      <p style={paragraph}>
        HUBClosing agit en tant qu&apos;interm&eacute;diaire de mise en relation entre closers/setters et managers/HOS. HUBClosing ne peut &ecirc;tre tenu responsable des relations contractuelles entre utilisateurs, des r&eacute;sultats commerciaux, ni du contenu publi&eacute; par les utilisateurs de la plateforme.
      </p>
    </>
  );
}
