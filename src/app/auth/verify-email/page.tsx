'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email && !email) {
        setEmail(user.email);
      }
      if (user?.email_confirmed_at) {
        router.replace('/dashboard');
      }
    };
    checkUser();
  }, [supabase, router, email]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setLoading(true);
    setError('');
    setSent(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });
      if (error) throw error;
      setSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="h-10 w-10 rounded-xl bg-brand-amber flex items-center justify-center font-bold text-white text-lg">
            H
          </div>
          <span className="font-bold text-xl text-brand-dark">HUBClosing</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-amber/10 flex items-center justify-center mx-auto mb-5">
          <Mail className="h-8 w-8 text-brand-amber" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">
          {`V\u00e9rifiez votre email`}
        </h1>

        <p className="text-sm text-gray-500 mb-6">
          {`Un email de confirmation a \u00e9t\u00e9 envoy\u00e9 \u00e0 `}
          {email ? (
            <span className="font-semibold text-gray-700">{email}</span>
          ) : (
            'votre adresse email'
          )}
          {'. Cliquez sur le lien pour activer votre compte.'}
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-amber-700">
            {`Pensez \u00e0 v\u00e9rifier vos `}<strong>spams</strong>{` si vous ne trouvez pas l'email.`}
          </p>
        </div>

        {sent && (
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 mb-4">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-green-600">{`Email renvoy\u00e9 !`}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={handleResend}
          disabled={loading || countdown > 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-amber text-white rounded-xl font-semibold text-sm hover:bg-brand-amber/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {countdown > 0
            ? `Renvoyer dans ${countdown}s`
            : 'Renvoyer l\'email de v\u00e9rification'}
        </button>

        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 mt-5 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {`Retour \u00e0 la connexion`}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse bg-white rounded-xl" />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
