'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface AlertDoc {
  message: string;
  active: boolean;
}

export default function PollutionAlertBanner() {
  const [alert, setAlert] = useState<AlertDoc | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) return;

    const unsub = onSnapshot(
      doc(db, 'globalStats', 'pollutionAlert'),
      (snap) => {
        if (snap.exists()) {
          setAlert(snap.data() as AlertDoc);
        }
      },
      () => {
        // Silently ignore permission errors
      }
    );
    return () => unsub();
  }, []);

  const show = alert?.active && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-amber-500/90 backdrop-blur-sm border-b border-amber-400/50 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-amber-950 text-sm font-medium">
                <AlertTriangle size={16} className="shrink-0" />
                <span>{alert?.message}</span>
              </div>
              <button
                onClick={() => setDismissed(true)}
                className="text-amber-950/70 hover:text-amber-950 transition-colors shrink-0"
                aria-label="Dismiss alert"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
