'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const STAGGER = {
  container: { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } },
  item: { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } },
};

export default function AboutClient() {
  const t = useTranslations('about');

  return (
    <div className="bg-[#0a0f1e] min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#00d4aa]/[0.04] blur-[100px] rounded-full" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl sm:text-6xl font-black text-[#f0f4ff] mb-6 tracking-tight">
              {t('title')}
            </h1>
            <p className="text-xl text-[#8892a4] max-w-2xl mx-auto">
              Almaty&apos;s air quality crisis is not a future problem — it&apos;s today&apos;s emergency. We built Aura Optima to fund the solution.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-4 bg-[#0f1629]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-[#f0f4ff] mb-12"
          >
            {t('problemTitle')}
          </motion.h2>

          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { stat: t('stat1'), icon: '🏙️' },
              { stat: t('stat2'), icon: '😷' },
              { stat: t('stat3'), icon: '💔' },
            ].map(({ stat, icon }) => (
              <motion.div
                key={stat}
                variants={STAGGER.item}
                className="rounded-2xl bg-white/[0.03] border border-red-500/20 p-8"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <p className="text-[#f0f4ff] font-medium leading-relaxed border-l-4 border-red-500/60 pl-4">
                  {stat}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 rounded-2xl bg-red-500/5 border border-red-500/20 p-8"
          >
            <p className="text-[#8892a4] leading-relaxed text-lg">
              Almaty sits in a mountain valley that traps air pollution, especially in winter when temperature inversions prevent vertical mixing.
              Coal-fired heating, heavy vehicle traffic, and industrial emissions combine to create some of the worst air quality episodes in Central Asia.
              The WHO recommends PM2.5 annual exposure no greater than 5 μg/m³ — Almaty regularly exceeds 25 μg/m³ in winter months.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-[#f0f4ff] mb-12"
          >
            {t('solutionTitle')}
          </motion.h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-[#8892a4] text-lg leading-relaxed mb-6">
                Each Aura Optima tower is a purpose-built outdoor air purification unit, designed for Almaty&apos;s specific pollution profile.
                Towers are placed at high-traffic, high-pollution nodes across the city&apos;s districts.
              </p>
              <div className="space-y-4">
                {[
                  { label: 'Processing Capacity', value: '30,000 m³/hour' },
                  { label: 'Daily Air Cleaned', value: '720,000 m³/day' },
                  { label: 'Pollutants Captured', value: 'PM2.5, PM10, CO, NO₂' },
                  { label: 'Tower Lifespan', value: '15+ years' },
                  { label: 'Cost Per Tower', value: '$54,000 (community funded)' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-white/[0.06]">
                    <span className="text-[#8892a4]">{label}</span>
                    <span className="font-bold text-[#f0f4ff]">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl bg-gradient-to-br from-[#00d4aa]/10 to-transparent border border-[#00d4aa]/20 p-10 text-center"
            >
              <div className="text-7xl mb-6">🌬️</div>
              <div className="text-4xl font-black text-[#00d4aa] mb-2">$54,000</div>
              <div className="text-[#8892a4] mb-6">funds one complete tower</div>
              <div className="text-2xl font-black text-[#f0f4ff] mb-2">5,000+</div>
              <div className="text-[#8892a4]">residents benefit per tower</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Technology */}
      <section className="py-20 px-4 bg-[#0f1629]">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-[#f0f4ff] mb-12"
          >
            {t('techTitle')}
          </motion.h2>

          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              { icon: '🔬', title: 'HEPA H14 Filtration', desc: 'Captures 99.995% of particles ≥0.3μm, including PM2.5 and PM10 particulates that cause respiratory damage.' },
              { icon: '⚫', title: 'Activated Carbon Layer', desc: 'Adsorbs volatile organic compounds (VOCs), CO, NO₂, and odorous gases through molecular bonding.' },
              { icon: '⚡', title: 'Electrostatic Pre-filter', desc: 'Pre-charges incoming air particles for more efficient main filter capture, extending HEPA filter life.' },
              { icon: '📡', title: 'IoT Monitoring', desc: 'Real-time AQI sensors feed data to our platform. Every tower has a live dashboard showing current performance.' },
              { icon: '🌞', title: 'Solar-Assisted Power', desc: 'Partial solar integration reduces grid dependency and operating costs, lowering long-term tower cost.' },
              { icon: '🌀', title: 'Directional Intake', desc: "Adjustable intake angles optimized for Almaty's prevailing wind patterns to maximize throughput." },
            ].map(({ icon, title, desc }) => (
              <motion.div
                key={title}
                variants={STAGGER.item}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:border-[#00d4aa]/20 transition-colors"
              >
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-[#f0f4ff] mb-2">{title}</h3>
                <p className="text-sm text-[#8892a4] leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-black text-[#f0f4ff] mb-12"
          >
            {t('teamTitle')}
          </motion.h2>

          <motion.div
            variants={STAGGER.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              { initials: 'AA', name: 'Alinur Ayazbay', role: 'Founder & CEO', desc: 'Environmental engineer and civic tech advocate based in Almaty.' },
              { initials: 'ZK', name: 'Zara Kasymova', role: 'Head of Engineering', desc: 'Air filtration systems specialist with 8 years in industrial HVAC.' },
              { initials: 'BS', name: 'Baurzhan Seitov', role: 'Head of Community', desc: 'Community organizer building partnerships with Almaty akimats.' },
            ].map(({ initials, name, role, desc }) => (
              <motion.div
                key={name}
                variants={STAGGER.item}
                className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-8 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0f1629] flex items-center justify-center text-2xl font-black text-[#0a0f1e] mx-auto mb-4">
                  {initials}
                </div>
                <h3 className="font-bold text-[#f0f4ff] mb-1">{name}</h3>
                <div className="text-sm text-[#00d4aa] mb-3">{role}</div>
                <p className="text-sm text-[#8892a4]">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[#0f1629]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-black text-[#f0f4ff] mb-4">
              Ready to be part of the solution?
            </h2>
            <p className="text-[#8892a4] mb-8 text-lg">
              Every investment, no matter the size, moves us closer to clean air for all Almaty residents.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="px-8 py-4 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-all hover:scale-[1.02] text-lg"
              >
                Register →
              </Link>
              <Link
                href="/invest"
                className="px-8 py-4 bg-white/[0.05] border border-white/[0.1] text-white font-medium rounded-xl hover:bg-white/[0.08] transition-all text-lg"
              >
                Invest Now
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
