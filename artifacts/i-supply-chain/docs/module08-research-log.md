# Module 08 — Local Content/ICV research log

Round A.1 (22 Oct 2026) rewrote the customer-facing `sourceNoteEn`/`sourceNoteAr`
fields for 27 programs in `supplierLocalContentEligibility.ts`, replacing a
dated, builder-facing research diary with short, plain-language text a
procurement manager can actually use (status, what's published, what's
missing, last-checked date and sources, what to do now).

Per Decision Record 8.7, nothing disclosed in the old notes is allowed to be
*lost* — only moved. This file is where the dated research history, rejected
or unreconciled secondary-source claims, and internal scope decisions now
live, one section per program, in the order the customer-facing rewrite
removed them. The `sourceNoteEn`/`sourceNoteAr` fields still carry every
number, date, and source needed to use the program; this file carries the
*process* of how each conclusion was reached — the research trail, not the
answer.

This file is referenced directly by three tests in
`supplierLocalContentEligibility.test.ts` (search for `module08-research-log`)
that check specific disclosures below are still present somewhere in the
codebase, not deleted.

---

## sa-likt

Research history: 1 Oct 2026 pass fetched LCGPA's own site directly (not a
secondary summary) and confirmed LIKT is a real, government-code-anchored
mechanism, not merely a marketing label — but still carries no published
eligibility threshold. A prior round's working notes referenced an unconfirmed
"SAR 100 million" LIKT eligibility figure; the 1 Oct pass searched specifically
for that figure across LCGPA's own English- and Arabic-language pages and
found no source stating it for LIKT — it was not carried into the file,
per Decision Record 8.7 (an unconfirmable figure is dropped, not repeated).
2 Oct 2026 pass confirmed GAMI's own Industrial Participation Policy PDF never
uses the string "LIKT" anywhere — two separate regulators, two separate
instruments. The same 2 Oct pass resolved a third question: whether LIKT is
an informal name for LCGPA's 2023 Economic Participation (EP) Policy. It is
not — LIKT is a 2021-activated sector-agreement contracting method; the EP
Policy is a 2023, per-bid, per-contractor compliance gate (SAR 100m
imported-goods trigger, 35% minimum). The EP Policy is modeled separately as
`sa-economic-participation-policy`. The "SAR 100 million" figure customers may
see referenced elsewhere belongs to that program, not LIKT.

## sa-tharwah-maaden

Research history: Ma'aden's own Tharwah page was fetched directly (1 Oct
2026), confirming no scoring formula exists on the public page — the program
is opportunity-mapping and investment-facilitation, not a per-supplier scoring
mechanism. 2 Oct 2026 pass found the Tharwah page links a Supplier Portal and
two centralized-application portals, both login-gated; this platform's
sourcing standard verifies only publicly-published material, so it could not
confirm or deny whether a scoring methodology sits behind those portals —
disclosed as the actual boundary of what was checked, not treated as a
confirmed absence. 20 Oct 2026 pass (Round A) re-checked via an independent
secondary summary (analytix.sa, 2026) of Ma'aden's vendor-registration
process and reached the same negative result. That summary separately named
the LCGPA national Local Content Certificate (19-month validity) as the
credentialing mechanism Ma'aden suppliers actually need — that is LCGPA's own
general scheme (modeled elsewhere as `sa-mandatory-list`), not a
Tharwah-specific methodology, so it does not resolve this entry. The
registration steps are described as following "Ma'aden's own published
registration manual," but no title, version, or date was given for that
manual, so it could not be independently located.

Comparison with stc's Rawafed program: unlike Tharwah, stc's own Rawafed
annual report (2021) publishes an explicit formula described as LCGPA-approved
(local content % = local goods/services + local salaries + local asset
depreciation + local capacity development, divided by the same totals) — the
same 4-pillar shape as LCGPA's own general score. Rawafed is modeled
separately as `sa-rawafed-stc` and is fully sourced. Tharwah's public
materials describe goals and initiatives but not a scoring methodology, which
is the concrete difference between the two Ma'aden-category entries.

## om-icv

Research history: multiple passes (1 Oct, 2 Oct, 20 Oct 2026) searched PTLC's
own site, Ithraa/Invest Oman, and secondary ICV-advisory sources for a
published weighting formula and found none each time — every source either
restates the 2013-era qualitative framing or describes the two narrower,
already-modeled mechanisms (`om-mandatory-list`, `om-oq-price-preference`).
The 2 Oct 2026 pass checked a BDO advisory summary that names the same seven
ICV elements the research brief itself listed, confirming the elements are
real and named but the weighting across them is not published. The 20 Oct
2026 pass (Round A) surfaced Oman's National Local Content Policy (2024-2030,
Oman Observer, 4 Aug 2026) as a newer, dated instrument — but it is a
four-pillar macro roadmap ("a road map and a compass"), not a scoring
instrument, and does not resolve the still-unpublished ICV weighting formula.

## qa-national-strategy

Research history: 29 Sep and 1 Oct 2026 passes re-searched Qatar Tribune,
Gulf Times, and the National Planning Council/Ministry of Finance's own pages
for any implementing formula and found none beyond the original approval
coverage. The 2 Oct 2026 pass attempted to read Cabinet Decision No. 11 of
2025's primary text directly via Lexis Middle East's law database
(lexismiddleeast.com) rather than secondary news coverage — that fetch
returned a server error (HTTP 404), so the primary text could not be
independently read that round; disclosed as an access failure, not evidence
either way. What was independently confirmed from the surrounding search
results is that Lexis Middle East lists Cabinet Decision No. 11/2025 by the
title "On the Establishment of the Ministerial Committee for National Local
Content" — an institutional/governance decision, consistent with every other
source describing it as establishing a committee rather than a scoring
formula. The 20 Oct 2026 pass (Round A) went to Qatar's state news agency
directly (qna.org.qa) and corrected the Strategy's approval date: 10 Jun 2026,
not 11 Jun 2026 as earlier carried — the 11 Jun date reflected Gulf Times'
own publication date reporting on "yesterday's" Cabinet meeting, not the
meeting date itself.

