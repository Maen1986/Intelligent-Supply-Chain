import { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
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
import { DecisionLab } from '@/pages/DecisionLab';
import { CustomerVoice } from '@/pages/CustomerVoice';
import { Legal } from '@/pages/Legal';
import { DataSources } from '@/pages/DataSources';
import { AdminLeads } from '@/pages/AdminLeads';
import { AdminIntegrations } from '@/pages/AdminIntegrations';
import { AdminAutomations } from '@/pages/AdminAutomations';
import { AdminEvidenceReview } from '@/pages/AdminEvidenceReview';
import { AccountSettings } from '@/pages/AccountSettings';
import { MyAssessments } from '@/pages/MyAssessments';
import { ActionTracker } from '@/pages/ActionTracker';
import { useIPProtection } from '@/hooks/useIPProtection';
import { ChatWidget } from '@/components/ChatWidget';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { AnnouncementBanner } from '@/components/AnnouncementBanner';
import { CommandCentreFloat } from '@/components/CommandCentreFloat';

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  useIPProtection();
  return (
    <div className={`min-h-screen flex flex-col font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <AnnouncementBanner />
      <Header />
      <main className="flex-1 bg-background">
        {children}
      </main>
      <Footer />
      <ChatWidget />
      <WhatsAppButton />
      <CommandCentreFloat />
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
        <Route path="/decision-lab" component={DecisionLab} />
        <Route path="/admin/leads" component={AdminLeads} />
        <Route path="/admin/integrations" component={AdminIntegrations} />
        <Route path="/admin/automations" component={AdminAutomations} />
        <Route path="/admin/evidence-review" component={AdminEvidenceReview} />
        <Route path="/account" component={AccountSettings} />
        <Route path="/my-assessments" component={MyAssessments} />
        <Route path="/action-tracker" component={ActionTracker} />
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
