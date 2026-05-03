'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { ArrowDown, Leaf, BarChart3, TrendingUp, Wind, Users, TreePine, Droplets } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  doc, onSnapshot, collection, query, orderBy, limit,
  type DocumentData,
} from 'firebase/firestore';
import AQIWidget from '@/components/AQIWidget';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import { calculateImpact, formatCurrency, formatNumber } from '@/lib/impact';
import { BADGE_CONFIG } from '@/lib/badges';
import type { UserProfile, GlobalStats, Investment } from '@/types';

// Animated counter
function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionValue = useMotionValue(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (shouldReduceMotion) {
      if (ref.current) ref.current.textContent = `${prefix}${value.toFixed(decimals)}${suffix}`;
      return;
    }
    const controls = animate(motionValue, value, {
      duration: 2,
      ease: 'easeOut',
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = `${prefix}${decimals > 0 ? v.toFixed(decimals) : Math.floor(v).toLocaleString()}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, value, motionValue, prefix, suffix, decimals, shouldReduceMotion]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  },
};

export default function HomePage() {
  const t = useTranslations();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats>({
    totalRaised: 0,
    backerCount: 0,
    towersCompleted: 0,
    towersInProgress: 1,
  });
  const [recentInvestments, setRecentInvestments] = useState<Investment[]>([]);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onSnapshot(
      doc(db, 'globalStats', 'investmentData'),
      (snap) => { if (snap.exists()) setStats(snap.data() as GlobalStats); },
      () => {}
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !authUser) return;
    const unsub = onSnapshot(
      doc(db, 'users', authUser.uid),
      (snap) => { if (snap.exists()) setProfile(snap.data() as UserProfile); },
      () => {}
    );
    return () => unsub();
  }, [authUser]);

  useEffect(() => {
    if (!isFirebaseConfigured || !authUser) return;
    const q = query(collection(db, 'investments'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setRecentInvestments(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investment))
      );
    }, () => {});
    return () => unsub();
  }, [authUser]);

  if (authLoading) return <PageLoadingSkeleton />;

  const m3PerDay = Math.round(stats.totalRaised * 13.33);
  const treesEquiv = Math.round(m3PerDay / 22);
  const towerProgress = Math.min((stats.totalRaised / 54000) * 100, 100);

  return (
    <>
      {authUser ? (
        <AuthDashboard
          t={t}
          profile={profile}
          stats={stats}
          recentInvestments={recentInvestments}
          m3PerDay={m3PerDay}
          treesEquiv={treesEquiv}
          towerProgress={towerProgress}
        />
      ) : (
        <GuestLanding
          t={t}
          stats={stats}
          m3PerDay={m3PerDay}
          treesEquiv={treesEquiv}
          towerProgress={towerProgress}
        />
      )}
    </>
  );
}

function GuestLanding({
  t,
  stats,
  m3PerDay,
  treesEquiv,
  towerProgress,
}: {
  t: ReturnType<typeof useTranslations>;
  stats: GlobalStats;
  m3PerDay: number;
  treesEquiv: number;
  towerProgress: number;
}) {
  return (
    <div className="bg-[#0a0f1e]">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#00d4aa]/[0.06] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/[0.05] blur-[100px]" />
          {/* Particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="particle"
              style={{
                width: `${4 + (i % 3) * 3}px`,
                height: `${4 + (i % 3) * 3}px`,
                left: `${10 + i * 11}%`,
                top: `${20 + (i % 4) * 18}%`,
                '--duration': `${6 + i * 1.5}s`,
                '--delay': `${i * 0.8}s`,
                opacity: 0.2,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* AQI Widget top right */}
        <div className="absolute top-24 right-6 sm:right-10 z-10">
          <AQIWidget />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#00d4aa]/30 bg-[#00d4aa]/10 text-[#00d4aa] text-sm font-medium mb-8">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
              Live — {stats.backerCount} backers and growing
            </div>

            <h1
              className="font-black text-[#f0f4ff] mb-6 leading-none tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}
            >
              {t('hero.title').split('.').map((part, i) => (
                <span key={i}>
                  {i === 0 ? part + '.' : (
                    <span className="gradient-text"> {part}.</span>
                  )}
                  {'\n'}
                </span>
              ))}
            </h1>

            <p className="text-lg sm:text-xl text-[#8892a4] mb-4 max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>

            {/* Live counter */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] mb-10">
              <span className="text-[#8892a4] text-sm">{t('hero.totalRaised')}:</span>
              <span className="text-2xl font-black text-[#00d4aa] tabular-nums">
                ${formatNumber(stats.totalRaised)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] hover:scale-[1.02] transition-all text-lg shadow-[0_0_30px_rgba(0,212,170,0.3)]"
              >
                {t('hero.cta')} →
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-4 bg-white/[0.05] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.08] transition-all text-lg"
              >
                {t('hero.learnHow')} ↓
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown size={20} className="text-[#4a5568]" />
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black text-[#f0f4ff] mb-4">{t('howItWorks.title')}</h2>
          </motion.div>

          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { icon: <Leaf size={28} />, key: 'invest', emoji: '💰' },
              { icon: <BarChart3 size={28} />, key: 'track', emoji: '📊' },
              { icon: <TrendingUp size={28} />, key: 'grow', emoji: '🌿' },
            ].map(({ key, emoji }) => (
              <motion.div
                key={key}
                variants={STAGGER.item}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 backdrop-blur-sm hover:border-[#00d4aa]/20 hover:bg-white/[0.05] transition-all"
              >
                <div className="text-4xl mb-4">{emoji}</div>
                <h3 className="text-xl font-bold text-[#f0f4ff] mb-3">
                  {t(`howItWorks.${key as 'invest' | 'track' | 'grow'}.title`)}
                </h3>
                <p className="text-[#8892a4] leading-relaxed">
                  {t(`howItWorks.${key as 'invest' | 'track' | 'grow'}.desc`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live Impact Stats */}
      <section className="py-24 px-4 bg-[#0f1629]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-[#f0f4ff] text-center mb-16"
          >
            Live Impact
          </motion.h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: t('stats.totalRaised'), value: stats.totalRaised, prefix: '$', icon: <Wind size={20} /> },
              { label: t('stats.communityBackers'), value: stats.backerCount, icon: <Users size={20} /> },
              { label: t('stats.airCleanedDaily'), value: m3PerDay, icon: <Droplets size={20} /> },
              { label: t('stats.treesEquivalent'), value: treesEquiv, icon: <TreePine size={20} /> },
            ].map(({ label, value, prefix = '', icon }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 glow-teal-sm"
              >
                <div className="text-[#00d4aa] mb-3">{icon}</div>
                <div className="text-3xl font-black text-[#f0f4ff] tabular-nums mb-1">
                  <AnimatedNumber value={value} prefix={prefix} />
                </div>
                <div className="text-xs text-[#8892a4] font-medium uppercase tracking-wider">{label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Investor Tiers */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-[#f0f4ff] text-center mb-4"
          >
            {t('tiers.title')}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[#8892a4] text-center mb-16"
          >
            Every dollar counts. Choose your level of impact.
          </motion.p>

          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {(Object.entries(BADGE_CONFIG) as [string, typeof BADGE_CONFIG[keyof typeof BADGE_CONFIG]][]).map(([key, cfg]) => (
              <motion.div
                key={key}
                variants={STAGGER.item}
                whileHover={{ y: -4 }}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 text-center hover:border-white/[0.1] transition-all"
              >
                <div className="text-5xl mb-4">{cfg.emoji}</div>
                <div
                  className="text-sm font-bold uppercase tracking-wider mb-2"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </div>
                <div className="text-2xl font-black text-[#f0f4ff] mb-2">
                  ${formatNumber(cfg.minAmount)}
                  {cfg.maxAmount !== 'Unlimited' ? `–${cfg.maxAmount}` : '+'}
                </div>
                <p className="text-[#8892a4] text-sm">
                  {t(`tiers.${key === 'civic' ? 'civicDesc' : key === 'partner' ? 'partnerDesc' : 'founderDesc'}` as never)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Tower Progress */}
      <section className="py-24 px-4 bg-[#0f1629]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-[#f0f4ff] mb-12"
          >
            {t('towers.title')}
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TowerProgressCard
              title={t('towers.tower1')}
              raised={stats.totalRaised}
              goal={54000}
              progress={towerProgress}
              status="active"
            />
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">TOWER 2</div>
                <h3 className="text-lg font-bold text-[#f0f4ff] mb-4">{t('towers.tower2')}</h3>
                <p className="text-[#8892a4] text-sm">{t('towers.planned')}</p>
              </div>
              <Link
                href="/vote"
                className="mt-6 block text-center px-4 py-3 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-[#00d4aa] text-sm font-bold hover:bg-[#00d4aa]/20 transition-colors"
              >
                Vote for the next location →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Dream Almaty Preview */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-3xl bg-gradient-to-br from-[#00d4aa]/10 to-blue-500/5 border border-[#00d4aa]/20 p-12 text-center"
          >
            <div className="text-5xl mb-6">🏙️</div>
            <h2 className="text-4xl font-black text-[#f0f4ff] mb-4">{t('dream.title')}</h2>
            <p className="text-lg text-[#8892a4] mb-8 max-w-2xl mx-auto">{t('dream.preview')}</p>
            <Link
              href="/dream-almaty"
              className="inline-block px-8 py-4 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-colors"
            >
              {t('dream.cta')} →
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
}

function AuthDashboard({
  t,
  profile,
  stats,
  recentInvestments,
  m3PerDay,
  treesEquiv,
  towerProgress,
}: {
  t: ReturnType<typeof useTranslations>;
  profile: UserProfile | null;
  stats: GlobalStats;
  recentInvestments: Investment[];
  m3PerDay: number;
  treesEquiv: number;
  towerProgress: number;
}) {
  const userImpact = profile ? calculateImpact(profile.totalInvested) : null;
  const badge = profile ? BADGE_CONFIG[profile.badge] : null;

  return (
    <div className="bg-[#0a0f1e] pt-20">
      {/* Personalized Hero */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1"
            >
              <h1 className="text-4xl font-black text-[#f0f4ff] mb-2">
                {t('hero.greeting', { name: profile?.firstName ?? 'Friend' })} 👋
              </h1>
              <p className="text-[#8892a4] mb-8">{t('hero.greetingSubtitle')}</p>

              {/* Impact Card */}
              {profile && userImpact && badge && (
                <div className="rounded-2xl bg-gradient-to-br from-[#00d4aa]/10 to-transparent border border-[#00d4aa]/20 p-6 mb-8 glow-teal-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{badge.emoji}</span>
                    <div>
                      <div className="text-xs text-[#8892a4] uppercase tracking-wider">{badge.label}</div>
                      <div className="font-black text-[#f0f4ff]">
                        {formatCurrency(profile.totalInvested)} invested
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-black text-[#00d4aa]">
                        {formatNumber(userImpact.m3PerDay)}
                      </div>
                      <div className="text-xs text-[#8892a4]">{t('stats.airCleanedDaily')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-[#00d4aa]">
                        {userImpact.treesEquivalent}
                      </div>
                      <div className="text-xs text-[#8892a4]">{t('stats.treesEquivalent')}</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/invest"
                  className="px-6 py-3 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-all hover:scale-[1.02]"
                >
                  Invest Now →
                </Link>
                <Link
                  href="/profile"
                  className="px-6 py-3 bg-white/[0.05] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.08] transition-all"
                >
                  View Profile
                </Link>
                <Link
                  href="/vote"
                  className="px-6 py-3 bg-white/[0.05] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.08] transition-all"
                >
                  Vote for Next Tower
                </Link>
              </div>
            </motion.div>

            <div className="lg:w-48">
              <AQIWidget />
            </div>
          </div>
        </div>
      </section>

      {/* Global Stats */}
      <section className="py-12 px-4 bg-[#0f1629]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('stats.totalRaised'), value: stats.totalRaised, prefix: '$' },
              { label: t('stats.communityBackers'), value: stats.backerCount },
              { label: t('stats.airCleanedDaily'), value: m3PerDay },
              { label: t('stats.treesEquivalent'), value: treesEquiv },
            ].map(({ label, value, prefix = '' }) => (
              <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="text-2xl font-black text-[#00d4aa] tabular-nums mb-1">
                  <AnimatedNumber value={value} prefix={prefix} />
                </div>
                <div className="text-xs text-[#8892a4] uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      {recentInvestments.length > 0 && (
        <section className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-black text-[#f0f4ff] mb-6">Recent Community Activity</h2>
            <div className="space-y-3">
              {recentInvestments.map((inv) => {
                const timeAgo = inv.createdAt
                  ? getTimeAgo(inv.createdAt.toDate ? inv.createdAt.toDate() : new Date((inv.createdAt as unknown as { seconds: number }).seconds * 1000))
                  : 'recently';
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.06] px-5 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#00d4aa] animate-pulse" />
                      <span className="text-[#8892a4] text-sm">
                        A backer invested{' '}
                        <span className="text-[#f0f4ff] font-bold">{formatCurrency(inv.amount)}</span>
                      </span>
                    </div>
                    <span className="text-xs text-[#4a5568]">{timeAgo}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tower Progress */}
      <section className="py-12 px-4 bg-[#0f1629]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-[#f0f4ff] mb-6">{t('towers.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TowerProgressCard
              title={t('towers.tower1')}
              raised={stats.totalRaised}
              goal={54000}
              progress={towerProgress}
              status="active"
            />
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <div className="text-xs font-bold text-[#8892a4] uppercase tracking-wider mb-2">TOWER 2</div>
              <h3 className="text-lg font-bold text-[#f0f4ff] mb-2">{t('towers.tower2')}</h3>
              <p className="text-[#8892a4] text-sm mb-4">{t('towers.planned')}</p>
              <Link
                href="/vote"
                className="block text-center px-4 py-3 rounded-xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-[#00d4aa] text-sm font-bold hover:bg-[#00d4aa]/20 transition-colors"
              >
                Vote for location →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer t={t} />
    </div>
  );
}

function TowerProgressCard({
  title,
  raised,
  goal,
  progress,
  status,
}: {
  title: string;
  raised: number;
  goal: number;
  progress: number;
  status: 'active' | 'planned';
}) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-[#00d4aa]/20 p-6 glow-teal-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-xs font-bold text-[#00d4aa] uppercase tracking-wider mb-1">TOWER 1</div>
          <h3 className="text-lg font-bold text-[#f0f4ff]">{title}</h3>
        </div>
        {status === 'active' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00d4aa] animate-pulse" />
            <span className="text-xs text-[#00d4aa] font-bold">Active</span>
          </div>
        )}
      </div>

      <div className="mb-2 flex justify-between text-sm">
        <span className="text-[#8892a4]">{formatCurrency(raised)} raised</span>
        <span className="text-[#f0f4ff] font-bold">{progress.toFixed(1)}%</span>
      </div>
      <div className="h-3 rounded-full bg-white/[0.06] overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${progress}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          className="h-full rounded-full bg-gradient-to-r from-[#00d4aa] to-[#0ea5e9]"
        />
      </div>
      <div className="text-xs text-[#4a5568]">Goal: {formatCurrency(goal)}</div>
    </div>
  );
}

function Footer({ t }: { t: ReturnType<typeof useTranslations> }) {
  return (
    <footer className="border-t border-white/[0.06] py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wind size={18} className="text-[#00d4aa]" />
              <span className="font-black text-[#f0f4ff] text-lg">Aura <span className="text-[#00d4aa]">Optima</span></span>
            </div>
            <p className="text-sm text-[#4a5568]">{t('footer.tagline')}</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-sm text-[#8892a4]">
            <Link href="/about" className="hover:text-[#f0f4ff] transition-colors">About</Link>
            <Link href="/#how-it-works" className="hover:text-[#f0f4ff] transition-colors">How It Works</Link>
            <Link href="/dream-almaty" className="hover:text-[#f0f4ff] transition-colors">Dream Almaty</Link>
            <Link href="/assistant" className="hover:text-[#f0f4ff] transition-colors">Assistant</Link>
            <Link href="/login" className="hover:text-[#f0f4ff] transition-colors">Login</Link>
            <Link href="/register" className="hover:text-[#f0f4ff] transition-colors">Register</Link>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-white/[0.06] text-center text-xs text-[#4a5568]">
          {t('footer.copyright')}
        </div>
      </div>
    </footer>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}