Round A.3 D6 (22 Oct 2026) addendum: the brief asked this round to try
cabinet.gov.qa, mof.gov.qa, and QNA's Arabic article for this exact Cabinet
session and quote the Arabic title if found. QNA's own primary article for
10 Jun 2026 was located and fetched directly in English
(qna.org.qa/en/News-Area/News/2026-6/10/cabinet-holds-weekly-meeting),
confirming the title "General Policy and Strategy for National Local
Content," the 10 Jun 2026 date, and that it was prepared by the Ministry of
Finance with the National Planning Council under Cabinet Decision No. 11 of
2025 -- all independently corroborated by Gulf Times' report of the same
meeting (gulf-times.com/article/727284). Neither cabinet.gov.qa nor
mof.gov.qa surfaced a matching page in this pass's searches, and QNA's
Arabic-language (ar-QA) article for this same date could not be located --
its language-switcher link resolves to a generic search page, not a direct
article URL, and no search query tried this round turned up the Arabic
article's own URL. This round's search therefore upgraded the confidence
behind this program's existing Arabic title `السياسة العامة والاستراتيجية
الوطنية للمحتوى المحلي` (now independently corroborated via QNA's own
English-language primary reporting, not just secondary Gulf Times/Qatar
Tribune coverage) without reaching a directly-quoted primary Arabic-script
source -- disclosed as a partial, not full, resolution of D6(c).

Gap-closure pass, 23 Oct 2026 (per the owner's "close the 3 disclosed gaps"
instruction): two further attempts were made to find a primary Arabic-script
quote of the Strategy's own exact title, both of which turned up a real but
adjacent result rather than the Strategy's own title. Al Meezan
(almeezan.qa), Qatar's official legal-portal, indexes a verbatim Arabic
title for Cabinet Decision No. 11 of 2025 itself (LawID=9984) via
search-engine-indexed title text: `قرار مجلس الوزراء رقم (11) لسنة 2025
بإنشاء اللجنة الوزارية للمحتوى المحلي الوطني` -- "Cabinet Decision No. 11 of
2025 Establishing the National Local Content Ministerial Committee." This is
a genuine primary-source Arabic title, but it is the title of the 2025
*committee-establishing* decision, not the Strategy document itself (which
the Cabinet approved later, under that committee's recommendation, on 10 Jun
2026) -- so it corroborates the surrounding institutional structure without
closing the gap. The live Al Meezan page could not be fetched directly to
look for a cross-reference to the Strategy's own title: WebFetch returns
only the portal's SPA shell (content loads via client-side JavaScript, not
present in the initial HTML), and a direct Playwright fetch of the same URL
fails with `net::ERR_TUNNEL_CONNECTION_FAILED` -- confirmed via this
sandbox's own proxy-status endpoint to be a deliberate egress-policy block
on general external domains (`403` logged against almeezan.qa in
`recentRelayFailures`), not a transient failure. Two further targeted
WebSearch queries this round (Arabic-language, combining "National Planning
Council," "general policy," "local content," and "strategy") surfaced no
new primary source beyond what Round A.3 D6 already found.

**Honest conclusion, not yet closed:** no primary Arabic-script quote of the
Strategy document's own exact title has been found across five research
rounds (29 Sep, 1 Oct, 2 Oct, 20 Oct, Round A.3 D6, and this 23 Oct pass).
The working hypothesis, strengthened but not proven this round, is that the
Strategy itself may never have been separately gazetted or published with
its own standalone Arabic title distinct from QNA's and Gulf Times'
descriptive coverage -- Cabinet "approval" of a strategy document, as
opposed to a numbered Cabinet Decision like 11/2025, does not always produce
a separately-published legal-portal entry in Qatar's system. This is a
disclosed limitation, not a closed gap: the existing Arabic title in the
module (`السياسة العامة والاستراتيجية الوطنية للمحتوى المحلي`) remains the
best-supported rendering (directly consistent with QNA's own English
primary title, translated conventionally), but it is not a verbatim quote of
a primary Arabic-script source, and this entry should continue to say so
rather than imply full verification. Per Decision Record 8.7, this gap is
disclosed as genuinely unclosable with the tools available in this sandbox
session -- a future session with broader web access (or a human with direct
access to Qatar's Official Gazette archive) is the realistic path to closing
it, not further search-tool iteration from here.

## bh-local-content

Research history: the Bahrain Tender Board's own Guideline (Nov 2025) was
checked cover-to-cover for any general/umbrella local-content section and
found none — only a single interaction rule (page 24) stating the higher of
multiple applicable preferences is granted. The 2 Oct 2026 pass checked one
further specific secondary claim raised in the original brief: that a
"Domestic Preference Circular No. 1 of 2023" gives ALL Bahraini-registered
companies a general 10% price preference (not SME-limited), stacking with the
SME-classification preference for a combined 20%, per tendersarabia.com's
Bahrain tender guide and a PwC "Doing Business in Bahrain" guide. Per the
brief's own instruction, this pass went to the Tender Board's own primary
text rather than those secondary summaries. Circular No. 1 of 2023 was
located and fetched directly; its own title, translated, is "Circular
Regarding Application of Preference for Industrial Establishments with Local
Added Value Certificate (Takamul)," issued 27 August 2023 — it is not a
separate general-company preference at all; it is the same circular that
already governs the Takamul preference modeled as `bh-takamul-local-value`.
The circular's own text states preferences do not stack — the higher single
rate is granted, the same rule the Guideline's page 24 documents. The
tendersarabia.com/PwC claim of a stacking 20% preference does not match
Circular No. 1 of 2023's own text — disclosed here explicitly as a
discrepancy between what those secondary sources report and what the Tender
Board's own primary text states, per Decision Record 8.7 (a conflict is
disclosed, not silently resolved by adjusting the modeled figure to match the
secondary claim).

Round A.3 D6 (22 Oct 2026) addendum: the official Arabic name of Bahrain's
Tender Board is `مجلس المناقصات والمزايدات`, confirmed from a primary
tenderboard.gov.bh Arabic HTML page (not a PDF),
`https://www.tenderboard.gov.bh/Ar/AboutUs/Overview`, whose footer reads
`مجلس المناقصات والمزايدات - مملكة البحرين`. The customer-facing sourceNoteAr
for this program and for `bh-takamul-local-value`, `bh-gulf-made-preference`,
and `bh-bahrainisation-tender-workforce` (plus that last program's own
Bahrainisation recommendation string) were updated from the prior, unverified
descriptive phrase `هيئة المناقصات البحرينية` / `هيئة المناقصات` to this
confirmed name, with verb/pronoun agreement switched from feminine to
masculine throughout (`مجلس` is grammatically masculine). See
`docs/module08-arabic-glossary.md`'s Bahrain Tender Board entry for the full
citation.

