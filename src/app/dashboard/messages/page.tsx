'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, Avatar, EmptyState, Button } from '@/components/ui';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const MESSAGES_LIMIT = 100;
const CONVERSATIONS_LIMIT = 50;

export default function MessagesPage() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Requêtes séparées au lieu d'interpolation .or() pour éviter l'injection
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

      // Merge + sort + dedupe
      const allConvs = [...(convs1 || []), ...(convs2 || [])];
      const seen = new Set<string>();
      const unique = allConvs
        .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
        .filter((c) => { if (seen.has(c.id)) return false; seen.add(c.id); return true; })
        .slice(0, CONVERSATIONS_LIMIT);

      setConversations(unique);
      setLoading(false);
    }
    load();
  }, []);

  // Auto-scroll vers le bas quand messages changent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (convId: string) => {
    setSelectedConv(convId);
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_LIMIT);
    // Reverse pour afficher du plus ancien au plus récent
    setMessages((data || []).reverse());
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || sending) return;
    setSending(true);

    const content = newMessage.trim();
    // Validation longueur
    if (content.length > 5000) {
      setSending(false);
      return;
    }

    // Optimistic update : ajouter localement
    const tempMsg = {
      id: `temp-${Date.now()}`,
      conversation_id: selectedConv,
      sender_id: userId,
      content,
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
      // Retirer le message optimiste en cas d'erreur
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(content); // Restaurer le texte
    } else {
      // Mettre à jour last_message_at sur la conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedConv);
    }

    setSending(false);
  };

  const getOtherUser = (conv: any) => {
    return conv.participant_1 === userId ? conv.participant_2_user : conv.participant_1_user;
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Chargement...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-dark">Messages</h1>

      {conversations.length === 0 ? (
        <EmptyState icon={<MessageSquare className="h-12 w-12" />} title="Aucune conversation" description="Les conversations apparaîtront ici lorsque vous échangerez avec d'autres utilisateurs." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
          <Card className="overflow-y-auto">
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => {
                const other = getOtherUser(conv);
                return (
                  <button
                    key={conv.id}
                    onClick={() => loadMessages(conv.id)}
                    className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-brand-green/5 border-l-2 border-brand-green' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={other?.avatar_url} fallback={other?.full_name || '?'} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark truncate">{other?.full_name || 'Utilisateur'}</p>
                        {conv.last_message_at && (
                          <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: fr })}</p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card className="md:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-xl px-4 py-2 ${msg.sender_id === userId ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-900'}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender_id === userId ? 'text-white/70' : 'text-gray-500'}`}>
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-4 border-t border-gray-200">
                  <div className="flex gap-2">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
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
              <div className="flex-1 flex items-center justify-center text-gray-500 text-sm">
                Sélectionnez une conversation
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
