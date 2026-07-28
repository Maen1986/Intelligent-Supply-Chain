import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2, MessageSquareHeart, X } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { useFeedbackAnalytics } from '@/hooks/useFeedback';
import { VoiceSummaryCards } from '@/components/voice/VoiceSummaryCards';
import { VoiceCharts } from '@/components/voice/VoiceCharts';
import { VoiceKeywordCloud } from '@/components/voice/VoiceKeywordCloud';
import { VoiceFeedbackList } from '@/components/voice/VoiceFeedbackList';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

function toolLabel(v: string, isAr: boolean) {
  if (v === 'diagnostic') return isAr ? 'التشخيص' : 'Diagnostic';
  if (v === 'maturity') return isAr ? 'النضج' : 'Maturity';
  return v;
}

export function CustomerVoice() {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === 'admin';

  // Admin guard: redirect non-admins home once auth state is known
  useEffect(() => {
    if (!loading && !isAdmin) navigate('/');
  }, [loading, isAdmin, navigate]);

  const [tool, setTool] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filters = {
    tool: tool === 'all' ? undefined : tool,
    from: from || undefined,
    to: to || undefined,
  };

  const hasFilters = tool !== 'all' || from !== '' || to !== '';

  const clearFilters = () => {
    setTool('all');
    setFrom('');
    setTo('');
  };

  const { data, isLoading, isError } = useFeedbackAnalytics(filters);

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
        {/* Analytics filters */}
        <div className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-wrap items-end gap-3" data-testid="analytics-filters">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('voice.filterTool')}</p>
            <Select value={tool} onValueChange={setTool}>
              <SelectTrigger className="w-[150px] h-9" data-testid="analytics-filter-tool">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('voice.allTools')}</SelectItem>
                <SelectItem value="diagnostic">{toolLabel('diagnostic', isAr)}</SelectItem>
                <SelectItem value="maturity">{toolLabel('maturity', isAr)}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('voice.from')}</p>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              data-testid="analytics-filter-from"
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('voice.to')}</p>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              data-testid="analytics-filter-to"
            />
          </div>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground h-9"
              data-testid="analytics-filter-clear"
            >
              <X className="w-4 h-4 me-1" />
              {t('voice.clearFilters')}
            </Button>
          )}
        </div>

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