## cn-defense-domestic-sourcing

Research history: three separate passes (29 Sep, 1 Oct, 2 Oct 2026) searched
open-source Chinese-language defense-industry and policy reporting for a PLA
domestic-sourcing numeric threshold and found none each time — coverage
remained strategic/descriptive (Military-Civil Fusion literature, the US
DoD's unrelated "1260H" Chinese-military-company list, FY2026 NDAA China
provisions). The 2 Oct 2026 pass found the actual answer by searching China's
CIVILIAN government-procurement regime instead of PLA-specific literature:
the Ministry of Finance's Notice (Guobanfa [2025] No. 34, effective 1 Jan
2026) covers defense procurement too, but per china-briefing.com's own
explainer, "the exact thresholds have not yet been released" — the Ministry
of Finance will develop product-specific standards "over the next five
years." This is a stronger, more specific negative finding than the earlier
passes reached: the reason no threshold is published is not regulatory
silence but an explicit, dated deferral to a multi-year rulemaking process.

## de-eu-gpa-non-discrimination-baseline

Research history: the original brief cited this as GPA "Article IV"; a direct
fetch of the WTO's own revised-GPA summary found the correct citation is
Articles III (National Treatment and Non-Discrimination) and V (offsets
prohibition) — the file now cites the article numbers the GPA's own text
actually uses. The 1 Oct 2026 pass re-checked whether this remains correctly
a "confirmed absent" finding and found a significant, dated development: on 9
Sep 2026 the European Commission presented a proposed EU Public Procurement
Act (COM(2026) 590 final, per hsfkramer.com's analysis, corroborated by
electrive.com and sustainable-bus.com) that would introduce a "European
preference" mechanism — letting buyers restrict participation to EU/covered
operators, require EU-origin percentages, apply evaluation preferences, and
reject tenders below 50% EU/covered-country content, alongside a rule
requiring quality criteria to carry at least 30% of award-evaluation weight
(50% for labor-intensive contracts). As of that pass this remained a
proposal: feedback open through 16 Nov 2026, co-legislator agreement not
expected before late 2027.

## de-edip-defense-local-content

Research history: prior rounds left this not-yet-sourced on the view that
EDIP's co-funding-eligibility shape was too different from a per-bid
mechanism to model — the 1 Oct 2026 pass concluded the concern was about
mis-modeling it as a price preference, not about the threshold itself being
uncomputable. The 65%/35% content-split figures are corroborated by two
independent law-firm sources (CMS, Gleiss Lutz), not the single Council
press-page citation prior rounds relied on. Gleiss Lutz's own article
attributes the threshold to "Article 10(3)-(4)" of EDIP Regulation (EU)
2025/2643, but this could not be independently verified against the
Regulation's own primary text — EUR-Lex's page
(eur-lex.europa.eu/eli/reg/2025/2643/oj/eng) returned only document metadata
on every fetch attempt, never the article text itself, consistent with every
EUR-Lex attempt across this engagement. The design-authority requirement
(full design authority must remain with EU/associated beneficiaries) and the
15%-35% pre-existing-subcontractor-relationship carve-out are real, sourced
facts from an earlier pass, deliberately not folded into the single computed
field — they are eligibility preconditions distinct from the content-share
arithmetic itself.

## eg-auto-local-content

Research history: both sources (Cabinet statement 28 Apr 2026, independently
reported by Ahram Online and EgyptToday) also report an incentive-VALUE
formula for manufacturers that clear the gate — a base incentive capped at
30% of ex-factory price or EGP 150,000/vehicle (whichever binds), plus a
bonus of EGP 5,000 per additional 1% of local content above a 35% threshold —
but neither source states whether that per-percentage-point bonus stacks on
top of, or is bounded within, the base cap. Assuming either order would
fabricate a formula the sources do not themselves resolve, so this platform
models only the eligibility gate, not the incentive amount. This supersedes a
prior pass's EnterpriseAM-sourced "60% local content / 100,000 vehicles"
framing: that figure is not contradicted (100,000 units/year matches the
Cabinet statement's production ambition; 60% likely describes a
longer-horizon value-added target across later program phases), but the
Cabinet statement is the more specific, more recently and more consistently
corroborated source for the actually-operative near-term thresholds. A
separate EGP 5.5bn export-subsidy program (EnterpriseAM, 4 May 2026) is a
genuinely different mechanism, not modeled here.

## in-dap-2020-defense-offset

Research history: prior rounds left this not-yet-sourced because DAP 2020's
offset-discharge mechanics (avenue selection, Indian Offset Partner
qualification, multiplier banking) seemed too intricate for a single
supplier-computable formula. The 1 Oct 2026 pass found the avenue-multiplier
table itself is published in enough detail by two independently-written
professional sources (mondaq.com, lexcounsel.in) to model cleanly, even
though whole-portfolio banking and Indian-Offset-Partner-qualification
nuances remain disclosed-but-unmodeled. This deliberately does not model
DAP 2020's separate Buy (Global) Indigenous-Content escape valve (clearing a
30% IC threshold instead of owing the offset at all) — a genuinely different
eligibility branch not conflated with the offset-discharge gate itself. A
draft DAP 2026 (10 Feb 2026, stakeholder comments closed 3 Mar 2026) was
found in an earlier pass and remains unresolved: this pass re-checked for
confirmation that DAP 2026 has been finalized and found none; DAP 2026's own
disclosed provisions (where found) touch a different category (Buy
Indian-IDDM, 50%-to-60% Indigenous Content), not Buy (Global)'s own 30%
offset figures this program is sourced to.

