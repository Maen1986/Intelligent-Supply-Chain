/**
 * PLATFORM_LABEL — canonical display names and pill colours for every
 * automation platform the TemplatesTab supports.
 *
 * Kept in its own module so it can be imported by both
 * AdminAutomations.tsx and unit tests without pulling in React.
 *
 * IMPORTANT: every `platform` value that appears in
 *   artifacts/api-server/public/n8n-templates/manifest.json
 * MUST have a matching entry here.  The unit test
 *   TemplatesPlatformFilter.test.ts → "every manifest platform has a PLATFORM_LABEL entry"
 * will fail loudly if a new platform is added to the manifest without
 * updating this map.
 */
export const PLATFORM_LABEL: Record<string, { en: string; ar: string; color: string }> = {
  n8n:    { en: 'n8n',      ar: 'n8n',       color: 'bg-orange-100 text-orange-700' },
  make:   { en: 'Make.com', ar: 'Make.com',   color: 'bg-violet-100 text-violet-700' },
  zapier: { en: 'Zapier',   ar: 'Zapier',     color: 'bg-amber-100 text-amber-700'  },
};
