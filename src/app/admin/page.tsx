'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  doc, collection, query, orderBy, limit, onSnapshot,
  setDoc, updateDoc, deleteDoc, writeBatch, getDocs,
  serverTimestamp, increment,
} from 'firebase/firestore';
import { formatCurrency, formatNumber } from '@/lib/impact';
import type { GlobalStats, Investment, UserProfile } from '@/types';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? '').split(',').map((e) => e.trim());

interface DistrictVote {
  id: string;
  name: string;
  votes: number;
}

export default function AdminPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats>({ totalRaised: 0, backerCount: 0, towersCompleted: 0, towersInProgress: 1 });
  const [alertMsg, setAlertMsg] = useState('');
  const [alertActive, setAlertActive] = useState(false);
  const [alertInput, setAlertInput] = useState('');
  const [tickerRaised, setTickerRaised] = useState('');
  const [tickerBackers, setTickerBackers] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [districts, setDistricts] = useState<DistrictVote[]>([]);
  const [editingInv, setEditingInv] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [loading, setLoading] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) { setAuthLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u || !ADMIN_EMAILS.some((e) => e.toLowerCase() === (u.email ?? '').toLowerCase())) {
        router.push('/');
        return;
      }
      setIsAdmin(true);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!isAdmin || !isFirebaseConfigured) return;

    const statUnsub = onSnapshot(doc(db, 'globalStats', 'investmentData'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as GlobalStats;
        setStats(data);
        setTickerRaised(String(data.totalRaised));
        setTickerBackers(String(data.backerCount));
      }
    }, () => {});

    const alertUnsub = onSnapshot(doc(db, 'globalStats', 'pollutionAlert'), (snap) => {
      if (snap.exists()) {
        setAlertMsg(snap.data().message ?? '');
        setAlertActive(snap.data().active ?? false);
        setAlertInput(snap.data().message ?? '');
      }
    }, () => {});

    const invQ = query(collection(db, 'investments'), orderBy('createdAt', 'desc'), limit(10));
    const invUnsub = onSnapshot(invQ, (snap) => {
      setInvestments(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investment)));
    }, () => {});

    const distUnsub = onSnapshot(collection(db, 'districts'), (snap) => {
      setDistricts(snap.docs.map((d) => ({ id: d.id, name: d.data().name ?? d.id, votes: d.data().votes ?? 0 })));
    }, () => {});

    getDocs(query(collection(db, 'users'), orderBy('joinedAt', 'desc'), limit(10))).then((snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as UserProfile)));
    }).catch(() => {});

    return () => { statUnsub(); alertUnsub(); invUnsub(); distUnsub(); };
  }, [isAdmin]);

  async function handlePostAlert() {
    await setDoc(doc(db, 'globalStats', 'pollutionAlert'), { message: alertInput, active: true });
  }

  async function handleClearAlert() {
    await updateDoc(doc(db, 'globalStats', 'pollutionAlert'), { active: false });
  }

  async function handleUpdateTicker() {
    const raised = parseFloat(tickerRaised);
    const backers = parseInt(tickerBackers, 10);
    if (isNaN(raised) || isNaN(backers)) return;
    await setDoc(doc(db, 'globalStats', 'investmentData'), {
      totalRaised: raised,
      backerCount: backers,
      towersCompleted: stats.towersCompleted,
      towersInProgress: stats.towersInProgress,
    });
  }

  async function handleEditInv(inv: Investment) {
    const newAmount = parseFloat(editAmount);
    if (isNaN(newAmount) || newAmount < 0) return;
    setLoading(inv.id);
    const diff = newAmount - inv.amount;
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'investments', inv.id), { amount: newAmount });
      batch.update(doc(db, 'globalStats', 'investmentData'), { totalRaised: increment(diff) });
      batch.update(doc(db, 'users', inv.uid), { totalInvested: increment(diff) });
      await batch.commit();
      setEditingInv(null);
    } finally {
      setLoading('');
    }
  }

  async function handleDeleteInv(inv: Investment) {
    if (!confirm(`Delete investment of ${formatCurrency(inv.amount)} from ${inv.email}?`)) return;
    setLoading(inv.id);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'investments', inv.id));
      batch.update(doc(db, 'globalStats', 'investmentData'), {
        totalRaised: increment(-inv.amount),
        backerCount: increment(-1),
      });
      batch.update(doc(db, 'users', inv.uid), { totalInvested: increment(-inv.amount) });
      await batch.commit();
    } finally {
      setLoading('');
    }
  }

  async function handleResetVotes() {
    if (!confirm(t('confirmReset'))) return;
    const snap = await getDocs(collection(db, 'districts'));
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.update(d.ref, { votes: 0 }));
    // Reset all users' votedDistrict
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.docs.forEach((d) => batch.update(d.ref, { votedDistrict: null }));
    await batch.commit();
  }

  if (authLoading) return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
      <div className="text-[#8892a4]">Verifying admin access...</div>
    </div>
  );

  if (!isAdmin) return null;

  const votingLeader = [...districts].sort((a, b) => b.votes - a.votes)[0];

  return (
    <div className="min-h-screen bg-[#0a0f1e] pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black text-[#f0f4ff] mb-2">{t('title')}</h1>
          <p className="text-[#8892a4] mb-10">Platform management panel</p>
        </motion.div>

        {/* Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Raised', value: formatCurrency(stats.totalRaised) },
            { label: 'Total Backers', value: formatNumber(stats.backerCount) },
            { label: 'Alert Status', value: alertActive ? '⚠️ Active' : '✓ Clear' },
            { label: 'Voting Leader', value: votingLeader?.name ?? '—' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
              <div className="text-xl font-black text-[#00d4aa] mb-1">{value}</div>
              <div className="text-xs text-[#8892a4]">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Ticker Editor */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h2 className="text-lg font-bold text-[#f0f4ff] mb-5">{t('tickerEditor')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#8892a4] mb-2">Total Raised ($)</label>
                <input
                  type="number"
                  value={tickerRaised}
                  onChange={(e) => setTickerRaised(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[#8892a4] mb-2">Backer Count</label>
                <input
                  type="number"
                  value={tickerBackers}
                  onChange={(e) => setTickerBackers(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm"
                />
              </div>
              <button
                onClick={handleUpdateTicker}
                className="w-full py-3 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-colors text-sm"
              >
                {t('updateTicker')}
              </button>
            </div>
          </div>

          {/* Alert Manager */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
            <h2 className="text-lg font-bold text-[#f0f4ff] mb-2">{t('alertManager')}</h2>
            <div className="flex items-center gap-2 mb-5">
              <div className={`w-2 h-2 rounded-full ${alertActive ? 'bg-amber-400 animate-pulse' : 'bg-[#4a5568]'}`} />
              <span className="text-xs text-[#8892a4]">{alertActive ? t('alertActive') : t('alertInactive')}</span>
              {alertActive && <span className="text-xs text-[#8892a4] truncate max-w-xs">: "{alertMsg}"</span>}
            </div>
            <div className="space-y-4">
              <textarea
                value={alertInput}
                onChange={(e) => setAlertInput(e.target.value)}
                placeholder="Enter alert message..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={handlePostAlert}
                  className="flex-1 py-3 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-colors text-sm"
                >
                  {t('postAlert')}
                </button>
                <button
                  onClick={handleClearAlert}
                  className="flex-1 py-3 bg-white/[0.05] border border-white/[0.1] text-[#f0f4ff] font-medium rounded-xl hover:bg-white/[0.08] transition-colors text-sm"
                >
                  {t('clearAlert')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Investments */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 mb-8">
          <h2 className="text-lg font-bold text-[#f0f4ff] mb-5">{t('recentInvestments')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Email', 'Date', 'Amount', 'Actions'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold text-[#8892a4] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {investments.map((inv) => {
                  const invDate = inv.createdAt?.toDate?.() ?? new Date((inv.createdAt as unknown as { seconds: number })?.seconds * 1000 || Date.now());
                  return (
                    <tr key={inv.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-3 px-3 text-[#8892a4] text-xs truncate max-w-[200px]">{inv.email}</td>
                      <td className="py-3 px-3 text-[#8892a4] text-xs">{invDate.toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        {editingInv === inv.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-24 bg-white/[0.04] border border-white/[0.1] rounded-lg text-[#f0f4ff] focus:border-[#00d4aa]/50 focus:outline-none px-2 py-1 text-xs"
                            />
                            <button onClick={() => handleEditInv(inv)} disabled={loading === inv.id} className="text-xs text-[#00d4aa] hover:underline">
                              {loading === inv.id ? '...' : 'Save'}
                            </button>
                            <button onClick={() => setEditingInv(null)} className="text-xs text-[#4a5568] hover:text-[#8892a4]">Cancel</button>
                          </div>
                        ) : (
                          <span className="font-bold text-[#f0f4ff]">{formatCurrency(inv.amount)}</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setEditingInv(inv.id); setEditAmount(String(inv.amount)); }}
                            className="text-xs text-[#8892a4] hover:text-[#f0f4ff] transition-colors"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInv(inv)}
                            disabled={loading === inv.id}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {investments.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#4a5568] text-sm">No investments yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* District Voting */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-bold text-[#f0f4ff]">{t('districtVoting')}</h2>
            <button
              onClick={handleResetVotes}
              className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              {t('resetVotes')}
            </button>
          </div>
          <div className="space-y-2">
            {[...districts].sort((a, b) => b.votes - a.votes).map(({ id, name, votes }) => (
              <div key={id} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                <span className="text-[#f0f4ff] text-sm">{name}</span>
                <span className="font-bold text-[#00d4aa] tabular-nums">{votes}</span>
              </div>
            ))}
            {districts.length === 0 && (
              <div className="text-center py-4 text-[#4a5568] text-sm">No districts data.</div>
            )}
          </div>
        </div>

        {/* User List */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
          <h2 className="text-lg font-bold text-[#f0f4ff] mb-5">{t('userList')}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Name', 'Email', 'Type', 'Badge', 'Invested', 'Joined'].map((h) => (
                    <th key={h} className="text-left py-3 px-3 text-xs font-bold text-[#8892a4] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const joined = u.joinedAt?.toDate?.() ?? new Date((u.joinedAt as unknown as { seconds: number })?.seconds * 1000 || Date.now());
                  return (
                    <tr key={u.uid} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-medium text-[#f0f4ff]">{u.firstName} {u.lastName}</td>
                      <td className="py-3 px-3 text-[#8892a4] text-xs">{u.email}</td>
                      <td className="py-3 px-3 text-[#8892a4] text-xs capitalize">{u.type}</td>
                      <td className="py-3 px-3 text-xs">{u.badge === 'founder' ? '🏛️' : u.badge === 'partner' ? '🌿' : '🌱'}</td>
                      <td className="py-3 px-3 font-bold text-[#f0f4ff]">{formatCurrency(u.totalInvested)}</td>
                      <td className="py-3 px-3 text-[#8892a4] text-xs">{joined.toLocaleDateString()}</td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-[#4a5568] text-sm">No users yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
