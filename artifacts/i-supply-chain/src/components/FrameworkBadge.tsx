/**
 * FrameworkBadge
 *
 * Renders compact pill badges for industry frameworks/standards
 * (e.g. CIPS, ISO 9001, ASCM/SCOR) relevant to a maturity question.
 *
 * Features:
 * - Tooltip showing the full framework name on hover
 * - Respects RTL layout for Arabic mode
 * - Visually unobtrusive (muted primary palette)
 */

import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─── Full-name lookup ────────────────────────────────────────────────────────

export const FRAMEWORK_NAMES: Record<string, string> = {
  'ASCM/SCOR':          'ASCM Supply Chain Operations Reference (SCOR)',
  'ASCM':               'Association for Supply Chain Management (ASCM)',
  'APICS':              'APICS (part of ASCM)',
  'APICS SCOR':         'APICS Supply Chain Operations Reference Model',
  'IBP':                'Integrated Business Planning (IBP)',
  'Gartner':            'Gartner Supply Chain Research',
  'CIPS':               'Chartered Institute of Procurement & Supply (CIPS)',
  'ISM/CPSM':           'Institute for Supply Management / Certified Professional in Supply Management',
  'ISO 20400':          'ISO 20400 \u2014 Sustainable Procurement',
  'IACCM/WCC':          'IACCM / World Commerce & Contracting (WCC)',
  'ISO 9001':           'ISO 9001 \u2014 Quality Management Systems',
  'ISO 44001':          'ISO 44001 \u2014 Collaborative Business Relationships',
  'ISO 31000':          'ISO 31000 \u2014 Risk Management',
  'ISO 14001':          'ISO 14001 \u2014 Environmental Management Systems',
  'ISO 45001':          'ISO 45001 \u2014 Occupational Health & Safety',
  'ISO 27001':          'ISO 27001 \u2014 Information Security Management',
  'ISO 28001':          'ISO 28001 \u2014 Supply Chain Security Management',
  'GRI':                'Global Reporting Initiative (GRI) Standards',
  'ILO':                'International Labour Organization (ILO) Conventions',
  'ABC-XYZ':            'ABC-XYZ Inventory Classification',
  'CSCMP':              'Council of Supply Chain Management Professionals (CSCMP)',
  'IATA':               'International Air Transport Association (IATA)',
  'FIATA':              'International Federation of Freight Forwarders Associations (FIATA)',
  'Incoterms':          'Incoterms\u00ae \u2014 International Commercial Terms (ICC)',
  'SHRM':               'Society for Human Resource Management (SHRM)',
  'IATF 16949':         'IATF 16949 \u2014 Automotive Quality Management',
  'OEE':                'Overall Equipment Effectiveness (OEE)',
  'TPM':                'Total Productive Maintenance (TPM)',
  'Nitaqat':            'Nitaqat (Saudization) Program',
  'IKTVA':              'In-Kingdom Total Value Add (IKTVA)',
  'Saudi Vision 2030':  'Saudi Vision 2030',
  'SFDA Halal':         'Saudi Food & Drug Authority \u2014 Halal Certification',
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FrameworkBadgeProps {
  frameworks?: string[];
  /** Pass 'ar' when the UI is in Arabic mode */
  lang?: 'ar' | 'en';
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FrameworkBadge({ frameworks, lang, className }: FrameworkBadgeProps) {
  if (!frameworks || frameworks.length === 0) return null;

  const ar = lang === 'ar';

  return (
    <TooltipProvider>
      <div
        className={`flex flex-wrap gap-1.5 mt-2 ${ar ? 'flex-row-reverse' : ''} ${className ?? ''}`}
        data-testid="framework-badge-list"
      >
        {frameworks.map((fw) => {
          const fullName = FRAMEWORK_NAMES[fw] ?? fw;
          return (
            <Tooltip key={fw}>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[11px] font-semibold cursor-default select-none leading-tight whitespace-nowrap hover:bg-primary/10 transition-colors"
                  data-testid={`framework-badge-${fw.replace(/[\s/]+/g, '-')}`}
                >
                  {fw}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-center">
                <p className="text-xs">{fullName}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export default FrameworkBadge;
