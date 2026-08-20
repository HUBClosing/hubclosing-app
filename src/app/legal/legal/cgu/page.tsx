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
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 1 — Objet</h2>
          <p>Les présentes Conditions Générales de Vente (ci-après &laquo;&nbsp;CGV&nbsp;&raquo;) régissent les relations contractuelles entre la société Ecom France, entrepreneur individuel immatriculé sous le SIRET 885 334 334 00020, exploitant la plateforme HUBClosing accessible à l&apos;adresse hubclosing.fr (ci-après &laquo;&nbsp;le Prestataire&nbsp;&raquo;), et toute personne physique ou morale souscrivant aux services payants proposés sur la plateforme (ci-après &laquo;&nbsp;le Client&nbsp;&raquo;).</p>
          <p className="mt-2">Toute souscription à un service payant implique l&apos;acceptation pleine et entière des présentes CGV, qui prévalent sur tout autre document émanant du Client.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 2 — Définitions</h2>
          <p><strong className="text-brand-light">Plateforme</strong> : le site web hubclosing.fr et l&apos;ensemble de ses fonctionnalités et services associés.</p>
          <p><strong className="text-brand-light">Candidat</strong> : utilisateur inscrit en tant que closer ou setter, recherchant des missions commerciales dans l&apos;univers de l&apos;infoproduit.</p>
          <p><strong className="text-brand-light">Recruteur</strong> : utilisateur inscrit en tant que manager, Head of Sales (HOS) ou infopréneur, publiant des offres de missions sur la marketplace.</p>
          <p><strong className="text-brand-light">Offre</strong> : annonce de mission publiée par un recruteur sur la marketplace HUBClosing.</p>
          <p><strong className="text-brand-light">Pack</strong> : offre commerciale unitaire (Solo, Équipe, Campagne) donnant accès à la publication d&apos;une annonce et à un nombre défini de déblocages de profils candidats.</p>
          <p><strong className="text-brand-light">Add-on</strong> : service complémentaire payant (déblocages supplémentaires, boost de visibilité, annonce supplémentaire).</p>
          <p><strong className="text-brand-light">Services</strong> : l&apos;ensemble des prestations numériques fournies par le Prestataire via la Plateforme.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 3 — Services proposés</h2>
          <p>HUBClosing est une marketplace de mise en relation entre closers/setters et managers/HOS dans l&apos;univers de l&apos;infoproduit et du closing commercial. La plateforme propose :</p>
          <p>— Un accès gratuit à la marketplace pour les candidats (consultation des offres, création de profil, candidature)</p>
          <p>— Des packs payants pour les recruteurs, incluant la publication d&apos;une annonce et le déblocage de profils candidats</p>
          <p>— Des add-ons optionnels : déblocages supplémentaires, boost de visibilité, annonce supplémentaire</p>
          <p>— Des fonctionnalités de messagerie, visioconférence intégrée, matching IA, CRM événementiel et suivi de performances</p>
          <p className="mt-2">Le Prestataire se réserve le droit de faire évoluer les Services à tout moment, sous réserve d&apos;en informer les Clients.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 4 — Tarifs et packs recruteur</h2>
          <p>Les tarifs en vigueur sont affichés TTC sur la page d&apos;abonnement de la plateforme. Le Prestataire étant non assujetti à la TVA en application de l&apos;article 293 B du Code général des impôts, les prix affichés sont nets.</p>
          <p className="mt-2">Les packs recruteur disponibles sont :</p>
          <p>— <strong className="text-brand-light">Pack Solo</strong> : 1 annonce + 3 déblocages de profils</p>
          <p>— <strong className="text-brand-light">Pack Équipe</strong> : 1 annonce + 10 déblocages de profils</p>
          <p>— <strong className="text-brand-light">Pack Campagne</strong> : 1 annonce + 25 déblocages de profils</p>
          <p className="mt-2">Les add-ons disponibles sont :</p>
          <p>— Déblocage unitaire (1 profil supplémentaire)</p>
          <p>— Pack 5 déblocages supplémentaires</p>
          <p>— Boost de visibilité pour une annonce</p>
          <p>— Annonce supplémentaire</p>
          <p className="mt-2">Les tarifs sont susceptibles de modification à tout moment. Le prix applicable est celui affiché sur la plateforme au moment de la validation de la commande par le Client. Toute modification tarifaire est sans effet sur les commandes déjà validées.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 5 — Processus de commande</h2>
          <p>Le processus de commande se déroule comme suit :</p>
          <p>1. Le Client sélectionne le pack ou l&apos;add-on souhaité sur la page d&apos;abonnement.</p>
          <p>2. Le Client vérifie le récapitulatif de sa commande et le prix total.</p>
          <p>3. Le Client est redirigé vers la page de paiement sécurisée Stripe.</p>
          <p>4. Le Client valide le paiement, ce qui constitue l&apos;acceptation ferme et définitive des présentes CGV.</p>
          <p>5. Un email de confirmation est envoyé à l&apos;adresse email du Client.</p>
          <p className="mt-2">L&apos;accès aux services achetés est immédiat après confirmation du paiement par le prestataire de paiement Stripe.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 6 — Modalités de paiement</h2>
          <p>Le paiement est effectué en ligne via la plateforme de paiement sécurisée Stripe (Stripe Inc., certifié PCI-DSS Niveau 1). Les moyens de paiement acceptés sont :</p>
          <p>— Carte bancaire (Visa, Mastercard, American Express)</p>
          <p>— Prélèvement SEPA</p>
          <p className="mt-2">Les packs et add-ons sont des paiements uniques (one-time). Aucun prélèvement récurrent n&apos;est effectué sauf mention contraire explicite lors de la commande.</p>
          <p className="mt-2">HUBClosing ne collecte ni ne stocke aucune donnée de carte bancaire. L&apos;ensemble des transactions sont traitées exclusivement par Stripe.</p>
          <p className="mt-2">En cas de rejet du paiement, la commande est annulée et aucun service n&apos;est activé.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 7 — Livraison des services numériques</h2>
          <p>Les services numériques (accès à la publication d&apos;annonce, déblocages de profils, boost de visibilité) sont délivrés par voie électronique, immédiatement après la confirmation du paiement. Le Client reconnaît que la nature numérique des services exclut toute livraison physique.</p>
          <p className="mt-2">En cas de dysfonctionnement technique empêchant la délivrance du service, le Client peut contacter le support à contact@hubclosing.fr. Le Prestataire s&apos;engage à rétablir l&apos;accès dans les meilleurs délais ou, à défaut, à procéder au remboursement intégral.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 8 — Droit de rétractation</h2>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p>Conformément à l&apos;article L. 221-28, 13° du Code de la consommation, le droit de rétractation de 14 jours ne peut être exercé pour les contrats de fourniture de contenu numérique non fourni sur un support matériel dont l&apos;exécution a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.</p>
            <p className="mt-3"><strong className="text-brand-light">Avant de finaliser toute commande, le Client doit expressément :</strong></p>
            <p className="mt-1">— Cocher une case confirmant qu&apos;il consent à l&apos;exécution immédiate du service dès la validation du paiement ;</p>
            <p>— Reconnaître qu&apos;en conséquence, il renonce expressément à son droit de rétractation de 14 jours prévu par l&apos;article L. 221-18 du Code de la consommation.</p>
            <p className="mt-3">Sans cette double acceptation, la commande ne peut être validée. L&apos;email de confirmation de commande rappelle cette renonciation.</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 9 — Rôle d&apos;intermédiaire</h2>
          <p>HUBClosing agit exclusivement en qualité d&apos;intermédiaire technique de mise en relation au sens de l&apos;article 6.I.2 de la loi n° 2004-575 du 21 juin 2004 (LCEN). Le Prestataire n&apos;est en aucun cas partie aux contrats, accords ou négociations conclus entre candidats et recruteurs via la plateforme.</p>
          <p className="mt-2">À ce titre, HUBClosing ne garantit pas :</p>
          <p>— La conclusion d&apos;un accord commercial entre les parties</p>
          <p>— Les résultats financiers ou commerciaux des collaborations</p>
          <p>— Le paiement des commissions ou rémunérations entre utilisateurs</p>
          <p>— La qualité, la disponibilité ou les compétences des candidats ou recruteurs</p>
          <p>— La véracité des informations publiées par les utilisateurs</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 10 — Obligations du Client</h2>
          <p>Le Client s&apos;engage à :</p>
          <p>— Fournir des informations exactes, complètes et à jour lors de son inscription et de toute commande</p>
          <p>— Utiliser la plateforme conformément aux lois en vigueur et aux présentes CGV</p>
          <p>— Ne pas publier de contenu faux, trompeur, diffamatoire ou portant atteinte aux droits de tiers</p>
          <p>— Ne pas usurper l&apos;identité d&apos;un tiers</p>
          <p>— Ne pas utiliser la plateforme à des fins de spam, harcèlement ou sollicitation non désirée</p>
          <p>— Ne pas contourner les mécanismes de sécurité, les limitations techniques ou les fonctionnalités payantes de la plateforme</p>
          <p>— Ne pas porter atteinte au bon fonctionnement du service</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 11 — Modération et suspension</h2>
          <p>Le Prestataire se réserve le droit, sans préavis ni indemnité, de :</p>
          <p>— Modérer, modifier ou supprimer tout contenu contraire aux présentes CGV, à la loi ou aux bonnes mœurs</p>
          <p>— Suspendre temporairement ou résilier définitivement le compte d&apos;un utilisateur en cas de manquement</p>
          <p className="mt-2">En cas de suspension ou résiliation d&apos;un compte pour violation des présentes CGV par le Client, aucun remboursement des services en cours ne sera dû. Le Prestataire informera le Client par email des motifs de la suspension.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 12 — Propriété intellectuelle</h2>
          <p>L&apos;ensemble du contenu de la plateforme HUBClosing (textes, images, logos, interface graphique, code source, bases de données, fonctionnalités) est protégé par les dispositions du Code de la propriété intellectuelle et les lois relatives au droit d&apos;auteur et aux droits voisins.</p>
          <p className="mt-2">La marque <strong className="text-brand-light">HUBClosing</strong>, le logo et le slogan &laquo;&nbsp;Connectez. Closez. Évoluez.&nbsp;&raquo; sont la propriété exclusive du Prestataire. Toute reproduction, imitation ou utilisation non autorisée constitue une contrefaçon sanctionnée par les articles L. 335-2 et suivants du Code de la propriété intellectuelle.</p>
          <p className="mt-2">Les utilisateurs conservent la propriété intellectuelle de leur propre contenu publié sur la plateforme. En publiant du contenu, l&apos;utilisateur accorde au Prestataire une licence non exclusive, mondiale, gratuite et pour la durée de son inscription, aux fins d&apos;affichage et de distribution dans le cadre du fonctionnement de la plateforme.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 13 — Indemnisation</h2>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p>Le Client s&apos;engage à garantir et indemniser le Prestataire, ses dirigeants, employés et sous-traitants, contre toute réclamation, action, perte, dommage, coût ou dépense (y compris les honoraires d&apos;avocat raisonnables) résultant directement ou indirectement :</p>
            <p className="mt-2">— De l&apos;utilisation de la plateforme par le Client en violation des présentes CGV</p>
            <p>— De tout contenu publié par le Client sur la plateforme</p>
            <p>— De toute atteinte aux droits d&apos;un tiers (notamment droits de propriété intellectuelle, droit à l&apos;image, diffamation)</p>
            <p>— De toute relation contractuelle ou commerciale engagée par le Client avec un autre utilisateur via la plateforme</p>
            <p className="mt-2">Cette obligation d&apos;indemnisation survit à la résiliation du compte du Client.</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 14 — Responsabilité</h2>
          <p>Le Prestataire met en œuvre les moyens raisonnables pour assurer la disponibilité, la sécurité et le bon fonctionnement de la plateforme, sans obligation de résultat.</p>
          <p className="mt-2">Le Prestataire ne saurait être tenu responsable :</p>
          <p>— Des dommages indirects, accessoires ou consécutifs, y compris les pertes de profits, de chiffre d&apos;affaires, de données ou d&apos;opportunités commerciales</p>
          <p>— Des relations contractuelles ou commerciales entre utilisateurs</p>
          <p>— Des résultats commerciaux obtenus par les utilisateurs</p>
          <p>— D&apos;une interruption de service pour maintenance planifiée ou d&apos;urgence</p>
          <p>— De la perte de données résultant d&apos;un cas de force majeure</p>
          <p>— Du contenu publié par les utilisateurs</p>
          <p className="mt-2"><strong className="text-brand-light">Plafond de responsabilité :</strong> en tout état de cause, la responsabilité totale et cumulée du Prestataire au titre des présentes CGV est limitée au montant effectivement payé par le Client au cours des douze (12) mois précédant le fait générateur du dommage. Cette limitation ne s&apos;applique pas en cas de dol ou de faute lourde du Prestataire.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 15 — Force majeure</h2>
          <div className="bg-white/5 rounded-xl p-5 border border-white/10">
            <p>Aucune des parties ne pourra être tenue responsable de l&apos;inexécution totale ou partielle de ses obligations si cette inexécution est provoquée par un événement de force majeure au sens de l&apos;article 1218 du Code civil.</p>
            <p className="mt-2">Sont notamment considérés comme cas de force majeure, sans que cette liste soit limitative :</p>
            <p>— Catastrophes naturelles, incendies, inondations, tempêtes</p>
            <p>— Épidémies, pandémies, mesures sanitaires gouvernementales</p>
            <p>— Guerres, émeutes, actes de terrorisme, sanctions internationales</p>
            <p>— Grèves générales, blocages des transports ou des télécommunications</p>
            <p>— Pannes électriques ou de réseau internet indépendantes de la volonté du Prestataire</p>
            <p>— Cyberattaques (DDoS, ransomware) d&apos;une ampleur exceptionnelle et imprévisible</p>
            <p>— Décisions législatives, réglementaires ou judiciaires empêchant l&apos;exécution du contrat</p>
            <p>— Défaillance d&apos;un prestataire technique essentiel (hébergeur, prestataire de paiement) indépendante de la volonté du Prestataire</p>
            <p className="mt-2"><strong className="text-brand-light">Conséquences :</strong> l&apos;exécution des obligations est suspendue pendant la durée de l&apos;événement de force majeure. Si l&apos;événement persiste au-delà de trente (30) jours consécutifs, chaque partie pourra résilier le contrat de plein droit par notification écrite, sans indemnité. Le Prestataire procédera alors au remboursement prorata temporis des services non fournis.</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 16 — Données personnelles</h2>
          <p>Le traitement des données personnelles est détaillé dans notre <a href="/legal/privacy" className="text-brand-green hover:underline">Politique de confidentialité</a>. En souscrivant aux services, le Client consent au traitement de ses données conformément au Règlement Général sur la Protection des Données (UE) 2016/679.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 17 — Modification des CGV</h2>
          <p>Le Prestataire se réserve le droit de modifier les présentes CGV à tout moment. Les utilisateurs seront informés des modifications substantielles par notification sur la plateforme et/ou par email, au moins quinze (15) jours avant leur entrée en vigueur.</p>
          <p className="mt-2">La poursuite de l&apos;utilisation des services après l&apos;entrée en vigueur des modifications vaut acceptation des nouvelles CGV. En cas de désaccord, le Client peut résilier son compte sans frais avant l&apos;entrée en vigueur des nouvelles conditions.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 18 — Droit applicable et règlement des litiges</h2>
          <p>Les présentes CGV sont régies par le droit français, quel que soit le lieu de résidence du Client.</p>
          <p className="mt-2"><strong className="text-brand-light">Règlement amiable :</strong> en cas de litige, les parties s&apos;engagent à rechercher une solution amiable dans un délai de trente (30) jours à compter de la notification du litige par lettre recommandée avec accusé de réception ou par email avec accusé de lecture.</p>
          <p className="mt-2"><strong className="text-brand-light">Médiation de la consommation :</strong> conformément aux articles L. 611-1 à L. 616-3 et R. 612-1 à R. 616-2 du Code de la consommation, le Client consommateur peut recourir gratuitement au service de médiation suivant :</p>
          <div className="bg-white/5 rounded-xl p-4 mt-2 border border-white/10">
            <p><strong className="text-brand-light">CNPM — MÉDIATION DE LA CONSOMMATION</strong></p>
            <p className="text-sm mt-1">27 avenue de la Libération — 42400 Saint-Chamond</p>
            <p className="text-sm"><a href="https://cnpm-mediation-consommation.eu" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">cnpm-mediation-consommation.eu</a></p>
          </div>
          <p className="mt-3">Le Client peut également recourir à la plateforme de Règlement en Ligne des Litiges (RLL) de la Commission européenne : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:underline">ec.europa.eu/consumers/odr</a>.</p>
          <p className="mt-2"><strong className="text-brand-light">Juridiction compétente :</strong> à défaut de résolution amiable ou de médiation, tout litige sera soumis aux tribunaux compétents du ressort du siège social du Prestataire, sauf disposition légale impérative contraire (notamment au bénéfice du consommateur).</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 19 — Dispositions diverses</h2>
          <p><strong className="text-brand-light">Divisibilité :</strong> si l&apos;une des clauses des présentes CGV est déclarée nulle ou inapplicable par une juridiction compétente, les autres clauses conservent leur pleine force et effet.</p>
          <p className="mt-2"><strong className="text-brand-light">Non-renonciation :</strong> le fait pour le Prestataire de ne pas se prévaloir d&apos;un manquement du Client à l&apos;une de ses obligations ne saurait être interprété comme une renonciation à l&apos;obligation en cause.</p>
          <p className="mt-2"><strong className="text-brand-light">Intégralité :</strong> les présentes CGV, complétées par la Politique de confidentialité et les Mentions légales, constituent l&apos;intégralité de l&apos;accord entre les parties.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-brand-light mb-2">Article 20 — Contact</h2>
          <p>Pour toute question relative aux présentes CGV, vous pouvez nous contacter à l&apos;adresse <a href="mailto:contact@hubclosing.fr" className="text-brand-green hover:underline">contact@hubclosing.fr</a>.</p>
        </div>
      </section>
    </article>
  );
}
