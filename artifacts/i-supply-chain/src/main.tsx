import { createRoot } from 'react-dom/client';

import App from './App';
import { applyItem42ComplianceQuestions } from './pages/clmComplianceItem42';

import './index.css';

// Item 42 (Contract Intelligence v10) -- adds the CTL/GTPL/riba maturity
// questions to clm-compliance at bootstrap. See clmComplianceItem42.ts for
// why this isn't inlined directly into maturitySubSegData1to5.ts.
applyItem42ComplianceQuestions();

createRoot(document.getElementById('root')!).render(<App />);
