import { getUser } from '@/lib/auth';
import { Card, CardContent, CardHeader } from '@/components/ui';
import {
  BookOpen, UserPlus, Search, FileText, MessageSquare, Star,
  Briefcase, Target, Award, CreditCard, Shield, HelpCircle,
  ChevronRight, Lightbulb, CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'Guide d\'utilisation — HUBClosing',
};

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-bold text-brand-dark">{title}</h2>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-600 leading-relaxed">
        {children}
      </CardContent>
    </Card>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <p>{text}</p>
    </div>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-amber-800">{text}</p>
    </div>
  );
}

export default async function GuidePage() {
  const user = await getUser();
  const isRecruiter = user?.role_type === 'recruiter' || user?.role_type === 'both' || user?.role === 'manager';
  const isCandidate = user?.role_type === 'candidate' || user?.role_type === 'both' || user?.role === 'closer';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-brand-green" />
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Guide d&apos;utilisation</h1>
          <p className="text-sm text-gray-500">Tout ce qu&apos;il faut savoir pour bien utiliser HUBClosing</p>
        </div>
      </div>

      {/* Présentation générale */}
      <Section icon={<HelpCircle className="h-5 w-5 text-brand-green" />} title="Qu'est-ce que HUBClosing ?">
        <p>
          <strong>HUBClosing</strong> est la 1re plateforme de mise en relation entre les <strong>closers/setters</strong> et les <strong>recruteurs</strong> (HOS, agences, infopreneurs).
        </p>
        <p>
          Notre mission : vous permettre de trouver rapidement les meilleures opportunit&eacute;s de closing ou les meilleurs candidats pour vos offres, gr&acirc;ce &agrave; des outils de matching, de suivi et de r&eacute;putation.
        </p>
      </Section>

      {/* Premiers pas */}
      <Section icon={<UserPlus className="h-5 w-5 text-brand-green" />} title="Premiers pas">
        <Step n={1} text="Cr&eacute;ez votre compte en choisissant votre r&ocirc;le : Candidat (closer/setter) ou Recruteur." />
        <Step n={2} text="Confirmez votre email en cliquant sur le lien re&ccedil;u dans votre bo&icirc;te mail." />
        <Step n={3} text="Compl&eacute;tez votre profil : photo, bio, comp&eacute;tences, niches, liens (Instagram, Loom...)." />
        <Step n={4} text="Explorez la plateforme ! Le tableau de bord vous donne une vue d'ensemble de votre activit&eacute;." />
        <Tip text="Plus votre profil est complet, plus vous avez de chances d'&ecirc;tre rep&eacute;r&eacute;(e) par les recruteurs ou de d&eacute;crocher une mission." />
      </Section>

      {/* Guide Candidat */}
      {isCandidate && (
        <>
          <div className="pt-2">
            <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
              <Target className="h-5 w-5 text-brand-amber" />
              Guide Candidat
            </h2>
          </div>

          <Section icon={<Search className="h-5 w-5 text-brand-green" />} title="Trouver des offres">
            <p>Rendez-vous dans la <strong>Marketplace</strong> pour voir toutes les offres publi&eacute;es par les recruteurs.</p>
            <Step n={1} text="Utilisez les filtres (niche, type de closing, localisation) pour affiner vos r&eacute;sultats." />
            <Step n={2} text="Cliquez sur une offre pour voir le d&eacute;tail : description, conditions, commission, questionnaire." />
            <Step n={3} text="Cliquez sur &laquo; Postuler &raquo; et remplissez le questionnaire du recruteur." />
            <Tip text="Certaines offres premium ne sont visibles qu'avec un abonnement Starter ou sup&eacute;rieur." />
          </Section>

          <Section icon={<FileText className="h-5 w-5 text-brand-green" />} title="Suivre vos candidatures">
            <p>La page <strong>Mes candidatures</strong> affiche toutes vos candidatures avec leur statut en temps r&eacute;el :</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-yellow-500" /> <span>En attente</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-500" /> <span>En cours de revue</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> <span>Accept&eacute;e</span></div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-red-500" /> <span>Refus&eacute;e</span></div>
            </div>
          </Section>

          <Section icon={<MessageSquare className="h-5 w-5 text-brand-green" />} title="Messagerie">
            <p>
              Une fois votre candidature accept&eacute;e, un <strong>chat en temps r&eacute;el</strong> s'ouvre avec le recruteur.
              Vous pouvez &eacute;changer des messages et m&ecirc;me lancer une <strong>visio</strong> directement depuis la conversation.
            </p>
            <Tip text="Le recruteur ne voit vos coordonn&eacute;es (t&eacute;l, email) qu'apr&egrave;s validation de votre profil." />
          </Section>

          <Section icon={<Target className="h-5 w-5 text-brand-green" />} title="Tracking & Performances">
            <p>
              Enregistrez vos appels dans <strong>Tracking Calls</strong> pour suivre vos stats (CA, taux de closing, nombre d'appels).
            </p>
            <p>
              La page <strong>Mes performances</strong> permet de faire valider vos r&eacute;sultats par votre HOS pour construire un historique v&eacute;rifiable.
            </p>
          </Section>

          <Section icon={<Award className="h-5 w-5 text-brand-green" />} title="R&eacute;putation">
            <p>
              Apr&egrave;s chaque mission termin&eacute;e, le recruteur peut vous laisser un <strong>avis</strong>. Votre score de r&eacute;putation est visible sur votre profil public dans la CVth&egrave;que.
            </p>
            <Tip text="Un bon score de r&eacute;putation augmente consid&eacute;rablement vos chances d'&ecirc;tre s&eacute;lectionn&eacute;(e) !" />
          </Section>

          <Section icon={<Star className="h-5 w-5 text-brand-green" />} title="Suggestions IA">
            <p>
              L'algorithme de <strong>Suggestions IA</strong> analyse votre profil et vos comp&eacute;tences pour vous recommander les offres les plus pertinentes. Disponible d&egrave;s le plan Starter.
            </p>
          </Section>
        </>
      )}

      {/* Guide Recruteur */}
      {isRecruiter && (
        <>
          <div className="pt-2">
            <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-brand-green" />
              Guide Recruteur
            </h2>
          </div>

          <Section icon={<FileText className="h-5 w-5 text-brand-green" />} title="Publier une offre">
            <Step n={1} text="Allez dans Mes offres et cliquez sur &laquo; Publier une offre &raquo;." />
            <Step n={2} text="Remplissez le formulaire : titre, description, niche, type, commission, dur&eacute;e." />
            <Step n={3} text="Ajoutez un questionnaire pour filtrer les candidats (QCM, questions ouvertes)." />
            <Step n={4} text="Publiez ! Votre offre appara&icirc;t dans la Marketplace et les candidats sont notifi&eacute;s." />
          </Section>

          <Section icon={<Search className="h-5 w-5 text-brand-green" />} title="G&eacute;rer les candidatures">
            <p>Depuis le <strong>Dashboard recrutement</strong>, vous voyez toutes les candidatures re&ccedil;ues par offre.</p>
            <Step n={1} text="Consultez le profil complet du candidat (comp&eacute;tences, exp&eacute;rience, r&eacute;putation)." />
            <Step n={2} text="Lisez ses r&eacute;ponses au questionnaire." />
            <Step n={3} text="Acceptez, refusez ou mettez en revue la candidature." />
            <Step n={4} text="Une fois accept&eacute;, le chat s'ouvre pour &eacute;changer avec le candidat." />
          </Section>

          <Section icon={<Target className="h-5 w-5 text-brand-green" />} title="Matching IA">
            <p>
              Cr&eacute;ez des <strong>fiches de poste</strong> d&eacute;taill&eacute;es et laissez l'algorithme de Matching IA trouver les candidats les plus compatibles. Disponible d&egrave;s le pack Solo.
            </p>
          </Section>

          <Section icon={<Shield className="h-5 w-5 text-brand-green" />} title="CVth&egrave;que & Validation">
            <p>
              La <strong>CVth&egrave;que</strong> vous donne acc&egrave;s aux profils publics des candidats. Vous pouvez d&eacute;bloquer leurs coordonn&eacute;es compl&egrave;tes en utilisant vos cr&eacute;dits de d&eacute;blocage (inclus dans vos packs).
            </p>
            <Tip text="La validation de profil (qui donne acc&egrave;s au t&eacute;l&eacute;phone et email du candidat) n&eacute;cessite un abonnement actif." />
          </Section>

          <Section icon={<MessageSquare className="h-5 w-5 text-brand-green" />} title="CRM &Eacute;v&eacute;nements">
            <p>
              Le <strong>CRM &Eacute;v&eacute;nements</strong> vous permet de cr&eacute;er des &eacute;v&eacute;nements (lancements, masterclasses), d'y assigner des closers, et de suivre leurs performances en temps r&eacute;el.
            </p>
          </Section>
        </>
      )}

      {/* Abonnements */}
      <Section icon={<CreditCard className="h-5 w-5 text-brand-green" />} title="Les abonnements">
        {isCandidate && (
          <div className="space-y-2">
            <p className="font-medium text-brand-dark">Candidat :</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-brand-dark">Free</p>
                <p className="text-xs">Acc&egrave;s marketplace, candidatures limit&eacute;es</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-bold text-green-700">Starter &mdash; 9&euro;/mois</p>
                <p className="text-xs">Candidatures illimit&eacute;es, suggestions IA, performances</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-bold text-amber-700">Pro &mdash; 29&euro;/mois</p>
                <p className="text-xs">Tout Starter + masterclasses, comptabilit&eacute;</p>
              </div>
            </div>
          </div>
        )}
        {isRecruiter && (
          <div className="space-y-2">
            <p className="font-medium text-brand-dark">Recruteur (packs &agrave; l&apos;unit&eacute;) :</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-bold text-brand-dark">Solo &mdash; 49&euro;</p>
                <p className="text-xs">1 annonce + 1 d&eacute;blocage profil</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="font-bold text-green-700">&Eacute;quipe &mdash; 129&euro;</p>
                <p className="text-xs">1 annonce + 5 d&eacute;blocages + matching IA</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="font-bold text-amber-700">Campagne &mdash; 249&euro;</p>
                <p className="text-xs">1 annonce + 15 d&eacute;blocages + CRM + priorit&eacute;</p>
              </div>
            </div>
          </div>
        )}
        <p>
          Rendez-vous sur la page <strong>Abonnement</strong> dans le menu pour souscrire ou g&eacute;rer votre plan.
        </p>
      </Section>

      {/* FAQ rapide */}
      <Section icon={<HelpCircle className="h-5 w-5 text-brand-green" />} title="Questions fr&eacute;quentes">
        <div className="space-y-4">
          <div>
            <p className="font-medium text-brand-dark flex items-center gap-1"><ChevronRight className="h-4 w-4" /> Comment modifier mon profil ?</p>
            <p className="ml-5">Cliquez sur &laquo; Mon profil &raquo; dans le menu lat&eacute;ral. Vous pouvez modifier toutes vos informations &agrave; tout moment.</p>
          </div>
          <div>
            <p className="font-medium text-brand-dark flex items-center gap-1"><ChevronRight className="h-4 w-4" /> Comment contacter le support ?</p>
            <p className="ml-5">Utilisez la page <strong>Contact</strong> accessible depuis le menu, ou &eacute;crivez-nous &agrave; <strong>contact@hubclosing.fr</strong>.</p>
          </div>
          <div>
            <p className="font-medium text-brand-dark flex items-center gap-1"><ChevronRight className="h-4 w-4" /> J&apos;ai une id&eacute;e d&apos;am&eacute;lioration</p>
            <p className="ml-5">Super ! Rendez-vous dans la <strong>Bo&icirc;te &agrave; id&eacute;es</strong> dans le menu pour soumettre votre suggestion. Nous lisons tout !</p>
          </div>
          <div>
            <p className="font-medium text-brand-dark flex items-center gap-1"><ChevronRight className="h-4 w-4" /> Comment changer de r&ocirc;le (candidat/recruteur) ?</p>
            <p className="ml-5">Si votre compte est en double r&ocirc;le, un bouton de switch appara&icirc;t en haut du menu lat&eacute;ral.</p>
          </div>
          <div>
            <p className="font-medium text-brand-dark flex items-center gap-1"><ChevronRight className="h-4 w-4" /> Comment supprimer mon compte ?</p>
            <p className="ml-5">Rendez-vous dans <strong>Param&egrave;tres</strong> &gt; Zone dangereuse &gt; Supprimer mon compte.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
