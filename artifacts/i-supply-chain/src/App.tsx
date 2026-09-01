import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';
import { isLocalStorageAvailable } from '@/lib/storage';

// Components & Pages
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { Diagnostic } from '@/pages/Diagnostic';
import { Consultant } from '@/pages/Consultant';
import { Csr } from '@/pages/Csr';
import { About } from '@/pages/About';
import { CaseStudies } from '@/pages/CaseStudies';
import { Insights } from '@/pages/Insights';
import { Intelligence } from '@/pages/Intelligence';
import { Maturity } from '@/pages/Maturity';
import { ReportGenerator } from '@/pages/ReportGenerator';
import { Login } from '@/pages/Login';
import { IndustryPage } from '@/pages/IndustryPage';
import { SolutionDetail } from '@/pages/SolutionDetail';
import { LeanSixSigma } from '@/pages/LeanSixSigma';
import { RiskManagement } from '@/pages/RiskManagement';
import { GovernanceCompliance } from '@/pages/GovernanceCompliance';
import { CommandCenter } from '@/pages/CommandCenter';
import { ROIWaterfall } from '@/pages/ROIWaterfall';
import { KraljicMatrix } from '@/pages/KraljicMatrix';
import { ProblemMap } from '@/pages/ProblemMap';
import { IndustryBenchmark } from '@/pages/IndustryBenchmark';
import { DecisionLab } from '@/pages/DecisionLab';
import { CustomerVoice } from '@/pages/CustomerVoice';
import { Legal } from '@/pages/Legal';
import { DataSources } from '@/pages/DataSources';
import { AdminLeads } from '@/pages/AdminLeads';
import { AdminIntegrations } from '@/pages/AdminIntegrations';
import { AdminAutomations } from '@/pages/AdminAutomations';
import { AdminEvidenceReview } from '@/pages/AdminEvidenceReview';
import { AdminPlatformImpact } from '@/pages/AdminPlatformImpact';
import { AccountSettings } from '@/pages/AccountSettings';
import { MyAssessments } from '@/pages/MyAssessments';
import { ActionTracker } from '@/pages/ActionTracker';
import { DailyBrief } from '@/pages/DailyBrief';
import { MyWorkbench } from '@/pages/MyWorkbench';
import { DecisionMemory } from '@/pages/DecisionMemory';
import { SupplierDependencyCheck } from '@/pages/SupplierDependencyCheck';
import { LCGPAReadinessCheck } from '@/pages/LCGPAReadinessCheck';
import { FreeZoneRoutingTool } from '@/pages/FreeZoneRoutingTool';
import { GccSeasonalCalendar } from '@/pages/GccSeasonalCalendar';
import { useIPProtection } from '@/hooks/useIPProtection';
import { ChatWidget } from '@/components/ChatWidget';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { CommandCentreFloat } from '@/components/CommandCentreFloat';

const queryClient = new QueryClient();

// The floating chat / WhatsApp / promo widgets are all `position: fixed`
// docked to a page-viewport corner (bottom-left or bottom-right). On every
// route except Home that's harmless -- the page already scrolls, so a
// corner widget never sits on top of anything the person is reading. On
// Home, though, the hero section is deliberately sized to fill the entire
// viewport with zero scroll (see useHeroFitBox in Home.tsx), which means
// "bottom-right of the viewport" and "bottom-right of the hero image" are
// the exact same pixels on first load. The floats were sitting directly on
// top of hero content -- e.g. the SRM/KPI/Risk slides' right-hand alerts
// and scorecard panels -- which reads as "part of the slide is cut off,"
// even though the image itself is intact underneath. Fix: on Home only,
// hold the floats back until the person has scrolled roughly half a
// viewport height, i.e. past the hero. Every other route is unaffected --
// floats there render immediately, exactly as before.
// BUG FOUND 2 Sep 2026 (owner-reported live screenshot: floats sitting on
// top of the Maturity slide on first paint, no scroll involved). Root
// cause: the original version of this hook read window.scrollY exactly
// once on mount via check() and, if it happened to already be past the
// 50% threshold, latched show=true FOREVER for that page view -- it never
// re-checked afterwards. wouter does client-side routing with no
// scroll-reset on navigation (confirmed: no scrollTo(0,0) anywhere in this
// app), so a signed-in user browsing another page, scrolling down, then
// clicking "Home" in the nav would land on the fresh Home hero with the
// browser's scrollY still wherever it was on the PREVIOUS page. That stale
// high scrollY immediately tripped the one-time check() and the floats
// rendered directly over the hero from the very first frame -- exactly
// what the screenshot showed, and exactly why it could never be
// reproduced by a plain fresh page load (scrollY is genuinely 0 there).
// Fix, two parts: (1) useScrollToTopOnNavigate below actually scrolls to
// the top on every route change -- correct behaviour on its own, and it
// removes the stale-scrollY input at the source. (2) this hook now tracks
// LIVE scroll position on every scroll event instead of latching once, so
// scrolling back up to the top hides the floats again exactly as
// scrolling down revealed them, rather than "stuck visible forever" after
// the first trip.
function useScrollToTopOnNavigate(pathname: string) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
}

