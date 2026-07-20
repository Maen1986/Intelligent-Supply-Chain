import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';

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

const articles = [
  {
    id: 1,
    title: "Vision 2030 and the Transformation of Saudi Supply Chains",
    category: "GCC Policy",
    readTime: "8 min read",
    date: "July 2025",
    excerpt: "Saudi Arabia's Vision 2030 is not merely an economic diversification programme — it is a fundamental restructuring of how goods and services flow across the Kingdom. Understanding the supply chain implications is essential for any organisation operating in the Saudi market.",
    body: `Saudi Arabia's Vision 2030 is reshaping supply chain infrastructure at every level. The programme's localisation mandate — through the Iktva framework in energy, the Nitaqat programme in labour, and the broader In-Kingdom Total Value Add requirements across sectors — is forcing organisations to fundamentally rethink their supplier base.

For procurement leaders, the primary implication is clear: single-source foreign supply arrangements that were once commercially optimal are now legally and reputationally risky. The government has signalled that procurement from local suppliers will be a prerequisite for participation in major government contracts, particularly in construction, energy, healthcare, and logistics.

The opportunity, however, is equally significant. Organisations that invest now in developing compliant, high-quality local supplier relationships will gain a structural competitive advantage as the localisation requirements tighten. The procurement function has moved from a cost centre to a strategic lever for Vision 2030 compliance and national competitiveness.`,
    author: "Maen Haqash",
    authorTitle: "Founder & Lead Consultant",
    bgColor: "bg-blue-600",
    featured: true,
  },
  {
    id: 2,
    title: "The Hidden Cost of Poor Contract Lifecycle Management",
    category: "Procurement",
    readTime: "6 min read",
    date: "June 2025",
    excerpt: "Most organisations underestimate the financial exposure created by poor contract management. Research consistently shows that weak CLM processes cost organisations between 5% and 40% of contract value — a staggering figure that few CFOs have quantified.",
    body: `The financial cost of poor contract lifecycle management is rarely visible on a balance sheet, but it is everywhere in an organisation's operations. Missed renewal windows that trigger automatic rollovers at unfavourable terms. Supplier invoices that exceed contracted rates because no one is enforcing the SLA. Liability clauses that were never negotiated and now expose the organisation to unlimited risk.

A well-structured CLM function does three things that generate immediate financial value. First, it creates a single source of truth for all contractual obligations, so nothing falls through the gap between legal, procurement, and operations. Second, it automates milestone alerts — renewal dates, notice periods, performance reviews — so the organisation is always acting proactively rather than reactively. Third, it creates a negotiation memory: over time, you build institutional knowledge about which clauses your suppliers resist, which concessions they will make, and where the leverage lies.

The starting point is not software. It is a structured contract register, a clear ownership model, and defined SLA monitoring intervals. With those three elements in place, most organisations recover 3–8% of contract value within the first year.`,
    author: "Maen Haqash",
    authorTitle: "Founder & Lead Consultant",
    bgColor: "bg-purple-600",
    featured: false,
  },
  {
    id: 3,
    title: "Building Supply Chain Resilience: Lessons from GCC Disruptions",
    category: "Risk",
    readTime: "7 min read",
    date: "May 2025",
    excerpt: "The past five years have stress-tested supply chains in ways that no risk model fully anticipated. Port congestion, single-source failures, geopolitical disruptions, and pandemic aftershocks have revealed fundamental structural vulnerabilities.",
    body: `The organisations that navigated recent supply chain disruptions with the least damage shared a common characteristic: they had invested in redundancy before they needed it. Dual-sourcing arrangements, pre-qualified contingency suppliers, and buffer stock strategies that seemed like expensive over-engineering in 2019 proved to be decisive competitive advantages by 2022.

For GCC operators, the resilience challenge has a specific regional dimension. The concentration of global shipping through key chokepoints — Suez Canal, Strait of Hormuz, and key Arabian Peninsula ports — creates geographic risk that cannot be fully diversified away. Supply chain resilience in this context means building relationships and contracts that provide flexibility, not just redundancy.

The practical framework we recommend has three levels. At the strategic level, conduct a full supply chain risk mapping exercise that identifies single-source dependencies and geographic concentrations. At the operational level, negotiate business continuity provisions into all strategic supplier contracts, including pre-agreed response times and escalation protocols. At the tactical level, maintain a living vendor list of pre-qualified alternative suppliers that can be activated within 48–72 hours.`,
    author: "James Whitfield",
    authorTitle: "Senior Consultant — Operations",
    bgColor: "bg-red-600",
    featured: false,
  },
  {
    id: 4,
    title: "AI in Procurement: What Actually Works for SMEs",
    category: "Technology",
    readTime: "5 min read",
    date: "April 2025",
    excerpt: "Artificial intelligence in procurement is generating enormous hype. But for SMEs and mid-market companies without dedicated data science teams, what practical applications deliver real value today — and what should you avoid?",
    body: `The gap between the AI capabilities that enterprise software vendors are selling and the actual needs of a mid-market procurement team is enormous. Most SMEs do not need predictive demand modelling or machine learning-powered supplier risk scoring. What they need is faster, more consistent execution of the fundamentals.

That is where AI genuinely delivers value today. Spend classification — automatically categorising purchase data into meaningful categories — is one of the highest-return applications. Organisations that have historically spent significant time manually reviewing purchasing data can now generate category-level spend intelligence in hours rather than weeks. The strategic decisions that follow from that intelligence are still human decisions, but they are better informed and faster.

Supplier discovery and qualification is another practical application. AI tools can now scan public databases, financial records, and news sources to build preliminary supplier profiles and flag potential risks — credit events, regulatory sanctions, adverse news — at a fraction of the cost of manual research. For procurement teams managing hundreds of suppliers, this is transformative. The starting point for any organisation is a structured spend analysis. Without clean, categorised spend data, no AI tool will deliver meaningful value.`,
    author: "Sophie Laurent",
    authorTitle: "Senior Consultant — Digital",
    bgColor: "bg-cyan-600",
    featured: false,
  },
  {
    id: 5,
    title: "Supplier Governance: Moving Beyond the Approved Vendor List",
    category: "Procurement",
    readTime: "6 min read",
    date: "March 2025",
    excerpt: "The approved vendor list is the foundation of supplier governance — but it is only the foundation. Organisations that stop there are managing compliance, not relationships. The difference matters enormously to the bottom line.",
    body: `An approved vendor list tells you who you are allowed to buy from. Supplier governance tells you whether those suppliers are actually delivering what you contracted for, whether the relationship is developing strategically, and whether the organisation's dependency on each supplier is at an acceptable risk level.

The transition from compliance-focused to relationship-focused supplier management requires three investments. The first is a performance measurement framework with metrics that are meaningful to the business — not just on-time delivery, but quality rates, invoice accuracy, responsiveness, and innovation contribution. The second is a structured review cadence: monthly operational reviews with high-volume suppliers, quarterly strategic reviews with key partners, and annual relationship assessments with all significant vendors.

The third, and most often overlooked, investment is in supplier development. The best organisations do not just measure supplier performance — they actively improve it. This means sharing your forecasts so suppliers can plan their capacity, providing technical support when quality issues arise, and giving preferred suppliers early visibility of new requirements. The suppliers that receive this level of engagement consistently outperform on every metric.`,
    author: "Maen Haqash",
    authorTitle: "Founder & Lead Consultant",
    bgColor: "bg-indigo-600",
    featured: false,
  },
  {
    id: 6,
    title: "ESG in Supply Chain: From Reporting Requirement to Competitive Advantage",
    category: "Sustainability",
    readTime: "7 min read",
    date: "February 2025",
    excerpt: "Environmental, social, and governance requirements in supply chain management have moved from a niche topic to a core business imperative. For GCC organisations seeking international contracts, ESG compliance is increasingly non-negotiable.",
    body: `The pressure on supply chain sustainability has shifted decisively from voluntary to mandatory. European importers are now required under the EU Corporate Sustainability Due Diligence Directive to assess and mitigate human rights and environmental risks across their entire supply chain — including their GCC suppliers. For Saudi and Jordanian exporters with European exposure, this is a material business risk.

But the organisations that are moving fastest on supply chain ESG are not doing so because of regulatory pressure alone. They are doing so because sustainability has become a genuine competitive differentiator in procurement decisions. When a multinational is choosing between two comparable suppliers, the one with documented ESG performance, a published supplier code of conduct, and third-party verification is almost always the preferred choice.

The practical starting point is a supplier ESG assessment framework. This does not need to be complex: a structured questionnaire covering environmental practices, labour standards, and governance processes, scored and tracked annually. The data this generates creates two immediate benefits — it identifies the highest-risk suppliers in the base, and it provides credible evidence of due diligence that can be shared with customers and investors.`,
    author: "Sophie Laurent",
    authorTitle: "Senior Consultant — Sustainability",
    bgColor: "bg-emerald-600",
    featured: false,
  },
];

