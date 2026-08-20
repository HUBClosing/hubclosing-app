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
          <div className="bg-white/5 rounded-xl p-5 space-y-2 border border-white/10">
            <p><strong className="text-brand-light">Ecom France</strong> — Entrepreneur individuel</p>
            <p>SIRET : 885 334 334 00020</p>
            <p>Email du responsable : <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a></p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">2. Données collectées et finalités</h2>
          <p>Nous collectons les données suivantes dans le cadre de l&apos;utilisation de la plateforme HUBClosing :</p>

          <div className="bg-white/5 rounded-xl p-5 mt-3 space-y-4 border border-white/10">
            <div>
              <p className="font-medium text-brand-light">Identité et contact</p>
              <p className="text-sm">Nom, prénom, adresse email — collectés lors de l&apos;inscription pour la création et la gestion du compte utilisateur.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Profil professionnel</p>
              <p className="text-sm">Expérience, compétences, secteurs d&apos;activité, photo de profil, liens Instagram et Loom — utilisés pour le matching et l&apos;affichage sur la marketplace.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Données de paiement</p>
              <p className="text-sm">Informations de facturation — traitées exclusivement par Stripe Inc. (certifié PCI-DSS Niveau 1). HUBClosing ne collecte, ne stocke et ne transfère aucun numéro de carte bancaire ni donnée bancaire sensible.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Candidatures et messages</p>
              <p className="text-sm">Candidatures soumises, messages échangés via la messagerie interne, résultats de matching IA — nécessaires au fonctionnement de la marketplace et à la mise en relation.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : exécution du contrat (art. 6.1.b RGPD)</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Données de connexion et de navigation</p>
              <p className="text-sm">Adresse IP (anonymisée pour l&apos;analytics), user agent, logs de connexion, pages visitées — utilisés pour la sécurité, le débogage, la prévention des fraudes et l&apos;amélioration du service.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : intérêt légitime (art. 6.1.f RGPD) pour la sécurité ; consentement (art. 6.1.a RGPD) pour l&apos;analytics</p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Préférences de notification</p>
              <p className="text-sm">Niches préférées, types d&apos;offres suivis, fréquence d&apos;emails — configurés librement par l&apos;utilisateur dans ses paramètres.</p>
              <p className="text-xs text-gray-400 mt-1">Base légale : consentement (art. 6.1.a RGPD)</p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">3. Sous-traitants et transferts de données</h2>
          <p>Vos données peuvent être transmises aux sous-traitants suivants dans le cadre du fonctionnement de la plateforme. Chaque sous-traitant offre des garanties conformes au RGPD (DPF, clauses contractuelles types ou équivalent) :</p>
          <div className="bg-white/5 rounded-xl p-5 mt-3 space-y-3 border border-white/10">
            <div>
              <p><strong className="text-brand-light">Supabase Inc.</strong> (Singapour)</p>
              <p className="text-sm text-gray-400">Hébergement base de données et authentification</p>
            </div>
            <div>
              <p><strong className="text-brand-light">Vercel Inc.</strong> (États-Unis — certifié DPF)</p>
              <p className="text-sm text-gray-400">Hébergement du site web et CDN</p>
            </div>
            <div>
              <p><strong className="text-brand-light">Stripe Inc.</strong> (États-Unis — certifié PCI-DSS L1 et DPF)</p>
              <p className="text-sm text-gray-400">Traitement des paiements</p>
            </div>
            <div>
              <p><strong className="text-brand-light">Resend Inc.</strong> (États-Unis)</p>
              <p className="text-sm text-gray-400">Envoi d&apos;emails transactionnels</p>
            </div>
            <div>
              <p><strong className="text-brand-light">Google LLC</strong> (États-Unis — certifié DPF)</p>
              <p className="text-sm text-gray-400">Authentification OAuth et analyse d&apos;audience (Google Analytics 4) — sous réserve du consentement de l&apos;utilisateur pour l&apos;analytics</p>
            </div>
            <div>
              <p><strong className="text-brand-light">Microsoft Corporation</strong> (États-Unis — certifié DPF)</p>
              <p className="text-sm text-gray-400">Analyse comportementale anonymisée (Microsoft Clarity) — sous réserve du consentement de l&apos;utilisateur</p>
            </div>
          </div>
          <p className="mt-3">Les données de carte bancaire sont traitées exclusivement par Stripe et ne transitent jamais par les serveurs de HUBClosing.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">4. Durée de conservation</h2>
          <div className="bg-white/5 rounded-xl p-5 space-y-2 border border-white/10">
            <p><strong className="text-brand-light">Données du compte :</strong> conservées pendant toute la durée d&apos;utilisation du service, puis trois (3) ans après la dernière connexion, conformément aux délais de prescription</p>
            <p><strong className="text-brand-light">Données de facturation :</strong> dix (10) ans conformément aux obligations comptables légales (art. L. 123-22 du Code de commerce)</p>
            <p><strong className="text-brand-light">Logs de connexion :</strong> douze (12) mois conformément au décret n° 2011-219 du 25 février 2011</p>
            <p><strong className="text-brand-light">Messages et candidatures :</strong> conservés pendant la durée du compte, puis supprimés dans un délai de trente (30) jours suivant la fermeture définitive du compte</p>
            <p><strong className="text-brand-light">Données analytics :</strong> vingt-six (26) mois maximum (paramétrage Google Analytics)</p>
          </div>
          <p className="mt-3">À l&apos;expiration de ces durées, les données sont supprimées ou anonymisées de manière irréversible.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">5. Vos droits (RGPD)</h2>
          <p>Conformément aux articles 15 à 22 du Règlement (UE) 2016/679, vous disposez des droits suivants :</p>
          <p>— <strong className="text-brand-light">Droit d&apos;accès</strong> (art. 15) : obtenir la confirmation du traitement de vos données et en recevoir une copie</p>
          <p>— <strong className="text-brand-light">Droit de rectification</strong> (art. 16) : corriger des données inexactes ou incomplètes</p>
          <p>— <strong className="text-brand-light">Droit à l&apos;effacement</strong> (art. 17) : obtenir la suppression de vos données, sous réserve des obligations légales de conservation</p>
          <p>— <strong className="text-brand-light">Droit à la portabilité</strong> (art. 20) : recevoir vos données dans un format structuré, couramment utilisé et lisible par machine</p>
          <p>— <strong className="text-brand-light">Droit d&apos;opposition</strong> (art. 21) : vous opposer au traitement de vos données pour des motifs légitimes</p>
          <p>— <strong className="text-brand-light">Droit à la limitation</strong> (art. 18) : demander la suspension du traitement dans certains cas prévus par le RGPD</p>
          <p>— <strong className="text-brand-light">Droit de retirer votre consentement</strong> (art. 7) : à tout moment et sans justification, pour les traitements fondés sur le consentement (notifications, cookies analytiques)</p>
          <p>— <strong className="text-brand-light">Directives post-mortem</strong> (loi Informatique et Libertés, art. 85) : définir des directives relatives à la conservation, l&apos;effacement et la communication de vos données après votre décès</p>
          <p className="mt-3">Pour exercer ces droits, envoyez un email à <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a> accompagné d&apos;une pièce d&apos;identité en cas de doute raisonnable sur votre identité. Nous répondons dans un délai maximum de trente (30) jours, prolongeable de deux mois en cas de demande complexe.</p>
          <p className="mt-2">En cas de litige non résolu, vous pouvez introduire une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">www.cnil.fr</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">6. Sécurité des données</h2>
          <p>Nous mettons en œuvre les mesures techniques et organisationnelles appropriées conformément à l&apos;article 32 du RGPD :</p>
          <p>— Chiffrement TLS/HTTPS pour toutes les communications entre le navigateur et nos serveurs</p>
          <p>— Authentification sécurisée via OAuth 2.0 et tokens JWT avec expiration</p>
          <p>— Row Level Security (RLS) au niveau de la base de données Supabase pour isoler strictement les données entre utilisateurs</p>
          <p>— En-têtes de sécurité HTTP : Content-Security-Policy, Strict-Transport-Security (HSTS), X-Frame-Options, X-Content-Type-Options, Referrer-Policy</p>
          <p>— Rate limiting sur les API sensibles (authentification, paiement, contact)</p>
          <p>— Absence de stockage de données bancaires sur nos serveurs (traitement exclusif par Stripe)</p>
          <p>— Audits de sécurité réguliers du code et de l&apos;infrastructure</p>
          <p className="mt-2">En cas de violation de données personnelles, nous notifierons la CNIL dans les 72 heures conformément à l&apos;article 33 du RGPD, et informerons les personnes concernées si la violation est susceptible d&apos;engendrer un risque élevé pour leurs droits et libertés (art. 34 du RGPD).</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">7. Cookies et traceurs</h2>

          <p className="font-medium text-brand-light mt-2">Cookies strictement nécessaires (exemptés de consentement — CNIL) :</p>
          <div className="bg-white/5 rounded-xl p-4 mt-2 space-y-2 border border-white/10">
            <p><strong className="text-brand-light">Cookie de session Supabase</strong> — authentification et maintien de la connexion sécurisée</p>
            <p><strong className="text-brand-light">Cookie de préférences</strong> — langue, thème et paramètres d&apos;affichage</p>
          </div>

          <p className="font-medium text-brand-light mt-4">Cookies analytiques (soumis à consentement préalable) :</p>
          <div className="bg-white/5 rounded-xl p-4 mt-2 space-y-3 border border-white/10">
            <div>
              <p className="font-medium text-brand-light">Google Analytics 4 (Google LLC)</p>
              <p className="text-sm">Mesure d&apos;audience et analyse du parcours utilisateur. L&apos;adresse IP est anonymisée. Les données sont conservées 26 mois maximum.</p>
              <p className="text-xs text-gray-400 mt-1">Opt-out : <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">tools.google.com/dlpage/gaoptout</a></p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Microsoft Clarity (Microsoft Corporation)</p>
              <p className="text-sm">Heatmaps et enregistrements de session anonymisés pour comprendre l&apos;usage de l&apos;interface. Aucune donnée personnelle identifiable n&apos;est collectée.</p>
              <p className="text-xs text-gray-400 mt-1">Politique : <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">privacy.microsoft.com</a></p>
            </div>
          </div>

          <p className="mt-3">Ces cookies analytiques ne sont activés qu&apos;après votre consentement explicite. Vous pouvez retirer ce consentement à tout moment. Le refus n&apos;affecte en rien le fonctionnement de la plateforme.</p>
          <p className="mt-2">Aucun cookie publicitaire, de retargeting ou de profilage commercial n&apos;est déposé par HUBClosing.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">8. Transferts internationaux</h2>
          <p>Certains de nos sous-traitants sont situés en dehors de l&apos;Espace Économique Européen (voir article 3). Ces transferts sont encadrés par :</p>
          <p>— Le Data Privacy Framework (DPF) UE-États-Unis, reconnu par la décision d&apos;adéquation de la Commission européenne du 10 juillet 2023</p>
          <p>— Des clauses contractuelles types adoptées par la Commission européenne, le cas échéant</p>
          <p className="mt-2">Vous pouvez obtenir une copie des garanties appropriées en contactant <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">9. Modifications de cette politique</h2>
          <p>Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Les modifications substantielles seront notifiées par email ou via la plateforme. La date de dernière mise à jour est indiquée en haut de cette page.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">10. Contact — Délégué à la protection des données</h2>
          <p>Pour toute question relative à la protection de vos données personnelles ou pour exercer vos droits, contactez-nous à <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>.</p>
        </div>
      </section>
    </article>
  );
}
