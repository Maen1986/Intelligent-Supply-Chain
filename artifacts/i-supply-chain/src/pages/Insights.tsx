import React, { useState } from 'react';
import { motion  } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight, BookOpen , ChevronLeft } from 'lucide-react';
import { useLanguage } from '@/lib/LanguageContext';
import { articles } from './insightsData';
import { API_BASE } from '@/lib/apiBase';

function RevealSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const categories = ['All', 'Strategy', 'Procurement', 'Technology', 'Sustainability', 'Risk', 'GCC Policy'];
const categoriesAr: Record<string, string> = {
  'All': 'الكل',
  'Strategy': 'الاستراتيجية',
  'Procurement': 'المشتريات',
  'Technology': 'التقنية',
  'Sustainability': 'الاستدامة',
  'Risk': 'المخاطر',
  'GCC Policy': 'سياسات الخليج',
};


function ArticleModal({ article, onClose }: { article: typeof articles[0]; onClose: () => void }) {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const body = isAr ? article.bodyAr : article.body;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-4" onClick={(e) => e.stopPropagation()}>
        <div className={`${article.bgColor} p-8 rounded-t-3xl text-white`}>
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wide">{isAr ? categoriesAr[article.category] : article.category}</span>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
          </div>
          <h2 className="text-2xl font-bold leading-tight mb-3">{isAr ? article.titleAr : article.title}</h2>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <span>{article.author}</span>
            <span>·</span>
            <span>{isAr ? article.dateAr : article.date}</span>
            <span>·</span>
            <span>{isAr ? article.readTimeAr : article.readTime}</span>
          </div>
        </div>
        <div className="p-8 space-y-6">
          {body.split('\n\n').map((para, i) => (
            <p key={i} className="text-foreground leading-relaxed">{para}</p>
          ))}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
            <Link href="/consultant" onClick={onClose}>
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                {isAr ? 'ناقش مع استشاري' : 'Discuss with a Consultant'} {isAr ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
              </Button>
            </Link>
            <Link href="/diagnostic" onClick={onClose}>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                {isAr ? 'ابدأ التشخيص المجاني' : 'Start Free Diagnostic'}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Insights() {
  const { lang } = useLanguage();
  const isAr = lang === 'ar';
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<typeof articles[0] | null>(null);
  const filtered = filter === 'All' ? articles : articles.filter((a) => a.category === filter);
  const featured = articles.find((a) => a.featured);
  const rest = filtered.filter((a) => !a.featured || filter !== 'All');

  // ── Newsletter signup — was a decorative form that discarded every submission ──
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || subscribeStatus === 'loading') return;
    setSubscribeStatus('loading');
    try {
      const res = await fetch(`${API_BASE}/leads/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim() }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      setSubscribeStatus('success');
      setNewsletterEmail('');
    } catch {
      setSubscribeStatus('error');
    }
  };

  return (
    <div className="w-full">
      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}

      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden bg-[#082C6B]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B] via-[#0B3D91] to-[#0B3D91]/70" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(201,168,76,0.5) 0%, transparent 50%)' }} />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <span className="text-accent font-bold text-sm uppercase tracking-widest mb-3">{isAr ? 'ريادة فكرية' : 'Thought Leadership'}</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">{isAr ? 'رؤى ومقالات' : 'Insights'}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            {isAr ? 'وجهات نظر خبيرة حول استراتيجية سلسلة الإمداد والمشتريات والمخاطر ومشهد الأعمال الخليجي المتطوّر.' : 'Expert perspectives on supply chain strategy, procurement, risk, and the evolving GCC business landscape.'}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14 max-w-6xl">

        {/* Featured — only show when not filtered */}
        {filter === 'All' && featured && (
          <RevealSection className="mb-14">
            <div
              className="grid lg:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl border border-border cursor-pointer group"
              onClick={() => setSelected(featured)}
            >
              <div className={`${featured.bgColor} p-10 text-white flex flex-col justify-between min-h-[340px]`}>
                <div>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wide">{isAr ? categoriesAr[featured.category] : featured.category}</span>
                  <h2 className="text-2xl md:text-3xl font-bold mt-5 mb-4 leading-tight group-hover:text-white/90 transition-colors">{isAr ? featured.titleAr : featured.title}</h2>
                  <p className="text-white/80 leading-relaxed">{isAr ? featured.excerptAr : featured.excerpt}</p>
                </div>
                <div className="flex items-center gap-3 mt-8">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{featured.author}</p>
                    <p className="text-white/60 text-xs">{isAr ? featured.dateAr : featured.date} · {isAr ? featured.readTimeAr : featured.readTime}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-10 flex flex-col justify-center">
                <span className="text-xs text-accent font-bold uppercase tracking-widest mb-3">{isAr ? 'مقال مميّز' : 'Featured Article'}</span>
                <h3 className="text-xl font-bold text-primary mb-4">{isAr ? featured.titleAr : featured.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{isAr ? featured.excerptAr : featured.excerpt}</p>
                <Button className="bg-primary hover:bg-primary/90 text-white self-start font-semibold">
                  {isAr ? 'اقرأ المقال كاملاً' : 'Read Full Article'} {isAr ? <ChevronLeft className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 ml-1" />}
                </Button>
              </div>
            </div>
          </RevealSection>
        )}

        {/* Filter */}
        <RevealSection className="flex flex-wrap gap-2 mb-10 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                filter === cat
                  ? 'bg-primary text-white border-primary shadow-md'
                  : 'bg-white text-foreground border-border hover:border-primary hover:text-primary'
              }`}
            >
              {isAr ? categoriesAr[cat] : cat}
            </button>
          ))}
        </RevealSection>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((article, i) => (
            <RevealSection key={article.id} delay={i * 0.07}>
              <div
                className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow h-full flex flex-col"
                onClick={() => setSelected(article)}
              >
                <div className={`${article.bgColor} h-3 w-full`} />
                <div className="p-6 flex flex-col gap-4 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-primary/8 text-primary rounded-full text-xs font-bold border border-primary/15">
                      {isAr ? categoriesAr[article.category] : article.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {isAr ? article.readTimeAr : article.readTime}
                    </span>
                  </div>
                  <h3 className="font-bold text-primary text-lg leading-tight group-hover:text-primary/80 transition-colors">
                    {isAr ? article.titleAr : article.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{isAr ? article.excerptAr : article.excerpt}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{article.author}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? article.dateAr : article.date}</p>
                    </div>
                    <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      {isAr ? 'اقرأ' : 'Read'} {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </span>
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Newsletter CTA */}
        <RevealSection className="mt-20 bg-primary/5 border border-primary/15 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-primary mb-3">{isAr ? 'ابقَ في طليعة المشهد' : 'Stay Ahead of the Curve'}</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {isAr ? 'احصل على نشرتنا الشهرية لذكاء سلسلة الإمداد — تحديثات السوق الخليجي والتغيّرات التنظيمية ورؤى المشتريات العملية تصلك إلى بريدك.' : 'Get our monthly supply chain intelligence briefing — GCC market updates, regulatory changes, and practical procurement insights delivered to your inbox.'}
          </p>
          {subscribeStatus === 'success' ? (
            <p className="max-w-md mx-auto px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
              {isAr ? 'تم الاشتراك بنجاح — شكراً لك!' : "You're subscribed — thank you!"}
            </p>
          ) : (
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubscribe}>
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                disabled={subscribeStatus === 'loading'}
                placeholder={isAr ? 'بريدك الإلكتروني المهني' : 'Your work email'}
                className="flex-1 px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm disabled:opacity-60"
              />
              <Button type="submit" disabled={subscribeStatus === 'loading'} className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 shrink-0 disabled:opacity-60">
                {subscribeStatus === 'loading' ? (isAr ? 'جارٍ الإرسال...' : 'Subscribing...') : (isAr ? 'اشترك' : 'Subscribe')}
              </Button>
            </form>
          )}
          {subscribeStatus === 'error' && (
            <p className="text-xs text-red-600 mt-3 font-medium">{isAr ? 'تعذّر الاشتراك، يرجى المحاولة مرة أخرى.' : "Something went wrong — please try again."}</p>
          )}
          <p className="text-xs text-muted-foreground mt-3">{isAr ? 'بلا رسائل مزعجة. يمكنك إلغاء الاشتراك في أي وقت.' : 'No spam. Unsubscribe at any time.'}</p>
        </RevealSection>
      </div>
    </div>
  );
}