## jo-price-preference

Research history: the statutory basis (Government Procurement Bylaw No. 8 of
2022, Art. 8(a)(7) and Art. 15(b)(1)) was identified in a 21 Sep 2026 Jordan
deepening pass. The bylaw's existence, number, and issuing-article citation
are corroborated by multiple independent official/university-hosted mirrors
(Government Tenders Directorate, Government Procurement Department, several
public-university procurement pages); the specific article wording was read
via automated PDF text extraction that showed OCR artifacts, so it should be
treated as a reliable citation to the right bylaw and articles, not a
pristine verbatim quote of the Arabic text.

## jp-kankoju-sme-target-ratio

Research history: this pass deliberately re-searched for a second genuine
Japanese local-content-flavored mechanism (per the brief's own instruction to
start with Japan as one of the two shallowest countries) and found none
beyond Kankouju's own SME-targeting regime — Japan genuinely runs one such
mechanism. Modeled via a genuinely new function (computeSpendSetAsideJp)
that, unlike Jordan/Bahrain/Kuwait's module-level-constant wrappers, requires
the current fiscal year's target ratio as caller-supplied input, because no
single constant can honestly represent a target legally re-set every fiscal
year.

## kr-sme-competitive-products-gate

Research history: the 2022-2024 designation cycle listed 213 products across
632 detailed subcategories (net +18 vs. the prior cycle). The 29 Sep 2026
pass found the designation cycle had rolled over: the 2025-2027 designation
(effective 1 Jan 2025) lists 610 product items — 14 newly added (e.g.
running shirts, commercial electric ranges), 32 excluded, 47 adjusted. The
historical 213/632 figure is kept here as a disclosed reference point rather
than silently overwritten, since the two cycles' item-counting methodology
was not confirmed identical. Per the same official announcement, the
SME-exclusive competitive-products market reached approximately KRW 28
trillion in 2023, about 22% of total public SME-product procurement. The
underlying binary AND-gate mechanism (category-designated +
direct-production-certified) is unchanged by the cycle rollover.

## kr-sme-purchase-target-ratio

Research history: this pass also deliberately re-searched for a genuinely
different third Korean mechanism and found none beyond this Act's own two
articles (5, and 4/8/9 for the related competitive-products-gate program) —
Korea genuinely runs two distinct mechanisms under one statute, not three.

## kw-local-content

Research history: the 1 Oct 2026 pass went to the law's own primary text
(Al Tamimi & Company's legal update quoting Article 87 directly) rather than
a tertiary aggregator, and found Article 87's two independent 30% thresholds
sitting inside the general Public Tenders Law all along, not a separate
umbrella program. The same Al Tamimi update also states the Central Agency
for Public Tenders' approval-exemption ceiling rose to KD 75,000 (from KD
5,000 under the superseded 1964 law) — this is disclosed here because it is
a DIFFERENT provision (a procurement-approval-routing threshold, not an
Article 87 local-sourcing trigger); this engine deliberately does not apply
KD 75,000 as Article 87's own trigger value, since Al Tamimi's own article
does not state that Article 87 is scoped by that figure.

## kw-nationality-price-preference

