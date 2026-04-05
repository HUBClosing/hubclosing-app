'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Check, X, MessageSquare, Loader2 } from 'lucide-react';

interface CandidateActionsProps {
  applicationId: string;
  currentStatus: string;
  closerId: string;
  managerId: string;
  offerTitle: string;
}

export default function CandidateActions({ applicationId, currentStatus, closerId, managerId, offerTitle }: CandidateActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const updateStatus = async (newStatus: 'accepted' | 'rejected') => {
    setLoading(newStatus);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (error) throw error;

      // Si accepté, créer une conversation automatiquement
      if (newStatus === 'accepted') {
        // Vérifier si une conversation existe déjà
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .or(`and(participant_1.eq.${managerId},participant_2.eq.${closerId}),and(participant_1.eq.${closerId},participant_2.eq.${managerId})`)
          .maybeSingle();

        if (!existing) {
          const { data: conv } = await supabase
            .from('conversations')
            .insert({ participant_1: managerId, participant_2: closerId })
            .select('id')
            .single();

          if (conv) {
            await supabase.from('messages').insert({
              conversation_id: conv.id,
              sender_id: managerId,
              content: `Votre candidature pour "${offerTitle}" a été acceptée ! Discutons des prochaines étapes.`,
            });
          }
        }
      }

      router.refresh();
    } catch (err) {
      console.error('Erreur:', err);
      alert('Une erreur est survenue');
    } finally {
      setLoading(null);
    }
  };

  const startConversation = async () => {
    setLoading('message');
    try {
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_1.eq.${managerId},participant_2.eq.${closerId}),and(participant_1.eq.${closerId},participant_2.eq.${managerId})`)
        .maybeSingle();

      if (existing) {
        router.push('/dashboard/messages');
      } else {
        await supabase.from('conversations').insert({ participant_1: managerId, participant_2: closerId });
        router.push('/dashboard/messages');
      }
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(null);
    }
  };

  if (currentStatus === 'accepted') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-green-600 font-medium">Accepté</span>
        <button
          onClick={startConversation}
          disabled={loading === 'message'}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
        >
          {loading === 'message' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
          Contacter
        </button>
      </div>
    );
  }

  if (currentStatus === 'rejected') {
    return <span className="text-sm text-red-500 font-medium">Refusé</span>;
  }

  if (currentStatus === 'withdrawn') {
    return <span className="text-sm text-gray-400 font-medium">Retiré</span>;
  }

  // Status: pending
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => updateStatus('accepted')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
      >
        {loading === 'accepted' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Accepter
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
      >
        {loading === 'rejected' ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
        Refuser
      </button>
      <button
        onClick={startConversation}
        disabled={loading !== null}
        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
      >
        {loading === 'message' ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
      </button>
    </div>
  );
}
