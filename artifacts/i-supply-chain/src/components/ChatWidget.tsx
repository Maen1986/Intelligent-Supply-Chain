import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const QUICK_SUGGESTIONS = [
  'What services do you offer?',
  'I need help with procurement',
  'Tell me about supply chain risks',
  'Start a free diagnostic',
];

const QUICK_SUGGESTIONS_AR = [
  'ما هي الخدمات التي تقدمونها؟',
  'أحتاج مساعدة في المشتريات',
  'أخبرني عن مخاطر سلسلة التوريد',
  'ابدأ تشخيصاً مجانياً',
];

export function ChatWidget() {
  const { lang } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Ref to the Chrome keep-alive interval (fixes the ~15s auto-pause bug)
  const ttsWatchdogRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (ttsWatchdogRef.current) {
      clearInterval(ttsWatchdogRef.current);
      ttsWatchdogRef.current = null;
    }
  }, []);

  // Load voices — returns a promise that resolves once voices are available
  const getVoices = useCallback((): Promise<SpeechSynthesisVoice[]> => {
    return new Promise(resolve => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) { resolve(voices); return; }
      const handler = () => { resolve(window.speechSynthesis.getVoices()); };
      window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true });
      // Fallback if event never fires (some browsers)
      setTimeout(() => resolve(window.speechSynthesis.getVoices()), 1000);
    });
  }, []);

  const pickVoice = useCallback((voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | null => {
    if (language === 'ar') {
      // Preferred Arabic voices in priority order
      const preferredAr = [
        'Google Arabic', 'Microsoft Naayf', 'Microsoft Hoda',
        'Majed', 'Tarik', 'Maged',
      ];
      for (const name of preferredAr) {
        const v = voices.find(v => v.name.includes(name));
        if (v) return v;
      }
      // Any Arabic locale voice
      const arVoice = voices.find(v => v.lang.startsWith('ar'));
      if (arVoice) return arVoice;
      // Last resort: fall through to English so speech still works
    }

    // English male voices in priority order
    const preferredEn = [
      'Google UK English Male', 'Microsoft David - English', 'Microsoft Mark - English',
      'Daniel', 'Alex', 'Fred', 'Ralph', 'Albert',
    ];
    for (const name of preferredEn) {
      const v = voices.find(v => v.name.includes(name));
      if (v) return v;
    }
    const male = voices.find(v =>
      v.lang.startsWith('en') && /male|david|mark|daniel|alex|fred|ralph/i.test(v.name)
    );
    return male ?? voices.find(v => v.lang.startsWith('en')) ?? voices[0] ?? null;
  }, []);

  // Strip markdown and special characters before TTS reads them
  const sanitizeForSpeech = useCallback((text: string): string => {
    return text
      .replace(/```[\s\S]*?```/g, '')          // code blocks
      .replace(/`[^`]*`/g, '')                  // inline code
      .replace(/#{1,6}\s+/g, '')                // headings
      .replace(/\*\*([^*]+)\*\*/g, '$1')        // bold
      .replace(/\*([^*]+)\*/g, '$1')            // italic
      .replace(/_{1,2}([^_]+)_{1,2}/g, '$1')   // underline/italic
      .replace(/~~([^~]+)~~/g, '$1')            // strikethrough
      .replace(/^\s*[-•*]\s+/gm, '')            // bullet points
      .replace(/^\s*\d+\.\s+/gm, '')            // numbered lists
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // markdown links → text only
      .replace(/[|#~^\\]/g, '')                 // stray special chars
      .replace(/&amp;/g, 'and')
      .replace(/&/g, 'and')
      .replace(/ {2,}/g, ' ')                   // collapse extra spaces
      .trim();
  }, []);

  const speakText = useCallback(async (text: string) => {
    const clean = sanitizeForSpeech(text);
    if (!clean.trim() || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    clearWatchdog();

    const voices = await getVoices();
    const voice = pickVoice(voices, lang);

    // Arabic uses ، ؟ as sentence separators; English uses . ! ?
    const splitPattern = lang === 'ar'
      ? /[^.!?،؟]+[.!?،؟]*/g
      : /[^.!?]+[.!?]*/g;
    const sentences = clean.match(splitPattern)?.filter(s => s.trim()) ?? [clean];

    let index = 0;
    setIsSpeaking(true);

    // Chrome watchdog: resumes auto-paused synthesis every 10s
    ttsWatchdogRef.current = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 10_000);

    const speakNext = () => {
      if (index >= sentences.length) {
        clearWatchdog();
        setIsSpeaking(false);
        return;
      }
      const utt = new SpeechSynthesisUtterance(sentences[index].trim());
      if (voice) utt.voice = voice;
      // Arabic reads better slightly slower; English at natural pace
      utt.rate  = lang === 'ar' ? 0.88 : 0.92;
      utt.pitch = lang === 'ar' ? 1.0  : 0.85;
      utt.volume = 1;
      utt.lang  = lang === 'ar' ? 'ar-SA' : 'en-GB';
      utt.onend = () => { index++; speakNext(); };
      utt.onerror = (e) => {
        if ((e as any).error !== 'interrupted') {
          clearWatchdog();
          setIsSpeaking(false);
        }
      };
      window.speechSynthesis.speak(utt);
    };

    speakNext();
  }, [getVoices, pickVoice, clearWatchdog, lang]);

  const stopSpeaking = useCallback(() => {
    clearWatchdog();
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, [clearWatchdog]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const createConversation = async (): Promise<number> => {
    const res = await fetch('/api/openai/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Supply Chain Chat' }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const conv = await res.json();
    setConversationId(conv.id);
    return conv.id;
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    // Cancel any previous in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setInput('');

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: trimmed }]);
    // Placeholder assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }]);
    setIsStreaming(true);

    try {
      let convId = conversationId;
      if (!convId) convId = await createConversation();

      const response = await fetch(`/api/openai/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error('Stream failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: data.error, streaming: false };
                return updated;
              });
            } else if (data.content) {
              assistantContent += data.content;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, streaming: true };
                return updated;
              });
            } else if (data.done) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: assistantContent, streaming: false };
                return updated;
              });
              if (voiceEnabled && assistantContent) {
                speakText(assistantContent);
              }
            }
          } catch {}
        }
      }
    } catch (err: any) {
      // Aborted by reset — stay silent, don't overwrite cleared messages
      if (err?.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: lang === 'ar'
            ? 'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.'
            : 'Sorry, something went wrong. Please try again.',
          streaming: false,
        };
        return updated;
      });
      setError('connection');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const resetChat = () => {
    // Kill any in-flight stream so its callbacks don't write back into the cleared messages
    abortRef.current?.abort();
    abortRef.current = null;
    // Stop voice
    stopSpeaking();
    // Clear all state
    setIsStreaming(false);
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const suggestions = lang === 'ar' ? QUICK_SUGGESTIONS_AR : QUICK_SUGGESTIONS;
  const isRtl = lang === 'ar';

  return (
    <>
      {/* Speaking avatar card — shown above trigger when speaking & chat is closed */}
      <AnimatePresence>
        {isSpeaking && !isOpen && (
          <motion.div
            key="speaking-card"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-28 right-4 z-50 flex flex-col items-center gap-2"
          >
            {/* Avatar with ripple rings */}
            <div className="relative flex items-center justify-center">
              {/* Ripple rings */}
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="absolute rounded-full border-2 border-[#0B3D91]/40"
                  style={{
                    width: `${80 + i * 22}px`,
                    height: `${80 + i * 22}px`,
                    animation: `ping 1.4s cubic-bezier(0,0,0.2,1) ${i * 0.3}s infinite`,
                    opacity: 0,
                  }}
                />
              ))}
              <img
                src="/brand/chat-avatar.png"
                alt="Maen speaking"
                className="w-20 h-20 rounded-full object-cover ring-4 ring-[#0B3D91] shadow-2xl relative z-10"
              />
            </div>
            {/* Name + sound bars */}
            <div className="bg-[#0B3D91] text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
              <span>Maen</span>
              {/* Animated sound bars */}
              <span className="flex items-end gap-0.5 h-3">
                {[0.6, 1, 0.7, 1, 0.5].map((h, i) => (
                  <span
                    key={i}
                    className="w-0.5 bg-white rounded-full"
                    style={{
                      height: `${h * 100}%`,
                      animation: `soundbar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                    }}
                  />
                ))}
              </span>
            </div>
            {/* Stop button */}
            <button
              onClick={stopSpeaking}
              className="text-[10px] text-white/80 bg-black/30 hover:bg-black/50 px-2 py-0.5 rounded-full transition-colors"
            >
              {isRtl ? 'إيقاف' : 'stop'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div key="trigger-wrap" className="fixed bottom-6 right-6 z-50">
            {/* Speaking rings on trigger */}
            {isSpeaking && (
              <>
                <span className="absolute inset-0 rounded-full border-2 border-[#0B3D91]/50 animate-ping" />
                <span className="absolute -inset-1 rounded-full border border-[#0B3D91]/30 animate-ping [animation-delay:0.4s]" />
              </>
            )}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full shadow-2xl overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 relative"
              aria-label={isRtl ? 'افتح المحادثة مع معن، المستشار الذكي' : 'Open chat with Maen, AI Consultant'}
            >
              <img
                src="/brand/chat-avatar.png"
                alt="Maen AI Consultant"
                className="w-full h-full object-cover bg-primary"
              />
              {/* Online / speaking indicator */}
              <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center">
                {isSpeaking ? (
                  <span className="w-3 h-3 bg-blue-400 rounded-full border-2 border-white animate-pulse" />
                ) : (
                  <>
                    <span className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75" />
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white relative z-10" />
                  </>
                )}
              </span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="fixed bottom-6 right-6 z-50 w-[390px] max-w-[calc(100vw-24px)] flex flex-col bg-white rounded-2xl shadow-2xl border border-border overflow-hidden"
            style={{ maxHeight: 'min(600px, calc(100dvh - 96px))' }}
          >
            {/* Header */}
            <div className={`bg-gradient-to-r from-[#0B3D91] to-[#082C6B] px-4 flex items-center gap-3 shrink-0 transition-all duration-300 ${isSpeaking ? 'py-4' : 'py-3'}`}>
              <div className="relative shrink-0">
                {/* Ripple rings when speaking */}
                {isSpeaking && (
                  <>
                    <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping" />
                    <span className="absolute -inset-1.5 rounded-full border border-white/20 animate-ping [animation-delay:0.3s]" />
                  </>
                )}
                <img
                  src="/brand/chat-avatar.png"
                  alt="Maen"
                  className={`rounded-full ring-2 object-cover bg-white/10 transition-all duration-300 relative z-10 ${isSpeaking ? 'w-14 h-14 ring-white/60' : 'w-10 h-10 ring-white/30'}`}
                />
                {/* Status dot */}
                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0B3D91] ${isSpeaking ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-none">
                  {isRtl ? 'معن' : 'Maen'}
                </p>
                {isSpeaking ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-blue-200 text-xs">{isRtl ? 'يتحدث...' : 'Speaking...'}</span>
                    {/* Animated sound bars */}
                    <span className="flex items-end gap-0.5 h-3.5">
                      {[0.5, 1, 0.6, 1, 0.7, 0.4, 1].map((h, i) => (
                        <span
                          key={i}
                          className="w-0.5 bg-blue-300 rounded-full soundbar"
                          style={{
                            height: `${h * 100}%`,
                            animationDelay: `${i * 0.1}s`,
                          }}
                        />
                      ))}
                    </span>
                  </div>
                ) : (
                  <p className="text-white/70 text-xs mt-0.5 truncate">
                    {isRtl ? 'مستشار سلسلة التوريد الذكية' : 'AI Supply Chain Consultant'}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Voice toggle */}
                <button
                  onClick={() => {
                    if (voiceEnabled) stopSpeaking();
                    setVoiceEnabled(v => !v);
                  }}
                  className={`transition-colors p-1.5 rounded-lg hover:bg-white/10 ${voiceEnabled ? 'text-white' : 'text-white/40'}`}
                  title={voiceEnabled ? (isRtl ? 'كتم الصوت' : 'Mute voice') : (isRtl ? 'تفعيل الصوت' : 'Enable voice')}
                  aria-label={voiceEnabled ? (isRtl ? 'كتم الصوت' : 'Mute voice') : (isRtl ? 'تفعيل الصوت' : 'Enable voice')}
                >
                  {voiceEnabled
                    ? <Volume2 className={`w-4 h-4 ${isSpeaking ? 'animate-pulse' : ''}`} />
                    : <VolumeX className="w-4 h-4" />
                  }
                </button>
                {messages.length > 0 && (
                  <button
                    onClick={resetChat}
                    className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                    title={isRtl ? 'محادثة جديدة' : 'New conversation'}
                    aria-label={isRtl ? 'بدء محادثة جديدة' : 'Start new conversation'}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  aria-label={isRtl ? 'إغلاق المحادثة' : 'Close chat'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-0">
              {/* Welcome bubble — always shown */}
              <div className="flex items-start gap-2">
                <img
                  src="/brand/chat-avatar.png"
                  alt="Laila"
                  className="w-7 h-7 rounded-full shrink-0 mt-1 object-cover bg-primary"
                />
                <div className="max-w-[82%] bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-border text-sm text-foreground leading-relaxed">
                  {isRtl
                    ? 'مرحباً! أنا معن، مستشارك الذكي لسلسلة التوريد في I Supply Chain. كيف يمكنني مساعدتك اليوم؟'
                    : "Hi! I'm Maen, your AI supply chain consultant at I Supply Chain. How can I help you today?"}
                </div>
              </div>

              {/* Quick suggestions — only when no messages yet */}
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2 ps-9">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary bg-white hover:bg-primary hover:text-white transition-colors font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Conversation messages */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <img
                      src="/brand/chat-avatar.png"
                      alt="Laila"
                      className="w-7 h-7 rounded-full shrink-0 mb-0.5 object-cover bg-primary"
                    />
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#0B3D91] text-white rounded-br-sm'
                        : 'bg-white text-foreground shadow-sm border border-border rounded-bl-sm'
                    }`}
                  >
                    {msg.content || (
                      msg.streaming && (
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:300ms]" />
                        </span>
                      )
                    )}
                    {msg.content && msg.streaming && (
                      <span className="inline-block w-0.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-3 py-3 border-t border-border bg-white shrink-0">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRtl ? 'اكتب رسالتك...' : 'Ask about supply chain...'}
                  disabled={isStreaming}
                  dir={isRtl ? 'rtl' : 'ltr'}
                  className="flex-1 text-sm px-4 py-2.5 rounded-xl border border-border bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all placeholder:text-muted-foreground"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || isStreaming}
                  className="w-10 h-10 rounded-xl bg-[#0B3D91] text-white flex items-center justify-center hover:bg-[#082C6B] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
                  aria-label={isRtl ? 'إرسال الرسالة' : 'Send message'}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-center text-[10px] text-muted-foreground mt-2">
                {isRtl ? 'مدعوم بالذكاء الاصطناعي · I Supply Chain' : 'Powered by AI · I Supply Chain'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