Research history: this 10% nationality preference was first flagged as a
real candidate "fourth Kuwait program" in an earlier pass's own sourceNote,
and implemented in a 29 Sep 2026 verify-then-extend round. Two further real,
sourced findings from that same research pass were investigated and
deliberately not modeled as separate programs: (1) a mandatory minimum 30%
local-market-sourcing requirement for foreign bidders under the same Decree
No. 30/2017 — a genuinely different mechanism type (a compliance mandate,
not a price preference) from KPC's own 30%-by-2040 target, and now modeled
as its own program (`kw-local-content`'s Article 87, which is CAPT-
administered and cross-government, distinct from KPC's internal policy); (2)
a single-sourced 20% SME preference reported by tenderspedia.com alone,
uncorroborated by trade.gov, fac-arab.com, or any other source — per this
platform's Never-Fabricate standard, disclosed as investigated-but-rejected,
not modeled, the same treatment already applied to a similar Pinsent Masons
claim in Qatar's own entry.

## kw-tender-law-price-preference

Research history: the 15% figure is corroborated by three independent
sources (Al Tamimi, tenderspedia.com, trade.gov's Kuwait Country Commercial
Guide, which states plainly "a 15 percent price preference favoring domestic
and GCC-produced items"), plus the law's own primary text hosted on
kdipa.gov.kw. Two further real, sourced findings from this same research pass
were investigated and deliberately not modeled as separate programs within
this entry (each is its own separately-modeled program instead, to avoid
conflating distinct mechanisms under one program): (1) a distinct 10% price
preference specifically for Kuwaiti-nationality companies (trade.gov and
tenderspedia.com both state this separately from Article 62's 15%
national-PRODUCT preference) — now modeled as `kw-nationality-price-
preference`; (2) a mandatory minimum 30% local-market-sourcing requirement
for foreign bidders under the same Decree No. 30/2017 — a genuinely different
mechanism type (a compliance mandate, not a price preference) and a
genuinely different legal basis/buyer scope from KPC's own 30%-by-2040
target (this one is CAPT-administered and cross-government). Separately,
tenderspedia.com alone (uncorroborated by trade.gov, fac-arab.com, or any
other source found) states a further 20% price preference for SMEs
registered with Kuwait's National Fund for SME Development; per this
platform's Never-Fabricate standard, this single-sourced figure is disclosed
as investigated-but-rejected, not modeled — the same treatment already
applied to a similar Pinsent Masons claim in Qatar's own `qa-tenders-icv`
entry.

## sa-economic-participation-policy

Research history: this program was modeled after the platform owner's own
brief flagged a real, dated, computable LCGPA mechanism sitting unmodeled
under no name in the file. It deliberately mirrors GAMI's own
gami-valuation-factor-credit-gate shape but with three disclosed, deliberate
differences: (1) the percentage base is imported-content value, not total
contract value; (2) no SME or sole-source bonus is sourced for this policy
(GAMI's own bonuses are GAMI-specific, not carried over by assumption); (3)
no performance-security amount or liquidation-on-shortfall formula is
published for the EP Policy specifically, so this engine never fabricates a
penalty amount GAMI's own policy happens to disclose but this one does not.
DGA Group's own follow-up article reports LCGPA issued an updated version of
this policy for public consultation, proposing a lower flat 25% requirement
replaced by a tiered schedule — as of this check this remains a consultation
draft, not confirmed in force, so the currently-in-force 35%-flat version is
what is modeled.

## sa-gami-defense

Research history: this program was resolved after the platform owner's own
independent re-research found, in under 20 minutes, the exact primary-source
formula two prior passes (29 Sep and 1 Oct 2026) had read in full and then
still called "too complex to reduce to a single supplier-computable
formula." That self-assessment was the error, not the source material — GAMI's
own Industrial Participation Policy PDF (Version 1.0.0, 15 Sep 2019 AD) was
re-fetched directly and confirmed verbatim. What remains deliberately
unmodeled, and is disclosed rather than silently dropped: the policy's own
Bonus Credit (an additional 10% of the Industrial Participation Commitment
once a contractor achieves ≥30% Localization, page 15) and its Excess Credit
banking system (credit earned on one contract carried forward up to 5 years,
capped at satisfying 25% of a future commitment from banked credits, page 17)
are real, sourced, cross-contract, multi-year mechanics this single-
assessment engine does not aggregate across contracts or time — a bounded
scope decision.

## tr-defense-offset

Research history: three prior passes (15/29 Sep, 1 Oct 2026) all read the
same two sources this program relies on and each time stopped at an
unreconciled figure conflict (herdemlaw.com's granular sub-thresholds vs.
mondaq.com's single "70% of bid amount" headline) rather than modeling the
parts that were never actually in conflict. The 2 Oct 2026 pass re-fetched
herdemlaw.com's own comparison directly and confirmed the 2022 Guideline (now
in force, superseding the 2011 edition) states three separate sub-liabilities
that mondaq's single headline figure does not actually contradict once read
as a less granular description of the same regime. Separately, SSB (the
Presidency of Defence Industries) requires a performance guarantee of 6% of
total offset liabilities, and a tiered shortfall penalty regime (6% of that
period's shortfall initially, rising to a 50% uplift on outstanding
liabilities if an extension is granted, and a final 25% penalty on anything
still unfulfilled) — both real and sourced, but deliberately not modeled as a
single computed liquidation figure, because the penalty structure depends on
multi-period program dynamics this single-assessment engine has no sourced
way to resolve into one deterministic number.

## uk-below-threshold-reservation

Research history: a separate, real UK mechanism — "social value" evaluation
weighting under the Public Services (Social Value) Act 2012 and the
Procurement Act 2023's National Procurement Policy Statement (Cabinet Office
PPN 002; the devolved equivalents — Wales' WPPN 003 and Northern Ireland —
both mandate a minimum 10% social-value weighting, England sets no mandated
minimum, Scotland encourages but does not mandate one) — is deliberately not
modeled as a second UK program. It is real and sourced, but structurally
different from every mechanism in this file: each contracting authority sets
its own qualitative weighting per tender (bid-writing practitioners report
social value comprising up to 25% of marking criteria in some tenders), the
criteria span economic, social, and environmental wellbeing (not local
content specifically), and — critically — it must remain nationality-neutral
to stay compliant with the Procurement Act 2023's s.90 non-discrimination
duty, so no domestic/local-content sub-formula exists to source. A
Parliamentary bill, the Public Procurement (British Goods and Services)
Bill, would add mandatory consideration of UK goods/services and reporting
duties (including UK-origin food-content disclosure) — but its own drafters
were explicit that it creates no price preference or quota, precisely
because of the same s.90 duty. The Bill's own text (Bill 153, as introduced)
confirms this: Section 1 amends the 2012 Act to add a duty to CONSIDER how
British goods/services procurement might improve wellbeing (not a mandate to
prefer them), and Section 2 adds reporting duties — consideration and
disclosure obligations, not a price margin, quota, or set-aside.

## usa-berry-amendment-dod

Research history: specialty metals were originally covered by the Berry
Amendment but were carved out in 2006 to a separate statute (10 U.S.C.
2533b). This program was kept as not-yet-sourced through an earlier
continuation pass on the reasoning that no single clean numeric threshold
holds across all three product categories — the 29 Sep 2026 verify-then-
extend pass re-read that finding and concluded a numeric threshold was never
the right bar: the rule is a binary compliance question once a purchase is
Berry-covered at all, structurally identical to how the Build America, Buy
America Act's own waiver-and-exception complexity is handled.

## usa-sba-small-business-setaside

Research history: unlike GCC/Jordan's nationality-based local-content
set-asides, this is a US federal small-business-STATUS set-aside, not a
sub-national geography or domestic-manufacturing-content requirement — the
United States has no single federal analog to a state/province-level
local-content preference. Individual US states run their own, non-federal,
in-state preference statutes; these are out of scope for this federal-
procurement-focused program, the same "real but out of scope" disclosure
already applied to the UK's absent England/Scotland/Wales/Northern-Ireland-
level PPN 005 boundary.

## bh-takamul-local-value

Research history: 29 Sep 2026 verify-then-extend pass found and verified this
directly from Bahrain's Tender Board "Guideline for Suppliers & Contractors"
(Version 1.0, Nov 2025, tenderboard.gov.bh), page 25, under Cabinet Decision
No. (11-2679). Confirmed as a genuinely different qualifying criterion from
Bahrain's SME-status preference (a certified local-value-add credential tied
to specific listed products, not a company-size classification) — the same
"narrower real mechanism, general framework stays unsourced" precedent
already established for Kuwait's `kw-local-content`. The Guideline states
that where more than one preference could apply, the establishment receives
only the higher single rate, not a stacked total — disclosed as context; this
engine assesses each program independently and does not compute cross-program
stacking itself.

## bh-gulf-made-preference

Research history: 29 Sep 2026 verify-then-extend pass, same Tender Board
Guideline (Version 1.0, Nov 2025, page 24) as `bh-takamul-local-value`, under
Cabinet Decision No. 40 of 2015 adopting the GCC's unified national-product
preference rules. Confirmed as a product-origin-based criterion, genuinely
distinct from both the SME-status preference and the Takamul local-value
certificate preference — a product can be Gulf-made without its manufacturer
holding a Takamul certificate for it. Mirrors the same GCC Unified Economic
Agreement national-treatment logic already modeled for the UAE
(`ae-gcc-origin-treatment`) and Kuwait (`kw-tender-law-price-preference`). As
with Takamul, the Guideline grants only the higher of multiple applicable
preferences, not a stacked total — disclosed as context, not computed.

## bh-bahrainisation-tender-workforce

Research history: 2 Oct 2026 pass, genuinely distinct from `bh-local-content`
(a workforce-nationality gate, not a goods/local-content mechanism, so never
a candidate to resolve that program directly). Lexis Middle East (22 Nov
2024) reports Bahrain's Parliament approved a 20% Bahraini-workforce
requirement for government tender bidders on 20 Nov 2024; some legislators
pushed for up to 50% and called 20% "a starting point." This pass went back
to the Tender Board's own current Guideline (Nov 2025, page 12) directly: it
requires a valid Bahrainisation Certificate from the Ministry of Labour but
does not itself restate a percentage — it delegates the exact figure to
separate Ministry of Labour regulation, consistent with (not contradicting)
the 2024 Parliament figure, but meaning the Guideline itself is not this
gate's primary numeric source. Separately, DLA Piper's GENIE legal-update
service (14 May 2025) reports a different, higher 50% requirement that
applies only to privatised state-service contracts, not general tenders —
deliberately not used here, to avoid conflating two separately-sourced
figures with two different scopes. Both scoping caveats are disclosed above
rather than smoothed over.

## cn-govt-procurement-law-domestic-mandate

Research history: Article 10 of China's Government Procurement Law (enacted
2002, last amended 2014) was modeled via the same two-key
computeCategoryEligibilityGate primitive already used for the Saudi and
Omani Mandatory Lists and the UK's PPN 005 and USA's BABA gates — zero new
computation logic, the same reuse-before-inventing discipline applied to
every prior country. The dispatcher maps Article 10's three real exemptions
(goods/services unavailable domestically or on reasonable commercial terms;
procurement for use outside China; another statute provides otherwise) onto
the primitive's existing two-key shape, with the second key genuinely shared
with `cn-domestic-product-price-preference`'s domestic-product classification
test (the same `inputs.cn.meetsDomesticProductCriteria` value), not a
duplicated question. This is the structural domestic-purchase-by-default
mandate under Article 10 itself — a bid-eligibility gate, not a price
preference layered on top of open competition the way the price-preference
programs are.

