'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, Lock, MessageSquare } from 'lucide-react';

interface ContactButtonProps {
  candidateId: string;
  canContact: boolean;
  hasExistingConversation: boolean;
  remainingContacts: number;
}

export function ContactButton({ candidateId, canContact, hasExistingConversation, remainingContacts }: ContactButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContact = async () => {
    if (loading) return; // Anti double-click
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors du contact');
        return;
      }

      // Rediriger vers messages
      router.push('/dashboard/messages');
    } catch {
      setError('Erreur réseau, réessayez');
    } finally {
      setLoading(false);
    }
  };

  if (hasExistingConversation) {
    return (
      <a
        href="/dashboard/messages"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white rounded-lg font-medium text-sm hover:bg-brand-dark transition-colors"
      >
        <MessageSquare className="h-4 w-4" /> Voir la conversation
      </a>
    );
  }

  if (!canContact) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium text-sm cursor-not-allowed">
          <Lock className="h-4 w-4" /> Quota contacts atteint
        </div>
        <a href="/dashboard/subscription" className="block text-xs text-brand-amber hover:underline mt-2 font-medium">
          Augmenter mon quota →
        </a>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleContact}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-green text-white rounded-lg font-medium text-sm hover:bg-brand-dark transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {loading ? 'Contact en cours...' : 'Contacter ce candidat'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {remainingContacts !== Infinity && remainingContacts > 0 && (
        <p className="text-xs text-gray-400 mt-2">{remainingContacts} contact{remainingContacts > 1 ? 's' : ''} restant{remainingContacts > 1 ? 's' : ''}</p>
      )}
    </div>
  );
}
