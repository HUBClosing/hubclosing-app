'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, Avatar, EmptyState, Button } from '@/components/ui';
import { MessageSquare, Send, Loader2, Check, CheckCheck, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { RealtimeChannel } from '@supabase/supabase-js';

const MESSAGES_LIMIT = 100;
const CONVERSATIONS_LIMIT = 50;

interface ConvUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface ConversationRow {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string | null;
  created_at: string;
  participant_1_user: ConvUser | null;
  participant_2_user: ConvUser | null;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // ── Chargement initial ──
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: convs1 }, { data: convs2 }] = await Promise.all([
        supabase
          .from('conversations')
          .select('*, participant_1_user:users!participant_1(id, full_name, avatar_url), participant_2_user:users!participant_2(id, full_name, avatar_url)')
          .eq('participant_1', user.id)
          .order('last_message_at', { ascending: false })
          .limit(CONVERSATIONS_LIMIT),
        supabase
          .from('conversations')
          .select('*, participant_1_user:users!participant_1(id, full_name, avatar_url), participant_2_user:users!participant_2(id, full_name, avatar_url)')
          .eq('participant_2', user.id)
          .order('last_message_at', { ascending: false })
          .limit(CONVERSATIONS_LIMIT),
      ]);

      const allConvs = [...(convs1 || []), ...(convs2 || [])];
      const seen = new Set<string>();
      const unique = allConvs
        .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
        .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
        .slice(0, CONVERSATIONS_LIMIT) as ConversationRow[];

      setConversations(unique);

      // Compter les non-lus par conversation
      const counts: Record<string, number> = {};
      for (const conv of unique) {
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .neq('sender_id', user.id)
          .is('read_at', null);
        counts[conv.id] = count || 0;
      }
      setUnreadCounts(counts);

      setLoading(false);

      // ── Realtime : écouter les nouveaux messages ──
      const channel = supabase
        .channel('messages-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            const newMsg = payload.new as MessageRow;
            // Vérifier que ce message appartient à une de nos conversations
            const isOurConv = unique.some((c) => c.id === newMsg.conversation_id);
            if (!isOurConv) return;

            // Si c'est la conversation active, ajouter le message
            setSelectedConv((current) => {
              if (current === newMsg.conversation_id) {
                setMessages((prev) => {
                  // Éviter les doublons (message optimiste déjà ajouté)
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  // Remplacer le message temp par le vrai si c'est le nôtre
                  if (newMsg.sender_id === user.id) {
                    return prev.map((m) => m.id.startsWith('temp-') ? newMsg : m);
                  }
                  return [...prev, newMsg];
                });

                // Marquer comme lu si c'est un message reçu
                if (newMsg.sender_id !== user.id) {
                  supabase
                    .from('messages')
                    .update({ read_at: new Date().toISOString() })
                    .eq('id', newMsg.id)
                    .then(() => {});
                }
              } else {
                // Incrémenter le compteur non-lu si c'est un message reçu
                if (newMsg.sender_id !== user.id) {
                  setUnreadCounts((prev) => ({
                    ...prev,
                    [newMsg.conversation_id]: (prev[newMsg.conversation_id] || 0) + 1,
                  }));
                }
              }
              return current;
            });

            // Remonter la conversation en haut de la liste
            setConversations((prev) => {
              const updated = prev.map((c) =>
                c.id === newMsg.conversation_id
                  ? { ...c, last_message_at: newMsg.created_at }
                  : c
              );
              return updated.sort((a, b) =>
                new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
              );
            });
          }
        )
        .subscribe();

      channelRef.current = channel;
    }

    load();

    return () => {
      channelRef.current?.unsubscribe();
      typingChannelRef.current?.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Charger les messages d'une conversation ──
  const loadMessages = useCallback(async (convId: string) => {
    setSelectedConv(convId);
    setTypingUser(null);

    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);

    const msgs = (data || []).reverse() as MessageRow[];
    setMessages(msgs);

    // Marquer tous les messages non lus comme lus
    const unreadIds = msgs
      .filter((m) => m.sender_id !== userId && !m.read_at)
      .map((m) => m.id);

    if (unreadIds.length > 0) {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .in('id', unreadIds);

      setUnreadCounts((prev) => ({ ...prev, [convId]: 0 }));
    }

    // ── Presence : typing indicator ──
    typingChannelRef.current?.unsubscribe();
    const typingChannel = supabase
      .channel(`typing-${convId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.user_id !== userId) {
          setTypingUser(payload.payload?.user_name || 'Quelqu\'un');
          // Reset après 3 secondes
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      })
      .subscribe();

    typingChannelRef.current = typingChannel;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ── Envoyer un message ──
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);

    const content = newMessage.trim();
    if (content.length > 5000) { setSending(false); return; }

    const tempMsg: MessageRow = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConv,
      sender_id: userId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConv,
      sender_id: userId,
      content,
    });

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(content);
    } else {
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConv);
    }
    setSending(false);
  };

  // ── Broadcast typing ──
  const handleTyping = () => {
    if (!selectedConv || !typingChannelRef.current) return;
    const conv = conversations.find((c) => c.id === selectedConv);
    const myName = conv?.participant_1 === userId
      ? conv?.participant_1_user?.full_name
      : conv?.participant_2_user?.full_name;

    typingChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: userId, user_name: myName || 'Utilisateur' },
    });
  };

  const getOtherUser = (conv: ConversationRow): ConvUser | null => {
    return conv.participant_1 === userId ? conv.participant_2_user : conv.participant_1_user;
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-brand-dark">Messages</h1>
        {totalUnread > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-12 w-12" />}
          title="Aucune conversation"
          description="Les conversations apparaîtront ici lorsque vous échangerez avec d'autres utilisateurs via la CVthèque ou les candidatures."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          {/* Sidebar conversations */}
          <Card className="overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => {
                const other = getOtherUser(conv);
                const unread = unreadCounts[conv.id] || 0;
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-brand-green/5 border-l-2 border-brand-green' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar src={other?.avatar_url} fallback={other?.full_name || '?'} size="sm" />
                        {unread > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium text-brand-dark truncate ${unread > 0 ? 'font-bold' : ''}`}>
                            {other?.full_name || 'Utilisateur'}
                          </p>
                        </div>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: fr })}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Zone de chat */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                {/* Header conversation */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const conv = conversations.find((c) => c.id === selectedConv);
                      const other = conv ? getOtherUser(conv) : null;
                      return (
                        <>
                          <Avatar src={other?.avatar_url} fallback={other?.full_name || '?'} size="sm" />
                          <div>
                            <p className="font-semibold text-brand-dark">{other?.full_name || 'Utilisateur'}</p>
                            {typingUser && (
                              <p className="text-xs text-brand-green animate-pulse">
                                {typingUser} est en train d&apos;&eacute;crire...
                              </p>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      const roomId = `hubclosing-${selectedConv?.slice(0, 12)}`;
                      window.open(`https://meet.jit.si/${roomId}`, '_blank');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-brand-green bg-brand-green/10 rounded-lg hover:bg-brand-green/20 transition-colors"
                    title="Démarrer un appel vidéo"
                  >
                    <Video className="h-4 w-4" /> Visio
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-8">
                      Envoyez le premier message !
                    </p>
                  )}
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-2 ${msg.sender_id === userId ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.sender_id === userId ? 'justify-end' : ''}`}>
                          <p className={`text-xs ${msg.sender_id === userId ? 'text-white/70' : 'text-gray-500'}`}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                          </p>
                          {msg.sender_id === userId && (
                            msg.read_at
                              ? <CheckCheck className="h-3.5 w-3.5 text-white/70" />
                              : <Check className="h-3.5 w-3.5 text-white/50" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder="Votre message..."
                      maxLength={5000}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    />
                    <Button onClick={sendMessage} size="sm" disabled={sending || !newMessage.trim()}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm gap-2 px-8 text-center">
                <MessageSquare className="h-10 w-10 text-gray-300 mb-2" />
                <p className="font-medium">S&eacute;lectionnez une conversation</p>
                <p className="text-gray-400 text-xs">
                  Vos conversations avec les recruteurs et candidats apparaissent ici.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