---

# Round A.2 additions (22 Oct 2026) — the 16 previously over-cap programs

The 16 programs below were deliberately left out of Round A.1's scope (they already had no F2-style jargon, so the jargon-hygiene pass had no reason to touch them) but were over the 135-word customer-note cap. Round A.2 task F4 rewrote all 16 to the same customer shape as the other 36 programs and deleted the disclosed over-cap allowlist, so the 135-word cap now applies to all 52 with no exceptions. This section records the process/sourcing narrative moved out of each note, per Decision Record 8.7 (moved, not lost).

## sa-rawafed-stc

Research history: stc's own Rawafed Program Annual Report (Version 1, 2021) was fetched directly from stc.com rather than relied on via secondary summary. The 4-pillar eligible-spend-ratio formula is reused, not duplicated, from LCGPA's own general-score shape — the same structural judgment already applied elsewhere in this file. The SAR ~16 billion figure is the report's own stated scope of large high-value project procurement the formula was applied against, not a target or cap stc commits to going forward; disclosed here as historical scale context rather than kept in the customer note, which only needs the formula and applicability scope.

## sa-sabic-lc-commitment

Research history: no public SABIC-wide local-content percentage target exists in any source checked across this file's history — SABIC's actual practice (per-contract negotiated commitment, audited against delivered local content) was confirmed directly by the platform owner, not sourced from a SABIC publication. The deviation-tolerance (5 percentage points) and penalty-cap (1% of contract value) constants are explicitly disclosed, in both the customer note and here, as this platform's own business-rule defaults rather than a published SABIC or regulatory standard — this is the one program in the file whose computational constants are platform-owned rather than source-owned, and that distinction is preserved in the customer note itself, not just here.

## ae-icv-general

Research history: the Manufacturing/Third-Party Spend, Investment, Emiratisation, Expatriate Contribution, and capped bonus category weights are a best-available reconstruction from public secondary sourcing of MoIAT's official ICV guideline document, not a byte-verified transcription — this caveat is also kept in the customer note itself since it is directly relevant to reliance. MoIAT's own program page was fetched directly and confirms ICV certification is an incentive (tender-evaluation advantage) rather than a mandatory bidding gate — this research pass found no sourced evidence of a mandatory ICV-only bidding category comparable to Saudi's Mandatory List, a genuine negative finding disclosed as such.

## ae-tawazun-offset

Research history: sourced from the Tawazun Economic Council's 2019 policy guidelines via afridi-angell.com, mondaq.com, and trade.gov's UAE Defense Country Commercial Guide, none flagging a more recent revision as of this check. The USD 10 million / AED 36.73 million dual-currency figure resolves a currency-citation ambiguity flagged in this module's original brief by confirming both are the same threshold at the UAE's fixed 3.6725 peg, not two different figures.

