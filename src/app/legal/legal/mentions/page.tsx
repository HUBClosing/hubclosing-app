import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mentions légales — HUBClosing',
  description: 'Mentions légales de la plateforme HUBClosing.',
};

/* Mentions légales obligatoires — Loi n° 2004-575 du 21 juin 2004 (LCEN) */

export default function MentionsPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-xs uppercase tracking-widest text-brand-green font-semibold mb-2">Légal</p>
      <h1 className="text-3xl font-bold text-brand-light mb-1">Mentions légales</h1>
      <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 20 août 2026</p>

      <section className="space-y-6 text-gray-300 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">1. Éditeur du site</h2>
          <div className="bg-white/5 rounded-xl p-5 space-y-2 border border-white/10">
            <p><strong className="text-brand-light">Raison sociale :</strong> Ecom France — Entrepreneur individuel (auto-entrepreneur)</p>
            <p><strong className="text-brand-light">Nom commercial :</strong> HUBClosing</p>
            <p><strong className="text-brand-light">Siège social :</strong> France</p>
            <p><strong className="text-brand-light">SIRET :</strong> 885 334 334 00020</p>
            <p><strong className="text-brand-light">Code APE :</strong> 4791B — Vente à distance sur catalogue spécialisé</p>
            <p><strong className="text-brand-light">TVA :</strong> Non assujetti à la TVA (article 293 B du Code général des impôts)</p>
            <p><strong className="text-brand-light">Directrice de la publication :</strong> Céline</p>
            <p><strong className="text-brand-light">Email de contact :</strong> <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a></p>
            <p><strong className="text-brand-light">Site web :</strong> <a href="https://hubclosing.fr" className="text-brand-green hover:underline">hubclosing.fr</a></p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">2. Hébergement</h2>
          <div className="bg-white/5 rounded-xl p-5 space-y-2 border border-white/10">
            <p><strong className="text-brand-light">Hébergeur du site web :</strong> Vercel Inc.</p>
            <p>440 N Baxter St, Covina, CA 91723, États-Unis</p>
            <p>Site web : <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">vercel.com</a></p>
          </div>
          <div className="bg-white/5 rounded-xl p-5 space-y-2 mt-3 border border-white/10">
            <p><strong className="text-brand-light">Hébergeur de la base de données :</strong> Supabase Inc.</p>
            <p>970 Toa Payoh North #07-04, Singapore 318992</p>
            <p>Site web : <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">supabase.com</a></p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">3. Propriété intellectuelle</h2>
          <p>L&apos;ensemble du contenu du site hubclosing.fr — textes, images, logo, interface graphique, code source, bases de données, fonctionnalités — est protégé par le droit d&apos;auteur et les lois relatives à la propriété intellectuelle (articles L. 111-1 et suivants du Code de la propriété intellectuelle). Toute reproduction, représentation, modification, publication ou exploitation, même partielle, est interdite sans autorisation préalable écrite de l&apos;éditeur.</p>
          <p className="mt-2">La marque <strong className="text-brand-light">HUBClosing</strong>, le logo et le slogan &laquo;&nbsp;Connectez. Closez. Évoluez.&nbsp;&raquo; sont la propriété exclusive de l&apos;éditeur. Toute utilisation non autorisée constitue une contrefaçon sanctionnée par les articles L. 335-2 et suivants du Code de la propriété intellectuelle.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">4. Données personnelles</h2>
          <p>Le traitement des données personnelles collectées sur le site est détaillé dans notre <a href="/legal/privacy" className="text-brand-green hover:underline">Politique de confidentialité</a>.</p>
          <p className="mt-2">Conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679) et à la loi n° 78-17 du 6 janvier 1978 relative à l&apos;informatique, aux fichiers et aux libertés (modifiée), vous disposez des droits suivants sur vos données personnelles : accès, rectification, effacement, portabilité, limitation et opposition au traitement.</p>
          <p className="mt-2">Pour exercer ces droits, adressez votre demande par email à <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>. Nous répondons dans un délai maximum de trente (30) jours.</p>
          <p className="mt-2">En cas de litige non résolu, vous pouvez introduire une réclamation auprès de la Commission Nationale de l&apos;Informatique et des Libertés (CNIL) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">www.cnil.fr</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">5. Cookies et traceurs</h2>
          <p><strong className="text-brand-light">Cookies strictement nécessaires (exemptés de consentement) :</strong></p>
          <p>Le site utilise des cookies strictement nécessaires au fonctionnement du service : authentification (session Supabase), préférences utilisateur et sécurité. Conformément aux recommandations de la CNIL, ces cookies ne requièrent pas le recueil du consentement préalable.</p>

          <p className="mt-3"><strong className="text-brand-light">Cookies analytiques (soumis à consentement) :</strong></p>
          <p>Afin d&apos;améliorer l&apos;expérience utilisateur et de comprendre l&apos;utilisation du site, HUBClosing utilise les outils d&apos;analyse suivants, uniquement après obtention du consentement explicite de l&apos;utilisateur via le bandeau cookies :</p>
          <div className="bg-white/5 rounded-xl p-5 mt-2 space-y-3 border border-white/10">
            <div>
              <p className="font-medium text-brand-light">Google Analytics 4 (Google LLC)</p>
              <p className="text-sm">Mesure d&apos;audience et analyse du parcours utilisateur. Identifiant de mesure : G-NMTC5GW220. Les données sont hébergées dans l&apos;Union européenne. L&apos;adresse IP est anonymisée.</p>
              <p className="text-xs text-gray-400 mt-1">Politique de confidentialité Google : <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">policies.google.com/privacy</a></p>
            </div>
            <div>
              <p className="font-medium text-brand-light">Microsoft Clarity (Microsoft Corporation)</p>
              <p className="text-sm">Analyse comportementale par heatmaps et enregistrements de session anonymisés. Projet ID : y3qj6kg8ew. Aucune donnée personnelle identifiable n&apos;est collectée par cet outil.</p>
              <p className="text-xs text-gray-400 mt-1">Politique de confidentialité Microsoft : <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">privacy.microsoft.com</a></p>
            </div>
          </div>
          <p className="mt-3">Vous pouvez retirer votre consentement à tout moment en modifiant vos préférences cookies. Le refus des cookies analytiques n&apos;affecte pas le fonctionnement de la plateforme.</p>
          <p className="mt-2">Aucun cookie publicitaire n&apos;est déposé par HUBClosing.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">6. Limitation de responsabilité</h2>
          <p>HUBClosing agit en tant qu&apos;intermédiaire technique de mise en relation entre closers/setters et managers/HOS. À ce titre, HUBClosing ne peut être tenu responsable :</p>
          <p>— Des relations contractuelles ou commerciales entre utilisateurs</p>
          <p>— Des résultats obtenus dans le cadre des collaborations initiées via la plateforme</p>
          <p>— Du contenu publié par les utilisateurs</p>
          <p>— Des interruptions temporaires du service pour maintenance ou mise à jour</p>
          <p className="mt-2">L&apos;éditeur s&apos;efforce de maintenir les informations publiées exactes et à jour, mais ne peut garantir l&apos;exhaustivité ou l&apos;absence d&apos;erreur. Les informations sont fournies à titre indicatif.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">7. Liens hypertextes</h2>
          <p>Le site peut contenir des liens vers des sites tiers. HUBClosing n&apos;exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu, leur disponibilité ou leurs pratiques en matière de protection des données personnelles.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">8. Médiation de la consommation</h2>
          <p>Conformément aux articles L. 611-1 à L. 616-3 du Code de la consommation, tout consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable d&apos;un litige. Le médiateur désigné est :</p>
          <div className="bg-white/5 rounded-xl p-4 mt-2 border border-white/10">
            <p><strong className="text-brand-light">CNPM — MÉDIATION DE LA CONSOMMATION</strong></p>
            <p className="text-sm mt-1">27 avenue de la Libération — 42400 Saint-Chamond</p>
            <p className="text-sm"><a href="https://cnpm-mediation-consommation.eu" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">cnpm-mediation-consommation.eu</a></p>
          </div>
          <p className="mt-3">Vous pouvez également recourir à la plateforme européenne de Règlement en Ligne des Litiges : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">ec.europa.eu/consumers/odr</a>.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">9. Droit applicable</h2>
          <p>Les présentes mentions légales sont régies par le droit français. Tout litige sera soumis à la compétence exclusive des juridictions françaises, sous réserve des dispositions impératives applicables au consommateur.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">10. Contact</h2>
          <p>Pour toute question, contactez-nous à <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>.</p>
        </div>
      </section>
    </article>
  );
}
