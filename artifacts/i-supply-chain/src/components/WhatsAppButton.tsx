import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

export function WhatsAppButton() {
  const { lang } = useLanguage();
  const ar = lang === 'ar';
  const [hovered, setHovered] = useState(false);
  const phone = '966549479722';
  const message = encodeURIComponent(ar ? 'مرحباً، أودّ مناقشة تحدٍّ في سلسلة الإمداد مع I Supply Chain.' : 'Hello, I would like to discuss a supply chain challenge with I Supply Chain.');
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <div className="fixed bottom-24 left-5 z-40 flex items-center gap-3">
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, x: -10, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white text-foreground text-sm font-semibold px-4 py-2 rounded-xl shadow-lg border border-border whitespace-nowrap pointer-events-none"
          >
            {ar ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ar ? 'تواصل معنا عبر واتساب' : 'Chat with us on WhatsApp'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-xl"
        style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)' }}
      >
        {/* WhatsApp SVG icon */}
        <svg viewBox="0 0 32 32" width="28" height="28" fill="white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.004 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.347.613 4.547 1.68 6.467L2.667 29.333l7.12-1.653A13.267 13.267 0 0 0 16.004 29.333C23.36 29.333 29.333 23.36 29.333 16S23.36 2.667 16.004 2.667zm0 24.266a11.04 11.04 0 0 1-5.627-1.546l-.4-.24-4.227.987.987-4.12-.267-.413A11.04 11.04 0 0 1 4.933 16c0-6.107 4.96-11.067 11.067-11.067 6.106 0 11.066 4.96 11.066 11.067 0 6.106-4.96 11.066-11.066 11.066zm6.08-8.266c-.334-.174-1.96-.974-2.267-1.08-.306-.107-.52-.16-.747.16-.226.32-.88 1.08-1.08 1.307-.2.226-.4.24-.733.08-.334-.16-1.4-.52-2.667-1.654-.987-.88-1.653-1.96-1.853-2.293-.2-.334-.014-.52.147-.68.147-.147.334-.373.493-.547.16-.173.214-.293.32-.507.107-.213.054-.4-.027-.546-.08-.147-.746-1.8-1.027-2.454-.266-.64-.546-.546-.746-.56-.2-.013-.427-.013-.654-.013-.226 0-.6.08-.907.4-.307.32-1.173 1.147-1.173 2.8 0 1.653 1.2 3.253 1.36 3.466.16.214 2.36 3.6 5.72 5.054.8.347 1.427.547 1.907.707.8.253 1.534.213 2.107.133.64-.094 1.96-.8 2.24-1.573.28-.774.28-1.44.2-1.574-.08-.133-.294-.213-.627-.386z" />
        </svg>

        {/* Pulse ring */}
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-green-400 opacity-0"
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.a>
    </div>
  );
}
