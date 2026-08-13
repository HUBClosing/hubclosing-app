'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Loader2, MessageSquare } from 'lucide-react';

interface ContactButtonProps {
  candidateId: string;
  canContact: boolean;
  hasExistingConversation: boolean;
  remainingContacts: number;
}

export function ContactButton({ candidateId, canContact: _canContact, hasExistingConversation, remainingContacts: _remainingContacts }: ContactButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContact = async () => {
    if (loading) return;
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
    </div>
  );
}
