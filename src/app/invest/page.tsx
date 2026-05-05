'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc, addDoc, collection, updateDoc, increment,
  serverTimestamp, writeBatch, getDoc,
} from 'firebase/firestore';
import { calculateImpact, formatCurrency, formatNumber, TOWER_GOAL } from '@/lib/impact';
import { calculateBadge, BADGE_CONFIG } from '@/lib/badges';
import type { UserProfile } from '@/types';

const PRESET_AMOUNTS = [10, 50, 100, 500, 1000];

export default function InvestPage() {
  const t = useTranslations('invest');
  const [amount, setAmount] = useState(50);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [currentTotal, setCurrentTotal] = useState(0);
  const [towerRaised, setTowerRaised] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUid(u.uid);
        setUserEmail(u.email ?? '');
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) setCurrentTotal((snap.data() as UserProfile).totalInvested);
        const statsSnap = await getDoc(doc(db, 'globalStats', 'investmentData'));
        if (statsSnap.exists()) setTowerRaised(statsSnap.data().totalRaised ?? 0);
      }
    });
    return () => unsub();
  }, []);

  const effectiveAmount = isCustom ? (parseFloat(customAmount) || 0) : amount;
  const impact = calculateImpact(effectiveAmount);
  const newTotal = currentTotal + effectiveAmount;
  const newBadge = calculateBadge(newTotal);
  const badgeCfg = BADGE_CONFIG[newBadge];
  const towerProgress = Math.min(((towerRaised + effectiveAmount) / TOWER_GOAL) * 100, 100);

  async function handleConfirm() {
    if (!uid || effectiveAmount < 1) return;
    setLoading(true);
    setError('');

    try {
      const batch = writeBatch(db);

      // Add investment document
      const invRef = doc(collection(db, 'investments'));
      batch.set(invRef, {
        uid,
        email: userEmail,
        amount: effectiveAmount,
        createdAt: serverTimestamp(),
      });

      // setDoc+merge so it works even if the document doesn't exist yet
      batch.set(
        doc(db, 'globalStats', 'investmentData'),
        { totalRaised: increment(effectiveAmount), backerCount: increment(1) },
        { merge: true }
      );

      batch.set(
        doc(db, 'users', uid),
        { totalInvested: increment(effectiveAmount), badge: newBadge },
        { merge: true }
      );

      await batch.commit();

      // Fire confetti
      import('canvas-confetti').then((mod) => {
        mod.default({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00d4aa', '#0ea5e9', '#f0f4ff'],
        });
      });

      setStep('success');
    } catch {
      setError('Investment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-[#00d4aa]/20 border-2 border-[#00d4aa] flex items-center justify-center mx-auto mb-8"
          >
            <Check size={36} className="text-[#00d4aa]" />
          </motion.div>
          <h1 className="text-4xl font-black text-[#f0f4ff] mb-4">{t('success')}</h1>
          <p className="text-xl text-[#00d4aa] font-bold mb-2">
            {formatCurrency(effectiveAmount)} invested
          </p>
          <p className="text-[#8892a4] mb-8">
            {t('successMsg', { m3: formatNumber(impact.m3PerDay) })}
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
              <div className="text-2xl font-black text-[#00d4aa]">{formatNumber(impact.m3PerDay)}</div>
              <div className="text-xs text-[#8892a4] mt-1">m³ air/day</div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
              <div className="text-2xl font-black text-[#00d4aa]">{impact.treesEquivalent}</div>
              <div className="text-xs text-[#8892a4] mt-1">tree equivalents</div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/profile"
              className="flex-1 py-3 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-colors text-center"
            >
              {t('viewProfile')}
            </Link>
            <button
              onClick={() => { setStep('select'); setCustomAmount(''); setIsCustom(false); }}
              className="flex-1 py-3 bg-white/[0.05] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.08] transition-colors"
            >
              {t('investMore')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-[#f0f4ff] mb-2">{t('title')}</h1>
          <p className="text-[#8892a4] mb-12">{t('subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Amount Selection / Confirm */}
          <div>
            <AnimatePresence mode="wait">
              {step === 'select' ? (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8"
                >
                  <h2 className="text-xl font-bold text-[#f0f4ff] mb-6">{t('amount')}</h2>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {PRESET_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => { setAmount(a); setIsCustom(false); }}
                        className={`py-3 rounded-xl font-bold text-sm transition-all ${
                          !isCustom && amount === a
                            ? 'bg-[#00d4aa] text-[#0a0f1e] shadow-[0_0_20px_rgba(0,212,170,0.3)]'
                            : 'bg-white/[0.05] border border-white/[0.1] text-[#f0f4ff] hover:bg-white/[0.08]'
                        }`}
                      >
                        ${formatNumber(a)}
                      </button>
                    ))}
                    <button
                      onClick={() => setIsCustom(true)}
                      className={`py-3 rounded-xl font-bold text-sm transition-all ${
                        isCustom
                          ? 'bg-[#00d4aa] text-[#0a0f1e]'
                          : 'bg-white/[0.05] border border-white/[0.1] text-[#f0f4ff] hover:bg-white/[0.08]'
                      }`}
                    >
                      {t('custom')}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isCustom && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                      >
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8892a4] font-bold">$</span>
                          <input
                            type="number"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            placeholder="Enter amount"
                            min="1"
                            max="500000"
                            className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none pl-8 pr-4 py-3 text-sm"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tower progress preview */}
                  <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex justify-between text-xs text-[#8892a4] mb-2">
                      <span>Tower 1 progress after your investment</span>
                      <span className="font-bold text-[#f0f4ff]">{towerProgress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                      <motion.div
                        animate={{ width: `${towerProgress}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0ea5e9]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => { if (effectiveAmount >= 1) setStep('confirm'); }}
                    disabled={effectiveAmount < 1}
                    className="w-full mt-6 py-4 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t('confirm')} →
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl bg-white/[0.03] border border-[#00d4aa]/20 p-8"
                >
                  <h2 className="text-xl font-bold text-[#f0f4ff] mb-6">{t('confirmTitle')}</h2>

                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between py-3 border-b border-white/[0.06]">
                      <span className="text-[#8892a4]">Amount</span>
                      <span className="font-black text-[#f0f4ff] text-xl">{formatCurrency(effectiveAmount)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-white/[0.06]">
                      <span className="text-[#8892a4]">Air cleaned daily</span>
                      <span className="font-bold text-[#00d4aa]">{formatNumber(impact.m3PerDay)} m³</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-white/[0.06]">
                      <span className="text-[#8892a4]">Tree equivalents</span>
                      <span className="font-bold text-[#f0f4ff]">{impact.treesEquivalent}</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-[#8892a4]">Badge earned</span>
                      <span className="font-bold" style={{ color: badgeCfg.color }}>
                        {badgeCfg.emoji} {badgeCfg.label}
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('select')}
                      className="flex-1 py-3.5 bg-white/[0.05] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.08] transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 py-3.5 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-all disabled:opacity-60"
                    >
                      {loading ? 'Processing...' : t('confirm')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Impact preview */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-[#00d4aa]/10 to-transparent border border-[#00d4aa]/20 p-6">
              <h3 className="text-sm font-bold text-[#8892a4] uppercase tracking-wider mb-5">{t('impact')}</h3>
              <div className="space-y-4">
                {[
                  { label: t('airDaily'), value: `${formatNumber(impact.m3PerDay)} m³` },
                  { label: t('trees'), value: `${impact.treesEquivalent}` },
                  { label: t('towerFunding'), value: `${impact.towerPercent}%` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-[#8892a4]">{label}</span>
                    <motion.span
                      key={value}
                      initial={{ scale: 1.1, color: '#00d4aa' }}
                      animate={{ scale: 1, color: '#f0f4ff' }}
                      className="font-black text-lg tabular-nums"
                    >
                      {value}
                    </motion.span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
              <div className="text-3xl mb-2">{badgeCfg.emoji}</div>
              <div className="text-sm text-[#8892a4] mb-1">{t('badge')}</div>
              <div className="font-bold" style={{ color: badgeCfg.color }}>
                {badgeCfg.label}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