## ae-gcc-origin-treatment

Research history: Article 1(b) and Article 3(1) of the GCC Unified Economic Agreement were checked directly against the agreement's UNCTAD-archived text and gaft.gov.sa's own summary. gaft.gov.sa's claim that the Agreement gives GCC entities "the same privileges as citizens in government procurement" could not be independently confirmed against a numbered article — Article 8 (the Agreement's general national-treatment article) covers work, residence, ownership, and economic activity broadly but does not use the words "government procurement" itself; this is disclosed as an open citation gap in the customer note, not resolved by assumption. Separately confirmed: neither MoIAT's own ICV materials nor UAE Federal Decree-Law No. 11 of 2023 (Articles 13(2)/22(2), which govern "national products"/"locally produced" preferences) mentions GCC-origin treatment at all — a real, disclosed gap between treaty entitlement and UAE's own domestic procurement law text.

## jo-contractor-quota

Research history: Jordan's Council of Ministers 7 May 2018 decision was sourced via Jordan Times' own reporting of the Cabinet decision. The decision's own framing under the 2018-2022 Economic Growth Plan, including the 5-percentage-point annual escalator "during the time frame" of that plan, means no primary-source reconfirmation exists for any year after 2022 — whether the escalator continued, plateaued, or was superseded is genuinely unknown, so this file computes only against the disclosed 2018 base of 35%, never an extrapolated current-year figure, consistent with Decision Record 8.7.

## qa-icv-tawteen

Research history: the base-ICV-score formula, the "ICV+" 50% manufacturer bonus, the "blanket score" 30% minimum for micro/small suppliers, and the up-to-15-percentage-point strategic-behavior bonus are all sourced directly from icv.qa's own FAQ and Enhanced Program pages, not a secondary summary. The 15-point bonus is modeled as a capped, self-reported, caller-supplied input rather than independently computed from sub-components, because icv.qa does not publish the internal weighting behind it — this is disclosed in the customer note itself since it materially affects how much weight a supplier should place on a claimed bonus figure.

## qa-tenders-icv

Research history (the longest entry in this file before Round A.2's rewrite, now condensed to roughly 136 words in the customer note): Article 2 and Article 3 of Qatar's Tenders and Auctions Law (Law No. 24 of 2015) Executive Regulations were confirmed via two independent law-firm summaries of the same amended text (K&L Gates' own analysis and a parallel National Law Review summary of the same underlying source). Article 4's real, sourced, but purely procedural SME provisions (fee exemption below QR1 million, exemption from performance guarantees, authority discretion to restrict tenders below QR5 million to micro/small enterprises, a 50% reduction in the standard SME-classification fee) are genuinely out of this mechanism's scope — they are not a spend-ratio and are deliberately not modeled as a computed score, disclosed here rather than in the shortened customer note. The Pinsent Masons claim (Articles 33/34 of the base Tenders Law mandating a minimum 30% local-market purchase) was investigated against three other independent summaries of the same law (Mondaq; qatarlaw.com/Sultan Al-Abdulla & Partners, a Qatari law firm itself; and the US government's own trade.gov Qatar Country Commercial Guide), none of which mention any such percentage or these article numbers despite discussing the law's other provisions in comparable detail — per this platform's Never-Fabricate standard, disclosed as investigated-but-rejected, not modeled. A separate search for SOE-specific/sector-authority/anchor-buyer local-content mechanisms beyond icv.qa and this Tenders Law provision — at Kahramaa, Ashghal, Qatar Development Bank's Moushtarayat/"Access to Local Markets" matchmaking program (confirmed to carry no percentage threshold), Qatar Free Zones Authority, Manateq, Qatar Rail, and Mwani Qatar/Hamad Port — found no further distinct, publicly computable mechanism at any of them; this negative result is disclosed rather than omitted, though it no longer fits in the customer-facing note itself and lives here instead.

## eg-price-preference

Research history: Law No. 5 of 2015 (as amended by Law No. 90 of 2018) and the 40%/15% figures were confirmed via the US government's own trade.gov "Egypt — Selling to the Public Sector" guide. A genuine citation discrepancy exists between sources on which law governs overall procurement procedure: trade.gov's own guide cites the older Tenders and Bids Law No. 89 of 1998, while a separate legal summary (riad-riad.com) states Law No. 182 of 2018 replaced that 1998 law — disclosed rather than resolved by assumption, the same treatment already applied to Jordan's own unconfirmed bylaw citation elsewhere in this file. No dedicated certifying/administering authority for the 40% local-content determination was identified in this research pass's sourcing.

## eg-oil-gas-price-preference

Research history: Egypt's Production Sharing Agreement (PSA) model was sourced to the Mines and Quarries Law of 1953, the Investment Guarantees and Incentives Act of 1997, and the Ministry of Petroleum's own PSA terms. No numeric administering-body confirmation beyond the general PSA contractual language was found — the source article's own recommendation that Egypt establish "a unique and specialized department in the Ministry of Petroleum to manage local content" implies no such department is confirmed to exist yet, disclosed as an open item rather than assumed.

## tr-price-preference

Research history: Turkey's Public Procurement Law No. 4734, Article 63(c), and the mandatory-for-medium/high-tech-goods status of the 15% preference were confirmed via a Kamu Ihale Kurumu (KIK) ruling reported by satinalmadergisi.com, which found a contracting authority's use of only 7% for high-tech medical equipment non-compliant and ordered the relevant tender sections cancelled. This resolves what might otherwise look like a live 7%-vs-15% rate conflict: the "7%" figure that surfaces in some sources is a documented violation of the mandatory rate, not an alternative statutory rate — disclosed as such rather than presented as two live options. The advantage-added-to-competing-bids (not discount-to-domestic-bidder) mechanic is sourced to a KIK-decision summary via salimdemirel.com.tr.

## usa-buy-american-price-preference

Research history: the Buy American Act's rising domestic-content threshold (65% for 2024-2028, 75% from 2029) and FAR 25.105's size-dependent margin (20% large business, 30% small business) are sourced to 41 U.S.C. 8301-8305, FAR Subparts 25.1/25.2, and FAR 52.225-1/52.225-3 clause text via acquisition.gov. The 2022 Executive Order 14005/FAR Council rule's separate under-5%-foreign-iron-or-steel sub-test for items containing iron or steel, and the Made In America Office's published "critical item" list additional factor, are both real, sourced, but deliberately not modeled — the sub-test and the critical-item factor are each set per-item rather than as one universal percentage, disclosed as open items rather than forced into the single computed threshold. The $174,000 Trade Agreements Act threshold is current as of the March 2026 Federal Register update; above it, the domestic-content test is replaced by a "designated country end product" eligibility test governing foreign-bidder eligibility rather than a US supplier's own local-content standing.

## usa-baba-infrastructure-gate

Research history: the Build America, Buy America Act (BABA, Title IX of the Infrastructure Investment and Jobs Act, Pub. L. 117-58, 2021) is administered per-agency (DOT/FHWA, EPA, HUD, DOE and others each issue their own implementing guidance and waivers) rather than government-wide, and is triggered by receipt of federal infrastructure funding rather than by the buyer's own government/private status — reaching state DOTs, public water utilities, and public transit agencies as well as direct federal agency awards, but not a purely privately-financed project carrying no federal infrastructure funding. No single national phase-in schedule to a higher domestic-content percentage (comparable to the Buy American Act's 65%-to-75% step-up) was found for BABA's 55% manufactured-products floor; some individual agencies have proposed or piloted higher category-specific thresholds, disclosed as an open item rather than assumed.

