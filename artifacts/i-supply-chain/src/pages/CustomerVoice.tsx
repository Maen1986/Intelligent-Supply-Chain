import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Loader2, MessageSquareHeart } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useFeedbackAnalytics } from '@/hooks/useFeedback';
import { VoiceSummaryCards } from '@/components/voice/VoiceSummaryCards';
import { VoiceCharts } from '@/components/voice/VoiceCharts';
import { VoiceKeywordCloud } from '@/components/voice/VoiceKeywordCloud';
import { VoiceFeedbackList } from '@/components/voice/VoiceFeedbackList';

export function CustomerVoice() {
  const { t } = useLanguage();
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === 'admin';

  // Admin guard: redirect non-admins home once auth state is known
  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [loading, isAdmin, navigate]);

  const { data, isLoading, isError } = useFeedbackAnalytics();

  if (loading || !isAdmin) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-[#082C6B]">
        <div className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-3">
            <MessageSquareHeart className="w-8 h-8 text-[#C9A84C]" />
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{t('voice.pageTitle')}</h1>
              <p className="text-white/70 text-sm mt-1">{t('voice.pageSubtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 space-y-6">
        {isLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : isError || !data ? (
          <p className="text-center text-muted-foreground py-12">{t('voice.loadError')}</p>
        ) : (
          <>
            <VoiceSummaryCards data={data} />
            <VoiceCharts data={data} />
            <VoiceKeywordCloud keywords={data.topKeywords} />
          </>
        )}
        <VoiceFeedbackList />
      </section>
    </div>
  );
}
