'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wind, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import type { Metadata } from 'next';

function mapFirebaseError(code: string, t: ReturnType<typeof useTranslations<'auth'>>): string {
  const map: Record<string, string> = {
    'auth/invalid-email': t('errors.invalidEmail'),
    'auth/user-not-found': t('errors.userNotFound'),
    'auth/wrong-password': t('errors.wrongPassword'),
    'auth/invalid-credential': t('errors.wrongPassword'),
    'auth/too-many-requests': t('errors.tooManyRequests'),
    'auth/network-request-failed': t('errors.networkError'),
  };
  return map[code] ?? t('errors.generic');
}

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    if (!email.trim()) { setError(t('errors.required')); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError(t('errors.invalidEmail')); return false; }
    if (!password) { setError(t('errors.required')); return false; }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please set up .env.local first.');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      router.push(from);
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(mapFirebaseError(code, t));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-16">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#00d4aa]/[0.04] blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <div className="w-10 h-10 rounded-xl bg-[#00d4aa]/20 border border-[#00d4aa]/30 flex items-center justify-center">
            <Wind size={20} className="text-[#00d4aa]" />
          </div>
          <span className="font-black text-[#f0f4ff] text-xl">
            Aura <span className="text-[#00d4aa]">Optima</span>
          </span>
        </Link>

        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 backdrop-blur-sm">
          <h1 className="text-2xl font-black text-[#f0f4ff] mb-2">Welcome back</h1>
          <p className="text-[#8892a4] text-sm mb-8">Sign in to your account</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#8892a4] mb-2">{t('email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm"
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-[#8892a4]">{t('password')}</label>
                <span className="text-xs text-[#4a5568] cursor-pointer hover:text-[#8892a4]">
                  {t('forgotPassword')}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 pr-12 text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4a5568] hover:text-[#8892a4]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 text-sm"
            >
              {loading ? 'Signing in...' : t('signIn')}
            </button>
          </form>

          <p className="text-center text-sm text-[#8892a4] mt-6">
            {t('noAccount')}{' '}
            <Link href="/register" className="text-[#00d4aa] font-medium hover:underline">
              {t('register')} →
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
