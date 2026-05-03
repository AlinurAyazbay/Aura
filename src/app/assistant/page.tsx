'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Wind } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { ChatMessage, GlobalStats } from '@/types';

const GUEST_LIMIT = 3;
const SESSION_KEY = 'aura_chat_count';

export default function AssistantPage() {
  const t = useTranslations('assistant');
  const [isAuth, setIsAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Salem! I'm Aura-ly 🌱 How can I help you breathe easier today? Ask me anything about Almaty's air quality, our investment platform, or clean air science.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [stats, setStats] = useState<Partial<GlobalStats>>({});
  const [aqiLevel, setAqiLevel] = useState<number>(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setIsAuth(!!u);
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
    // Load guest message count from sessionStorage
    const count = parseInt(sessionStorage.getItem(SESSION_KEY) ?? '0', 10);
    setGuestCount(count);
  }, []);

  useEffect(() => {
    // Fetch AQI for context
    const cached = localStorage.getItem('aura_aqi_almaty');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setAqiLevel(parsed.aqi ?? 0);
      } catch {}
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const guestLimitReached = !isAuth && guestCount >= GUEST_LIMIT;

  async function sendMessage() {
    if (!input.trim() || loading || guestLimitReached) return;

    const userMsg: ChatMessage = { role: 'user', content: input.trim(), timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    if (!isAuth) {
      const newCount = guestCount + 1;
      setGuestCount(newCount);
      sessionStorage.setItem(SESSION_KEY, String(newCount));
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
          context: { totalRaised: stats.totalRaised, backerCount: stats.backerCount, aqi: aqiLevel },
        }),
      });

      const data = (await res.json()) as { reply?: string; error?: string };
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply ?? data.error ?? 'Sorry, something went wrong.',
          timestamp: Date.now(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.', timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#0a0f1e] min-h-screen pt-16 flex flex-col">
      <div className="max-w-3xl mx-auto w-full flex flex-col flex-1 px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-12 h-12 rounded-full bg-[#00d4aa]/20 border border-[#00d4aa]/30 flex items-center justify-center">
            <Wind size={20} className="text-[#00d4aa]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#f0f4ff]">{t('title')}</h1>
            <p className="text-sm text-[#8892a4]">{t('subtitle')}</p>
          </div>
          {!isAuth && !authLoading && (
            <div className="ml-auto text-xs text-[#4a5568]">
              {Math.max(0, GUEST_LIMIT - guestCount)} messages left
            </div>
          )}
        </motion.div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[400px]">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#00d4aa]/20 border border-[#00d4aa]/30 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-black text-[#00d4aa]">A</span>
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-[#00d4aa] text-[#0a0f1e] font-medium rounded-tr-sm'
                    : 'bg-white/[0.04] border border-white/[0.06] text-[#f0f4ff] rounded-tl-sm'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-[#00d4aa]/20 border border-[#00d4aa]/30 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-[#00d4aa]">A</span>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#00d4aa]"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Guest limit banner */}
        <AnimatePresence>
          {guestLimitReached && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-[#00d4aa]/10 border border-[#00d4aa]/20 p-5 mb-4 text-center"
            >
              <p className="text-[#f0f4ff] font-medium mb-3">{t('guestLimitMsg')}</p>
              <Link
                href="/register"
                className="inline-block px-6 py-2.5 bg-[#00d4aa] text-[#0a0f1e] font-bold rounded-xl hover:bg-[#00b894] transition-colors"
              >
                {t('signInCta')} →
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={t('placeholder')}
            disabled={guestLimitReached || loading}
            className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl text-[#f0f4ff] placeholder-[#4a5568] focus:border-[#00d4aa]/50 focus:outline-none px-4 py-3 text-sm disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || guestLimitReached}
            className="w-12 h-12 rounded-xl bg-[#00d4aa] text-[#0a0f1e] flex items-center justify-center hover:bg-[#00b894] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
