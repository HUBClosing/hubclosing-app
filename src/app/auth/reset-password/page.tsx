'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      // Cas 1 : code dans l'URL (PKCE flow) — échanger contre une session
      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError('Le lien a expiré ou est invalide. Demandez un nouveau lien.');
          setChecking(false);
          return;
        }
        setSessionReady(true);
        setChecking(false);
        return;
      }

      // Cas 2 : écouter l'événement PASSWORD_RECOVERY (hash fragment legacy)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
          setSessionReady(true);
          setChecking(false);
        }
      });

      // Cas 3 : session déjà active (redirigé depuis /auth/callback)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
        setChecking(false);
      } else {
        // Timeout : si rien après 5s, afficher le message d'erreur
        setTimeout(() => {
          setChecking((prev) => {
            if (prev) {
              setError('Le lien a expiré ou est invalide.');
              return false;
            }
            return prev;
          });
        }, 5000);
      }

      return () => subscription.unsubscribe();
    };

    initSession();
  }, [supabase, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-white to-brand-cream/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl bg-brand-amber flex items-center justify-center font-bold text-white text-lg">
              H
            </div>
            <span className="font-bold text-xl text-brand-dark">HUBClosing</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-7 w-7 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-brand-dark mb-2">
                Mot de passe modifié !
              </h2>
              <p className="text-sm text-gray-600 mb-2">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <p className="text-sm text-gray-400">
                Redirection vers la connexion...
              </p>
            </div>
          ) : checking && !error ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-brand-amber border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-gray-500">
                Vérification du lien de réinitialisation...
              </p>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-8">
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                <p className="text-sm text-red-600">{error || 'Le lien est invalide ou a expiré.'}</p>
              </div>
              <a
                href="/auth/forgot-password"
                className="inline-block px-4 py-2 bg-brand-amber text-white rounded-xl text-sm font-medium hover:bg-brand-amber/90 transition-colors"
              >
                Demander un nouveau lien
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-brand-dark mb-2">
                Nouveau mot de passe
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Choisissez un nouveau mot de passe pour votre compte.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  isLoading={loading}
                  disabled={!password.trim() || !confirmPassword.trim()}
                  className="w-full"
                >
                  Réinitialiser mon mot de passe
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
