'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useTranslations } from 'next-intl';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, increment, onSnapshot, writeBatch } from 'firebase/firestore';
import type { District } from '@/types';

const Map = dynamic(() => import('./VoteMap'), { ssr: false, loading: () => (
  <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] h-[400px] flex items-center justify-center">
    <div className="text-[#4a5568] text-sm">Loading map...</div>
  </div>
) });

const DISTRICT_COORDS: Record<string, { lat: number; lng: number; name: string; nameKk: string }> = {
  turksib:   { lat: 43.3019, lng: 77.0619, name: 'Turksib',    nameKk: 'Түрксіб'   },
  medeu:     { lat: 43.1720, lng: 76.9506, name: 'Medeu',      nameKk: 'Медеу'      },
  alatau:    { lat: 43.3167, lng: 76.8500, name: 'Alatau',     nameKk: 'Алатау'     },
  bostandyk: { lat: 43.2165, lng: 76.8695, name: 'Bostandyk',  nameKk: 'Бостандық' },
  almaly:    { lat: 43.2567, lng: 76.9286, name: 'Almaly',     nameKk: 'Алмалы'    },
  nauryzbai: { lat: 43.2500, lng: 76.7833, name: 'Nauryzbai',  nameKk: 'Наурызбай' },
  zhetysu:   { lat: 43.2894, lng: 76.9856, name: 'Zhetysu',   nameKk: 'Жетісу'    },
  narikbai:  { lat: 43.2333, lng: 76.7167, name: 'Narikbai',  nameKk: 'Нариқбай'  },
};

const AQI_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Good', color: '#00d4aa' },
  2: { label: 'Fair', color: '#84cc16' },
  3: { label: 'Moderate', color: '#f59e0b' },
  4: { label: 'Poor', color: '#f97316' },
  5: { label: 'Hazardous', color: '#ef4444' },
};

interface DistrictAQI {
  aqi: number;
  pm2_5: number;
  label: string;
  color: string;
}

const AQI_CACHE_PREFIX = 'aura_aqi_district_';
const CACHE_TTL = 30 * 60 * 1000;

async function fetchDistrictAQI(id: string, lat: number, lng: number): Promise<DistrictAQI> {
  const cacheKey = `${AQI_CACHE_PREFIX}${id}`;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const p = JSON.parse(cached) as DistrictAQI & { fetchedAt: number };
      if (Date.now() - p.fetchedAt < CACHE_TTL) return p;
    }
  } catch {}

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
  const res = await fetch(
    `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${apiKey}`
  );
  const json = await res.json() as { list: Array<{ main: { aqi: number }; components: { pm2_5: number } }> };
  const item = json.list[0];
  const aqiIndex = item.main.aqi as 1 | 2 | 3 | 4 | 5;
  const cfg = AQI_LABELS[aqiIndex] ?? AQI_LABELS[3];
  const result: DistrictAQI & { fetchedAt: number } = { ...cfg, aqi: aqiIndex, pm2_5: Math.round(item.components.pm2_5 * 10) / 10, fetchedAt: Date.now() };
  localStorage.setItem(cacheKey, JSON.stringify(result));
  return result;
}

