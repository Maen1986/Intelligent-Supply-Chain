import React from 'react';
import { useLanguage } from '@/lib/LanguageContext';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { GitBranch, ShoppingCart, FileText, Users, ShieldAlert, Leaf, RefreshCw, Cpu, ChevronRight, ArrowRight } from 'lucide-react';

export function Home() {
  const { t } = useLanguage();

  const solutions = [
    { icon: GitBranch, title: 'Supply Chain Strategy', desc: 'End-to-end supply chain design and operational strategy.' },
    { icon: ShoppingCart, title: 'Procurement Excellence', desc: 'Strategic sourcing, vendor selection, and procurement transformation.' },
    { icon: FileText, title: 'Contract Lifecycle Management (CLM)', desc: 'Full contract lifecycle from drafting to renewal and compliance.' },
    { icon: Users, title: 'Supplier Relationship & Governance', desc: 'Supplier performance management and governance frameworks.' },
    { icon: ShieldAlert, title: 'Risk Management', desc: 'Proactive identification and mitigation of supply chain risks.' },
    { icon: Leaf, title: 'Sustainability', desc: 'ESG integration and sustainable procurement practices.' },
    { icon: RefreshCw, title: 'Resiliency', desc: 'Building adaptive, disruption-resistant supply chains.' },
    { icon: Cpu, title: 'Digital Transformation', desc: 'Technology enablement and digital supply chain maturity.' },
  ];

  const industries = [
    'Manufacturing', 'Marine', 'Retail', 'FMCG', 'Pharma', 'Logistics', 
    'Energy', 'Construction', 'Tech', 'Government', 'Ecommerce', 
    'Food & Beverage', 'Healthcare'
  ];

  const packages = [
    {
      name: 'Startup',
      desc: 'For early-stage companies establishing their first supply chain processes. Includes AI diagnostic, basic procurement framework, and 1 consultation session.',
    },
    {
      name: 'SME',
      desc: 'For growing businesses scaling operations. Includes full AI diagnostic, procurement strategy, supplier onboarding support, and 3 consultation sessions.',
    },
    {
      name: 'Mid-Market',
      desc: 'For mid-sized organizations optimizing complex supply chains. Includes advanced diagnostics, CLM setup, risk assessment, and 6 consultation sessions.',
    },
    {
      name: 'Enterprise',
      desc: 'For large organizations requiring comprehensive transformation. Custom scope, dedicated consultant, full suite of services, ongoing support.',
    },
    {
      name: 'Government',
      desc: 'Tailored for public sector entities aligned with Vision 2030 (Saudi Arabia) and GCC national development programs. Includes regulatory compliance, nationalization strategy, and governance frameworks.',
    }
  ];

  return (
    <div className="w-full flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full bg-gradient-to-br from-[#0B3D91] to-[#082C6B] text-white py-16 lg:py-32 overflow-hidden">
        {/* Subtle background pattern or glow could go here */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              {t('hero.headline')}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              {t('hero.subheadline')}
            </p>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 pt-6 sm:pt-8 w-full max-w-md mx-auto sm:max-w-none">
              <Link href="/diagnostic" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-white font-bold px-8 shadow-lg min-h-[48px]">
                  {t('hero.ctaPrimary')}
                </Button>
              </Link>
              <Link href="/consultant" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white text-white hover:bg-white hover:text-primary font-bold px-8 min-h-[48px]">
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
            
            <div className="pt-4">
              <Link href="/csr" className="text-sm text-white/70 hover:text-accent underline underline-offset-4 font-medium inline-flex items-center gap-1 transition-colors">
                {t('hero.ctaTertiary')} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Brand Visual Strip */}
      <section className="w-full bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-border max-w-4xl mx-auto">
            <img
              src="/brand/social-launch.png"
              alt="I Supply Chain — Your Intelligent Supply Chain Consultant"
              className="w-full h-auto object-cover block"
            />
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-20 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">{t('sections.solutions')}</h2>
            <div className="w-24 h-1 bg-accent mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((sol, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow group">
                <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <sol.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{sol.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{sol.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section id="industries" className="py-16 bg-white border-y border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
            <div className="md:w-1/3 text-center md:text-start md:rtl:text-right">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">{t('sections.industries')}</h2>
              <p className="text-muted-foreground">Expertise tailored to the unique demands of your specific sector.</p>
            </div>
            {/* Mobile: intentional horizontal scroll with snap. md+: wrapping flex */}
            <div className="md:w-2/3 flex overflow-x-auto md:flex-wrap gap-3 md:justify-end pb-2 md:pb-0 snap-x snap-mandatory md:snap-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {industries.map((ind, i) => (
                <div key={i} className="snap-start shrink-0 md:shrink px-4 py-2 rounded-full bg-muted border border-border text-primary text-sm font-medium hover:bg-primary hover:text-white transition-colors cursor-default">
                  {ind}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-primary">{t('sections.packages')}</h2>
            <div className="w-24 h-1 bg-accent mx-auto mt-6 rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {packages.map((pkg, i) => (
              <div key={i} className={`bg-white border rounded-2xl p-8 flex flex-col ${pkg.name === 'Enterprise' ? 'lg:col-span-1 md:col-span-2' : ''} ${pkg.name === 'Government' ? 'lg:col-span-2 md:col-span-2 bg-gradient-to-br from-white to-muted' : ''} border-border shadow-sm hover:shadow-lg transition-all`}>
                <h3 className="text-2xl font-bold text-primary mb-4">{pkg.name}</h3>
                <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">{pkg.desc}</p>
                <Link href="/consultant">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-white font-bold group">
                    Get Started <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
