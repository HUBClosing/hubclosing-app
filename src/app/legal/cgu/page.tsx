import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales d\'Utilisation',
  description: 'CGU de HUBClosing — conditions d\'utilisation de la marketplace closers & managers.',
};

const sectionTitle: React.CSSProperties = {
  fontSize: '20px', fontWeight: 700, color: '#F5F5F0',
  marginTop: '40px', marginBottom: '12px', letterSpacing: '-0.5px',
};
const paragraph: React.CSSProperties = {
  fontSize: '15px', color: '#A5A59A', lineHeight: 1.8, marginBottom: '16px',
};

export default function CGUPage() {
  return (
    <>
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase', color: '#E8913A', fontWeight: 600 }}>
          L&eacute;gal
        </span>
      </div>
      <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#F5F5F0', letterSpacing: '-1px', marginBottom: '8px' }}>
        Conditions G&eacute;n&eacute;rales d&apos;Utilisation
      </h1>
      <p style={{ fontSize: '14px', color: '#7A7A72', marginBottom: '40px' }}>
        Derni&egrave;re mise &agrave; jour : 30 juillet 2026
      </p>

      <h2 style={sectionTitle}>1. Objet</h2>
      <p style={paragraph}>
        Les pr&eacute;sentes Conditions G&eacute;n&eacute;rales d&apos;Utilisation (CGU) r&eacute;gissent l&apos;acc&egrave;s et l&apos;utilisation de la plateforme HUBClosing accessible &agrave; l&apos;adresse hubclosing.fr. En cr&eacute;ant un compte, l&apos;utilisateur accepte les pr&eacute;sentes CGU sans r&eacute;serve.
      </p>

      <h2 style={sectionTitle}>2. D&eacute;finitions</h2>
      <p style={paragraph}>
        <strong style={{ color: '#F5F5F0' }}>Plateforme</strong> : le site web hubclosing.fr et ses services associ&eacute;s.<br />
        <strong style={{ color: '#F5F5F0' }}>Candidat</strong> : utilisateur inscrit en tant que closer ou setter, cherchant des missions de vente.<br />
        <strong style={{ color: '#F5F5F0' }}>Recruteur</strong> : utilisateur inscrit en tant que manager ou HOS (Head of Sales), publiant des offres.<br />
        <strong style={{ color: '#F5F5F0' }}>Offre</strong> : annonce de mission publi&eacute;e par un recruteur sur la marketplace.<br />
        <strong style={{ color: '#F5F5F0' }}>Abonnement</strong> : formule payante donnant acc&egrave;s &agrave; des fonctionnalit&eacute;s premium.
      </p>

      <h2 style={sectionTitle}>3. Inscription et compte</h2>
      <p style={paragraph}>
        L&apos;inscription est gratuite et ouverte &agrave; toute personne physique majeure ou personne morale. L&apos;utilisateur s&apos;engage &agrave; fournir des informations exactes et &agrave; les maintenir &agrave; jour. Chaque utilisateur est responsable de la confidentialit&eacute; de ses identifiants de connexion.
      </p>
      <p style={paragraph}>
        HUBClosing se r&eacute;serve le droit de suspendre ou supprimer tout compte en cas de violation des pr&eacute;sentes CGU, de comportement frauduleux ou d&apos;utilisation abusive de la plateforme.
      </p>

      <h2 style={sectionTitle}>4. Services propos&eacute;s</h2>
      <p style={paragraph}>
        HUBClosing est une marketplace de mise en relation entre closers/setters et managers/HOS dans l&apos;univers de l&apos;infoproduit. La plateforme permet notamment la publication et consultation d&apos;offres de missions, la candidature et gestion des candidatures, la messagerie entre utilisateurs, la gestion de profil et r&eacute;putation, et l&apos;acc&egrave;s &agrave; des fonctionnalit&eacute;s premium via abonnement.
      </p>

      <h2 style={sectionTitle}>5. R&ocirc;le d&apos;interm&eacute;diaire</h2>
      <p style={paragraph}>
        HUBClosing agit exclusivement en tant qu&apos;interm&eacute;diaire de mise en relation. La plateforme n&apos;est pas partie aux contrats conclus entre candidats et recruteurs. HUBClosing ne garantit pas la conclusion d&apos;un accord entre les parties, les r&eacute;sultats commerciaux des collaborations, ni le paiement des commissions entre utilisateurs.
      </p>

      <h2 style={sectionTitle}>6. Abonnements et paiement</h2>
      <p style={paragraph}>
        Certaines fonctionnalit&eacute;s de la plateforme sont accessibles via un abonnement mensuel payant. Les prix sont affich&eacute;s TTC sur la page d&apos;abonnement. Le paiement est effectu&eacute; via Stripe. L&apos;abonnement est renouvel&eacute; automatiquement chaque mois sauf annulation. L&apos;utilisateur peut annuler son abonnement &agrave; tout moment depuis son espace client ; l&apos;acc&egrave;s premium reste actif jusqu&apos;&agrave; la fin de la p&eacute;riode pay&eacute;e.
      </p>
      <p style={paragraph}>
        En cas de non-paiement, HUBClosing se r&eacute;serve le droit de suspendre l&apos;acc&egrave;s aux fonctionnalit&eacute;s premium. Conform&eacute;ment &agrave; l&apos;article L. 221-28 du Code de la consommation, le droit de r&eacute;tractation ne s&apos;applique pas aux services num&eacute;riques fournis imm&eacute;diatement apr&egrave;s souscription.
      </p>

      <h2 style={sectionTitle}>7. Obligations des utilisateurs</h2>
      <p style={paragraph}>
        L&apos;utilisateur s&apos;engage &agrave; utiliser la plateforme conform&eacute;ment aux lois en vigueur et aux pr&eacute;sentes CGU. Il est notamment interdit de publier du contenu faux, trompeur ou diffamatoire, d&apos;usurper l&apos;identit&eacute; d&apos;un tiers, d&apos;utiliser la plateforme &agrave; des fins de spam ou de sollicitation non d&eacute;sir&eacute;e, de contourner les m&eacute;canismes de s&eacute;curit&eacute; de la plateforme, et de porter atteinte au bon fonctionnement du service.
      </p>

      <h2 style={sectionTitle}>8. Mod&eacute;ration</h2>
      <p style={paragraph}>
        HUBClosing se r&eacute;serve le droit de mod&eacute;rer, suspendre ou supprimer tout contenu ou compte ne respectant pas les pr&eacute;sentes CGU. Les utilisateurs peuvent signaler tout contenu inappropri&eacute; via la fonctionnalit&eacute; de signalement int&eacute;gr&eacute;e.
      </p>

      <h2 style={sectionTitle}>9. Propri&eacute;t&eacute; intellectuelle</h2>
      <p style={paragraph}>
        Les utilisateurs conservent la propri&eacute;t&eacute; de leur contenu publi&eacute; sur la plateforme. En publiant du contenu, l&apos;utilisateur accorde &agrave; HUBClosing une licence non exclusive pour afficher et distribuer ce contenu dans le cadre du fonctionnement de la plateforme.
      </p>

      <h2 style={sectionTitle}>10. Responsabilit&eacute;</h2>
      <p style={paragraph}>
        HUBClosing met en &oelig;uvre les moyens raisonnables pour assurer la disponibilit&eacute; de la plateforme mais ne garantit pas un acc&egrave;s ininterrompu. HUBClosing ne saurait &ecirc;tre tenu responsable des dommages directs ou indirects r&eacute;sultant de l&apos;utilisation de la plateforme, des relations entre utilisateurs, ou d&apos;une interruption de service.
      </p>

      <h2 style={sectionTitle}>11. Modification des CGU</h2>
      <p style={paragraph}>
        HUBClosing se r&eacute;serve le droit de modifier les pr&eacute;sentes CGU &agrave; tout moment. Les utilisateurs seront inform&eacute;s des modifications par notification sur la plateforme. La poursuite de l&apos;utilisation apr&egrave;s modification vaut acceptation des nouvelles CGU.
      </p>

      <h2 style={sectionTitle}>12. Droit applicable et litiges</h2>
      <p style={paragraph}>
        Les pr&eacute;sentes CGU sont r&eacute;gies par le droit fran&ccedil;ais. En cas de litige, les parties s&apos;engagent &agrave; rechercher une solution amiable avant toute action judiciaire. &Agrave; d&eacute;faut, les tribunaux comp&eacute;tents seront ceux du ressort du si&egrave;ge social de l&apos;&eacute;diteur.
      </p>

      <h2 style={sectionTitle}>13. Contact</h2>
      <p style={paragraph}>
        Pour toute question relative aux pr&eacute;sentes CGU, vous pouvez nous contacter &agrave; l&apos;adresse contact@hubclosing.fr.
      </p>
    </>
  );
}
