import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité — HUBClosing',
  description: 'Politique de confidentialité et protection des données personnelles de HUBClosing.',
};

export default function PrivacyPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-xs uppercase tracking-widest text-brand-green font-semibold mb-2">Légal</p>
      <h1 className="text-3xl font-bold text-brand-light mb-1">Politique de confidentialité</h1>
      <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 20 août 2026</p>

      <section className="space-y-6 text-gray-300 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">1. Responsable du traitement</h2>
          <div className="bg-white/5 rounded-xl p-5 space-y-2">
            <p><strong className="text-brand-light">Ecom France</strong> — Entrepreneur individuel</p>
            <p>SIRET : 885 334 334 00020</p>
            <p>Email : <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a></p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">2. Données collectées et finalités</h2>
          <p>Nous collectons les données suivantes dans le cadre de l&apos;utilisation de la plateforme :</p>

          <div className="bg-white/5 rounded-xl p-5 mt-3 space-y-4">
            <div>
              <p className="font-medium text-brand-light">Identité et contact</p>
              <p className="text-sm">Nom, prénom, adresse email — collectés lors de l&apos;inscription pour la création et la gestion du compte.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Profil professionnel</p>
              <p className="text-sm">Expérience, compétences, secteurs d&apos;activité, photo de profil, liens Instagram/Loom — utilisés pour le matching et l&apos;affichage sur la marketplace.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Données de paiement</p>
              <p className="text-sm">Informations de facturation — traitées exclusivement par Stripe (certifié PCI-DSS Niveau 1). HUBClosing ne stocke aucun numéro de carte bancaire.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Candidatures et messages</p>
              <p className="text-sm">Candidatures soumises, messages échangés, résultats de matching IA — nécessaires au fonctionnement de la marketplace.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Données de connexion</p>
              <p className="text-sm">Adresse IP, user agent, logs de connexion — utilisés pour la sécurité, le débogage et la prévention des fraudes.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : intérêt légitime (art. 6.1.f RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Préférences de notification</p>
              <p className="text-sm">Niches préférées, types d&apos;offres suivis, fréquence d&apos;emails — configurés par l&apos;utilisateur dans ses paramètres.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : consentement (art. 6.1.a RGPD)</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">3. Sous-traitants et transferts de données</h2>
          <p>Vos données peuvent être transmises aux sous-traitants suivants, tous certifiés DPF (Data Privacy Framework) ou offrant des garanties équivalentes :</p>
          <div className="bg-white/5 rounded-xl p-5 mt-3 space-y-3">
            <p><strong className="text-brand-light">Supabase Inc.</strong> (Singapour) — Hébergement base de données et authentification</p>
            <p><strong className="text-brand-light">Vercel Inc.</strong> (États-Unis) — Hébergement du site web et CDN</p>
            <p><strong className="text-brand-light">Stripe Inc.</strong> (États-Unis) — Traitement des paiements — certifié PCI-DSS Niveau 1</p>
            <p><strong className="text-brand-light">Resend Inc.</strong> (États-Unis) — Envoi d&apos;emails transactionnels</p>
            <p><strong className="text-brand-light">Google LLC</strong> (États-Unis) — Authentification OAuth et analytics</p>
          </div>
          <p className="mt-3">Les données de carte bancaire sont traitées exclusivement par Stripe et ne transitent jamais par nos serveurs.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">4. Durée de conservation</h2>
          <div className="bg-white/5 rounded-xl p-5 space-y-2">
            <p><strong className="text-brand-light">Données du compte :</strong> conservées pendant toute la durée d&apos;utilisation du service, puis 3 ans après la dernière connexion</p>
            <p><strong className="text-brand-light">Données de facturation :</strong> 10 ans conformément aux obligations comptables (art. L. 123-22 du Code de commerce)</p>
            <p><strong className="text-brand-light">Logs de connexion :</strong> 12 mois conformément à la loi (décret n° 2011-219 du 25 février 2011)</p>
            <p><strong className="text-brand-light">Messages et candidatures :</strong> conservés pendant la durée du compte, supprimés 30 jours après la fermeture du compte</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">5. Vos droits (RGPD)</h2>
          <p>Conformément aux articles 15 à 22 du RGPD, vous disposez des droits suivants :</p>
          <p>— <strong className="text-brand-light">Droit d&apos;accès</strong> (art. 15) : obtenir la confirmation du traitement et une copie de vos données</p>
          <p>— <strong className="text-brand-light">Droit de rectification</strong> (art. 16) : corriger des données inexactes ou incomplètes</p>
          <p>— <strong className="text-brand-light">Droit à l&apos;effacement</strong> (art. 17) : demander la suppression de vos données</p>
          <p>— <strong className="text-brand-light">Droit à la portabilité</strong> (art. 20) : recevoir vos données dans un format structuré et lisible par machine</p>
          <p>— <strong className="text-brand-light">Droit d&apos;opposition</strong> (art. 21) : vous opposer au traitement de vos données pour des motifs légitimes</p>
          <p>— <strong className="text-brand-light">Droit à la limitation</strong> (art. 18) : demander la suspension du traitement dans certains cas</p>
          <p className="mt-3">Pour exercer ces droits, envoyez un email à <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>. Nous répondons dans un délai maximum de 30 jours.</p>
          <p className="mt-2">En cas de litige non résolu, vous pouvez introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">www.cnil.fr</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">6. Sécurité des données</h2>
          <p>Nous mettons en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :</p>
          <p>— Chiffrement TLS (HTTPS) pour toutes les communications</p>
          <p>— Authentification sécurisée via OAuth 2.0 et tokens JWT</p>
          <p>— Row Level Security (RLS) au niveau de la base de données pour isoler les données entre utilisateurs</p>
          <p>— En-têtes de sécurité HTTP (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)</p>
          <p>— Rate limiting sur les API sensibles</p>
          <p>— Audits de sécurité réguliers</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">7. Cookies</h2>
          <p>HUBClosing utilise uniquement des cookies strictement nécessaires au fonctionnement du service :</p>
          <div className="bg-white/5 rounded-xl p-5 mt-3 space-y-2">
            <p><strong className="text-brand-light">Cookie de session Supabase</strong> — authentification et maintien de la connexion</p>
            <p><strong className="text-brand-light">Cookie de préférences</strong> — langue, thème, paramètres d&apos;affichage</p>
          </div>
          <p className="mt-3">Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé. Conformément aux recommandations de la CNIL, les cookies strictement nécessaires ne requièrent pas le recueil du consentement préalable.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">8. Modifications</h2>
          <p>Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications seront notifiées sur la plateforme. La date de dernière mise à jour est indiquée en haut de cette page.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">9. Contact — Délégué à la protection des données</h2>
          <p>Pour toute question relative à la protection de vos données personnelles, contactez-nous à <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>.</p>
        </div>
      </section>
    </article>
  );
}
