import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence  } from 'framer-motion';
import { Link } from 'wouter';
import { X, Zap, ArrowRight , ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { safeSetItem } from '@/lib/storage';

const BANNER_KEY = 'isc_banner_dismissed_v2';

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  useEffect(() => {
    if (!localStorage.getItem(BANNER_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    safeSetItem(BANNER_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
          style={{ background: 'linear-gradient(90deg, #082C6B 0%, #0B3D91 40%, #1a5276 70%, #082C6B 100%)' }}
        >
          <div className="container mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
            {/* Left badge + message */}
            <div className="flex items-center gap-3 min-w-0">
              <span className="flex items-center gap-1.5 bg-[#C9A84C] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shrink-0 shadow-lg">
                <Zap className="w-3 h-3" />
                {ar ? 'مباشر الآن' : 'Live Now'}
              </span>

              {/* Scrolling marquee on mobile, static on desktop */}
              <div className="overflow-hidden">
                <motion.p
                  className="text-white text-sm font-medium whitespace-nowrap"
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  {ar ? 'برج التحكم الذكي من آي سبلاي تشين متاح الآن — ' : "I Supply Chain's AI Control Tower is live —"}
                  <span className="text-[#C9A84C] font-bold">{ar ? ' إحاطة تنفيذية خلال دقائق — باقات تبدأ من 250 ريال شهرياً.' : ' executive briefing in minutes — plans from SAR 250 / mo.'}</span>
                </motion.p>
              </div>
            </div>

            {/* CTA + dismiss */}
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/command-center" onClick={dismiss}>
                <motion.span
                  whileHover={{ scale: 1.04 }}
                  className="hidden sm:flex items-center gap-1.5 bg-[#C9A84C] hover:bg-[#b8973e] text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow"
                >
                  {ar ? 'ابدأ الآن' : 'Get Started'} {ar ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                </motion.span>
              </Link>
              <button
                onClick={dismiss}
                className="text-white/60 hover:text-white transition-colors p-1 rounded"
                aria-label={ar ? 'إغلاق' : 'Dismiss'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
