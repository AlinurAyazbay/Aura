'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

const SLIDES = [
  { year: '2026', emoji: '🏗️', key: 'milestone2026' },
  { year: '2027', emoji: '🌿', key: 'milestone2027' },
  { year: '2028', emoji: '💰', key: 'milestone2028' },
  { year: '2029', emoji: '🏆', key: 'milestone2029' },
  { year: '2030', emoji: '🌟', key: 'milestone2030' },
];

const DISTRICTS = [
  { name: 'Turksib', status: 'Active', year: '2026', aqi: 'Poor' },
  { name: 'Almaly', status: 'Voting', year: '2027', aqi: 'Moderate' },
  { name: 'Zhetysu', status: 'Planned', year: '2027', aqi: 'Moderate' },
  { name: 'Bostandyk', status: 'Planned', year: '2028', aqi: 'Fair' },
  { name: 'Medeu', status: 'Planned', year: '2028', aqi: 'Fair' },
  { name: 'Alatau', status: 'Planned', year: '2029', aqi: 'Moderate' },
  { name: 'Nauryzbai', status: 'Planned', year: '2029', aqi: 'Poor' },
  { name: 'Narikbai', status: 'Planned', year: '2030', aqi: 'Poor' },
];

const STATUS_COLORS: Record<string, string> = {
  Active: '#00d4aa',
  Voting: '#f59e0b',
  Planned: '#4a5568',
};

export default function DreamAlmatyPage() {
  const t = useTranslations('dreamAlmaty');
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  function goTo(idx: number) {
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }
  function prev() { if (current > 0) goTo(current - 1); }
  function next() { if (current < SLIDES.length - 1) goTo(current + 1); }

  const slide = SLIDES[current];

  return (
    <div className="bg-[#0a0f1e] min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-[#00d4aa]/[0.04] blur-[120px] rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl sm:text-7xl font-black text-[#f0f4ff] mb-4 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-2xl text-[#00d4aa] font-bold">{t('subtitle')}</p>
          </motion.div>
        </div>
      </section>

      {/* Vision Carousel */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-[#f0f4ff] text-center mb-12">The Road to 2030</h2>

          <div className="relative rounded-3xl bg-white/[0.03] border border-white/[0.08] p-8 sm:p-12 overflow-hidden min-h-[300px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                initial={{ x: direction * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -60, opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="text-center"
              >
                <div className="text-7xl mb-6">{slide.emoji}</div>
                <div className="text-6xl font-black text-[#00d4aa] mb-6">{slide.year}</div>
                <p className="text-xl text-[#f0f4ff] leading-relaxed max-w-2xl mx-auto">
                  {t(slide.key as 'milestone2026' | 'milestone2027' | 'milestone2028' | 'milestone2029' | 'milestone2030')}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Controls */}
            <div className="flex items-center justify-between mt-10">
              <button
                onClick={prev}
                disabled={current === 0}
                className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[#f0f4ff] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Dots */}
              <div className="flex gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? 'w-8 bg-[#00d4aa]' : 'w-2 bg-white/20'
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={current === SLIDES.length - 1}
                className="w-12 h-12 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-[#f0f4ff] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* District Roadmap */}
      <section className="py-20 px-4 bg-[#0f1629]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-[#f0f4ff] mb-12">District Roadmap</h2>

          <div className="space-y-4">
            {DISTRICTS.map(({ name, status, year, aqi }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.06] px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: STATUS_COLORS[status] }}
                  />
                  <div>
                    <div className="font-bold text-[#f0f4ff]">{name}</div>
                    <div className="text-xs text-[#4a5568]">AQI: {aqi}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span
                    className="px-3 py-1 rounded-full text-xs font-bold border"
                    style={{
                      color: STATUS_COLORS[status],
                      borderColor: `${STATUS_COLORS[status]}40`,
                      backgroundColor: `${STATUS_COLORS[status]}10`,
                    }}
                  >
                    {status}
                  </span>
                  <span className="text-[#8892a4] font-mono">{year}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The 2030 Vision */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="text-6xl mb-8">🏙️</div>
            <h2 className="text-4xl font-black text-[#f0f4ff] mb-6">The 2030 Vision</h2>
            <p className="text-lg text-[#8892a4] leading-relaxed mb-8 max-w-2xl mx-auto">
              By 2030, Aura Optima envisions 25 towers operational across all 8 Almaty districts —
              creating a city-wide clean air network that reduces PM2.5 exposure by 40% for 2 million residents.
              Almaty becomes Central Asia's first clean-air city, a model for the region.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
              {[
                { num: '25', label: 'Towers Operational' },
                { num: '2M', label: 'Residents Protected' },
                { num: '40%', label: 'PM2.5 Reduction' },
              ].map(({ num, label }) => (
                <div key={label} className="rounded-2xl bg-[#00d4aa]/5 border border-[#00d4aa]/20 p-6 text-center">
                  <div className="text-4xl font-black text-[#00d4aa] mb-1">{num}</div>
                  <div className="text-sm text-[#8892a4]">{label}</div>
                </div>
              ))}
            </div>
            <Link
              href="/invest"
              className="inline-block px-8 py-4 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-all hover:scale-[1.02] text-lg"
            >
              Be Part of the Dream →
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
