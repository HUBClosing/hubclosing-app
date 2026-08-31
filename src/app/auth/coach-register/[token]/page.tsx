'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function CoachRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const supabase = createClient();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    password_confirm: '',
  });

  useEffect(() => {
    checkInvitation();
  }, [token]);

  async function checkInvitation() {
    try {
      const { data, error: fetchError } = await supabase
        .from('coach_invitations')
        .select('*')
        .eq('token', token)
        .maybeSingle();

      if (fetchError || !data) {
        setError('Lien d\'invitation invalide ou expiré.');
        setLoading(false);
        return;
      }

      if (data.used_at) {
        setError('Cette invitation a déjà été utilisée.');
        setLoading(false);
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setError('Cette invitation a expiré. Contactez l\'administrateur.');
        setLoading(false);
        return;
      }

      setInvitation(data);
      setFormData(prev => ({ ...prev, email: data.email }));
      setLoading(false);
    } catch {
      setError('Erreur lors de la vérification de l\'invitation.');
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!formData.full_name.trim()) {
      setError('Veuillez entrer votre nom complet.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (formData.password !== formData.password_confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Créer le compte Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role_type: 'coach',
          },
        },
      });

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Un compte existe déjà avec cet email.'
          : authError.message);
        setSubmitting(false);
        return;
      }

      if (!authData.user) {
        setError('Erreur lors de la création du compte.');
        setSubmitting(false);
        return;
      }

      // 2. Créer le profil utilisateur avec role_type = 'coach'
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: formData.email,
          full_name: formData.full_name,
          role: 'admin', // Legacy — sera traité par role_type
          role_type: 'coach',
          is_onboarded: true,
          tier: 'free',
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Erreur création profil coach:', profileError);
      }

      // 3. Marquer l'invitation comme utilisée
      await supabase
        .from('coach_invitations')
        .update({
          used_by: authData.user.id,
          used_at: new Date().toISOString(),
        })
        .eq('token', token);

      // 4. Rediriger vers le dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Erreur inscription coach:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-amber border-t-transparent"></div>
      </div>
    );
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invitation invalide</h1>
          <p className="text-gray-500">{error}</p>
          <a href="/auth/login" className="mt-6 inline-block text-brand-green hover:underline">
            Retour à la connexion
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-brand-amber flex items-center justify-center font-bold text-brand-dark text-xl mx-auto mb-4">
            H
          </div>
          <h1 className="text-2xl font-bold text-brand-dark">Créer votre compte Coach</h1>
          <p className="text-gray-500 mt-2">
            Vous avez été invité(e) à rejoindre HUBClosing en tant que Coach
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">L&apos;email est fixé par l&apos;invitation</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              placeholder="Minimum 6 caractères"
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={formData.password_confirm}
              onChange={(e) => setFormData(prev => ({ ...prev, password_confirm: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-amber/50 focus:border-brand-amber outline-none"
              placeholder="Retapez le mot de passe"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-brand-amber text-brand-dark font-bold rounded-lg hover:bg-brand-amber/90 transition-colors disabled:opacity-50"
          >
            {submitting ? 'Création en cours...' : 'Créer mon compte Coach'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Déjà un compte ?{' '}
            <a href="/auth/login" className="text-brand-green hover:underline">Se connecter</a>
          </p>
        </form>
      </div>
    </div>
  );
}
