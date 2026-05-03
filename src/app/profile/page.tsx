'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { calculateImpact, formatCurrency, formatNumber, TOWER_GOAL } from '@/lib/impact';
import { BADGE_CONFIG } from '@/lib/badges';
import { PageLoadingSkeleton } from '@/components/SkeletonLoader';
import type { UserProfile, Investment } from '@/types';

const DISTRICTS: Record<string, string> = {
  turksib: 'Turksib', medeu: 'Medeu', alatau: 'Alatau', bostandyk: 'Bostandyk',
  almaly: 'Almaly', nauryzbai: 'Nauryzbai', zhetysu: 'Zhetysu', narikbai: 'Narikbai',
};

export default function ProfilePage() {
  const t = useTranslations('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editFirst, setEditFirst] = useState('');
  const [editLast, setEditLast] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) setUid(u.uid);
      else setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!uid || !isFirebaseConfigured) return;
    const unsub = onSnapshot(doc(db, 'users', uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setProfile(data);
        setEditFirst(data.firstName);
        setEditLast(data.lastName);
        setEditPhone(data.phone ?? '');
      }
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [uid]);

  useEffect(() => {
    if (!uid || !isFirebaseConfigured) return;
    const q = query(
      collection(db, 'investments'),
      where('uid', '==', uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    getDocs(q).then((snap) => {
      setInvestments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investment)));
    }).catch(() => {});
  }, [uid]);

  async function handleSave() {
    if (!uid) return;
    setSaveLoading(true);
    try {
      await updateDoc(doc(db, 'users', uid), {
        firstName: editFirst.trim(),
        lastName: editLast.trim(),
        phone: editPhone.trim() || null,
      });
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaveLoading(false);
    }
  }

  if (loading) return <PageLoadingSkeleton />;
  if (!profile) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <p className="text-[#8892a4]">Please sign in to view your profile.</p>
    </div>
  );

  const impact = calculateImpact(profile.totalInvested);
  const badge = BADGE_CONFIG[profile.badge];
  const joinedDate = profile.joinedAt?.toDate?.() ?? new Date();

  return (
    <div className="min-h-screen bg-[#0a0f1e] pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#00d4aa]/10 to-[#0f1629] border border-[#00d4aa]/20 p-8 mb-6 glow-teal-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-[#0a0f1e] shrink-0"
                style={{ background: `linear-gradient(135deg, ${badge.color}, #0f1629)` }}
              >
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-[#f0f4ff]">
                  {profile.firstName} {profile.lastName}
                </h1>
                <p className="text-[#8892a4] text-sm">{profile.email}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold border"
                    style={{ color: badge.color, borderColor: `${badge.color}40`, backgroundColor: `${badge.color}15` }}
                  >
                    {badge.emoji} {badge.label}
                  </span>
                  <span className="text-xs text-[#4a5568]">
                    {t('memberSince')} {joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Impact Stats */}
          <div id="impact" className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: t('totalInvested'), value: formatCurrency(profile.totalInvested) },
              { label: t('airDaily'), value: `${formatNumber(impact.m3PerDay)} m³` },
              { label: t('trees'), value: String(impact.treesEquivalent) },
              { label: t('towerPercent'), value: `${impact.towerPercent}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
                <div className="text-xl font-black text-[#00d4aa] tabular-nums mb-1">{value}</div>
                <div className="text-xs text-[#8892a4]">{label}</div>
              </div>
            ))}
          </div>

          {/* Account Details */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#f0f4ff]">{t('accountDetails')}</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#8892a4] hover:text-[#f0f4ff] hover:bg-white/[0.08] transition-all text-sm"
                >
                  <Pencil size={14} /> {t('editProfile')}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saveLoading}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-[#00d4aa] text-[#0a0f1e] font-bold text-sm hover:bg-[#00b894] transition-colors"
                  >
                    <Check size={14} /> {saveLoading ? 'Saving...' : t('saveChanges')}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[#8892a4] text-sm"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {[
                { label: 'First Name', value: editFirst, setter: setEditFirst, field: 'firstName' },
                { label: 'Last Name', value: editLast, setter: setEditLast, field: 'lastName' },
                { label: 'Phone', value: editPhone, setter: setEditPhone, field: 'phone' },
              ].map(({ label, value, setter }) => (
                <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="sm:w-32 text-sm text-[#8892a4] shrink-0">{label}</span>
                  {editing ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-2.5 text-sm"
                    />
                  ) : (
                    <span className="text-[#f0f4ff] text-sm">{value || '—'}</span>
                  )}
                </div>
              ))}
              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.06]">
                <span className="sm:w-32 text-sm text-[#8892a4]">Email</span>
                <span className="text-[#f0f4ff] text-sm">{profile.email}</span>
              </div>
            </div>
          </div>

          {/* Investment History */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 mb-6">
            <h2 className="text-xl font-bold text-[#f0f4ff] mb-6">{t('investmentHistory')}</h2>
            {investments.length === 0 ? (
              <p className="text-[#4a5568] text-sm">No investments yet. <a href="/invest" className="text-[#00d4aa] hover:underline">Make your first investment →</a></p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      {[t('date'), t('amount'), t('impact'), t('badgeEarned')].map((h) => (
                        <th key={h} className="text-left py-3 px-2 text-xs font-bold text-[#8892a4] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => {
                      const invDate = inv.createdAt?.toDate?.() ?? new Date((inv.createdAt as unknown as { seconds: number })?.seconds * 1000 || Date.now());
                      const invImpact = calculateImpact(inv.amount);
                      return (
                        <tr key={inv.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-2 text-[#8892a4]">{invDate.toLocaleDateString()}</td>
                          <td className="py-3 px-2 font-bold text-[#f0f4ff]">{formatCurrency(inv.amount)}</td>
                          <td className="py-3 px-2 text-[#00d4aa]">{formatNumber(invImpact.m3PerDay)} m³/day</td>
                          <td className="py-3 px-2">
                            <span className="text-sm">{BADGE_CONFIG[calculateBadge(inv.amount)].emoji}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Voting History */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8">
            <h2 className="text-xl font-bold text-[#f0f4ff] mb-4">{t('votingHistory')}</h2>
            {profile.votedDistrict ? (
              <p className="text-[#8892a4]">
                {t('votedFor')}{' '}
                <span className="font-bold text-[#00d4aa]">
                  {DISTRICTS[profile.votedDistrict] ?? profile.votedDistrict}
                </span>
              </p>
            ) : (
              <p className="text-[#4a5568] text-sm">
                {t('notVoted')}{' '}
                <a href="/vote" className="text-[#00d4aa] hover:underline">Vote now →</a>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function calculateBadge(amount: number) {
  if (amount >= 5000) return 'founder' as const;
  if (amount >= 500) return 'partner' as const;
  return 'civic' as const;
}