## cn-domestic-product-price-preference

Research history: State Council General Office Document [2025] No. 34 (issued 28 Sep 2025, effective 1 Jan 2026) and its OR-gated eligibility shape (substantial-transformation-in-China test, or an 80%-of-bundle-cost mixed-category path) are modeled via a new function, computePricePreferenceCnDomesticProduct, which evaluates both paths independently before handing the resulting binary qualification to the shared computePricePreferenceMargin primitive — an OR-gate feeding a shared primitive, not a disguised reuse of another country's formula with new constants, the first mechanism of this shape in this file. The follow-on joint interpretive opinion from the Ministry of Finance and the Ministry of Industry and Information Technology (19 Dec 2025) clarifying that special-customs-zone products count as Made-in-China, and that procurement may not discriminate by a supplier's place of registration, ownership structure, or investor nationality, was fetched and confirmed directly rather than assumed from the Document's own text alone.

## cn-sme-price-deduction

Research history: Cai Ku [2020] No. 46 (effective 1 Jan 2021) and Cai Ku [2022] No. 19 (effective 1 Jul 2022, which roughly doubled the goods/services ranges without touching the 2020 engineering-works ranges) are modeled via a new function, computePricePreferenceCnSme, whose applicable band depends on both the supplier's role (direct small/micro vs. large/medium consortium-subcontract) and the procurement type (goods/services vs. engineering works) together — a 2×2 band-selection matrix with no counterpart elsewhere in this file. The consortium/subcontract path additionally requires clearing a real minimum 30% small-enterprise subcontract-share gate before any deduction applies at all; below it, the deduction is zero, not partial, the same gate-not-taper discipline already applied to the US Buy American Act threshold. Because every legal range here is genuine (the procuring entity sets the exact figure within the range), PricePreferenceMarginResult was extended with two new optional fields, preferenceMarginMinPct and preferenceMarginMaxPct, verified via a dedicated regression test to remain undefined for every other price-preference program in this file — an additive, backward-compatible extension, not a breaking change.

## in-make-in-india-price-preference

Research history: the Public Procurement (Preference to Make in India) Order 2017 (DPIIT), as revised 4 June 2020, and its three-tier classification (Class-I ≥50%, Class-II 20%-50%, Non-Local ≤20%) are modeled via a new function, computePricePreferenceInMakeInIndia. Class-II and Non-Local both currently resolve to a zero effective margin in this engine, since honestly distinguishing "eligible to bid, no price preference" (Class-II) from "excluded entirely" (Non-Local) would need a field the shared result shape does not yet carry — this simplification is disclosed here rather than silently assumed. Nodal ministries' authority to notify higher minimum local-content thresholds for specific categories is real and sourced but not separately modeled, since this platform cannot know which category-specific notifications apply to a given tender without caller-supplied input this file does not yet collect.

## om-mandatory-list

Research history (Round A.3 D6, 22 Oct 2026): the customer note previously said Royal Decree No. 57/2025 renamed Oman's tender authority itself to PTLC "replacing the former Tender Board" — checked this round against the Decree's own primary Arabic text (qanoon.om/p/2025/rd2025057/) and found that framing wrong. Article 1 renames only the Tender Board's **General Secretariat** ("الأمانة العامة لمجلس المناقصات") to "هيئة المشاريع والمناقصات والمحتوى المحلي" (PTLC); Article 4 states PTLC's role is to support/assist the Tender Board ("معاونة مجلس المناقصات"), meaning the Board itself continues; Article 7 preserves the Board's own powers under other laws and decrees; Article 8 is the mechanical find-and-replace clause substituting the old Secretariat/Secretary-General titles with the new Authority's name wherever they appear in other legislation. A secondary source, omandaily.om's report of 24 Jun 2025 (omandaily.om/article/1181247), independently confirms the same renaming-of-the-Secretariat framing and additionally describes PTLC's expanded internal structure (new directorates including a Projects Follow-up Office and a General Directorate for Government Procurement; the former General Directorate for Local Content renamed to the National Office for Local Content; contract-review duties moved in from the Ministry of Justice and Legal Affairs). The customer-facing note was corrected to say only what these two primary/near-primary sources support — the Board continues, the Secretariat was renamed — rather than the prior, broader "replacing the former Tender Board" claim. This also resolved the program's own D2 "Last checked" date, moving it out of the not-recorded disclosure list it had carried since D2's own pass earlier this round.