function ArticleModal({ article, onClose }: { article: typeof articles[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full my-4" onClick={(e) => e.stopPropagation()}>
        <div className={`${article.bgColor} p-8 rounded-t-3xl text-white`}>
          <div className="flex justify-between items-start mb-4">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wide">{article.category}</span>
            <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">×</button>
          </div>
          <h2 className="text-2xl font-bold leading-tight mb-3">{article.title}</h2>
          <div className="flex items-center gap-4 text-white/70 text-sm">
            <span>{article.author}</span>
            <span>·</span>
            <span>{article.date}</span>
            <span>·</span>
            <span>{article.readTime}</span>
          </div>
        </div>
        <div className="p-8 space-y-6">
          {article.body.split('\n\n').map((para, i) => (
            <p key={i} className="text-foreground leading-relaxed">{para}</p>
          ))}
          <div className="pt-6 border-t border-border flex flex-col sm:flex-row gap-3">
            <Link href="/consultant" onClick={onClose}>
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                Discuss with a Consultant <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Link href="/diagnostic" onClick={onClose}>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white font-semibold">
                Start Free Diagnostic
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Insights() {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<typeof articles[0] | null>(null);
  const filtered = filter === 'All' ? articles : articles.filter((a) => a.category === filter);
  const featured = articles.find((a) => a.featured);
  const rest = filtered.filter((a) => !a.featured || filter !== 'All');

  return (
    <div className="w-full">
      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} />}

      {/* Hero */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden bg-[#082C6B]">
        <div className="absolute inset-0 bg-gradient-to-r from-[#082C6B] via-[#0B3D91] to-[#0B3D91]/70" />
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 30%, rgba(201,168,76,0.5) 0%, transparent 50%)' }} />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <span className="text-accent font-bold text-sm uppercase tracking-widest mb-3">Thought Leadership</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-3">Insights</h1>
          <p className="text-white/80 text-base md:text-lg max-w-2xl">
            Expert perspectives on supply chain strategy, procurement, risk, and the evolving GCC business landscape.
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
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold uppercase tracking-wide">{featured.category}</span>
                  <h2 className="text-2xl md:text-3xl font-bold mt-5 mb-4 leading-tight group-hover:text-white/90 transition-colors">{featured.title}</h2>
                  <p className="text-white/80 leading-relaxed">{featured.excerpt}</p>
                </div>
                <div className="flex items-center gap-3 mt-8">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{featured.author}</p>
                    <p className="text-white/60 text-xs">{featured.date} · {featured.readTime}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-10 flex flex-col justify-center">
                <span className="text-xs text-accent font-bold uppercase tracking-widest mb-3">Featured Article</span>
                <h3 className="text-xl font-bold text-primary mb-4">{featured.title}</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">{featured.excerpt}</p>
                <Button className="bg-primary hover:bg-primary/90 text-white self-start font-semibold">
                  Read Full Article <ChevronRight className="w-4 h-4 ml-1" />
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
              {cat}
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
                      {article.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {article.readTime}
                    </span>
                  </div>
                  <h3 className="font-bold text-primary text-lg leading-tight group-hover:text-primary/80 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">{article.excerpt}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{article.author}</p>
                      <p className="text-xs text-muted-foreground">{article.date}</p>
                    </div>
                    <span className="text-primary text-sm font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                      Read <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </RevealSection>
          ))}
        </div>

        {/* Newsletter CTA */}
        <RevealSection className="mt-20 bg-primary/5 border border-primary/15 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-primary mb-3">Stay Ahead of the Curve</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Get our monthly supply chain intelligence briefing — GCC market updates, regulatory changes, and practical procurement insights delivered to your inbox.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Your work email"
              className="flex-1 px-4 py-3 rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
            />
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 shrink-0">
              Subscribe
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3">No spam. Unsubscribe at any time.</p>
        </RevealSection>
      </div>
    </div>
  );
}
