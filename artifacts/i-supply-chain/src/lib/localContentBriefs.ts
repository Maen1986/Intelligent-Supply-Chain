// Module 08 -- merged Program Briefs. Official-source Saudi entries override the earlier Saudi drafts of the same key.
import type { ProgramBrief } from './localContentBriefTypes';
import { SA_BRIEFS } from './localContentBriefsSA';
import { SA_BRIEFS_OFFICIAL } from './localContentBriefsSAOfficial';
import { GULF_BRIEFS } from './localContentBriefsGulf';
import { INTL_BRIEFS } from './localContentBriefsIntl';

export const PROGRAM_BRIEFS: Record<string, ProgramBrief> = {
  ...SA_BRIEFS, ...SA_BRIEFS_OFFICIAL, ...GULF_BRIEFS, ...INTL_BRIEFS,
};
export const briefFor = (program: string): ProgramBrief | undefined => PROGRAM_BRIEFS[program];
