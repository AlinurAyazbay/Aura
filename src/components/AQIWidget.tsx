'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

interface AQIResult {
  aqi: number;
  pm2_5: number;
  label: string;
  color: string;
  fetchedAt: number;
}

const AQI_CONFIG: Record<number, { label: string; color: string }> = {
  1: { label: 'good', color: '#00d4aa' },
  2: { label: 'fair', color: '#84cc16' },
  3: { label: 'moderate', color: '#f59e0b' },
  4: { label: 'poor', color: '#f97316' },
  5: { label: 'hazardous', color: '#ef4444' },
};

const CACHE_KEY = 'aura_aqi_almaty';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export default function AQIWidget({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('aqi');
  const [data, setData] = useState<AQIResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAQI() {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as AQIResult;
          if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) {
            setData(parsed);
            setLoading(false);
            return;
          }
        }
      } catch {
        // ignore parse errors
      }

      try {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/air_pollution?lat=43.2220&lon=76.8512&appid=${apiKey}`
        );
        if (!res.ok) throw new Error('Failed to fetch AQI');

        const json = (await res.json()) as {
          list: Array<{ main: { aqi: number }; components: { pm2_5: number } }>;
        };
        const item = json.list[0];
        const aqiIndex = item.main.aqi as 1 | 2 | 3 | 4 | 5;
        const config = AQI_CONFIG[aqiIndex] ?? AQI_CONFIG[3];
        const result: AQIResult = {
          aqi: aqiIndex,
          pm2_5: Math.round(item.components.pm2_5 * 10) / 10,
          label: config.label,
          color: config.color,
          fetchedAt: Date.now(),
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        setData(result);
      } catch {
        // Show fallback on error
        setData({ aqi: 3, pm2_5: 0, label: 'moderate', color: '#f59e0b', fetchedAt: 0 });
      } finally {
        setLoading(false);
      }
    }
    fetchAQI();
  }, []);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-2xl bg-white/5 border border-white/10 ${compact ? 'p-3 w-28' : 'p-4 w-36'}`}>
        <div className="h-4 bg-white/10 rounded mb-2" />
        <div className="h-6 bg-white/10 rounded" />
      </div>
    );
  }

  if (!data) return null;

  const labelText = t(data.label as 'good' | 'fair' | 'moderate' | 'poor' | 'hazardous');

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 border backdrop-blur-sm"
        style={{ borderColor: `${data.color}40`, backgroundColor: `${data.color}15` }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: data.color }}
        />
        <span className="text-xs font-bold" style={{ color: data.color }}>
          {labelText}
        </span>
        {data.pm2_5 > 0 && (
          <span className="text-xs text-[#8892a4]">PM2.5: {data.pm2_5}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-4 border backdrop-blur-sm text-center min-w-[130px]"
      style={{ borderColor: `${data.color}40`, backgroundColor: `${data.color}10` }}
    >
      <div className="text-[10px] text-[#8892a4] mb-1 uppercase tracking-widest">
        {t('almaty')}
      </div>
      <div
        className="text-xl font-black tracking-tight mb-1"
        style={{ color: data.color }}
      >
        {labelText}
      </div>
      {data.pm2_5 > 0 && (
        <div className="text-xs text-[#8892a4]">
          {t('pm25')}: <span className="font-bold text-[#f0f4ff]">{data.pm2_5}</span> μg/m³
        </div>
      )}
      <div
        className="mt-2 h-1 rounded-full"
        style={{ backgroundColor: `${data.color}30` }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${(data.aqi / 5) * 100}%`, backgroundColor: data.color }}
        />
      </div>
    </div>
  );
}
