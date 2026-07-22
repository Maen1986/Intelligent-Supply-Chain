import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Star, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { useAuth } from '@/lib/AuthContext';
import { submitFeedback } from '@/hooks/useFeedback';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  tool: string;               // e.g. 'diagnostic' | 'maturity'
  submissionId?: number;
}

export function FeedbackModal({ open, onClose, tool, submissionId }: FeedbackModalProps) {
  const { t, lang } = useLanguage();
  const isAr = lang === 'ar';
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [nps, setNps] = useState<number>(8);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    setFailed(false);
    const ok = await submitFeedback({
      tool,
      rating,
      nps,
      comment: comment.trim() || undefined,
      company: user?.company ?? undefined,
      submissionId,
    });
    setSubmitting(false);
    if (ok) {
      setDone(true);
      setTimeout(() => onClose(), 1500);
    } else {
      setFailed(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className={`sm:max-w-md ${isAr ? 'rtl text-right' : ''}`} dir={isAr ? 'rtl' : 'ltr'}>
        {done ? (
          <div className="py-8 flex flex-col items-center text-center gap-3" data-testid="feedback-success">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
            <p className="font-bold text-lg">{t('feedback.thanks')}</p>
          </div>
        ) : (
          <>
            <DialogHeader className={isAr ? 'text-right sm:text-right' : ''}>
              <DialogTitle>{t('feedback.title')}</DialogTitle>
              <DialogDescription>{t('feedback.subtitle')}</DialogDescription>
            </DialogHeader>

            {/* Star rating */}
            <div>
              <p className="text-sm font-medium mb-2">{t('feedback.rating')}</p>
              <div className="flex gap-1" dir="ltr" style={{ justifyContent: isAr ? 'flex-end' : 'flex-start' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHover(s)}
                    onMouseLeave={() => setHover(0)}
                    className="p-1"
                    aria-label={`${s} star`}
                    data-testid={`star-${s}`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${(hover || rating) >= s ? 'fill-[#C9A84C] text-[#C9A84C]' : 'text-muted-foreground/40'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* NPS slider */}
            <div>
              <p className="text-sm font-medium mb-1">{t('feedback.nps')}</p>
              <div className="flex items-center gap-3" dir="ltr">
                <span className="text-xs text-muted-foreground w-4">0</span>
                <Slider value={[nps]} min={0} max={10} step={1} onValueChange={(v) => setNps(v[0])} className="flex-1" data-testid="slider-nps" />
                <span className="text-xs text-muted-foreground w-6">10</span>
                <span className="w-8 text-center font-bold text-primary">{nps}</span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <p className="text-sm font-medium mb-1">{t('feedback.comment')}</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('feedback.commentPlaceholder')}
                className="min-h-[90px] resize-none"
                maxLength={5000}
                data-testid="input-feedback-comment"
              />
            </div>

            {failed && (
              <p className="text-sm text-destructive" data-testid="text-feedback-error">
                {t('feedback.error')}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <Button variant="ghost" onClick={onClose} data-testid="button-feedback-dismiss">
                {t('feedback.dismiss')}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={rating < 1 || submitting}
                className="bg-primary text-white font-bold"
                data-testid="button-feedback-submit"
              >
                {submitting ? '…' : t('feedback.submit')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Returns true the first time it's called per tool per session (marks shown). */
export function shouldShowFeedback(tool: string): boolean {
  try {
    const key = `isc-feedback-shown-${tool}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return false;
  }
}