export default function VotePage() {
  const t = useTranslations('vote');
  const [uid, setUid] = useState<string | null>(null);
  const [districts, setDistricts] = useState<Record<string, District>>({});
  const [aqiMap, setAqiMap] = useState<Record<string, DistrictAQI>>({});
  const [aqiLoading, setAqiLoading] = useState(true);
  const [votedDistrict, setVotedDistrict] = useState<string | null>(null);
  const [votingLoading, setVotingLoading] = useState<string | null>(null);
  const [highlightedDistrict, setHighlightedDistrict] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ votedDistrict: string | null } | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUid(u.uid);
        const userUnsub = onSnapshot(doc(db, 'users', u.uid), (snap) => {
          if (snap.exists()) {
            const data = snap.data() as { votedDistrict: string | null };
            setVotedDistrict(data.votedDistrict);
            setUserProfile(data);
          }
        }, () => {});
        return userUnsub;
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const unsub = onSnapshot(collection(db, 'districts'), (snap) => {
      const data: Record<string, District> = {};
      snap.docs.forEach((d) => { data[d.id] = { id: d.id, ...d.data() } as District; });
      // Always merge lat/lng from local coords — Firestore docs don't store coordinates
      Object.entries(DISTRICT_COORDS).forEach(([id, coords]) => {
        if (data[id]) {
          data[id].lat = coords.lat;
          data[id].lng = coords.lng;
          data[id].nameKk = data[id].nameKk || coords.nameKk;
        } else {
          data[id] = { id, name: coords.name, nameKk: coords.nameKk, votes: 0, lat: coords.lat, lng: coords.lng };
        }
      });
      setDistricts(data);
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    const entries = Object.entries(DISTRICT_COORDS);
    Promise.all(
      entries.map(async ([id, { lat, lng }]) => {
        try {
          const aqi = await fetchDistrictAQI(id, lat, lng);
          return [id, aqi] as [string, DistrictAQI];
        } catch {
          return [id, { aqi: 3, pm2_5: 0, label: 'Moderate', color: '#f59e0b' }] as [string, DistrictAQI];
        }
      })
    ).then((results) => {
      setAqiMap(Object.fromEntries(results));
      setAqiLoading(false);
    });
  }, []);

  async function handleVote(districtId: string) {
    if (!uid || votedDistrict || votingLoading) return;
    setVotingLoading(districtId);
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'districts', districtId), { votes: increment(1) }, { merge: true });
      batch.set(doc(db, 'users', uid), { votedDistrict: districtId }, { merge: true });
      await batch.commit();
      setVotedDistrict(districtId);
    } catch {
      // ignore
    } finally {
      setVotingLoading(null);
    }
  }

  const sortedDistricts = Object.values(districts).sort((a, b) => b.votes - a.votes);
  const totalVotes = sortedDistricts.reduce((s, d) => s + d.votes, 0);
  const highestAQI = Object.entries(aqiMap).sort((a, b) => b[1].aqi - a[1].aqi)[0]?.[0];

  const chartData = sortedDistricts.map((d) => ({
    name: d.name,
    id: d.id,
    votes: d.votes,
  }));

  return (
    <div className="min-h-screen bg-[#0a0f1e] pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-[#f0f4ff] mb-4">{t('title')}</h1>
          <p className="text-[#8892a4] text-lg max-w-2xl">{t('subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Districts */}
          <div className="space-y-3">
            {sortedDistricts.map((district, i) => {
              const aqi = aqiMap[district.id];
              const pct = totalVotes > 0 ? (district.votes / totalVotes) * 100 : 0;
              const isVoted = votedDistrict === district.id;
              const isHighestAQI = district.id === highestAQI;
              const isHighlighted = highlightedDistrict === district.id;

              return (
                <motion.div
                  key={district.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setHighlightedDistrict(district.id)}
                  className={`rounded-2xl border p-5 cursor-pointer transition-all ${
                    isHighlighted
                      ? 'border-[#00d4aa]/40 bg-[#00d4aa]/5'
                      : isVoted
                      ? 'border-[#00d4aa]/30 bg-[#00d4aa]/[0.03]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-bold text-[#f0f4ff] flex items-center gap-2">
                          {district.name}
                          {isHighestAQI && !aqiLoading && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 font-bold">
                              {t('mostNeeded')}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#4a5568]">{district.nameKk}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {aqiLoading ? (
                        <div className="w-16 h-6 rounded-full bg-white/[0.06] animate-pulse" />
                      ) : aqi ? (
                        <div
                          className="px-3 py-1 rounded-full text-xs font-bold border"
                          style={{ color: aqi.color, borderColor: `${aqi.color}40`, backgroundColor: `${aqi.color}15` }}
                        >
                          {aqi.label}
                        </div>
                      ) : null}

                      {uid && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVote(district.id); }}
                          disabled={!!votedDistrict || !!votingLoading}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            isVoted
                              ? 'bg-[#00d4aa] text-[#0a0f1e] cursor-default'
                              : votedDistrict
                              ? 'bg-white/[0.03] border border-white/[0.06] text-[#4a5568] cursor-not-allowed'
                              : 'bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-[#00d4aa] hover:bg-[#00d4aa]/20'
                          }`}
                        >
                          {votingLoading === district.id
                            ? '...'
                            : isVoted
                            ? t('votedButton')
                            : t('voteButton')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <motion.div
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full bg-[#00d4aa]"
                      />
                    </div>
                    <span className="text-xs text-[#8892a4] tabular-nums w-16 text-right">
                      {district.votes} votes
                    </span>
                  </div>
                </motion.div>
              );
            })}

            {!uid && (
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
                <p className="text-[#8892a4] text-sm mb-4">Sign in to vote for the next tower location</p>
                <a href="/login" className="inline-block px-6 py-2.5 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-colors text-sm">
                  Sign In to Vote →
                </a>
              </div>
            )}
          </div>

          {/* Right column: Map + Chart */}
          <div className="space-y-6">
            <Map
              districts={sortedDistricts}
              aqiMap={aqiMap}
              highlightedDistrict={highlightedDistrict}
              onMarkerClick={setHighlightedDistrict}
            />

            {/* Results Chart */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6">
              <h3 className="font-bold text-[#f0f4ff] mb-4">{t('results')}</h3>
              <div className="text-xs text-[#4a5568] mb-4">{t('totalVotes')}: {totalVotes}</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                  <XAxis type="number" tick={{ fill: '#4a5568', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#8892a4', fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f1629', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, color: '#f0f4ff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  />
                  <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.id}
                        fill={entry.id === highlightedDistrict ? '#00d4aa' : entry.id === votedDistrict ? '#00b894' : 'rgba(0,212,170,0.3)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
