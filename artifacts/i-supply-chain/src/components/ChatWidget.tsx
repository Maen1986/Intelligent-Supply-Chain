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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakText = useCallback(async (text: string) => {
    if (!text.trim()) return;
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    try {
      setIsSpeaking(true);
      const res = await fetch('/api/openai/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

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
    } catch {
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
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const suggestions = lang === 'ar' ? QUICK_SUGGESTIONS_AR : QUICK_SUGGESTIONS;
  const isRtl = lang === 'ar';

  return (
    <>
      {/* Floating trigger button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="trigger"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-2xl overflow-hidden focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50"
            aria-label="Open chat with Laila, AI Consultant"
          >
            <img
              src="/brand/chat-avatar.png"
              alt="Laila AI Consultant"
              className="w-full h-full object-cover bg-primary"
            />
            {/* Pulsing online indicator */}
            <span className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center">
              <span className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75" />
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white relative z-10" />
            </span>
          </motion.button>
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
            <div className="bg-gradient-to-r from-[#0B3D91] to-[#082C6B] px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="relative shrink-0">
                <img
                  src="/brand/chat-avatar.png"
                  alt="Laila"
                  className="w-10 h-10 rounded-full ring-2 ring-white/30 object-cover bg-white/10"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-[#0B3D91]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm leading-none">
                  {isRtl ? 'معن' : 'Maen'}
                </p>
                <p className="text-white/70 text-xs mt-0.5 truncate">
                  {isRtl ? 'مستشار سلسلة التوريد الذكية' : 'AI Supply Chain Consultant'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {/* Voice toggle */}
                <button
                  onClick={() => {
                    if (voiceEnabled) stopSpeaking();
                    setVoiceEnabled(v => !v);
                  }}
                  className={`transition-colors p-1.5 rounded-lg hover:bg-white/10 ${voiceEnabled ? 'text-white' : 'text-white/40'}`}
                  title={voiceEnabled ? 'Mute voice' : 'Enable voice'}
                  aria-label={voiceEnabled ? 'Mute voice' : 'Enable voice'}
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
                    title="New conversation"
                    aria-label="Start new conversation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
                  aria-label="Close chat"
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
                  aria-label="Send message"
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
