import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';
import { AuthProvider } from '@/lib/AuthContext';

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
import { Login } from '@/pages/Login';
import { IndustryPage } from '@/pages/IndustryPage';
import { SolutionDetail } from '@/pages/SolutionDetail';
import { LeanSixSigma } from '@/pages/LeanSixSigma';
import { RiskManagement } from '@/pages/RiskManagement';
import { GovernanceCompliance } from '@/pages/GovernanceCompliance';
import { ChatWidget } from '@/components/ChatWidget';
import { WhatsAppButton } from '@/components/WhatsAppButton';

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  const { lang } = useLanguage();
  return (
    <div className={`min-h-screen flex flex-col font-sans ${lang === 'ar' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="flex-1 bg-background">
        {children}
      </main>
      <Footer />
      <ChatWidget />
      <WhatsAppButton />
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
        <Route path="/login" component={Login} />
        <Route path="/industry/:slug" component={IndustryPage} />
        <Route path="/solutions/:slug" component={SolutionDetail} />
        <Route path="/lean-six-sigma" component={LeanSixSigma} />
        <Route path="/risk-management" component={RiskManagement} />
        <Route path="/governance-compliance" component={GovernanceCompliance} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
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
