import { createRoot } from 'react-dom/client';

import App from './App';
import { applyItem42ComplianceQuestions } from './pages/clmComplianceItem42';

import './index.css';

// Item 42 (Contract Intelligence v10) -- adds the CTL/GTPL/riba maturity
// questions to clm-compliance at bootstrap. See clmComplianceItem42.ts for
// why this isn't inlined directly into maturitySubSegData1to5.ts.
applyItem42ComplianceQuestions();

// Static hosting serves /about/ for the per-route shells; normalise to the canonical no-slash URL
// before the router mounts so the SPA and the canonical tag agree.
if (window.location.pathname.length > 1 && window.location.pathname.endsWith('/')) {
  window.history.replaceState(null, '', window.location.pathname.replace(/\/+$/, '') + window.location.search + window.location.hash);
}

createRoot(document.getElementById('root')!).render(<App />);
