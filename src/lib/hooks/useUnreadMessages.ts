'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Hook global pour le compteur de messages non lus.
 * S'abonne en Realtime aux nouveaux messages et met à jour le compteur.
 */
export function useUnreadMessages(userId: string | undefined) {
  const [count, setCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    // Fetch initial count
    async function fetchUnread() {
      // On récupère d'abord les conversations de l'utilisateur
      const [{ data: c1 }, { data: c2 }] = await Promise.all([
        supabase
          .from('conversations')
          .select('id')
          .eq('participant_1', userId),
        supabase
          .from('conversations')
          .select('id')
          .eq('participant_2', userId),
      ]);

      const convIds = [...(c1 || []), ...(c2 || [])].map((c) => c.id);
      if (convIds.length === 0) { setCount(0); return; }

      const { count: total } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .is('read_at', null);

      setCount(total || 0);
    }

    fetchUnread();

    // Realtime : écouter les nouveaux messages entrants
    const channel = supabase
      .channel('sidebar-unread')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const msg = payload.new as { sender_id: string };
          // Seuls les messages reçus comptent
          if (msg.sender_id !== userId) {
            setCount((prev) => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const oldMsg = payload.old as { read_at: string | null };
          const newMsg = payload.new as { read_at: string | null; sender_id: string };
          // Si un message vient d'être lu (read_at passe de null à une valeur)
          if (!oldMsg.read_at && newMsg.read_at && newMsg.sender_id !== userId) {
            setCount((prev) => Math.max(0, prev - 1));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return count;
}
