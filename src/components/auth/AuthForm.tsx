'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';
import { Mail, Lock, User, Eye, EyeOff, Camera } from 'lucide-react';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode: initialMode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  // Vérifier côté client si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.replace('/dashboard');
      }
    };
    checkSession();
  }, [supabase, router]);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError('');
    setMessage('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image (JPG, PNG, etc.)');
      return;
    }

    // Vérifier la taille (max 2 Mo)
    if (file.size > 2 * 1024 * 1024) {
      setError('L\'image ne doit pas dépasser 2 Mo');
      return;
    }

    setAvatarFile(file);
    setError('');

    // Créer un preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, avatarFile, { upsert: true });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'register') {
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });
        if (error) throw error;

        // Si la confirmation email est désactivée, l'utilisateur est auto-connecté
        if (signUpData.session) {
          if (signUpData.user) {
            // Upload avatar si fourni
            let avatarUrl: string | null = null;
            if (avatarFile) {
              avatarUrl = await uploadAvatar(signUpData.user.id);
            }

            await supabase.from('users').upsert({
              id: signUpData.user.id,
              email: signUpData.user.email || '',
              role: 'pending',
              full_name: fullName || '',
              ...(avatarUrl && { avatar_url: avatarUrl }),
            }, { onConflict: 'id' });
          }
          router.push('/onboarding');
          router.refresh();
          return;
        }

        // Email confirmation activée — upload avatar après vérification
        // On stocke le fichier dans localStorage pour le récupérer après callback
        if (avatarFile && signUpData.user) {
          // Upload quand même — le user existe déjà côté Supabase Auth
          const avatarUrl = await uploadAvatar(signUpData.user.id);
          if (avatarUrl) {
            await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', signUpData.user.id);
          }
        }

        // Rediriger vers la page de vérification email
        router.push('/auth/verify-email?email=' + encodeURIComponent(email));
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const redirectParam = searchParams.get('redirect') || '/dashboard';
        const safeRedirect =
          redirectParam.startsWith('/') &&
          !redirectParam.startsWith('//') &&
          !redirectParam.startsWith('/\\') &&
          !redirectParam.includes(':')
            ? redirectParam
            : '/dashboard';
        router.push(safeRedirect);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion Google');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-brand-amber flex items-center justify-center font-bold text-white text-lg">
            H
          </div>
          <span className="font-bold text-xl text-brand-dark">HUBClosing</span>
        </div>
        <p className="text-gray-500 text-sm">
          La marketplace des closers & managers
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Onglets Connexion / Inscription */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
              mode === 'login'
                ? 'text-brand-amber'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Connexion
            {mode === 'login' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-amber" />
            )}
          </button>
          <button
            onClick={() => switchMode('register')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
              mode === 'register'
                ? 'text-brand-amber'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Inscription
            {mode === 'register' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-amber" />
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {mode === 'login' ? 'Se connecter avec Google' : "S'inscrire avec Google"}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-400 uppercase tracking-wider">ou par email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                {/* Photo de profil — optionnel */}
                <div className="flex flex-col items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group"
                  >
                    {avatarPreview ? (
                      <div className="relative">
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="h-20 w-20 rounded-full object-cover border-2 border-brand-amber"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-brand-amber hover:bg-brand-amber/5 transition-colors">
                        <Camera className="h-5 w-5 text-gray-400" />
                        <span className="text-[10px] text-gray-400">Photo</span>
                      </div>
                    )}
                  </button>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">
                      Photo de profil <span className="text-gray-300">(optionnel)</span>
                    </p>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="text-xs text-red-400 hover:text-red-500 mt-0.5"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Votre nom"
                      required
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-amber/20 focus:border-brand-amber"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
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
              {mode === 'register' && (
                <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
              )}
              {mode === 'login' && (
                <div className="text-right mt-1">
                  <a href="/auth/forgot-password" className="text-xs text-brand-amber hover:underline">
                    Mot de passe oublié ?
                  </a>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {message && (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}

            <Button type="submit" isLoading={loading} className="w-full">
              {mode === 'login' ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-5">
            {mode === 'login'
              ? 'Pas encore de compte ? Cliquez sur l\'onglet Inscription ci-dessus.'
              : 'Déjà un compte ? Cliquez sur l\'onglet Connexion ci-dessus.'}
          </p>
        </div>
      </div>
    </div>
  );
}