function useShowFloats(pathname: string) {
  const [show, setShow] = useState(pathname !== '/');

  useEffect(() => {
    if (pathname !== '/') {
      setShow(true);
      return;
    }
    function check() {
      setShow(window.scrollY > window.innerHeight * 0.5);
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, [pathname]);

  return show;
}

function Layout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  const [location] = useLocation();
  useScrollToTopOnNavigate(location);
  const showFloats = useShowFloats(location);
  useIPProtection();
  return (
    <div className={`min-h-screen flex flex-col font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <AnnouncementBanner />
      <Header />
      <main className="flex-1 bg-background">
        {children}
      </main>
      <Footer />
      {showFloats && <ChatWidget />}
      {showFloats && <WhatsAppButton />}
      {showFloats && <CommandCentreFloat />}
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/diagnostic" component={Diagnostic} />
        <Route path="/consultant" component={Consultant} />
        <Route path="/csr" component={Csr} />
        <Route path="/about" component={About} />
        <Route path="/case-studies" component={CaseStudies} />
        <Route path="/insights" component={Insights} />
        <Route path="/intelligence" component={Intelligence} />
        <Route path="/maturity" component={Maturity} />
        <Route path="/report-generator" component={ReportGenerator} />
        <Route path="/login" component={Login} />
        <Route path="/industry/:slug" component={IndustryPage} />
        <Route path="/solutions/:slug" component={SolutionDetail} />
        <Route path="/lean-six-sigma" component={LeanSixSigma} />
        <Route path="/risk-management" component={RiskManagement} />
        <Route path="/governance-compliance" component={GovernanceCompliance} />
        <Route path="/command-center" component={CommandCenter} />
        <Route path="/kraljic" component={KraljicMatrix} />
        <Route path="/problem-map" component={ProblemMap} />
        <Route path="/industry-benchmark" component={IndustryBenchmark} />
        <Route path="/decision-lab" component={DecisionLab} />
        <Route path="/admin/leads" component={AdminLeads} />
        <Route path="/admin/integrations" component={AdminIntegrations} />
        <Route path="/admin/automations" component={AdminAutomations} />
        <Route path="/admin/evidence-review" component={AdminEvidenceReview} />
        <Route path="/admin/platform-impact" component={AdminPlatformImpact} />
        <Route path="/account" component={AccountSettings} />
        <Route path="/my-assessments" component={MyAssessments} />
        <Route path="/action-tracker" component={ActionTracker} />
        <Route path="/brief" component={DailyBrief} />
        <Route path="/workbench" component={MyWorkbench} />
        <Route path="/decision-memory" component={DecisionMemory} />
        <Route path="/supplier-dependency" component={SupplierDependencyCheck} />
        <Route path="/lcgpa-readiness" component={LCGPAReadinessCheck} />
        <Route path="/freezone-routing" component={FreeZoneRoutingTool} />
        <Route path="/gcc-seasonal-calendar" component={GccSeasonalCalendar} />
        <Route path="/roi-waterfall" component={ROIWaterfall} />
        <Route path="/customer-voice" component={CustomerVoice} />
        <Route path="/legal" component={Legal} />
        <Route path="/data-sources" component={DataSources} />
        <Route path="/admin" component={AdminLeads} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    if (!isLocalStorageAvailable()) {
      toast.warning(
        'Private browsing detected — your changes cannot be saved. ' +
        'Open the app in a normal tab to keep your work.\n' +
        'تم اكتشاف وضع التصفح الخاص — لا يمكن حفظ التغييرات. ' +
        'افتح التطبيق في تبويب عادي للاحتفاظ بعملك.',
        {
          id: 'storage-private-browsing',
          duration: 8000,
        },
      );
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
