'use client';

import { useState } from 'react';
import type { User } from '@/types/database';
import { Card, CardContent, CardHeader } from '@/components/ui';
import {
  Mail, Phone, MapPin, Globe, Send, Loader2, CheckCircle2,
  MessageSquare, Clock, Instagram,
} from 'lucide-react';

export function ContactContent({ user }: { user: User }) {
  const [name, setName] = useState(user.full_name || '');
  const [email, setEmail] = useState(user.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur');
      } else {
        setSent(true);
      }
    } catch {
      setError('Erreur réseau');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <MessageSquare className="h-7 w-7 text-brand-green" />
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Contactez-nous</h1>
          <p className="text-sm text-gray-500">Une question, un probl&egrave;me ? Nous sommes l&agrave; pour vous aider.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Coordonnées */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-brand-dark">Nos coordonn&eacute;es</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-green/10 rounded-lg">
                  <Mail className="h-5 w-5 text-brand-green" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a href="mailto:contact@hubclosing.fr" className="text-sm font-medium text-brand-dark hover:text-brand-green transition-colors">
                    contact@hubclosing.fr
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-green/10 rounded-lg">
                  <Phone className="h-5 w-5 text-brand-green" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">T&eacute;l&eacute;phone</p>
                  <a href="tel:+33667549460" className="text-sm font-medium text-brand-dark hover:text-brand-green transition-colors">
                    06 67 54 94 60
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-green/10 rounded-lg">
                  <Globe className="h-5 w-5 text-brand-green" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Site web</p>
                  <a href="https://hubclosing.fr" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-dark hover:text-brand-green transition-colors">
                    hubclosing.fr
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-green/10 rounded-lg">
                  <Instagram className="h-5 w-5 text-brand-green" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Instagram</p>
                  <a href="https://instagram.com/hubclosing" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-dark hover:text-brand-green transition-colors">
                    @hubclosing
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-brand-amber mt-0.5" />
                <div>
                  <p className="font-medium text-brand-dark text-sm">Temps de r&eacute;ponse</p>
                  <p className="text-sm text-gray-500">Nous r&eacute;pondons g&eacute;n&eacute;ralement sous 24 &agrave; 48h ouvr&eacute;es.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-green mt-0.5" />
                <div>
                  <p className="font-medium text-brand-dark text-sm">Ecom France</p>
                  <p className="text-sm text-gray-500">Entrepreneur individuel</p>
                  <p className="text-xs text-gray-400 mt-1">SIRET : 885 334 334 00020</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-brand-dark">Envoyer un message</h2>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-brand-dark">Message envoy&eacute; !</p>
                <p className="text-sm text-gray-500 mt-1">Nous reviendrons vers vous rapidement.</p>
                <button
                  onClick={() => { setSent(false); setSubject(''); setMessage(''); }}
                  className="mt-4 text-sm text-brand-green hover:underline"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green"
                    required
                  >
                    <option value="">S&eacute;lectionnez un sujet</option>
                    <option value="Question générale">Question g&eacute;n&eacute;rale</option>
                    <option value="Problème technique">Probl&egrave;me technique</option>
                    <option value="Abonnement / Paiement">Abonnement / Paiement</option>
                    <option value="Signaler un utilisateur">Signaler un utilisateur</option>
                    <option value="Partenariat">Partenariat</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="D&eacute;crivez votre demande..."
                    rows={5}
                    maxLength={5000}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green resize-none"
                    required
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !subject || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-green text-white rounded-lg text-sm font-medium hover:bg-brand-green/90 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Envoyer
                </button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
