import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence  } from 'framer-motion';
import { Link, useLocation } from 'wouter';
import { X, Brain, Zap, ArrowRight, Clock , ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

const SESSION_KEY = 'isc_float_dismissed';

export function CommandCentreFloat() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const { lang } = useLanguage();
  const ar = lang === 'ar';

  useEffect(() => {
    // Don't show on the command centre itself, or if already dismissed this session
    if (location === '/command-center') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(timer);
  }, [location]);

  // Hide if user navigates to command centre
  useEffect(() => {
    if (location === '/command-center') setVisible(false);
  }, [location]);

  const dismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-24 right-5 z-50 w-72 shadow-2xl rounded-2xl overflow-hidden"
          style={{ filter: 'drop-shadow(0 20px 40px rgba(8,44,107,0.35))' }}
        >
          {/* Gold top accent bar */}
          <div className="h-1 bg-gradient-to-r from-[#C9A84C] via-[#e8c96d] to-[#C9A84C]" />

          <div className="bg-[#082C6B] p-4">
            {/* Header row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/20 flex items-center justify-center">
                  <Brain className="w-4.5 h-4.5 text-[#C9A84C]" style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#C9A84C]">
                    <Zap className="w-3 h-3" /> {ar ? 'الأول خليجياً' : 'GCC First'}
                  </span>
                  <p className="text-white font-bold text-sm leading-tight">{ar ? 'مركز القيادة الذكي' : 'AI Command Centre'}</p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-white/40 hover:text-white/80 transition-colors p-0.5 rounded mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <p className="text-white/80 text-xs leading-relaxed mb-3">
              {ar ? 'احصل على تقرير تنفيذي مخصص لسلسلة الإمداد في الخليج — ' : 'Get a personalised GCC supply chain executive briefing —'}
              <span className="text-[#C9A84C] font-bold">{ar ? ' معايير مقارنة، نموذج توفير، مؤشر مخاطر وخطة 90 يوماً.' : ' benchmarks, savings model, risk score & 90-day plan.'}</span>
            </p>

            {/* Pricing + speed badge */}
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#C9A84C]" />
              <span className="text-white/60 text-xs">{ar ? <>جاهز خلال <span className="text-white font-bold">60 ثانية</span></> : <>Ready in <span className="text-white font-bold">60 seconds</span></>}</span>
            </div>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="text-[#C9A84C] text-xs">💰</span>
              <span className="text-white/60 text-xs">{ar ? <>تبدأ من <span className="text-white font-bold">250 ريال / شهرياً</span> · حسب حجم منشأتك</> : <>From <span className="text-white font-bold">SAR 250 / mo</span> · sized to your organisation</>}</span>
            </div>

            {/* CTA */}
            <Link href="/command-center">
              <motion.span
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { sessionStorage.setItem(SESSION_KEY, '1'); setVisible(false); }}
                className="flex items-center justify-center gap-2 w-full bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold text-sm py-2.5 rounded-xl transition-colors cursor-pointer shadow-lg"
              >
                {ar ? 'استكشف مركز القيادة' : 'Explore Command Centre'} {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </motion.span>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
