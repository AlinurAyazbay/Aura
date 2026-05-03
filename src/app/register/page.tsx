'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Wind, Eye, EyeOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BADGE_CONFIG } from '@/lib/badges';

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'This email is already registered. Try signing in.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/network-request-failed': 'Connection error. Please check your internet.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}

type InvestorType = 'civic' | 'institutional';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [investorType, setInvestorType] = useState<InvestorType>('civic');
  const [company, setCompany] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate(): string | null {
    if (!firstName.trim()) return t('errors.required');
    if (!lastName.trim()) return t('errors.required');
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) return t('errors.invalidEmail');
    if (!password || password.length < 6) return t('errors.weakPassword');
    if (investorType === 'institutional' && !company.trim()) return 'Company name is required for institutional investors.';
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Please set up .env.local first.');
      return;
    }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: `${firstName} ${lastName}` });

      await setDoc(doc(db, 'users', cred.user.uid), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim() || null,
        type: investorType,
        company: investorType === 'institutional' ? company.trim() : null,
        totalInvested: 0,
        badge: 'civic',
        joinedAt: serverTimestamp(),
        votedDistrict: null,
      });

      const idToken = await cred.user.getIdToken();
      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      router.push('/');
      router.refresh();
    } catch (err) {
      const code = (err as { code?: string }).code ?? '';
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 py-16">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00d4aa]/[0.04] blur-[100px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
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
          <h1 className="text-2xl font-black text-[#f0f4ff] mb-2">Create your account</h1>
          <p className="text-[#8892a4] text-sm mb-8">Join thousands funding clean air for Almaty</p>

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
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#8892a4] mb-2">{t('firstName')}</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Alinur"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#8892a4] mb-2">{t('lastName')}</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ayazbay"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-[#8892a4] mb-2">{t('password')}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 pr-12 text-sm"
                  autoComplete="new-password"
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

            <div>
              <label className="block text-sm font-medium text-[#8892a4] mb-2">{t('phone')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (700) 000-0000"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm"
              />
            </div>

            {/* Investor Type */}
            <div>
              <label className="block text-sm font-medium text-[#8892a4] mb-3">{t('investorType')}</label>
              <div className="grid grid-cols-2 gap-3">
                {(['civic', 'institutional'] as InvestorType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInvestorType(type)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      investorType === type
                        ? 'border-[#00d4aa]/50 bg-[#00d4aa]/10 text-[#f0f4ff]'
                        : 'border-white/[0.1] bg-white/[0.02] text-[#8892a4] hover:border-white/[0.2]'
                    }`}
                  >
                    <div className="text-xl mb-1">
                      {type === 'civic' ? BADGE_CONFIG.civic.emoji : BADGE_CONFIG.founder.emoji}
                    </div>
                    <div className="text-sm font-bold">
                      {type === 'civic' ? t('civic') : t('institutional')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Company field */}
            <AnimatedField show={investorType === 'institutional'}>
              <div>
                <label className="block text-sm font-medium text-[#8892a4] mb-2">{t('company')}</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your company name"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm"
                />
              </div>
            </AnimatedField>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] hover:scale-[1.01] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 text-sm"
            >
              {loading ? 'Creating account...' : t('register')}
            </button>
          </form>

          <p className="text-center text-sm text-[#8892a4] mt-6">
            {t('hasAccount')}{' '}
            <Link href="/login" className="text-[#00d4aa] font-medium hover:underline">
              {t('signIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function AnimatedField({ show, children }: { show: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ height: show ? 'auto' : 0, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
