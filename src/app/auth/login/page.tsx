import { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center p-4">
      <Suspense fallback={<div className="w-full max-w-md h-96 animate-pulse bg-white rounded-xl" />}>
        <AuthForm mode="login" />
      </Suspense>
    </div>
  );
}
