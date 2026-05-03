'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronDown, Wind } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/types';

export default function Header() {
  const t = useTranslations('nav');
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentLocale, setCurrentLocale] = useState('en');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const localeCookie = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('locale='));
    setCurrentLocale(localeCookie ? localeCookie.split('=')[1] : 'en');
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) setProfile(snap.data() as UserProfile);
        } catch {
          // ignore
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLocaleToggle() {
    const next = currentLocale === 'en' ? 'kk' : 'en';
    await fetch('/api/locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: next }),
    });
    setCurrentLocale(next);
    router.refresh();
  }

  async function handleLogout() {
    await signOut(auth);
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  }

  const initials =
    profile
      ? `${profile.firstName[0] ?? ''}${profile.lastName[0] ?? ''}`.toUpperCase()
      : user?.displayName
        ? user.displayName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '?';

  const headerClass = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    scrolled || mobileOpen
      ? 'bg-[#0a0f1e]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-lg'
      : 'bg-transparent'
  }`;

  return (
    <header className={headerClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-[#00d4aa]/20 border border-[#00d4aa]/30 flex items-center justify-center group-hover:bg-[#00d4aa]/30 transition-colors">
              <Wind size={16} className="text-[#00d4aa]" />
            </div>
            <span className="font-black text-[#f0f4ff] text-lg tracking-tight">
              Aura <span className="text-[#00d4aa]">Optima</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {!loading && user ? (
              <>
                <NavLink href="/">{t('dashboard')}</NavLink>
                <NavLink href="/invest">{t('invest')}</NavLink>
                <NavLink href="/assistant">{t('assistant')}</NavLink>
                <NavLink href="/vote">{t('vote')}</NavLink>
                <NavLink href="/dream-almaty">{t('dreamAlmaty')}</NavLink>
              </>
            ) : (
              <>
                <NavLink href="/about">{t('about')}</NavLink>
                <NavLink href="/dream-almaty">{t('dreamAlmaty')}</NavLink>
                <NavLink href="/#how-it-works">{t('howItWorks')}</NavLink>
                <NavLink href="/assistant">{t('assistant')}</NavLink>
              </>
            )}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={handleLocaleToggle}
              className="text-xs font-bold text-[#8892a4] hover:text-[#f0f4ff] transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
            >
              {currentLocale === 'en' ? 'KK' : 'EN'}
            </button>

            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-white/5 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4aa] to-[#0f1629] flex items-center justify-center text-xs font-black text-[#0a0f1e]">
                        {initials}
                      </div>
                      <span className="text-sm text-[#f0f4ff] font-medium">
                        {profile?.firstName ?? user.displayName?.split(' ')[0] ?? 'User'}
                      </span>
                      <ChevronDown size={14} className={`text-[#8892a4] transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {dropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[#0f1629]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl overflow-hidden"
                        >
                          <Link
                            href="/profile"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#f0f4ff] hover:bg-white/5 transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            {t('profile')}
                          </Link>
                          <Link
                            href="/profile#impact"
                            className="flex items-center gap-3 px-4 py-3 text-sm text-[#f0f4ff] hover:bg-white/5 transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            {t('myImpact')}
                          </Link>
                          <div className="border-t border-white/[0.06]" />
                          <button
                            onClick={() => { setDropdownOpen(false); handleLogout(); }}
                            className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            {t('logout')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-sm font-medium text-[#8892a4] hover:text-[#f0f4ff] transition-colors px-3 py-2"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      className="text-sm font-bold bg-[#00d4aa] text-[#0a0f1e] px-4 py-2 rounded-xl hover:bg-[#00b894] hover:scale-[1.02] transition-all"
                    >
                      {t('register')} →
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-[#f0f4ff] p-2 rounded-xl hover:bg-white/5 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-white/[0.06] bg-[#0a0f1e]/98 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              {user ? (
                <>
                  <MobileNavLink href="/" onClick={() => setMobileOpen(false)}>{t('dashboard')}</MobileNavLink>
                  <MobileNavLink href="/invest" onClick={() => setMobileOpen(false)}>{t('invest')}</MobileNavLink>
                  <MobileNavLink href="/assistant" onClick={() => setMobileOpen(false)}>{t('assistant')}</MobileNavLink>
                  <MobileNavLink href="/vote" onClick={() => setMobileOpen(false)}>{t('vote')}</MobileNavLink>
                  <MobileNavLink href="/dream-almaty" onClick={() => setMobileOpen(false)}>{t('dreamAlmaty')}</MobileNavLink>
                  <MobileNavLink href="/profile" onClick={() => setMobileOpen(false)}>{t('profile')}</MobileNavLink>
                  <div className="pt-2 border-t border-white/[0.06]">
                    <button
                      onClick={() => { setMobileOpen(false); handleLogout(); }}
                      className="w-full text-left px-4 py-3 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/10 transition-colors"
                    >
                      {t('logout')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <MobileNavLink href="/about" onClick={() => setMobileOpen(false)}>{t('about')}</MobileNavLink>
                  <MobileNavLink href="/dream-almaty" onClick={() => setMobileOpen(false)}>{t('dreamAlmaty')}</MobileNavLink>
                  <MobileNavLink href="/#how-it-works" onClick={() => setMobileOpen(false)}>{t('howItWorks')}</MobileNavLink>
                  <MobileNavLink href="/assistant" onClick={() => setMobileOpen(false)}>{t('assistant')}</MobileNavLink>
                  <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-medium text-[#8892a4] hover:text-[#f0f4ff] rounded-xl hover:bg-white/5 transition-colors"
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-3 text-sm font-bold bg-[#00d4aa] text-[#0a0f1e] rounded-xl text-center"
                    >
                      {t('register')} →
                    </Link>
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-white/[0.06]">
                <button
                  onClick={handleLocaleToggle}
                  className="px-4 py-2 text-xs font-bold text-[#8892a4] hover:text-[#f0f4ff] transition-colors"
                >
                  Switch to {currentLocale === 'en' ? 'Қазақша (KK)' : 'English (EN)'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 text-sm font-medium text-[#8892a4] hover:text-[#f0f4ff] rounded-lg hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 text-sm font-medium text-[#f0f4ff] rounded-xl hover:bg-white/5 transition-colors"
    >
      {children}
    </Link>
  );
}
