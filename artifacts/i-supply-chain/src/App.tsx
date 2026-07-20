import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { LanguageProvider, useLanguage } from '@/lib/LanguageContext';

// Components & Pages
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Home } from '@/pages/Home';
import { Diagnostic } from '@/pages/Diagnostic';
import { Consultant } from '@/pages/Consultant';
import { Csr } from '@/pages/Csr';

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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
