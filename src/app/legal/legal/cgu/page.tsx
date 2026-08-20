import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — HUBClosing',
  description: 'Conditions générales de vente de la plateforme HUBClosing.',
};

export default function CGVPage() {
  return (
    <article className="prose prose-invert prose-sm max-w-none">
      <p className="text-xs uppercase tracking-widest text-brand-green font-semibold mb-2">Légal</p>
      <h1 className="text-3xl font-bold text-brand-light mb-1">Conditions Générales de Vente</h1>
      <p className="text-sm text-gray-400 mb-10">Dernière mise à jour : 20 août 2026</p>

      <section className="space-y-6 text-gray-300 text-[15px] leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">1. Objet</h2>
          <p>Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles entre la société Ecom France, exploitant la plateforme HUBClosing accessible à l&apos;adresse hubclosing.fr, et toute personne physique ou morale (ci-après &laquo;&nbsp;le Client&nbsp;&raquo;) souscrivant aux services payants proposés sur la plateforme. Toute souscription à un service payant implique l&apos;acceptation sans réserve des présentes CGV.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">2. Définitions</h2>
          <p><strong className="text-brand-light">Plateforme</strong> : le site web hubclosing.fr et l&apos;ensemble de ses services associés.</p>
          <p><strong className="text-brand-light">Candidat</strong> : utilisateur inscrit en tant que closer ou setter, recherchant des missions commerciales.</p>
          <p><strong className="text-brand-light">Recruteur</strong> : utilisateur inscrit en tant que manager, Head of Sales (HOS) ou infopréneur, publiant des offres de missions.</p>
          <p><strong className="text-brand-light">Offre</strong> : annonce de mission publiée par un recruteur sur la marketplace.</p>
          <p><strong className="text-brand-light">Pack</strong> : offre commerciale unitaire (Solo, Équipe, Campagne) donnant accès à la publication d&apos;une annonce et à un nombre défini de déblocages de profils candidats.</p>
          <p><strong className="text-brand-light">Add-on</strong> : service complémentaire payant (déblocages supplémentaires, boost de visibilité, annonce supplémentaire).</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">3. Services proposés</h2>
          <p>HUBClosing est une marketplace de mise en relation entre closers/setters et managers/HOS dans l&apos;univers de l&apos;infoproduit et du closing commercial. La plateforme propose :</p>
          <p>— Un accès gratuit à la marketplace pour les candidats (consultation des offres, création de profil, candidature)</p>
          <p>— Des packs payants pour les recruteurs, incluant la publication d&apos;une annonce et le déblocage de profils candidats</p>
          <p>— Des add-ons optionnels : déblocages supplémentaires, boost de visibilité, annonce supplémentaire</p>
          <p>— Des fonctionnalités de messagerie, visioconférence intégrée, matching IA, CRM événementiel et suivi de performances</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">4. Tarifs et packs recruteur</h2>
          <p>Les tarifs en vigueur sont affichés TTC sur la page d&apos;abonnement de la plateforme. L&apos;éditeur étant non assujetti à la TVA (article 293 B du CGI), les prix affichés sont nets.</p>
          <p>Les packs recruteur disponibles sont :</p>
          <p>— <strong className="text-brand-light">Pack Solo</strong> : 1 annonce + 3 déblocages de profils</p>
          <p>— <strong className="text-brand-light">Pack Équipe</strong> : 1 annonce + 10 déblocages de profils</p>
          <p>— <strong className="text-brand-light">Pack Campagne</strong> : 1 annonce + 25 déblocages de profils</p>
          <p>Les add-ons disponibles sont :</p>
          <p>— Déblocage unitaire (1 profil supplémentaire)</p>
          <p>— Pack 5 déblocages supplémentaires</p>
          <p>— Boost de visibilité pour une annonce</p>
          <p>— Annonce supplémentaire</p>
          <p>Les tarifs sont susceptibles de modification à tout moment. Le prix applicable est celui en vigueur au moment de la validation de la commande.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">5. Processus de commande</h2>
          <p>Le Client sélectionne le pack ou l&apos;add-on souhaité sur la page d&apos;abonnement. Il est redirigé vers la page de paiement sécurisée Stripe. Le paiement valide la commande de manière ferme et définitive. Un email de confirmation est envoyé à l&apos;adresse email du Client.</p>
          <p>L&apos;accès aux services achetés est immédiat après confirmation du paiement par Stripe.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">6. Modalités de paiement</h2>
          <p>Le paiement est effectué en ligne via la plateforme de paiement sécurisée Stripe. Les moyens de paiement acceptés sont : carte bancaire (Visa, Mastercard, American Express) et prélèvement SEPA.</p>
          <p>Les packs et add-ons sont des paiements uniques (one-time). Aucun prélèvement récurrent n&apos;est effectué sauf mention contraire explicite.</p>
          <p>HUBClosing ne stocke aucune donnée de carte bancaire. L&apos;ensemble des transactions sont traitées par Stripe (certifié PCI-DSS Niveau 1).</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">7. Livraison des services numériques</h2>
          <p>Les services numériques (accès à la publication d&apos;annonce, déblocages de profils, boost) sont délivrés immédiatement après la confirmation du paiement. Le Client reconnaît que l&apos;exécution du service commence dès la validation de la commande.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">8. Droit de rétractation</h2>
          <p>Conformément à l&apos;article L. 221-28 du Code de la consommation, le droit de rétractation ne peut être exercé pour les contrats de fourniture de contenu numérique non fourni sur un support matériel dont l&apos;exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.</p>
          <p>En validant sa commande, le Client reconnaît expressément renoncer à son droit de rétractation et consent à ce que l&apos;exécution du service commence immédiatement.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">9. Rôle d&apos;intermédiaire</h2>
          <p>HUBClosing agit exclusivement en tant qu&apos;intermédiaire de mise en relation. La plateforme n&apos;est pas partie aux contrats conclus entre candidats et recruteurs. HUBClosing ne garantit pas :</p>
          <p>— La conclusion d&apos;un accord entre les parties</p>
          <p>— Les résultats commerciaux des collaborations</p>
          <p>— Le paiement des commissions entre utilisateurs</p>
          <p>— La qualité ou la disponibilité des candidats ou recruteurs</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">10. Obligations de l&apos;utilisateur</h2>
          <p>L&apos;utilisateur s&apos;engage à utiliser la plateforme conformément aux lois en vigueur et aux présentes CGV. Il est notamment interdit de :</p>
          <p>— Publier du contenu faux, trompeur ou diffamatoire</p>
          <p>— Usurper l&apos;identité d&apos;un tiers</p>
          <p>— Utiliser la plateforme à des fins de spam ou de sollicitation non désirée</p>
          <p>— Contourner les mécanismes de sécurité ou les limitations de la plateforme</p>
          <p>— Porter atteinte au bon fonctionnement du service</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">11. Modération et suspension</h2>
          <p>HUBClosing se réserve le droit de modérer, suspendre ou supprimer tout contenu ou compte ne respectant pas les présentes CGV, sans préavis et sans indemnité. En cas de suspension d&apos;un compte ayant souscrit un pack, aucun remboursement ne sera dû si la suspension résulte d&apos;une violation des CGV par le Client.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">12. Propriété intellectuelle</h2>
          <p>L&apos;ensemble du contenu de la plateforme (textes, images, logo, interface, code source) est protégé par le droit d&apos;auteur. La marque HUBClosing, le logo et le slogan &laquo;&nbsp;Connectez. Closez. Évoluez.&nbsp;&raquo; sont la propriété exclusive de l&apos;éditeur.</p>
          <p>Les utilisateurs conservent la propriété de leur contenu publié. En publiant du contenu, l&apos;utilisateur accorde à HUBClosing une licence non exclusive pour afficher et distribuer ce contenu dans le cadre du fonctionnement de la plateforme.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">13. Responsabilité</h2>
          <p>HUBClosing met en œuvre les moyens raisonnables pour assurer la disponibilité et la sécurité de la plateforme, mais ne garantit pas un accès ininterrompu. HUBClosing ne saurait être tenu responsable :</p>
          <p>— Des dommages directs ou indirects résultant de l&apos;utilisation de la plateforme</p>
          <p>— Des relations contractuelles entre utilisateurs</p>
          <p>— D&apos;une interruption de service pour maintenance ou force majeure</p>
          <p>— De la perte de données en cas de force majeure</p>
          <p>La responsabilité de HUBClosing est en tout état de cause limitée au montant payé par le Client au cours des 12 derniers mois précédant le fait générateur.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">14. Données personnelles</h2>
          <p>Le traitement des données personnelles est détaillé dans notre <a href="/legal/privacy" className="text-brand-green hover:underline">Politique de confidentialité</a>. En souscrivant aux services, le Client consent au traitement de ses données conformément au RGPD.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">15. Modification des CGV</h2>
          <p>HUBClosing se réserve le droit de modifier les présentes CGV à tout moment. Les utilisateurs seront informés des modifications par notification sur la plateforme. La poursuite de l&apos;utilisation des services après modification vaut acceptation des nouvelles CGV.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">16. Droit applicable et litiges</h2>
          <p>Les présentes CGV sont régies par le droit français. En cas de litige, les parties s&apos;engagent à rechercher une solution amiable avant toute action judiciaire. Conformément aux articles L. 611-1 et R. 612-1 du Code de la consommation, le Client peut recourir gratuitement au service de médiation de la consommation. À défaut de résolution amiable, les tribunaux compétents seront ceux du ressort du siège social de l&apos;éditeur.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">17. Contact</h2>
          <p>Pour toute question relative aux présentes CGV, vous pouvez nous contacter à l&apos;adresse <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>.</p>
        </div>
      </section>
    </article>
  );
}
