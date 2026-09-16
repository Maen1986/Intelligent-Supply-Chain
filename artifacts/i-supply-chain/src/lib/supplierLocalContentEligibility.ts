/**
 * Supplier Intelligence Module 08 — Local Content / ICV Eligibility
 * (SI-08, 15 Sep 2026; Saudi Arabia decomposition 15 Sep 2026; UAE
 * decomposition + program-architecture generalization 15 Sep 2026).
 *
 * Extends the pre-existing LCGPA Readiness Self-Check (#373/#374,
 * lcgpaLocalContent.ts, 28 Aug 2026) from a single-country, client-own-spend
 * self-check into a real, multi-country, multi-mechanism SUPPLIER-fact
 * engine that plugs into the rest of the SI engine (Kraljic, qualification,
 * concentration) the way every other SI module does. lcgpaLocalContent.ts
 * and its page (LCGPAReadinessCheck.tsx) remain live and unchanged -- this
 * module is a standalone, separately-tested sibling (standalone-first
 * architecture: no runtime import from lcgpaLocalContent.ts or any other SI
 * module), not a replacement.
 *
 * ============================================================================
 * WHY THIS IS MULTI-COUNTRY, MULTI-MECHANISM, AND GOVERNMENT/PRIVATE-AWARE
 * ============================================================================
 * A 15 Sep 2026 research pass (real web sourcing, not training-data recall)
 * found that "local content" is not one regional concept with country
 * variants -- it is several genuinely different regulatory mechanisms, and
 * as of 15 Sep 2026 (see below), most countries turn out to run MULTIPLE
 * distinct mechanisms of their own, not just one:
 *
 *   - Saudi Arabia (LCGPA + Aramco + GAMI + LIKT): six distinct programs,
 *     decomposed 15 Sep 2026 (see `PROGRAMS`, keys `sa-*`) -- a certified
 *     PERCENTAGE SCORE (LCGPA general), a CATEGORY ELIGIBILITY GATE
 *     (Mandatory List), a PRICE PREFERENCE (10% national-product), an
 *     ANCHOR-BUYER SCORE (Aramco IKTVA, a real computable formula from
 *     Aramco's own guideline), and two not-yet-sourced OFFSET/TECH-TRANSFER
 *     programs (GAMI defense, LIKT) each carrying real dated national
 *     context instead of a blank placeholder.
 *   - UAE (MoIAT ICV + Tawazun): two distinct programs, decomposed 16 Sep
 *     2026 (see `PROGRAMS`, keys `ae-*`) -- `ae-icv-general`, a certified
 *     WEIGHTED MULTI-PILLAR SCORE (manufacturing/third-party spend +
 *     investment + Emiratisation + expatriate contribution + capped bonus
 *     categories), requiring a MoIAT-authorized audit; and `ae-tawazun-
 *     offset`, the Tawazun Economic Council's real, sourced defense-sector
 *     OFFSET obligation (a genuinely different mechanism run by a
 *     genuinely different body for a genuinely different buyer, not a
 *     variant of the general ICV score). See Section "AE Tawazun sourcing"
 *     below for the exact figures and how this research pass resolved the
 *     brief's own flagged "$10M vs AED10M" ambiguity.
 *   - Jordan: NOT a scored certificate at all -- a 20% PRICE PREFERENCE
 *     MARGIN for locally-manufactured products in PUBLIC TENDERS only
 *     (Cabinet-approved, per Petra/Jordan News Agency reporting Minister of
 *     Industry, Trade & Supply Yarub Qudah's announcement). This adjusts BID
 *     EVALUATION, not a company's own local-content percentage -- a
 *     genuinely different mechanism type from LCGPA/ICV. Single program for
 *     now (`jo-price-preference`); no second Jordanian mechanism has been
 *     sourced yet.
 *   - Oman, Qatar, Bahrain, Kuwait: real named programs exist (Oman runs its
 *     own separate "ICV" program; Qatar Cabinet-approved a National Local
 *     Content Strategy; Kuwait's KPC/KOC run anchor-buyer-style programs;
 *     Bahrain reserves a share of tenders for SMEs) but this research pass
 *     has not yet sourced an exact formula or weighting to the same rigor
 *     as SA/AE/JO. Each keeps ONE `not-yet-sourced` program for now (`om-
 *     icv`, `qa-national-strategy`, `bh-local-content`, `kw-local-content`)
 *     -- Decision Record 8.7: an explicit `not-yet-sourced` state, never a
 *     guessed formula. Their own multi-program decomposition is future work
 *     (Part 1 continues), using the exact same `PROGRAMS`/`program`
 *     mechanism this file now generalizes for that purpose.
 *
 * Two disclosed sourcing caveats carried over from the original build,
 * stated plainly rather than smoothed over:
 *   1. The UAE ICV master-formula figures below were extracted from an
 *      AI-summarized read of MoIAT's own published supplier certification
 *      guidelines PDF, not a byte-verified manual transcription. Treat the
 *      output here as a directional, best-available-public-sourcing
 *      reconstruction -- verify against the primary MoIAT document before
 *      using this for an actual certification-adjacent decision.
 *   2. Jordan's exact governing bylaw/regulation number was not identified
 *      in available sourcing (only the Cabinet decision and the 20% figure,
 *      reported by Jordan's official state news agency). The mechanism and
 *      figure are real and sourced; the precise legal citation is not.
 *
 * ============================================================================
 * WHY THE PROGRAM ARCHITECTURE IS NOW GENERAL, NOT SAUDI-SPECIFIC
 * (15 Sep 2026, this pass)
 * ============================================================================
 * The 15 Sep 2026 Saudi Arabia decomposition introduced a `SaudiProgram`
 * union and a `SAUDI_PROGRAMS` record, scoped to Saudi Arabia only, because
 * Saudi Arabia was the first country found to run more than one real
 * mechanism. As soon as this same UAE research pass found Tawazun to be a
 * second, genuinely distinct UAE mechanism, it became clear the "one
 * country, one program" assumption baked into a per-country union type
 * would not survive contact with the second country, let alone the four
 * still to be researched (Oman/Qatar/Bahrain/Kuwait, per the brief's own
 * taxonomy notes, likely also run more than one mechanism each: Oman's own
 * ICV anchor-buyer program plus a PTLC Mandatory List; Qatar's QatarEnergy
 * Tawteen anchor-buyer program; Kuwait's KPC/KOC anchor-buyer program plus
 * a spend set-aside; Bahrain's SME category reservation plus a stacked
 * price preference). Rather than duplicate the Saudi-specific pattern a
 * second time for UAE and then a third/fourth/fifth/sixth time for the
 * rest, this pass generalizes it once: `LocalContentProgram` is now a flat
 * union of EVERY program key across every country (`sa-*`, `ae-*`, `jo-*`,
 * `om-*`, `qa-*`, `bh-*`, `kw-*`), `PROGRAMS` is the single record keyed by
 * that union, `PROGRAMS_BY_COUNTRY` lists which programs exist for a given
 * country (for UI routing), and `DEFAULT_PROGRAM_BY_COUNTRY` is what
 * `assessSupplierLocalContent` resolves to when `program` is omitted --
 * always the country's ORIGINAL single pre-existing mechanism, so this
 * refactor is a pure behavior-preserving rename for AE/JO/OM/QA/BH/KW and
 * for Saudi Arabia's own pre-existing default (`sa-lcgpa-general`), not a
 * silent change to what any existing caller gets back. `COUNTRY_FRAMEWORKS`
 * (the original single-program-per-country lookup, still used by the UI's
 * country-selector buttons) is now a derived view: `PROGRAMS[
 * DEFAULT_PROGRAM_BY_COUNTRY[country]]`, not a second source of truth.
 *
 * ============================================================================
 * AE TAWAZUN SOURCING (15 Sep 2026) -- resolves a flagged open item
 * ============================================================================
 * The brief flagged a "$10M vs AED10M" currency discrepancy in its own
 * Tawazun citation, to be resolved in a later (non-Saudi) pass. This
 * research pass resolved it: the UAE Dirham has been fixed-pegged to the US
 * Dollar at exactly AED 3.6725 = USD 1 since 1997 (a matter of public
 * record, not something this pass needed to re-verify per-transaction).
 * AED 36.73 million (cited by mondaq.com's legal summary of the Tawazun
 * Economic Council's 2019 policy guidelines) divided by 3.6725 equals
 * essentially exactly USD 10.00 million (cited independently by both
 * afridi-angell.com's legal summary and the US government's own
 * trade.gov UAE Defense Country Commercial Guide). These are the SAME
 * threshold expressed in two currencies via a fixed peg, not two different
 * numbers -- the brief's flagged ambiguity was a citation-formatting
 * artifact, not a real source conflict. Sourced also: a 60% offset-credit
 * target as a share of the underlying contract value, and an 8.5%
 * shortfall-penalty rate (payable in cash, or securable via a bank
 * guarantee, per afridi-angell.com and mondaq.com) when accumulated credits
 * fall short at the end of the performance period -- both real, both
 * disclosed with their sources inline in `PROGRAMS['ae-tawazun-offset']`.
 * No more recent (2020+) revision to these guidelines' numeric figures was
 * found in this research pass; trade.gov's own UAE Defense guide (a US
 * government source, generally kept current) cites the same 2019 guidelines
 * without noting a later update, and that absence of a newer figure is
 * disclosed rather than treated as silent confirmation nothing has changed.
 *
 * ============================================================================
 * PART 1 CONTINUATION: JORDAN / OMAN / QATAR / BAHRAIN / KUWAIT (15 Sep 2026)
 * ============================================================================
 * Per the user's "Proceed" instruction following the UAE decomposition, this
 * pass continued Part 1 into the five remaining GCC + Jordan countries,
 * exactly as the file header's "WHY THIS IS MULTI-COUNTRY" section had
 * flagged as future work. Real, dated, sourced mechanisms were found for
 * ALL FIVE countries -- each country's ORIGINAL single program is kept
 * verbatim (unchanged), and newly-sourced programs are added alongside it,
 * never replacing it, following the exact SA/AE precedent of layering
 * narrower/company-specific real mechanisms next to a country's main
 * program rather than guessing what the main program's own formula is:
 *   - Jordan: a genuinely SECOND mechanism beyond the 20% price preference
 *     -- a Cabinet-approved 35% quota (2018, Jordan Times reporting the
 *     Council of Ministers decision) for Jordanian contractors in
 *     international tenders, part of the 2018-2022 Economic Growth Plan.
 *     The plan specified a 5-point annual increase "during the time frame"
 *     of that plan; no primary source reconfirming the value beyond 2022
 *     was found, so this engine computes against the disclosed 2018 base
 *     (35%) only -- never an extrapolated current-year guess (`jo-
 *     contractor-quota`, new `spend-set-aside-target` mechanism type).
 *   - Oman: the general national ICV program remains not-yet-sourced (kept
 *     verbatim as `om-icv`), but two genuinely different, narrower Oman
 *     mechanisms WERE sourced -- the PTLC Mandatory List (Royal Decree No.
 *     57/2025 renamed Oman's Tender Board to the Projects, Tenders, and
 *     Local Content Authority; the list itself reserves categories for
 *     Omani SMEs/local suppliers, per tendersarabia.com's 2026 guide,
 *     structurally identical to Saudi's Mandatory List gate, `om-
 *     mandatory-list`) and OQ Group's own 10% price preference for
 *     Omani-manufactured goods (`om-oq-price-preference`, an anchor-buyer-
 *     specific mechanism in the same pattern as Aramco IKTVA / QatarEnergy
 *     Tawteen -- a real company program, not the national ICV score).
 *   - Qatar: the newly-approved National Local Content Strategy remains
 *     not-yet-sourced (kept verbatim as `qa-national-strategy` -- still too
 *     new for a public formula), but Qatar's much longer-established
 *     official Tawteen/ICV program WAS fully sourced from icv.qa (the
 *     national ICV certification portal's own FAQ and Enhanced Program
 *     pages): a real 5-cost-category eligible-spend base ratio (local
 *     tangible goods/materials, local services, Qatari-national/resident
 *     training, supplier training/certification, Qatar-based asset
 *     depreciation -- against total Qatar revenue EXCLUDING exports, with
 *     sub-supplier development costs crediting 100% to the primary
 *     supplier), PLUS three real sourced modifiers: an "ICV+" 50% score
 *     boost for eligible manufacturers, a "blanket score" 30% floor for
 *     micro/small suppliers, and a capped (0-15pt) self-reported
 *     strategic-behaviour bonus. A new `modified-icv-score` mechanism type
 *     was added specifically so these modifiers are shown to the reader as
 *     real decision-relevant facts, not smoothed into a single opaque
 *     number (`qa-icv-tawteen`).
 *   - Bahrain: the general national framework remains not-yet-sourced (kept
 *     verbatim as `bh-local-content`), but Ministerial Decision No. 23 of
 *     2026 (Bahrain's Minister of Industry and Commerce, Official Gazette
 *     11 Jun 2026, effective 12 Jun 2026) sourced BOTH mechanisms the
 *     brief's own taxonomy note anticipated: a 10% SME bidding price
 *     advantage (`bh-sme-price-preference`, reusing the price-preference-
 *     margin primitive) and a 20% SME government-spend allocation (`bh-sme-
 *     spend-setaside`, new spend-set-aside-target mechanism) -- both keyed
 *     off the same SME-qualification fact (<=250 employees or <=BHD 20M
 *     annual revenue, up from the prior 100 employees / BHD 3M ceiling).
 *   - Kuwait: the general national framework remains not-yet-sourced (kept
 *     verbatim as `kw-local-content`), but the U.S. government's own
 *     trade.gov Kuwait market-intelligence guide sourced KPC's own real
 *     spend target -- a minimum 30% of project spending designated for
 *     Kuwaiti suppliers, targeted "by 2040" (`kw-kpc-local-spend`, the
 *     spend set-aside the brief's own taxonomy note anticipated for KPC/
 *     KOC).
 * Two shared computation primitives (`computePricePreferenceMargin`,
 * `computeCategoryEligibilityGate` -- the latter generalized this pass from
 * the SA-only `computeMandatoryListSa`) now serve SEVEN programs across
 * four countries with the exact same "one computation, N source-notes"
 * pattern already used for Saudi/Jordan; a new third shared primitive
 * (`computeSpendSetAside`) was added for the three new set-aside programs.
 *
 * ============================================================================
 * PART 2: EGYPT -- FIRST NON-GCC/JORDAN COUNTRY (15 Sep 2026)
 * ============================================================================
 * Per the user's own explicit direction ("go with egypt, then turkey, then
 * UK, then USA, then China"), this pass opened Part 2 ("non-GCC coverage",
 * previously explicitly not started -- see "What Is Not Yet Done" in the
 * worked-example doc) with Egypt, the first country added to `EG`
 * (`LocalContentCountry`) since this engine's original 7. Coverage scope
 * decision, stated here rather than only in conversation: this engine does
 * NOT attempt to pre-build a mechanism for every country in the world --
 * most countries run no GCC/Jordan-style local-content or ICV regime at
 * all, so forcing one would mean either fabricating a formula (Decision
 * Record 8.7) or filling the union with empty not-yet-sourced entries that
 * add no real value. Coverage grows on demand, prioritized by where ISC
 * clients have real supplier exposure -- Egypt, Turkey, UK, USA, and China
 * are Rawabi's own named non-GCC supplier countries (see section 1's
 * intro), the same demand-driven logic already used to decide which GCC
 * countries got a second/third mechanism first. Two genuinely different,
 * real, sourced Egyptian mechanisms were found this pass: a general
 * public-procurement price preference (Law No. 5 of 2015, as amended by
 * Law No. 90 of 2018 -- a 40%-local-content qualifying threshold, then a
 * flat 15% price preference, `eg-price-preference`, the country's default
 * program) and a narrower oil & gas Production Sharing Agreement (PSA)
 * local-contractor priority (a 10% price-band preference for local
 * contractors, run by petroleum-sector operating companies under Ministry
 * of Petroleum oversight -- a different buyer and legal basis from the
 * general preference, `eg-oil-gas-price-preference`). A third, real,
 * dated national target -- the revamped Automotive Industry Development
 * Program's 60% local-content goal -- was found to have no published
 * per-supplier formula as of this research pass, so it is kept as an
 * honest `not-yet-sourced` entry (`eg-auto-local-content`) rather than
 * guessed, the same Decision Record 8.7 treatment already applied to
 * Saudi GAMI/LIKT and Oman/Qatar/Bahrain/Kuwait's general national
 * programs. Both sourced Egyptian mechanisms reuse the existing
 * `computePricePreferenceMargin` primitive -- one shared computation, now
 * serving NINE programs across five countries.
 *
 * ============================================================================
 * PART 2 CONTINUATION: TURKEY (16 Sep 2026)
 * ============================================================================
 * Second stop on the user's explicit order ("egypt, then turkey, then UK,
 * then USA, then China"). `TR` (`LocalContentCountry`) is the ninth country.
 * One real, sourced, computable mechanism: `tr-price-preference`, the
 * general public-procurement domestic-goods ("yerli mali") price
 * preference under Law No. 4734 Art. 63(c) -- up to 15% (mandatory, not
 * discretionary, for medium/high-tech listed goods), applied by adding the
 * margin to competing non-domestic bids, certified per item via a "Yerli
 * Mali Belgesi" and applied item-by-item in partial tenders -- modeled via
 * the same continuously-scaled share already used for Jordan/Oman, not
 * Egypt's binary threshold gate, since the sourced mechanism is
 * proportional. A candidate "%7" alternate rate found in one source title
 * was run down and resolved: it is a documented KIK violation finding (an
 * administration under-applying the mandatory 15%), not a live alternate
 * statutory rate -- disclosed as a resolved ambiguity, not left open.
 * `tr-defense-offset` (SSB's 2022 Offset Guideline) is kept `not-yet-
 * sourced`: two real sources (mondaq.com, herdemlaw.com) disagree on
 * whether their respective "70%" figures describe the same commitment,
 * and neither gives a confirmed contract-value trigger threshold or a
 * per-supplier formula -- disclosed as an open discrepancy rather than
 * resolved by assumption, per Decision Record 8.7. A third real scheme,
 * YEKDEM's >=55% domestic-content rule for solar-module manufacturers'
 * access to premium feed-in tariffs, was deliberately NOT modeled as a
 * program: it certifies a manufacturer for subsidy access, not a supplier
 * bidding into a specific buyer's tender, so it does not fit this engine's
 * buyer-side `ProcurementContext` taxonomy -- an explicit scope decision,
 * disclosed in `tr-defense-offset`'s sourceNoteEn and the worked-example
 * doc, not a silent omission. Both Turkish programs reuse existing shared
 * computation primitives -- no new mechanism type needed.
 *
 * ============================================================================
 * PART 2 CONTINUATION: UNITED KINGDOM (16 Sep 2026)
 * ============================================================================
 * Third stop on the user's explicit order. `UK` (`LocalContentCountry`) is
 * the tenth country -- and a genuinely different kind of finding from every
 * country before it: this research pass confirms the UK runs NO GCC/Jordan/
 * Egypt/Turkey-style ABOVE-threshold price preference for domestic
 * suppliers, and that this is a structural legal fact, not a research gap.
 * The Procurement Act 2023 (PA23) s.90 binds contracting authorities to a
 * non-discrimination duty toward WTO GPA/FTA "treaty state" suppliers above
 * the Act's own thresholds (GBP 135,018 / 207,720 goods-services, GBP
 * 5,193,000 works, effective 1 Jan 2026 per PPN 023) -- a domestic price
 * preference above those thresholds would breach that duty outright. BELOW
 * threshold, Cabinet Office PPN 005 does let a contract be reserved by
 * supplier geography (UK-wide/county/London-borough -- explicitly not by
 * constituent nation) optionally combined with SME/VCSE status: a real, one
 * sourced, computable mechanism, `uk-below-threshold-reservation`, modeled
 * via the existing `category-eligibility-gate` primitive (the same shape as
 * Saudi/Oman's Mandatory List) rather than a new mechanism type. A second
 * real UK mechanism, "social value" evaluation weighting (Public Services
 * (Social Value) Act 2012 / PA23's National Procurement Policy Statement),
 * was deliberately NOT modeled: it is nationality-neutral by legal necessity
 * (the same s.90 duty), each authority sets its own ad hoc qualitative
 * weighting per tender, and its criteria span environmental/social wellbeing
 * broadly, not local content specifically -- so there is no domestic-content
 * sub-formula to source, ever, by design. A pending Parliamentary bill (the
 * Public Procurement (British Goods and Services) Bill, second reading 17
 * Apr 2026, not yet law) would add UK-goods consideration and reporting
 * duties, but its own drafters confirm it creates no price preference or
 * quota, for the same s.90 reason -- disclosed, not modeled, the same
 * treatment already applied to Turkey's YEKDEM scheme.
 *
 * ============================================================================
 * PART 2 CONTINUATION: UNITED STATES (16 Sep 2026)
 * ============================================================================
 * Fourth stop on the user's explicit order. `USA` (`LocalContentCountry`) is
 * the eleventh country. Three real, sourced, computable mechanisms, each
 * genuinely different in shape and legal basis: `usa-buy-american-price-
 * preference` (the Buy American Act, FAR 25.1/25.2 -- a binary domestic-
 * content threshold gate, currently 65% through 2028 stepping to 75% from
 * 2029, feeding a business-size-dependent evaluation margin, 20% large /
 * 30% small, the first program in this file where the margin itself is
 * caller-dependent rather than a fixed constant, disclosed as a caller-
 * overridable default per Decision Record 8.7); `usa-baba-infrastructure-
 * gate` (the Build America, Buy America Act, IIJA Title IX -- a materially
 * stricter, infrastructure-specific, per-agency-administered domestic-
 * content gate covering federal financial-assistance recipients broadly,
 * not just direct federal agencies, modeled via the same category-
 * eligibility-gate primitive already used for UK PPN 005 and Saudi/Oman's
 * Mandatory List); and `usa-sba-small-business-setaside` (the SBA's 23%
 * government-wide small-business prime-contracting goal plus FAR 19.502-2's
 * mandatory "Rule of Two" set-aside trigger -- disclosed as a genuinely
 * different KIND of set-aside from every GCC/Jordan program in this file:
 * a small-business-STATUS set-aside, not a sub-national-geography or
 * domestic-manufacturing-content one, since the United States has no single
 * federal analog to a state/province-level local-content preference).
 * `usa-berry-amendment-dod` (10 U.S.C. 4862, DoD-only textiles/food/hand-
 * tools sourcing) is kept `not-yet-sourced`: real and dated, but no single
 * clean supplier-computable threshold survives its many product-category
 * exceptions in this research pass. Two further real mechanisms were found
 * and deliberately NOT modeled as programs, each disclosed in
 * `usa-buy-american-price-preference`'s or `usa-sba-small-business-
 * setaside`'s own sourceNoteEn rather than silently dropped: the Trade
 * Agreements Act, which WAIVES the Buy American Act above the WTO GPA/FTA
 * dollar threshold ($174,000 for covered supplies/services as of the March
 * 2026 Federal Register update) and substitutes a "designated country end
 * product" eligibility test -- a fact about foreign-bidder eligibility, not
 * a US supplier's own local-content standing, so it is disclosed rather
 * than modeled as a second program, the same treatment as the UK's PA23
 * s.90 finding; and state-level in-state-preference statutes, which the US
 * runs individually per state rather than as one federal program -- a real
 * but out-of-scope absence, the same disclosed-boundary pattern already
 * used for the UK's missing England/Scotland/Wales/Northern-Ireland-level
 * PPN 005 line. `usa-buy-american-price-preference` needed a genuinely new
 * compute function (`computePricePreferenceUsa`) rather than a direct reuse
 * of an existing one, since it is the first mechanism in this file whose
 * margin is itself caller-dependent; the other two real USA programs reuse
 * `computeCategoryEligibilityGate` and `computeSpendSetAside` directly with
 * zero new logic, the same "reuse before inventing" discipline already
 * applied to every prior country.
 *
 * ============================================================================
 * PART 2 CONTINUATION: CHINA (16 Sep 2026)
 * ============================================================================
 * Fifth and final stop on the user's explicit "then the USA, then China"
 * order -- `CN` (`LocalContentCountry`) is the twelfth country, closing out
 * Part 2 in full. Three real, sourced, computable mechanisms, each
 * genuinely different in shape and legal basis: `cn-domestic-product-price-
 * preference` (State Council Doc. [2025] No. 34, 国办发〔2025〕34号, effective
 * 1 Jan 2026 -- a flat 20% price-evaluation deduction reached via either of
 * two independently-sufficient paths, this product's own domestic-product
 * classification OR an 80%+ domestically-made bundle-cost-share, the first
 * OR-gated eligibility shape in this file, feeding the shared
 * computePricePreferenceMargin primitive via a genuinely new function,
 * `computePricePreferenceCnDomesticProduct`); `cn-govt-procurement-law-
 * domestic-mandate` (Government Procurement Law Article 10, 2002, last
 * amended 2014 -- a domestic-purchase-by-default mandate with three real
 * exemptions, modeled via a direct, zero-new-logic reuse of
 * `computeCategoryEligibilityGate`, the same primitive already used for
 * Saudi/Oman's Mandatory List and the UK's PPN 005 and USA's BABA gates,
 * sharing its domestic-product-classification input field with the price
 * preference above rather than asking a duplicate question); and `cn-sme-
 * price-deduction` (财库〔2020〕46号 / 财库〔2022〕19号 -- a price-evaluation
 * deduction banded by BOTH bidder role and procurement type together, a 2x2
 * band-selection matrix with no counterpart elsewhere in this file, gated
 * by a real 30% consortium small-enterprise subcontract-share threshold
 * below which the deduction is zero, not partial, the same "gate not
 * taper" discipline already applied to the US Buy American Act threshold --
 * modeled via a genuinely new function, `computePricePreferenceCnSme`).
 * `cn-defense-domestic-sourcing` (PLA / Military-Civil Fusion, 军民融合) is
 * kept `not-yet-sourced`: real and dated, structurally similar to the USA's
 * Berry Amendment, but core directives are issued through the Central
 * Military Commission's Equipment Development Department and
 * classified/internal procurement regulations rather than a single
 * published statute carrying a clean numeric threshold. Two further real
 * mechanisms were found and deliberately NOT modeled as programs, each
 * disclosed as an explicit scope decision rather than silently dropped: SOE
 * procurement under the separate Tendering and Bidding Law (中华人民共和国招标
 * 投标法, a different statute from the Government Procurement Law modeled
 * above, governing large state-owned-enterprise capital-construction
 * tenders), for which no single clean supplier-level local-content
 * threshold analogous to Document 34/2025 was found; and the pre-2018/2022
 * foreign-ownership equity cap on joint-venture automakers (<=50% foreign
 * ownership without a local JV partner), fully phased out by 2022 and a
 * foreign-investment-structure rule rather than a supplier bid-eligibility
 * mechanism, a structural fact from a prior era rather than a live
 * mechanism this module's taxonomy covers. `PricePreferenceMarginResult`
 * gained two new optional fields, `preferenceMarginMinPct` and
 * `preferenceMarginMaxPct`, CN-only (verified via a dedicated regression
 * test that every non-CN price-preference program leaves both `undefined`)
 * -- the first genuinely additive extension to that shared result shape,
 * needed because `cn-sme-price-deduction`'s legal ranges cannot be
 * disclosed honestly by a single `preferenceMarginPct` number alone.
 */

// ---------------------------------------------------------------------------
// Section 1 — country / context / mechanism taxonomy
// ---------------------------------------------------------------------------

export type LocalContentCountry = 'SA' | 'AE' | 'JO' | 'OM' | 'QA' | 'BH' | 'KW' | 'EG' | 'TR' | 'UK' | 'USA' | 'CN';

/** Every program key across every country this engine represents, flat
 * (not nested per-country) so the routing/resolution logic below is the
 * same regardless of which country a program belongs to. `undefined`/
 * omitted resolves to `DEFAULT_PROGRAM_BY_COUNTRY[country]` everywhere, so
 * every pre-existing caller (and every pre-existing test) that never knew
 * about programs keeps its exact prior behavior -- this is a rename/
 * generalization of the 15 Sep 2026 Saudi-specific `SaudiProgram`, not a
 * behavior change. See the file header's two "WHY" sections above for the
 * full rationale and sourcing. */
export type LocalContentProgram =
  | 'sa-lcgpa-general'    // SA type 1: certification score (the module's original mechanism)
  | 'sa-mandatory-list'   // SA type 3: category eligibility gate
  | 'sa-price-preference' // SA type 4: bid-evaluation price preference (reuses price-preference-margin)
  | 'sa-iktva-aramco'     // SA type 2: anchor-buyer program
  | 'sa-gami-defense'     // SA type 6: offset/tech-transfer obligation (not-yet-sourced)
  | 'sa-likt'             // SA type 6: offset/tech-transfer obligation (not-yet-sourced)
  | 'ae-icv-general'      // AE type 1: certification score (the module's original mechanism)
  | 'ae-tawazun-offset'   // AE type 6: offset/tech-transfer obligation (Tawazun Economic Council, real formula)
  | 'jo-price-preference' // JO type 4: bid-evaluation price preference (the module's original mechanism)
  | 'jo-contractor-quota' // JO type 5 (new, 15 Sep 2026): international-tender contractor quota, real Cabinet decision
  | 'om-icv'              // OM: not-yet-sourced (the module's original mechanism -- general national ICV formula)
  | 'om-mandatory-list'   // OM type 3 (new, 15 Sep 2026): PTLC Mandatory List category eligibility gate
  | 'om-oq-price-preference' // OM type 4 (new, 15 Sep 2026): OQ Group price preference (company-specific, like AE Tawazun/QA QatarEnergy)
  | 'qa-national-strategy' // QA: not-yet-sourced (the module's original mechanism -- the NEW Cabinet-approved National Local Content Strategy specifically)
  | 'qa-icv-tawteen'      // QA type 1 (new, 15 Sep 2026): official icv.qa Tawteen ICV score with real modifiers
  | 'bh-local-content'    // BH: not-yet-sourced (the module's original mechanism -- general national framework)
  | 'bh-sme-price-preference' // BH type 4 (new, 15 Sep 2026): 10% SME bidding price advantage, Ministerial Decision 23/2026
  | 'bh-sme-spend-setaside'   // BH type 5 (new, 15 Sep 2026): 20% SME spend allocation, Ministerial Decision 23/2026
  | 'kw-local-content'    // KW: not-yet-sourced (the module's original mechanism -- general national framework)
  | 'kw-kpc-local-spend'  // KW type 5 (new, 15 Sep 2026): KPC 30% Kuwaiti-supplier spend target
  | 'eg-price-preference'          // EG type 4 (new, 15 Sep 2026 Part 2 pass): public-procurement price preference, Law 5/2015 as amended by Law 90/2018 (the module's default/original mechanism for Egypt)
  | 'eg-oil-gas-price-preference'  // EG type 4 (new, Part 2 pass): PSA local-contractor price-band priority, Ministry of Petroleum PSA framework -- a genuinely different buyer/program from the general procurement preference above
  | 'eg-auto-local-content'         // EG type 6-ish target (new, Part 2 pass): revamped AIDP 60% local-content target, not-yet-sourced (no published per-supplier formula)
  | 'tr-price-preference'           // TR type 4 (new, Part 2 continuation): public-procurement domestic-goods ("yerli mali") price preference, Law 4734 Art. 63(c) -- the module's default/original mechanism for Turkey
  | 'tr-defense-offset'             // TR type 6: SSB 2022 Offset Guideline, not-yet-sourced (disclosed trigger-threshold and cross-source figure ambiguity)
  | 'uk-below-threshold-reservation' // UK type 3 (new, Part 2 continuation): PPN 005 below-threshold reservation gate (category-eligibility-gate) -- the module's default/only mechanism for the UK, which structurally cannot run an above-threshold price preference (PA23 s.90 non-discrimination duty)
  | 'usa-buy-american-price-preference' // USA type 4 (new, Part 2 continuation): FAR Subpart 25.1/25.2 Buy American Act binary-threshold price preference -- the module's default/original mechanism for the USA
  | 'usa-baba-infrastructure-gate'      // USA type 3 (new, Part 2 continuation): Build America, Buy America Act (BABA, IIJA Title IX) federally-funded-infrastructure domestic-content category eligibility gate
  | 'usa-sba-small-business-setaside'   // USA type 5 (new, Part 2 continuation): SBA/FAR Part 19 small-business federal-contracting goal (23%) + Rule of Two set-aside
  | 'usa-berry-amendment-dod'           // USA type 6-ish (new, Part 2 continuation): Berry Amendment (10 U.S.C. 4862) DoD textiles/food/hand-tools domestic-sourcing mandate -- not-yet-sourced (no single clean numeric threshold found)
  | 'cn-domestic-product-price-preference'    // CN type 4 (new, 16 Sep 2026 China Part 2 continuation): State Council Doc [2025] No. 34 (国办发〔2025〕34号) 20% price-evaluation deduction, OR-gated eligibility (first OR-gate shape in this file) -- the module's default/original mechanism for China
  | 'cn-govt-procurement-law-domestic-mandate' // CN type 3: Government Procurement Law (中华人民共和国政府采购法, 2002, last amended 2014) Article 10 domestic-purchase-by-default mandate -- zero-new-logic reuse of computeCategoryEligibilityGate
  | 'cn-sme-price-deduction'            // CN type 4 (genuinely new mechanism): 财库〔2020〕46号 / 财库〔2022〕19号 SME price-evaluation deduction, banded by bidder role AND procurement type together, gated by a real 30% consortium small-enterprise subcontract-share threshold
  | 'cn-defense-domestic-sourcing';     // CN type 6-ish: PLA/military-civil fusion (军民融合) defense-procurement domestic-sourcing mandate -- not-yet-sourced (no single clean numeric threshold found), structurally similar to the Berry Amendment above

/** Which program `assessSupplierLocalContent` resolves to when `program` is
 * omitted -- always each country's original pre-existing single mechanism,
 * so this generalization (and the 15 Sep 2026 Part-1-continuation additions
 * below it) changes no caller's default behavior. Every newly-added JO/OM/
 * QA/BH/KW program is deliberately NOT made the default, mirroring how
 * Saudi's real, sourced, computable `sa-iktva-aramco` is not the SA default
 * either -- the default stays each country's own MAIN named program, with
 * narrower/company-specific/category-specific real mechanisms reachable via
 * the routing question (`PROGRAMS_BY_COUNTRY`) instead. */
export const DEFAULT_PROGRAM_BY_COUNTRY: Record<LocalContentCountry, LocalContentProgram> = {
  SA: 'sa-lcgpa-general', AE: 'ae-icv-general', JO: 'jo-price-preference',
  OM: 'om-icv', QA: 'qa-national-strategy', BH: 'bh-local-content', KW: 'kw-local-content',
  EG: 'eg-price-preference', TR: 'tr-price-preference', UK: 'uk-below-threshold-reservation',
  USA: 'usa-buy-american-price-preference', CN: 'cn-domestic-product-price-preference',
};

/** Every program that exists for a given country, in display order -- used
 * by the UI to render the routing-question button row whenever a country
 * has more than one. As of the 15 Sep 2026 Part-1-continuation pass, every
 * country now has more than one program -- the routing question is no
 * longer an SA/AE-only UI affordance. */
export const PROGRAMS_BY_COUNTRY: Record<LocalContentCountry, LocalContentProgram[]> = {
  SA: ['sa-lcgpa-general', 'sa-mandatory-list', 'sa-price-preference', 'sa-iktva-aramco', 'sa-gami-defense', 'sa-likt'],
  AE: ['ae-icv-general', 'ae-tawazun-offset'],
  JO: ['jo-price-preference', 'jo-contractor-quota'],
  OM: ['om-icv', 'om-mandatory-list', 'om-oq-price-preference'],
  QA: ['qa-national-strategy', 'qa-icv-tawteen'],
  BH: ['bh-local-content', 'bh-sme-price-preference', 'bh-sme-spend-setaside'],
  KW: ['kw-local-content', 'kw-kpc-local-spend'],
  EG: ['eg-price-preference', 'eg-oil-gas-price-preference', 'eg-auto-local-content'],
  TR: ['tr-price-preference', 'tr-defense-offset'],
  UK: ['uk-below-threshold-reservation'],
  USA: ['usa-buy-american-price-preference', 'usa-baba-infrastructure-gate', 'usa-sba-small-business-setaside', 'usa-berry-amendment-dod'],
  CN: ['cn-domestic-product-price-preference', 'cn-govt-procurement-law-domestic-mandate', 'cn-sme-price-deduction', 'cn-defense-domestic-sourcing'],
};

/** Which buyer this assessment is for -- see file header: every sourced
 * regime found is anchored in government/SOE-linked procurement. */
export type ProcurementContext = 'government' | 'semi-government-soe' | 'private-commercial';

// Bilingual-completeness fix (found by independent QA review, 15 Sep 2026):
// reasonAr must never splice a raw English enum literal into an Arabic
// sentence, and must never carry LESS information than reasonEn. This map
// is the Arabic label for each procurement context, used everywhere
// procurementContext is rendered inside reasonAr.
const PROCUREMENT_CONTEXT_LABEL_AR: Record<ProcurementContext, string> = {
  government: 'حكومي',
  'semi-government-soe': 'شبه حكومي / مملوك للدولة',
  'private-commercial': 'تجاري خاص',
};

export type LocalContentMechanismType =
  | 'eligible-spend-ratio'      // Saudi LCGPA general score
  | 'weighted-pillar-score'     // UAE ICV
  | 'price-preference-margin'   // Jordan; Saudi LCGPA national-product preference; Oman OQ Group; Bahrain SME
  | 'category-eligibility-gate' // Saudi LCGPA Mandatory List; Oman PTLC Mandatory List
  | 'anchor-buyer-score'        // Saudi Aramco IKTVA
  | 'offset-obligation-gate'    // UAE Tawazun defense-sector offset obligation
  | 'spend-set-aside-target'    // (new, 15 Sep 2026) Jordan contractor quota; Bahrain SME allocation; Kuwait KPC local spend -- a sourced NATIONAL/PROGRAM target share plus this supplier's own qualification for it, not a per-bid score
  | 'modified-icv-score'        // (new, 15 Sep 2026) Qatar Tawteen/ICV -- eligible-spend-ratio base score plus real sourced modifiers (ICV+ manufacturer boost, micro/small blanket floor, capped strategic-behavior bonus)
  | 'not-yet-sourced';          // Oman general ICV / Qatar National Local Content Strategy / Bahrain general framework / Kuwait general framework; Saudi GAMI / LIKT

export interface CountryFrameworkInfo {
  country: LocalContentCountry;
  countryNameEn: string;
  countryNameAr: string;
  programNameEn: string;
  programNameAr: string;
  mechanismType: LocalContentMechanismType;
  /** Buyer contexts this research pass found real sourced evidence for. */
  applicableContexts: ProcurementContext[];
  sourceNoteEn: string;
  sourceNoteAr: string;
  /** Which program key (see `LocalContentProgram`) this framework describes. */
  program: LocalContentProgram;
  /** "How the same score gets used differently by context" notes -- per the
   * brief's own UAE precedent, this is deliberately NOT a new mechanism,
   * just disclosure text attached to the program it describes. Populated
   * for `sa-lcgpa-general` and `ae-icv-general`. */
  usageNotesEn?: string[];
  usageNotesAr?: string[];
}

// ---------------------------------------------------------------------------
// Section 1b — Saudi Arabia: 6 programs (5 modeled mechanisms + the general
// score's usage notes). See file header for full sourcing.
// ---------------------------------------------------------------------------

const SA_PROGRAMS: Record<'sa-lcgpa-general' | 'sa-mandatory-list' | 'sa-price-preference' | 'sa-iktva-aramco' | 'sa-gami-defense' | 'sa-likt', CountryFrameworkInfo> = {
  'sa-lcgpa-general': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Local Content (general score)', programNameAr: 'المحتوى المحلي العام (هيئة المحتوى المحلي والمشتريات الحكومية)',
    mechanismType: 'eligible-spend-ratio', program: 'sa-lcgpa-general',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA Guide G1 (Version 5.0, 15 Nov 2022): baseline score = locally-eligible spend / total spend across 4 pillars. Government procurement is directly covered; extended June 2022 to entities >=50% state-owned. No sourced evidence this governs private-to-private commercial contracts.',
    sourceNoteAr: 'دليل هيئة المحتوى المحلي والمشتريات الحكومية G1 (الإصدار ٥.٠، ١٥ نوفمبر ٢٠٢٢): الدرجة الأساسية = الإنفاق المؤهل محلياً ÷ إجمالي الإنفاق عبر أربعة أركان. تشمل مباشرة المشتريات الحكومية، ووُسِّع نطاقها في يونيو ٢٠٢٢ ليغطي الجهات المملوكة للدولة بنسبة ٥٠٪ فأكثر. لا يوجد دليل موثّق على سريانها على العقود التجارية بين القطاع الخاص فقط.',
    usageNotesEn: [
      'LCGPA\'s own official Local Content Mechanisms page (lcgpa.gov.sa) states that for high-value government contracts (excluding sourcing contracts), technical/commercial evaluation weighs local content at 40% against 60% price, plus a bonus for Tadawul-listed companies. This is the SAME general score above being used in a specific evaluation weighting -- not a separate score to compute.',
      'A separately-cited figure (attributed to SPA, Saudi Press Agency) describes a ~30%, phased local-content weighting specific to consulting/IT-sector bid evaluation. This research pass could not confirm with full confidence whether this is the same 40% high-value-contract rule described differently, or a genuinely separate sector-specific rule -- spa.gov.sa returned 403 on every direct verification attempt. Disclosed as an open item, not resolved by assumption.',
    ],
    usageNotesAr: [
      'تذكر الصفحة الرسمية لآليات المحتوى المحلي التابعة لهيئة المحتوى المحلي والمشتريات الحكومية (lcgpa.gov.sa) أن التقييم الفني/التجاري للعقود الحكومية عالية القيمة (باستثناء عقود التوريد) يمنح المحتوى المحلي وزناً ٤٠٪ مقابل ٦٠٪ للسعر، إضافة إلى ميزة إضافية للشركات المدرجة في تداول. هذه هي نفس الدرجة العامة أعلاه تُستخدم ضمن ترجيح تقييم محدد -- وليست درجة منفصلة يجب حسابها.',
      'يشير رقم آخر منسوب إلى وكالة الأنباء السعودية (واس) إلى ترجيح محتوى محلي يقارب ٣٠٪، متدرّج زمنياً، خاص بتقييم عطاءات قطاعي الاستشارات وتقنية المعلومات. لم يتمكن هذا البحث من التأكد بثقة كاملة مما إذا كانت هذه نفس قاعدة الـ٤٠٪ للعقود عالية القيمة موصوفة بصياغة مختلفة، أو قاعدة قطاعية منفصلة فعلاً -- إذ أعاد موقع spa.gov.sa خطأ ٤٠٣ في كل محاولة تحقق مباشرة. يُفصَح عن هذه النقطة كمسألة مفتوحة، دون حسمها بافتراض.',
    ],
  },
  'sa-mandatory-list': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Mandatory List (category eligibility gate)', programNameAr: 'القائمة الإلزامية لهيئة المحتوى المحلي (بوابة أهلية الفئة)',
    mechanismType: 'category-eligibility-gate', program: 'sa-mandatory-list',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA\'s official Local Content Mechanisms page lists a Mandatory List of 233+ products/services where government entities MUST procure from LCGPA-certified local sources -- a pass/fail bidding gate for the listed categories, not a percentage score. No single sourced percentage threshold applies here; eligibility is binary (in-list + certified, or not).',
    sourceNoteAr: 'تُدرج الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة قائمة إلزامية تضم أكثر من ٢٣٣ منتجاً وخدمة يتوجب على الجهات الحكومية شراءها من مصادر محلية معتمدة من الهيئة فقط -- بوابة ثنائية (نجاح/فشل) للفئات المدرجة، وليست درجة نسبية. لا تنطبق هنا نسبة مئوية موثّقة واحدة؛ الأهلية ثنائية (مدرج ومعتمد، أو لا).',
  },
  'sa-price-preference': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA National Product Price Preference', programNameAr: 'تفضيل سعر المنتج الوطني (هيئة المحتوى المحلي)',
    mechanismType: 'price-preference-margin', program: 'sa-price-preference',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA\'s official Local Content Mechanisms page states a 10% price preference is added to foreign products when compared against qualifying national products in government tenders -- structurally identical to Jordan\'s price-preference mechanism (a bid-evaluation adjustment, not a local-content percentage score), reusing the same computation shape.',
    sourceNoteAr: 'تنص الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة على إضافة تفضيل سعري بنسبة ١٠٪ للمنتجات الأجنبية عند مقارنتها بالمنتجات الوطنية المؤهلة في المناقصات الحكومية -- آلية مطابقة من حيث البنية لآلية التفضيل السعري الأردنية (تعديل في تقييم العطاء، وليست درجة نسبة محتوى محلي)، وتُستخدم نفس بنية الحساب.',
  },
  'sa-iktva-aramco': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'Aramco IKTVA (In-Kingdom Total Value Add)', programNameAr: 'برنامج أرامكو لإجمالي القيمة المضافة داخل المملكة (إكتفاء)',
    mechanismType: 'anchor-buyer-score', program: 'sa-iktva-aramco',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'Aramco\'s own official "2021 iktva Guideline v13" (iktva.sa): iktva% = ((A+B+C+D+R)/E) + I, where A = local goods/services spend + local asset depreciation + Saudi-based expatriate compensation, B = Saudi workforce compensation, C = training & development spend, D = supplier development spend, R = local R&D spend, E = total costs (denominator), I = incentive bonuses (export ratio, ESG/cybersecurity/regional-HQ bonuses). This is Aramco\'s OWN separate anchor-buyer program, distinct from the LCGPA general government score -- a real, computable formula, not a guessed one. Simplification disclosed: the I bonus component is modeled here as a single optional bonus-points input (0-10, caller-supplied) rather than the full tiered export-ratio/ESG sub-formula -- directional only, not a substitute for Aramco\'s own certified iktva calculation.',
    sourceNoteAr: 'دليل أرامكو الرسمي "iktva Guideline v13 لعام ٢٠٢١" (iktva.sa): نسبة إكتفاء = ((A+B+C+D+R)/E) + I، حيث A = إنفاق السلع/الخدمات المحلية + إهلاك الأصول المحلية + تعويضات العمالة الوافدة المقيمة في السعودية، B = تعويضات القوى العاملة السعودية، C = إنفاق التدريب والتطوير، D = إنفاق تطوير الموردين، R = إنفاق البحث والتطوير المحلي، E = إجمالي التكاليف (المقام)، I = مكافآت تحفيزية (نسبة التصدير، مكافآت الاستدامة/الأمن السيبراني/المقر الإقليمي). هذا برنامج أرامكو الخاص بها كمشترٍ رئيسي، منفصل عن الدرجة الحكومية العامة لهيئة المحتوى المحلي -- صيغة حقيقية قابلة للحساب، وليست مخمّنة. تبسيط مُفصَح عنه: تُمثَّل مكافأة I هنا كمُدخل نقاط مكافأة اختياري واحد (٠-١٠، يُدخله المستخدم) بدلاً من الصيغة الفرعية الكاملة المتدرجة لنسبة التصدير/الاستدامة -- توجيهي فقط، وليس بديلاً عن حساب إكتفاء المعتمد من أرامكو نفسها.',
  },
  'sa-gami-defense': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'GAMI Defense Localization', programNameAr: 'برنامج التوطين الدفاعي (الهيئة العامة للصناعات العسكرية)',
    mechanismType: 'not-yet-sourced', program: 'sa-gami-defense',
    applicableContexts: [],
    sourceNoteEn: 'GAMI\'s own official site states national defense-sector localization reached 24.89% as of end-2024, with a public target of >50% by 2030. No publicly disclosed per-supplier computable formula, joint-venture requirement structure, or offset calculation methodology was found in this research pass -- a real, dated national-level figure is disclosed here rather than a fabricated per-supplier score.',
    sourceNoteAr: 'يذكر الموقع الرسمي للهيئة العامة للصناعات العسكرية (GAMI) أن نسبة التوطين في قطاع الصناعات الدفاعية الوطنية بلغت ٢٤.٨٩٪ حتى نهاية عام ٢٠٢٤، مع هدف معلن يتجاوز ٥٠٪ بحلول عام ٢٠٣٠. لم يُعثر في هذا البحث على صيغة حساب علنية على مستوى المورّد، أو هيكل اشتراط مشروع مشترك، أو منهجية حساب مقاصة -- يُفصَح هنا عن رقم وطني حقيقي ومؤرَّخ بدلاً من درجة مورّد مختلقة.',
  },
  'sa-likt': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LIKT (Localization of Industry & Knowledge Transfer)', programNameAr: 'برنامج توطين الصناعة ونقل المعرفة (LIKT)',
    mechanismType: 'not-yet-sourced', program: 'sa-likt',
    applicableContexts: [],
    sourceNoteEn: 'LCGPA\'s own official Local Content Mechanisms page names a distinct "LIKT" (Localization of Industry & Knowledge Transfer) program aimed at localizing targeted industries through collaboration with global investors and technology leaders -- genuinely new to this research pass and distinct from GAMI\'s defense-specific program. No per-supplier computable formula was found; deliberately not guessed.',
    sourceNoteAr: 'تسمّي الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة برنامجاً مستقلاً يُدعى "LIKT" (توطين الصناعة ونقل المعرفة) يهدف إلى توطين صناعات مستهدفة عبر التعاون مع مستثمرين عالميين وقادة تقنيين -- برنامج جديد فعلاً اكتُشف في هذا البحث ومختلف عن برنامج الهيئة العامة للصناعات العسكرية الخاص بالدفاع. لم يُعثر على صيغة حساب على مستوى المورّد؛ لم يتم تخمينها عمداً.',
  },
};

// ---------------------------------------------------------------------------
// Section 1c — UAE: 2 programs (ae-icv-general + ae-tawazun-offset). See
// file header's "AE TAWAZUN SOURCING" section for the full sourcing.
// ---------------------------------------------------------------------------

const AE_PROGRAMS: Record<'ae-icv-general' | 'ae-tawazun-offset', CountryFrameworkInfo> = {
  'ae-icv-general': {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'National In-Country Value (ICV)', programNameAr: 'برنامج القيمة الوطنية المضافة (ICV)',
    mechanismType: 'weighted-pillar-score', program: 'ae-icv-general',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "MoIAT National ICV Program (unified with ADNOC's original ICV program): certified weighted score across Manufacturing/Third-Party Spend, Investment, Emiratisation, Expatriate Contribution, and capped bonus categories, audited by a MoIAT-authorized firm, 14-month validity. Framed around public spending and \"Program Partner\" (government/semi-government) tenders -- no sourced evidence of a private-to-private mandate. Formula figures below are a best-available reconstruction from public secondary sourcing of the official guideline document, not a byte-verified transcription -- verify against the primary MoIAT document before relying on this for a real certification decision. MoIAT's own official ICV program page (moiat.gov.ae) confirms ICV certification is an INCENTIVE -- certified suppliers \"gain advantages during the award of tenders and contracts based on their ICV score\" -- not a mandatory category gate like Saudi's Mandatory List; this research pass found no sourced evidence of a mandatory ICV-only bidding category, so none is modeled here (a real negative finding, not an oversight).",
    sourceNoteAr: 'برنامج القيمة الوطنية المضافة الوطني التابع لوزارة الصناعة والتقنية المتقدمة (موحّد الآن مع برنامج أدنوك الأصلي): درجة مرجحة معتمدة عبر التصنيع/إنفاق الطرف الثالث، الاستثمار، التوطين، مساهمة العمالة الوافدة، وفئات مكافآت محدودة السقف، يدققها مكتب معتمد من الوزارة، وصلاحية ١٤ شهراً. يتمحور حول الإنفاق العام ومناقصات "شركاء البرنامج" (الحكومة وشبه الحكومة) -- لا يوجد دليل موثّق على إلزاميته بين القطاع الخاص فقط. أرقام الصيغة أدناه إعادة بناء اعتماداً على أفضل مصادر ثانوية متاحة للدليل الرسمي، وليست نسخاً حرفياً موثقاً -- يُنصح بالتحقق من الوثيقة الأصلية للوزارة قبل الاعتماد عليها في قرار تصديق فعلي. تؤكد الصفحة الرسمية لبرنامج ICV التابعة لوزارة الصناعة (moiat.gov.ae) أن شهادة ICV تحفيزية -- تحصل الشركات المعتمدة على "مزايا عند ترسية المناقصات والعقود بناءً على درجة ICV الخاصة بها" -- وليست بوابة فئة إلزامية كالقائمة الإلزامية السعودية؛ لم يجد هذا البحث دليلاً موثّقاً على فئة مناقصات إلزامية تقتصر على شهادة ICV، لذا لم تُنمذَج هنا (نتيجة سلبية حقيقية، وليست إغفالاً).',
    usageNotesEn: [
      'Abu Dhabi\'s own Department of Economic Development (idb.added.gov.ae, its In-Country Value / ADLC FAQ page) states: "The ICV factor accounts for 40% of the financial evaluation" in Abu Dhabi tenders, and that a bidder who does not submit an ICV certificate receives zero points on that 40% -- a real, sourced, heavily-weighted incentive, though this is an Abu Dhabi emirate-level figure, not confirmed as the UAE-wide MoIAT figure (the national MoIAT page does not itself state a percentage). Per the brief\'s own precedent for this exact situation: this is "how the score gets used" by one specific evaluating entity, not a new mechanism -- shown here as a usage note on the existing general score.',
    ],
    usageNotesAr: [
      'تذكر دائرة التنمية الاقتصادية في أبوظبي (صفحة أسئلة القيمة المحلية/ADLC على idb.added.gov.ae): "يمثّل عامل القيمة المحلية ٤٠٪ من التقييم المالي" في مناقصات أبوظبي، وأن مقدّم العطاء الذي لا يقدّم شهادة ICV يحصل على صفر نقاط من هذه الـ٤٠٪ -- حافز حقيقي وموثّق وذو وزن كبير، إلا أنه رقم على مستوى إمارة أبوظبي، وليس مؤكداً كرقم وطني موحّد لدى الوزارة (الصفحة الوطنية للوزارة لا تذكر نسبة بعينها). وفق سابقة الموجز نفسها لهذه الحالة تحديداً: هذا "كيفية استخدام الدرجة" من جهة تقييم واحدة محددة، وليس آلية جديدة -- يُعرض هنا كملاحظة استخدام على الدرجة العامة القائمة.',
    ],
  },
  'ae-tawazun-offset': {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'Tawazun Economic Program (defense offset obligation)', programNameAr: 'البرنامج الاقتصادي توازن (التزام المقاصة الدفاعية)',
    mechanismType: 'offset-obligation-gate', program: 'ae-tawazun-offset',
    applicableContexts: ['government'],
    sourceNoteEn: 'The Tawazun Economic Council\'s 2019 policy guidelines (per afridi-angell.com, mondaq.com legal summaries, and the US government\'s own trade.gov UAE Defense Country Commercial Guide, none flagging a more recent revision): offset obligations trigger on UAE Armed Forces / Abu Dhabi Police defense contracts valued at or above USD 10 million (= AED 36.73 million at the UAE\'s fixed USD peg of 3.6725 -- the SAME threshold in two currencies, resolving a currency-citation ambiguity flagged in this module\'s original brief). The required offset-credit target is 60% of the underlying contract value; a shortfall at the end of the performance period can be settled by paying 8.5% of the shortfall value (or rolling the obligation into a new project) -- contractors also post a bank guarantee of 8.5% of their offset obligation to secure performance. This is Tawazun\'s own separate defense-sector program, run by a different body for a different buyer (UAE Armed Forces / Abu Dhabi Police, via the Tawazun Economic Council) than MoIAT\'s general ICV program -- a genuinely distinct mechanism, not a variant of the ICV score.',
    sourceNoteAr: 'إرشادات السياسة الصادرة عن مجلس توازن الاقتصادي عام ٢٠١٩ (وفق ملخصات قانونية من afridi-angell.com وmondaq.com، ودليل الحكومة الأمريكية الرسمي لقطاع الدفاع الإماراتي على trade.gov، دون أن يشير أي منها إلى تحديث أحدث): تُستحق التزامات المقاصة على عقود القوات المسلحة الإماراتية/شرطة أبوظبي الدفاعية التي تبلغ قيمتها ١٠ ملايين دولار أمريكي أو أكثر (= ٣٦.٧٣ مليون درهم إماراتي وفق سعر الصرف الثابت للدرهم عند ٣.٦٧٢٥ -- وهو نفس الحد بعملتين، مما يحسم غموضاً في الاستشهاد بالعملة أشار إليه الموجز الأصلي لهذه الوحدة). الهدف المطلوب من ائتمانات المقاصة هو ٦٠٪ من قيمة العقد الأساسي؛ ويمكن تسوية أي نقص في نهاية فترة الأداء بدفع ٨.٥٪ من قيمة النقص (أو ترحيل الالتزام إلى مشروع جديد) -- كما يقدّم المقاولون ضماناً بنكياً بنسبة ٨.٥٪ من التزامهم بالمقاصة لضمان الأداء. هذا برنامج توازن الدفاعي الخاص، تديره جهة مختلفة لمشترٍ مختلف (القوات المسلحة الإماراتية/شرطة أبوظبي، عبر مجلس توازن الاقتصادي) عن برنامج ICV العام لدى وزارة الصناعة -- آلية مختلفة فعلاً، وليست نسخة من درجة ICV.',
  },
};

// ---------------------------------------------------------------------------
// Section 1d — Jordan / Oman / Qatar / Bahrain / Kuwait. 15 Sep 2026 Part-1-
// continuation pass ("Proceed" instruction): each of these five countries
// now has its ORIGINAL single program (unchanged, renamed keys from the 16
// Sep pass) PLUS newly-sourced real programs found in this pass. Where
// nothing sourceable was found, the original `not-yet-sourced` entry is
// kept verbatim (never guessed) -- Decision Record 8.7.
// ---------------------------------------------------------------------------

const JO_OM_QA_BH_KW_PROGRAMS: Record<
  | 'jo-price-preference' | 'jo-contractor-quota'
  | 'om-icv' | 'om-mandatory-list' | 'om-oq-price-preference'
  | 'qa-national-strategy' | 'qa-icv-tawteen'
  | 'bh-local-content' | 'bh-sme-price-preference' | 'bh-sme-spend-setaside'
  | 'kw-local-content' | 'kw-kpc-local-spend',
  CountryFrameworkInfo
> = {
  'jo-price-preference': {
    country: 'JO', countryNameEn: 'Jordan', countryNameAr: 'المملكة الأردنية الهاشمية',
    programNameEn: 'National Industry Price Preference', programNameAr: 'تفضيل السعر للصناعة الوطنية',
    mechanismType: 'price-preference-margin', program: 'jo-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "Cabinet-approved 20% price preference for locally-manufactured products in public tenders, announced by Jordan's Minister of Industry, Trade & Supply (per Petra, Jordan's official state news agency). This adjusts bid evaluation (a price handicap favoring local bidders), not a company's own local-content percentage -- a different mechanism from LCGPA/ICV. The precise governing bylaw/regulation number was not identified in available sourcing; the mechanism and 20% figure are real and sourced, the exact legal citation is not.",
    sourceNoteAr: 'تفضيل سعري بنسبة ٢٠٪ للمنتجات المصنّعة محلياً في المناقصات الحكومية، أقرّه مجلس الوزراء وأعلنه وزير الصناعة والتجارة والتموين الأردني (بحسب وكالة الأنباء الأردنية الرسمية "بترا"). يُطبَّق هذا التفضيل على تقييم العطاءات (خصم سعري لصالح المورّدين المحليين)، وليس كنسبة محتوى محلي خاصة بالشركة -- آلية مختلفة عن LCGPA/ICV. لم يتم تحديد رقم النظام أو التشريع الدقيق ضمن المصادر المتاحة؛ الآلية والنسبة ٢٠٪ موثّقتان، أما الاستشهاد القانوني الدقيق فغير مؤكد.',
  },
  'jo-contractor-quota': {
    country: 'JO', countryNameEn: 'Jordan', countryNameAr: 'المملكة الأردنية الهاشمية',
    programNameEn: 'International Tender Contractor Quota', programNameAr: 'حصة المقاولين الأردنيين في المناقصات الدولية',
    mechanismType: 'spend-set-aside-target', program: 'jo-contractor-quota',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "Jordan's Council of Ministers approved (7 May 2018, per Jordan Times reporting the Cabinet decision) a minimum 35% quota for Jordanian contractors in \"international tenders\" for projects implemented in Jordan -- applying to ministries, public institutions, government-owned companies, companies with government shareholding, and private-sector entities floating tenders to foreign contractors. The decision also required Jordanian consultants/certified local professionals for design and supervision work, and set a 20-40% local-contractor quota specifically for six named energy/environment-sector projects. It was framed as part of the 2018-2022 Economic Growth Plan and specified the quota would rise 5 percentage points annually \"during the time frame\" of that plan. This research pass found no primary-source reconfirmation of the quota's value beyond the 2018-2022 plan window -- the mechanism and its 2018 base figure (35%) are real and sourced; whether the annual escalator continued, plateaued, or was superseded after 2022 is NOT confirmed, so this engine computes against the disclosed 2018 base of 35% only, never an extrapolated current-year figure, per Decision Record 8.7.",
    sourceNoteAr: 'وافق مجلس الوزراء الأردني (في ٧ مايو ٢٠١٨، بحسب تقرير صحيفة جوردن تايمز عن قرار مجلس الوزراء) على تخصيص حصة لا تقل عن ٣٥٪ للمقاولين الأردنيين في "المناقصات الدولية" للمشاريع المنفَّذة داخل الأردن -- وتشمل الوزارات والمؤسسات العامة والشركات المملوكة للحكومة والشركات ذات المساهمة الحكومية، وكذلك القطاع الخاص عند طرح مناقصات على مقاولين أجانب. كما اشترط القرار إسناد أعمال التصميم والإشراف على التنفيذ إلى استشاريين أردنيين معتمدين، وحدّد حصة محلية تتراوح بين ٢٠٪ و٤٠٪ لستة مشاريع محددة في قطاعي الطاقة والبيئة. جاء القرار ضمن خطة النمو الاقتصادي ٢٠١٨-٢٠٢٢، ونصّ على زيادة الحصة بمقدار ٥ نقاط مئوية سنوياً "خلال الإطار الزمني" لتلك الخطة. لم يعثر هذا البحث على مصدر أساسي يعيد تأكيد قيمة الحصة بعد نهاية إطار خطة ٢٠١٨-٢٠٢٢ -- الآلية ورقمها الأساسي لعام ٢٠١٨ (٣٥٪) حقيقيان وموثّقان؛ أما استمرار الزيادة السنوية أو استقرارها أو استبدالها بعد عام ٢٠٢٢ فغير مؤكد، لذا يحسب هذا المحرك بناءً على الرقم الأساسي الموثّق لعام ٢٠١٨ (٣٥٪) فقط، دون أي تقدير مُسقَط للسنة الحالية، وفق سجل القرار ٨.٧.',
  },
  'om-icv': {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'In-Country Value (ICV) -- not yet sourced', programNameAr: 'القيمة المحلية (ICV) — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced', program: 'om-icv',
    applicableContexts: [],
    sourceNoteEn: "Oman runs its own separate ICV program (distinct from the UAE's, historically anchored in oil & gas / large-JV procurement). This research pass could not confirm an exact pillar formula or weighting for the GENERAL national program to the same rigor as SA/AE/JO -- deliberately not guessed. Two narrower, genuinely different Oman mechanisms WERE sourced this pass and are modeled separately below: the PTLC Mandatory List (`om-mandatory-list`) and OQ Group's own price preference (`om-oq-price-preference`).",
    sourceNoteAr: 'تدير عُمان برنامج قيمة محلية (ICV) خاصاً بها (مختلف عن برنامج الإمارات، وتاريخياً مرتبط بقطاع النفط والغاز والمشاريع المشتركة الكبرى). لم يتمكن هذا البحث من تأكيد صيغة أركان دقيقة أو أوزان للبرنامج الوطني العام بنفس دقة السعودية والإمارات والأردن -- ولم يتم تخمينها عمداً. جرى في هذا البحث توثيق آليتين عُمانيتين أضيق نطاقاً ومختلفتين فعلياً، ونُمذجتا بشكل منفصل أدناه: القائمة الإلزامية لهيئة المشاريع والمناقصات والمحتوى المحلي (`om-mandatory-list`)، والتفضيل السعري الخاص بمجموعة OQ (`om-oq-price-preference`).',
  },
  'om-mandatory-list': {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'PTLC Mandatory List (category eligibility gate)', programNameAr: 'القائمة الإلزامية لهيئة المشاريع والمناقصات والمحتوى المحلي (بوابة أهلية الفئة)',
    mechanismType: 'category-eligibility-gate', program: 'om-mandatory-list',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'Oman\'s tender authority (renamed under Royal Decree No. 57/2025 to the Projects, Tenders, and Local Content Authority -- PTLC, replacing the former Tender Board) maintains a Mandatory List that "reserves defined categories of goods and services for Omani SMEs and local suppliers" (per tendersarabia.com\'s 2026 Oman tender guide) -- structurally the same pass/fail bidding-gate mechanism as Saudi Arabia\'s LCGPA Mandatory List, reused here via the same category-eligibility-gate computation. This research pass did not find a published enumeration of which specific categories are on Oman\'s Mandatory List (unlike Saudi\'s sourced 233+-item count) -- bidders must check the actual list for their own category; this engine\'s gate logic is real and sourced, but the specific category coverage is not, and is disclosed as such.',
    sourceNoteAr: 'تُدير هيئة المناقصات في عُمان (التي أعاد المرسوم السلطاني رقم ٥٧/٢٠٢٥ تسميتها إلى "هيئة المشاريع والمناقصات والمحتوى المحلي" -- PTLC، خلفاً لمجلس المناقصات السابق) قائمة إلزامية "تُخصّص فئات محددة من السلع والخدمات للمؤسسات الصغيرة والمتوسطة والموردين المحليين العُمانيين" (بحسب دليل مناقصات عُمان ٢٠٢٦ الصادر عن tendersarabia.com) -- آلية بوابة نجاح/فشل مطابقة من حيث البنية للقائمة الإلزامية لهيئة المحتوى المحلي والمشتريات الحكومية السعودية، وتُستخدم هنا نفس صيغة حساب بوابة أهلية الفئة. لم يعثر هذا البحث على قائمة منشورة بالفئات المحددة المدرجة في القائمة الإلزامية العُمانية (بخلاف السعودية الموثّقة بأكثر من ٢٣٣ بنداً) -- على مقدمي العطاءات التحقق من القائمة الفعلية لفئتهم؛ منطق البوابة في هذا المحرك حقيقي وموثّق، أما نطاق تغطية الفئات المحدد فغير موثّق، ويُفصَح عن ذلك صراحة.',
  },
  'om-oq-price-preference': {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'OQ Group Price Preference (Omani-manufactured goods)', programNameAr: 'تفضيل سعري لمجموعة OQ (السلع المصنّعة عمانياً)',
    mechanismType: 'price-preference-margin', program: 'om-oq-price-preference',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'OQ Group (Oman\'s state-owned integrated energy company, formerly Orpic/OOC) "offers a 10 percent price preference for Omani-manufactured goods in qualifying contract categories" (per a 2026 Oman tenders market guide). This is OQ Group\'s own company-specific procurement preference -- a genuinely different buyer/program from Oman\'s general national ICV program, the same "anchor-buyer-specific mechanism" pattern already modeled for Saudi Aramco (IKTVA) and Qatar\'s QatarEnergy Tawteen program. Structurally identical to Jordan\'s price-preference mechanism, reusing the same computation. No further detail on which contract categories qualify was found in this research pass.',
    sourceNoteAr: 'تقدّم مجموعة OQ (شركة الطاقة المتكاملة المملوكة للدولة في عُمان، والمعروفة سابقاً بأوربيك/شركة عُمان للنفط) "تفضيلاً سعرياً بنسبة ١٠٪ للسلع المصنّعة عمانياً ضمن فئات العقود المؤهلة" (بحسب دليل سوق المناقصات العُمانية لعام ٢٠٢٦). هذا تفضيل خاص بمشتريات مجموعة OQ نفسها -- برنامج ومشترٍ مختلفان فعلياً عن برنامج القيمة المحلية الوطني العام في عُمان، على غرار نمط "الآلية الخاصة بمشترٍ رئيسي محدد" المُنمذَج مسبقاً لبرنامج إكتفاء لدى أرامكو السعودية وبرنامج توطين التابع لقطر للطاقة. مطابق من حيث البنية لآلية التفضيل السعري الأردنية، ويُستخدم نفس أسلوب الحساب. لم يُعثر في هذا البحث على تفاصيل إضافية حول فئات العقود المؤهلة تحديداً.',
  },
  'qa-national-strategy': {
    country: 'QA', countryNameEn: 'Qatar', countryNameAr: 'دولة قطر',
    programNameEn: 'National Local Content Strategy -- not yet sourced', programNameAr: 'الاستراتيجية الوطنية للمحتوى المحلي — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced', program: 'qa-national-strategy',
    applicableContexts: [],
    sourceNoteEn: "Qatar's Cabinet approved a National Local Content Strategy recently -- too new for a public formula to be sourced as of this research pass, deliberately not guessed. A genuinely different, longer-established, and fully-sourced QATAR mechanism WAS found this pass -- the official Tawteen/ICV score run via icv.qa -- and is modeled separately below (`qa-icv-tawteen`).",
    sourceNoteAr: 'أقرّ مجلس وزراء دولة قطر مؤخراً استراتيجية وطنية للمحتوى المحلي -- لا تزال حديثة العهد بحيث لم تُنشر صيغة حساب علنية حتى وقت هذا البحث، ولم يتم تخمينها عمداً. جرى في هذا البحث توثيق آلية قطرية مختلفة فعلياً وأطول عهداً وموثّقة بالكامل -- درجة توطين/القيمة المحلية الرسمية عبر icv.qa -- ونُمذجت بشكل منفصل أدناه (`qa-icv-tawteen`).',
  },
  'qa-icv-tawteen': {
    country: 'QA', countryNameEn: 'Qatar', countryNameAr: 'دولة قطر',
    programNameEn: 'Tawteen / ICV Score (official methodology)', programNameAr: 'درجة توطين / القيمة المحلية (المنهجية الرسمية)',
    mechanismType: 'modified-icv-score', program: 'qa-icv-tawteen',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'Qatar\'s official In-Country Value Digital Portal (icv.qa, the national ICV certification authority) publishes a real, computable methodology: a base ICV score = eligible local spend (local tangible goods/materials + local services -- manpower, subcontractors, goods + training cost for Qatari nationals/residents + supplier training/certification cost + depreciation of Qatar-based company assets) divided by total Qatar revenue EXCLUDING exports. Sub-supplier development costs count as 100% contribution to the primary supplier\'s own score. Real, sourced modifiers on top of the base score, per icv.qa\'s own FAQ and Enhanced Program pages: (1) an "ICV+" policy gives eligible manufacturers a 50% increase to their ICV score; (2) a "blanket score" guarantees micro and small suppliers a minimum ICV score of 30%; (3) suppliers can claim up to an additional 15 percentage points through disclosed strategic behaviors (productivity, capability building, investment growth, Qatarization, exports, R&D, sustainability) -- modeled here as a capped, self-reported, caller-supplied input (not independently verified/computed from sub-components, since icv.qa does not publish the internal weighting of that 15-point bonus). In tender evaluation, icv.qa states ICV "will play a role in the evaluation of commercial bids; premiums will be paid for higher ICV bids assuming the price is competitive" -- a real, sourced commercial-advantage mechanism, though (per icv.qa\'s own wording) not a guaranteed win and not an exact percentage weighting, so this is disclosed as context rather than modeled as a computed discount.',
    sourceNoteAr: 'تنشر البوابة الرقمية الرسمية للقيمة المحلية في قطر (icv.qa، الجهة الوطنية المعتمدة لشهادات القيمة المحلية) منهجية حقيقية قابلة للحساب: الدرجة الأساسية للقيمة المحلية = الإنفاق المحلي المؤهل (السلع والمواد الملموسة المحلية + الخدمات المحلية -- القوى العاملة والمقاولون من الباطن والسلع + تكلفة تدريب المواطنين/المقيمين القطريين + تكلفة تدريب/اعتماد الموردين + إهلاك أصول الشركة المقيمة في قطر) مقسومة على إجمالي إيرادات قطر باستثناء الصادرات. تُحتسب تكاليف تطوير الموردين من الباطن بنسبة ١٠٠٪ كمساهمة في درجة المورّد الرئيسي نفسه. معدِّلات حقيقية وموثّقة تُضاف إلى الدرجة الأساسية، بحسب صفحتي الأسئلة الشائعة والبرنامج المعزَّز على icv.qa: (١) سياسة "ICV+" تمنح المصنّعين المؤهلين زيادة ٥٠٪ على درجة القيمة المحلية؛ (٢) "الدرجة الشاملة" تضمن للموردين متناهي الصغر والصغار حداً أدنى لدرجة القيمة المحلية يبلغ ٣٠٪؛ (٣) يمكن للموردين المطالبة بحتى ١٥ نقطة مئوية إضافية عبر سلوكيات استراتيجية موثّقة (الإنتاجية، بناء القدرات، نمو الاستثمار، القطرنة، التصدير، البحث والتطوير، الاستدامة) -- وتُنمذَج هنا كمُدخل ذاتي التصريح يُدخله المستخدم بحدّ أقصى (وليس محسوباً بشكل مستقل من مكوّنات فرعية، إذ لا تنشر icv.qa الترجيح الداخلي لهذه المكافأة البالغة ١٥ نقطة). في تقييم العطاءات، تذكر icv.qa أن القيمة المحلية "ستؤدي دوراً في تقييم العروض التجارية؛ إذ تُمنح علاوات للعروض ذات القيمة المحلية الأعلى بشرط أن يكون السعر تنافسياً" -- آلية ميزة تجارية حقيقية وموثّقة، إلا أنها (بحسب صياغة icv.qa نفسها) لا تضمن الفوز ولا تمثّل ترجيحاً بنسبة مئوية دقيقة، لذا يُفصَح عنها كسياق وليس كخصم محسوب.',
  },
  'bh-local-content': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'Local content framework -- not yet sourced', programNameAr: 'إطار المحتوى المحلي — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'bh-local-content',
    applicableContexts: [],
    sourceNoteEn: 'This research pass found no formalized, publicly-documented GENERAL national local-content scoring framework for Bahrain to the rigor applied to SA/AE/JO. Deliberately not guessed. Two genuinely different, narrower Bahrain mechanisms WERE sourced this pass (both under the same Ministerial Decision No. 23 of 2026) and are modeled separately below: `bh-sme-price-preference` and `bh-sme-spend-setaside` -- confirming the brief\'s own original taxonomy note that Bahrain "reserves a share of tenders for SMEs plus a stacked price preference."',
    sourceNoteAr: 'لم يعثر هذا البحث على إطار وطني عام موثّق علنياً لتقييم المحتوى المحلي في مملكة البحرين بنفس دقة السعودية والإمارات والأردن. لم يتم تخمينه عمداً. جرى في هذا البحث توثيق آليتين بحرينيتين مختلفتين فعلياً وأضيق نطاقاً (كلتاهما بموجب القرار الوزاري رقم ٢٣ لسنة ٢٠٢٦ نفسه)، ونُمذجتا بشكل منفصل أدناه: `bh-sme-price-preference` و`bh-sme-spend-setaside` -- وهو ما يؤكد ملاحظة التصنيف الأصلية في الموجز بأن البحرين "تخصص حصة من المناقصات للمؤسسات الصغيرة والمتوسطة إضافة إلى تفضيل سعري متراكب."',
  },
  'bh-sme-price-preference': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'SME Bidding Price Advantage', programNameAr: 'ميزة سعرية للمؤسسات الصغيرة والمتوسطة في المناقصات',
    mechanismType: 'price-preference-margin', program: 'bh-sme-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: 'Under Ministerial Decision No. 23 of 2026 (Bahrain\'s Minister of Industry and Commerce, published in the Official Gazette 11 Jun 2026, effective 12 Jun 2026, repealing the 2017 SME-classification criteria), SMEs qualifying under the new ceiling (up to 250 employees or up to BHD 20 million in annual revenue, up from the prior 100 employees / BHD 3 million) receive "a 10% advantage in bidding for government tenders" (per mondaq.com\'s legal summary). A separate, related 10% advantage applies to public-utility auctions -- disclosed here as related context, not separately modeled (this program covers tender bidding specifically). Structurally the same price-preference-margin mechanism as Jordan/Saudi, but the qualifying share here is binary (SME status), not a locally-manufactured content percentage.',
    sourceNoteAr: 'بموجب القرار الوزاري رقم ٢٣ لسنة ٢٠٢٦ (الصادر عن وزير الصناعة والتجارة البحريني، ونُشر في الجريدة الرسمية بتاريخ ١١ يونيو ٢٠٢٦، ونفذ اعتباراً من ١٢ يونيو ٢٠٢٦، وألغى معايير تصنيف المؤسسات الصغيرة والمتوسطة لعام ٢٠١٧)، تحصل المؤسسات المؤهلة ضمن السقف الجديد (حتى ٢٥٠ موظفاً أو حتى ٢٠ مليون دينار بحريني إيرادات سنوية، مقارنة بالسقف السابق البالغ ١٠٠ موظف / ٣ ملايين دينار) على "ميزة بنسبة ١٠٪ في تقديم العطاءات للمناقصات الحكومية" (بحسب الملخص القانوني الصادر عن mondaq.com). وتنطبق ميزة منفصلة ذات صلة بنسبة ١٠٪ على مزادات المرافق العامة -- تُذكر هنا كسياق ذي صلة دون نمذجتها بشكل منفصل (يغطي هذا البرنامج تقديم العطاءات تحديداً). آلية مطابقة من حيث البنية لتفضيل السعر الأردني/السعودي، إلا أن الحصة المؤهلة هنا ثنائية (صفة مؤسسة صغيرة أو متوسطة)، وليست نسبة محتوى مصنّع محلياً.',
  },
  'bh-sme-spend-setaside': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'SME Government Spend Allocation', programNameAr: 'تخصيص إنفاق حكومي للمؤسسات الصغيرة والمتوسطة',
    mechanismType: 'spend-set-aside-target', program: 'bh-sme-spend-setaside',
    applicableContexts: ['government'],
    sourceNoteEn: 'The same Ministerial Decision No. 23 of 2026 sourcing (mondaq.com) states a "20% allocation of the value of government procurements and tenders to SMEs" qualifying under the new ceiling -- a real, sourced national spend-reservation target, structurally the SME/local spend set-aside mechanism type (per the brief\'s own original taxonomy note that Bahrain "reserves a share of tenders for SMEs"). This is a national/program-level target share, not a per-supplier score -- disclosed here alongside this supplier\'s own SME qualification for the reserved pool.',
    sourceNoteAr: 'يذكر المصدر نفسه لقرار وزاري ٢٣ لسنة ٢٠٢٦ (mondaq.com) تخصيص "٢٠٪ من قيمة المشتريات والمناقصات الحكومية للمؤسسات الصغيرة والمتوسطة" المؤهلة ضمن السقف الجديد -- هدف وطني حقيقي وموثّق لتخصيص حصة من الإنفاق، وهو من نوع آلية تخصيص الإنفاق المحلي/للمؤسسات الصغيرة والمتوسطة (بحسب ملاحظة التصنيف الأصلية في الموجز التي أشارت إلى أن البحرين "تخصص حصة من المناقصات للمؤسسات الصغيرة والمتوسطة"). هذا هدف وطني/برنامجي على مستوى الحصة، وليس درجة خاصة بمورّد بعينه -- يُعرض هنا إلى جانب مدى استيفاء هذا المورّد لشرط التأهل كمؤسسة صغيرة أو متوسطة للاستفادة من هذه الحصة المخصصة.',
  },
  'kw-local-content': {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: 'Local content framework -- not yet sourced', programNameAr: 'إطار المحتوى المحلي — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'kw-local-content',
    applicableContexts: [],
    sourceNoteEn: 'This research pass found no formalized, publicly-documented GENERAL national local-content scoring framework for Kuwait to the rigor applied to SA/AE/JO. Deliberately not guessed. A genuinely different, narrower, and real KPC spend-target mechanism WAS sourced this pass and is modeled separately below (`kw-kpc-local-spend`).',
    sourceNoteAr: 'لم يعثر هذا البحث على إطار وطني عام موثّق علنياً لتقييم المحتوى المحلي في دولة الكويت بنفس دقة السعودية والإمارات والأردن. لم يتم تخمينه عمداً. جرى في هذا البحث توثيق آلية كويتية مختلفة فعلياً وأضيق نطاقاً وحقيقية لهدف إنفاق مؤسسة البترول الكويتية، ونُمذجت بشكل منفصل أدناه (`kw-kpc-local-spend`).',
  },
  'kw-kpc-local-spend': {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: 'KPC Kuwaiti-Supplier Spend Target', programNameAr: 'هدف إنفاق مؤسسة البترول الكويتية مع الموردين الكويتيين',
    mechanismType: 'spend-set-aside-target', program: 'kw-kpc-local-spend',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'Per the U.S. government\'s own trade.gov Kuwait market-intelligence guide (citing Kuwait Petroleum Corporation\'s own stated objectives), KPC aims to "increase local private sector share in KPC spending by requiring a minimum of 30% of a project spending be designated for Kuwaiti suppliers," targeted "by 2040." This is KPC\'s own anchor-buyer-style spend target across its "K-company" group (KOC, KNPC, and other KPC subsidiaries) -- the real sourced mechanism the brief\'s own taxonomy note anticipated ("Kuwait\'s KPC/KOC run anchor-buyer-style programs... plus a spend set-aside"). No further per-supplier qualification criteria (a formal "Kuwaiti supplier" registration/certification scheme, as opposed to simple national ownership/registration) were found in this research pass -- disclosed as self-reported registration status pending a more granular sourced definition.',
    sourceNoteAr: 'بحسب دليل الحكومة الأمريكية الرسمي على trade.gov حول قطاع النفط الكويتي (نقلاً عن أهداف مؤسسة البترول الكويتية المعلنة)، تهدف المؤسسة إلى "زيادة حصة القطاع الخاص المحلي في إنفاق المؤسسة عبر اشتراط تخصيص ما لا يقل عن ٣٠٪ من إنفاق المشاريع للموردين الكويتيين"، بحلول عام ٢٠٤٠. هذا هدف إنفاق خاص بمؤسسة البترول الكويتية بصفتها مشترياً رئيسياً عبر مجموعة "شركات الكاف" التابعة لها (شركة نفط الكويت، شركة البترول الوطنية الكويتية، وشركات أخرى تابعة للمؤسسة) -- وهو الآلية الحقيقية والموثّقة التي توقّعتها ملاحظة التصنيف الأصلية في الموجز ("تدير مؤسسة البترول الكويتية/شركة نفط الكويت برامج على غرار المشتري الرئيسي... إضافة إلى تخصيص حصة من الإنفاق"). لم يُعثر في هذا البحث على معايير تأهيل إضافية على مستوى المورّد (نظام تسجيل/اعتماد رسمي لصفة "المورّد الكويتي"، بخلاف الملكية/التسجيل الوطني البسيط) -- يُفصَح عن ذلك كحالة تسجيل ذاتية التصريح ريثما تتوفر مصادر أدق.',
  },
};

// ---------------------------------------------------------------------------
// Section 1e — Egypt (EG). 15 Sep 2026 Part 2 pass ("non-GCC coverage"):
// the first non-GCC/Jordan country added to this engine. Two genuinely
// different, real, sourced price-preference-margin mechanisms (a general
// public-procurement preference and a narrower oil & gas PSA preference,
// run by different bodies under different legal bases), plus one honest
// not-yet-sourced entry (the revamped automotive local-content target,
// whose formula is reported as unpublished). See file header for the
// "rest of the world" coverage-scope note this pass also established.
// ---------------------------------------------------------------------------

const EG_PROGRAMS: Record<'eg-price-preference' | 'eg-oil-gas-price-preference' | 'eg-auto-local-content', CountryFrameworkInfo> = {
  'eg-price-preference': {
    country: 'EG', countryNameEn: 'Egypt', countryNameAr: 'جمهورية مصر العربية',
    programNameEn: 'Public Procurement Price Preference', programNameAr: 'تفضيل السعر في المشتريات الحكومية',
    mechanismType: 'price-preference-margin', program: 'eg-price-preference',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'Egypt\'s Law No. 5 of 2015 ("Preference of Egyptian Products in Governmental Contracts", as amended by Law No. 90 of 2018) requires a bid\'s supplied goods/services to contain at least 40% Egyptian-origin local content, by estimated project value, to qualify as an "Egyptian product"; qualifying Egyptian bidders then receive a flat 15% price preference in evaluation against foreign bids (per the US government\'s own trade.gov "Egypt -- Selling to the Public Sector" guide: "Egyptian domestic contractors shall be accorded priority if their bids do not exceed the lowest foreign bid by more than 15 percent"). This preference sits within Egypt\'s broader public-procurement legal framework -- trade.gov\'s own guide cites the older Tenders and Bids Law No. 89 of 1998 as governing overall procurement procedure, while a separate legal summary (riad-riad.com) states Law No. 182 of 2018 replaced that 1998 law; this research pass discloses that citation discrepancy rather than resolving it by assumption, the same treatment already applied to Jordan\'s own unconfirmed bylaw citation. Exempted from these preferences: procurement by the Ministry of Defense, Ministry of Interior, Military Production, and General Intelligence -- a real disclosed scope carve-out this engine does not separately model (no per-department procurement context is sourced anywhere else in this file either). No dedicated certifying/administering authority for the 40% local-content determination was identified in this research pass\'s sourcing. Modeled here as a threshold-gated flat preference (qualify at >=40% local content, then receive the full 15% margin) rather than Jordan/Oman\'s continuously-scaled share, since that is what the sourced language describes -- a genuinely different shape from the price-preference-margin mechanism\'s other reuses, disclosed rather than smoothed into the same continuous-scaling assumption.',
    sourceNoteAr: 'يشترط القانون المصري رقم ٥ لسنة ٢٠١٥ ("في شأن تفضيل المنتجات المصرية في العقود الحكومية"، بصيغته المعدَّلة بالقانون رقم ٩٠ لسنة ٢٠١٨) أن يحتوي العطاء على نسبة لا تقل عن ٤٠٪ من المحتوى المحلي المصري المنشأ، من القيمة التقديرية للمشروع، ليُعتبر "منتجاً مصرياً"؛ وتحصل العطاءات المصرية المؤهلة عندئذٍ على تفضيل سعري ثابت بنسبة ١٥٪ عند تقييمها مقابل العطاءات الأجنبية (بحسب دليل الحكومة الأمريكية الرسمي "مصر -- البيع للقطاع العام" على trade.gov: "يُمنح المقاولون المصريون المحليون الأولوية إذا لم تتجاوز عطاءاتهم أقل عطاء أجنبي بأكثر من ١٥٪"). يندرج هذا التفضيل ضمن إطار المشتريات الحكومية المصرية الأوسع -- يستشهد دليل trade.gov نفسه بقانون المناقصات والمزايدات رقم ٨٩ لسنة ١٩٩٨ (القديم) كحاكم لإجراءات المشتريات العامة، في حين يذكر ملخص قانوني منفصل (riad-riad.com) أن القانون رقم ١٨٢ لسنة ٢٠١٨ حلّ محل ذلك القانون القديم؛ يُفصح هذا البحث عن هذا التعارض في الاستشهاد بدلاً من حسمه بافتراض، وهي نفس المعالجة المطبّقة سابقاً على استشهاد الأردن غير المؤكد بالنظام. يُستثنى من هذه التفضيلات: مشتريات وزارة الدفاع، ووزارة الداخلية، والإنتاج الحربي، والمخابرات العامة -- استثناء حقيقي ومُفصَح عنه لا يُنمذجه هذا المحرك بشكل منفصل (لا يوجد سياق مشتريات خاص بكل جهة موثّق في أي مكان آخر من هذا الملف أيضاً). لم تُحدَّد جهة اعتماد/إدارة مخصصة لتحديد نسبة الـ٤٠٪ للمحتوى المحلي ضمن مصادر هذا البحث. يُنمذَج هذا هنا كتفضيل ثابت مشروط ببوابة حدّية (التأهل عند ≥٤٠٪ محتوى محلي، ثم الحصول على كامل هامش الـ١٥٪) بدلاً من التدرّج المستمر المستخدم في الأردن وعُمان، لأن هذا ما تصفه الصياغة الموثّقة -- شكل مختلف فعلياً عن الاستخدامات الأخرى لآلية تفضيل السعر، يُفصَح عنه بدلاً من دمجه ضمن افتراض التدرّج المستمر نفسه.',
  },
  'eg-oil-gas-price-preference': {
    country: 'EG', countryNameEn: 'Egypt', countryNameAr: 'جمهورية مصر العربية',
    programNameEn: 'Oil & Gas PSA Local-Contractor Priority', programNameAr: 'أولوية المقاول المحلي في اتفاقيات تقاسم الإنتاج النفطية',
    mechanismType: 'price-preference-margin', program: 'eg-oil-gas-price-preference',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'Egypt\'s Production Sharing Agreement (PSA) model -- the standard contractual framework governing oil & gas exploration/production, under the Mines and Quarries Law of 1953, the Investment Guarantees and Incentives Act of 1997, and the Ministry of Petroleum\'s own PSA terms -- requires operating (International Oil Company) contractors to give priority to local Egyptian contractors and sub-contractors "when their performance is comparable to international performance, and the prices of their services are not higher than other contractors by more than 10%" (a 10% price-band preference), and separately to favor domestically-manufactured equipment/materials on the same comparable-quality/delivery basis. This is a real, sourced, genuinely different mechanism from the general procurement preference above -- a different buyer (petroleum-sector operating companies under Ministry of Petroleum oversight, not general government procuring entities), a different legal basis (PSA contractual terms, not Law 5/2015), and a different margin (10%, not 15%), the same "genuinely distinct mechanism, not a variant" pattern already applied to UAE Tawazun vs. ICV and Oman\'s OQ Group vs. general ICV. This research pass found no numeric administering-body confirmation beyond the general PSA contractual language -- the source article\'s own recommendation that Egypt establish "a unique and specialized department in the Ministry of Petroleum to manage local content" implies no such department is confirmed to exist yet, disclosed as an open item rather than assumed. Modeled here via the binary local-contractor-status-to-share conversion already used for Bahrain\'s SME price preference (qualifying status -> 100% share, not qualifying -> 0%), since the sourced mechanism is a contractor-class priority, not a locally-manufactured-content percentage of bid value.',
    sourceNoteAr: 'يشترط نموذج اتفاقية تقاسم الإنتاج (PSA) المصري -- الإطار التعاقدي المعياري الحاكم لاستكشاف وإنتاج النفط والغاز، بموجب قانون المناجم والمحاجر لعام ١٩٥٣، وقانون ضمانات وحوافز الاستثمار لعام ١٩٩٧، وشروط اتفاقيات تقاسم الإنتاج الخاصة بوزارة البترول -- أن تمنح الشركات المشغِّلة (شركات النفط الدولية) الأولوية للمقاولين والمقاولين من الباطن المصريين المحليين "عندما يكون أداؤهم مماثلاً للأداء الدولي، ولا تتجاوز أسعار خدماتهم أسعار المقاولين الآخرين بأكثر من ١٠٪" (هامش تفضيل سعري ١٠٪)، وأن تُفضِّل بشكل منفصل المعدات/المواد المصنَّعة محلياً على نفس أساس تكافؤ الجودة والتسليم. هذه آلية حقيقية وموثّقة ومختلفة فعلياً عن تفضيل المشتريات العام أعلاه -- مشترٍ مختلف (شركات التشغيل في قطاع البترول تحت إشراف وزارة البترول، وليس جهات المشتريات الحكومية العامة)، وأساس قانوني مختلف (شروط اتفاقية تقاسم الإنتاج، وليس القانون ٥ لسنة ٢٠١٥)، وهامش مختلف (١٠٪ وليس ١٥٪)، وهو نفس نمط "آلية مختلفة فعلاً، وليست نسخة" المُطبَّق سابقاً على توازن الإماراتية مقابل ICV العام، وتفضيل مجموعة OQ العُمانية مقابل ICV العام. لم يعثر هذا البحث على تأكيد رقمي لجهة إدارة محددة بخلاف الصياغة التعاقدية العامة لاتفاقيات تقاسم الإنتاج -- وتوصية المقال المصدر نفسه بأن تُنشئ مصر "إدارة متخصصة وفريدة في وزارة البترول لإدارة المحتوى المحلي" تعني ضمناً أن مثل هذه الإدارة غير مؤكد وجودها بعد، ويُفصَح عن ذلك كمسألة مفتوحة لا كافتراض. يُنمذَج هذا هنا عبر تحويل حالة المقاول المحلي الثنائية إلى حصة، بنفس الأسلوب المستخدم بالفعل لتفضيل سعر المنشآت الصغيرة والمتوسطة البحرينية (حالة التأهل → حصة ١٠٠٪، وعدم التأهل → ٠٪)، لأن الآلية الموثّقة هي أولوية لفئة مقاولين، وليست نسبة مئوية من قيمة العطاء مصنّعة محلياً.',
  },
  'eg-auto-local-content': {
    country: 'EG', countryNameEn: 'Egypt', countryNameAr: 'جمهورية مصر العربية',
    programNameEn: 'Automotive Local Content Target (AIDP) -- not yet sourced', programNameAr: 'هدف المحتوى المحلي لصناعة السيارات (برنامج تطوير صناعة السيارات) — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'eg-auto-local-content',
    applicableContexts: [],
    sourceNoteEn: "Egypt's Ministry of Industry, Trade and Small Industries announced a revamped Automotive Industry Development Program (AIDP) targeting 60% local content and 100,000 vehicles/year, alongside performance-based production bonuses, extended EV support, and rewards for introducing advanced technology and specific component industries (glass, upholstery, sheet metal) (per EnterpriseAM's March 2026 reporting) -- replacing the earlier AIDP's 35% local-content / 10,000-vehicle target, described in that same reporting as impractical given Egypt's limited domestic demand and underdeveloped supplier base. No published per-manufacturer or per-supplier computable formula for the revised 60% target was found; the incentive structure is reported as unpublished, pending official announcement, as of this research pass. A real, dated national target is disclosed here rather than a fabricated per-supplier score, the same Decision Record 8.7 treatment already applied to Saudi GAMI/LIKT and Oman/Qatar/Bahrain/Kuwait's general national programs.",
    sourceNoteAr: 'أعلنت وزارة التجارة والصناعة المصرية (وزارة الصناعة والتجارة والصناعات الصغيرة) عن نسخة مُجدَّدة من برنامج تطوير صناعة السيارات (AIDP) تستهدف ٦٠٪ محتوى محلي و١٠٠ ألف مركبة سنوياً، إلى جانب مكافآت إنتاج قائمة على الأداء، ودعم موسّع للمركبات الكهربائية، ومكافآت لإدخال تقنيات متقدمة وصناعات مكوّنات محددة (الزجاج، التنجيد، الصاج) (بحسب تقرير EnterpriseAM في مارس ٢٠٢٦) -- لتحل محل هدف البرنامج السابق البالغ ٣٥٪ محتوى محلي و١٠ آلاف مركبة، والذي وصفه التقرير نفسه بأنه غير عملي نظراً لمحدودية الطلب المحلي المصري وضعف قاعدة الموردين. لم يُعثر على صيغة حساب منشورة على مستوى المصنّع أو المورّد للهدف الجديد البالغ ٦٠٪؛ ويُذكر أن هيكل الحوافز غير منشور، وينتظر إعلاناً رسمياً حتى وقت هذا البحث. يُفصَح هنا عن هدف وطني حقيقي ومؤرَّخ بدلاً من درجة مورّد مختلقة، وهي نفس معالجة سجل القرار ٨.٧ المطبّقة سابقاً على برنامجي GAMI وLIKT السعوديين والبرامج الوطنية العامة لعُمان وقطر والبحرين والكويت.',
  },
};

const TR_PROGRAMS: Record<'tr-price-preference' | 'tr-defense-offset', CountryFrameworkInfo> = {
  'tr-price-preference': {
    country: 'TR', countryNameEn: 'Turkey', countryNameAr: 'جمهورية تركيا',
    programNameEn: 'Public Procurement Domestic Goods Price Preference', programNameAr: 'تفضيل سعر السلع المحلية في المشتريات العامة',
    mechanismType: 'price-preference-margin', program: 'tr-price-preference',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "Turkey's Public Procurement Law No. 4734, Article 63(c), lets contracting authorities grant bidders offering domestic goods (\'yerli mali\') a price advantage of up to 15% in goods-procurement tender evaluation; for goods on the official list of medium/high-technology industrial products, this 15% preference is mandatory rather than discretionary (a Kamu Ihale Kurumu/KIK ruling reported by satinalmadergisi.com found a contracting authority's use of only 7% for high-tech medical equipment non-compliant and ordered the relevant tender sections cancelled -- the \'7%\' figure that surfaces in some sources is a documented VIOLATION of the mandatory rate, not an alternative statutory rate, and this research pass discloses that resolution rather than treating 7% and 15% as two live options). The preference is applied by adding the calculated advantage amount to competing non-domestic bidders' prices for evaluation purposes, not by discounting the domestic bidder's own price (per a KIK-decision summary, salimdemirel.com.tr); domestic-goods status is certified per item via a \'Yerli Mali Belgesi\' (Domestic Goods Certificate), issued by local Chambers of Commerce/Industry or the Turkish Standards Institution (TSE) under the Ministry of Industry and Technology's framework, and the preference is applied item-by-item in partial/multi-item tenders -- a proportional, not all-or-nothing, mechanism. This research pass found no sourced SME-specific rate distinct from the general rate. Modeled here via the same continuously-scaled share already used for Jordan/Oman (the domestic-certified share of this bid's value), rather than Egypt's binary threshold gate, since the sourced item-by-item/partial-certification language describes a proportional mechanism; the constant used is the 15% ceiling/mandatory rate (the maximum a contracting authority can set, and the rate legally required for medium/high-tech goods) -- disclosed as a ceiling, since the administration sets the exact figure (0-15%) in each tender's own documents for goods not on the mandatory list, and this engine cannot see a specific tender's published rate.",
    sourceNoteAr: 'يتيح قانون المشتريات العامة التركي رقم ٤٧٣٤، المادة ٦٣(ج)، لجهات التعاقد منح مزايدين يعرضون سلعاً محلية ("يرلي مالي") ميزة سعرية تصل إلى ١٥٪ في تقييم مناقصات توريد السلع؛ وبالنسبة للسلع المدرجة في القائمة الرسمية للمنتجات الصناعية متوسطة أو عالية التقنية، يصبح هذا التفضيل بنسبة ١٥٪ إلزامياً وليس تقديرياً (قرار صادر عن هيئة المشتريات العامة التركية -- Kamu İhale Kurumu/KİK -- نقلته satinalmadergisi.com، وجد أن استخدام جهة تعاقد نسبة ٧٪ فقط لمعدات طبية عالية التقنية غير متوافق، وأمر بإلغاء أقسام المناقصة المعنية -- فرقم "٧٪" الذي يظهر في بعض المصادر هو مخالفة موثّقة للنسبة الإلزامية، وليس نسبة قانونية بديلة، ويُفصح هذا البحث عن هذا الحسم بدلاً من معاملة ٧٪ و١٥٪ كخيارين قائمين). يُطبَّق التفضيل بإضافة مبلغ الميزة المحسوبة إلى أسعار المزايدين غير المحليين المنافسين لأغراض التقييم، وليس بخصم من سعر المزايد المحلي نفسه (وفق ملخص قرار KİK، salimdemirel.com.tr)؛ وتُعتمد حالة السلعة المحلية لكل بند عبر "وثيقة يرلي مالي" (شهادة السلعة المحلية)، تصدرها غرف التجارة/الصناعة المحلية أو معهد المواصفات التركي (TSE) ضمن إطار وزارة الصناعة والتقنية، ويُطبَّق التفضيل بنداً بنداً في المناقصات الجزئية/متعددة البنود -- آلية تناسبية وليست كلاً أو لا شيء. لم يعثر هذا البحث على نسبة خاصة بالمنشآت الصغيرة والمتوسطة تختلف عن النسبة العامة. يُنمذَج هذا هنا عبر نفس التدرّج المستمر المستخدم بالفعل للأردن وعُمان (حصة المحتوى المحلي المعتمد من قيمة هذا العطاء)، بدلاً من بوابة مصر الحدّية الثنائية، لأن صياغة الاعتماد الجزئي بنداً بنداً الموثّقة تصف آلية تناسبية؛ والثابت المستخدم هو النسبة القصوى/الإلزامية ١٥٪ (الحد الأقصى الذي يمكن لجهة التعاقد تحديده، والنسبة المطلوبة قانوناً للسلع متوسطة أو عالية التقنية) -- يُفصَح عنها كسقف، إذ تحدد الإدارة الرقم الدقيق (٠-١٥٪) في وثائق كل مناقصة للسلع غير المدرجة في القائمة الإلزامية، ولا يمكن لهذا المحرك رؤية النسبة المنشورة لمناقصة بعينها.',
  },
  'tr-defense-offset': {
    country: 'TR', countryNameEn: 'Turkey', countryNameAr: 'جمهورية تركيا',
    programNameEn: 'SSB Defense Offset Guideline (2022) -- not yet sourced', programNameAr: 'دليل تعويضات SSB الدفاعية (٢٠٢٢) — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'tr-defense-offset',
    applicableContexts: [],
    sourceNoteEn: "Turkey's defense-sector offset regime is administered by the Presidency of Defence Industries (Savunma Sanayii Baskanligi, SSB), which replaced the Undersecretariat for Defence Industries (SSM) under the 2018 executive-branch reorganization; a new Offset Guideline was issued in 2022, replacing a 2011-vintage guideline. Two real, professionally-published sources disagree on the headline commitment in a way this research pass discloses rather than resolves by assumption: mondaq.com's summary states foreign contractors/subcontractors on qualifying defense contracts must commit to an \'Offset Liability of at least 70% of the bid amount\', backed by a 6% guarantee of total offset liabilities; herdemlaw.com's more granular 2011-vs-2022 comparison instead gives narrower sub-thresholds -- a minimum 21% of contract value as local-content/SME work share (YS/SME), a requirement that 70% of EYDEP-accredited work specifically be carried out by Turkish SMEs (not 70% of the whole bid), a minimum 2% of bid value as a technology-acquisition (TUK) liability, and a tiered shortfall penalty (6% of that period's shortfall in the program's interim period, rising to +50% of outstanding liabilities in an extended period, and a final 25% penalty on any liability still unrealized). Whether mondaq's \'70% of bid amount\' and herdemlaw's \'70% of EYDEP-accredited work\' describe the same commitment under different labels, or two distinct figures, is not established by either source -- disclosed as an open discrepancy, the same treatment already applied to Egypt's Law 89/1998-vs-182/2018 citation conflict and Jordan's unconfirmed bylaw citation. Neither source states a confirmed contract-value trigger threshold analogous to UAE Tawazun's clear AED 10M/$10M line, and no per-supplier (as opposed to prime-contractor-level) computable formula was found. Kept as an honest not-yet-sourced entry -- Decision Record 8.7 -- with this real, dated context disclosed rather than a guessed formula or an assumed reconciliation of the two sources' figures. (A separate, real Turkish domestic-content scheme -- the YEKDEM renewable-energy feed-in-tariff program's >=55% domestic-content requirement for solar module manufacturers to access premium tariffs -- was found in this research pass but is deliberately NOT modeled as a third Turkish program: it certifies a manufacturer for subsidy access, not a supplier bidding into a specific buyer's tender, so it does not fit this engine's buyer-side ProcurementContext taxonomy the way every other modeled mechanism does. Disclosed here as an explicit scope decision, not a silent omission.)",
    sourceNoteAr: 'يُدار نظام التعويضات الدفاعية (Offset) التركي عبر رئاسة الصناعات الدفاعية (Savunma Sanayii Başkanlığı -- SSB)، التي حلّت محل الأمانة العامة للصناعات الدفاعية (SSM) ضمن إعادة الهيكلة التنفيذية لعام ٢٠١٨؛ وصدر دليل تعويضات جديد عام ٢٠٢٢ ليحل محل دليل سابق يعود لعام ٢٠١١. يختلف مصدران حقيقيان منشوران باحترافية حول الالتزام الرئيسي بطريقة يُفصح عنها هذا البحث بدلاً من حسمها بافتراض: يذكر ملخص mondaq.com أن على المقاولين/المقاولين من الباطن الأجانب في العقود الدفاعية المؤهلة الالتزام بـ"مسؤولية تعويض لا تقل عن ٧٠٪ من قيمة العرض"، مدعومة بضمان بنسبة ٦٪ من إجمالي التزامات التعويض؛ بينما تقدم مقارنة herdemlaw.com الأكثر تفصيلاً بين دليلي ٢٠١١ و٢٠٢٢ عتبات فرعية أضيق -- حد أدنى ٢١٪ من قيمة العقد كحصة عمل محلي/منشآت صغيرة ومتوسطة (YS/SME)، وشرط أن يُنجَز ٧٠٪ من العمل المعتمد ضمن EYDEP تحديداً بواسطة منشآت تركية صغيرة ومتوسطة (وليس ٧٠٪ من العرض كاملاً)، وحد أدنى ٢٪ من قيمة العرض كالتزام اكتساب تقنية (TÜK)، وعقوبة تدرجية عند التقصير (٦٪ من عجز تلك الفترة في المرحلة الانتقالية للبرنامج، ترتفع إلى +٥٠٪ من الالتزامات المتبقية في مرحلة ممتدة، وعقوبة نهائية ٢٥٪ على أي التزام لم يُنجَز بعد). ولا يتضح من أي من المصدرين ما إذا كان رقم mondaq "٧٠٪ من قيمة العرض" ورقم herdemlaw "٧٠٪ من العمل المعتمد ضمن EYDEP" يصفان الالتزام ذاته بتسميتين مختلفتين، أم رقمين منفصلين فعلاً -- ويُفصَح عن ذلك كتعارض مفتوح، بنفس المعالجة المطبّقة سابقاً على تعارض استشهاد مصر بين القانونين ٨٩/١٩٩٨ و١٨٢/٢٠١٨، واستشهاد الأردن غير المؤكد بالنظام. لا يذكر أي من المصدرين عتبة تعاقدية مؤكدة مماثلة لعتبة توازن الإماراتية الواضحة (١٠ ملايين درهم/دولار)، ولم يُعثر على صيغة حساب على مستوى المورّد (بخلاف التزام على مستوى المقاول الرئيسي). يُبقى هذا كإدخال صادق غير موثّق بعد -- سجل القرار ٨.٧ -- مع الإفصاح عن هذا السياق الحقيقي والمؤرَّخ بدلاً من صيغة مخمَّنة أو تسوية مفترَضة بين رقمي المصدرين. (عُثر في هذا البحث على نظام محتوى محلي تركي حقيقي منفصل -- برنامج تعرفة التغذية للطاقة المتجددة YEKDEM الذي يشترط محتوى محلياً ≥٥٥٪ لمصنّعي الألواح الشمسية للوصول إلى تعرفات مميزة -- لكنه لا يُنمذَج عمداً كبرنامج تركي ثالث: فهو يعتمد المصنّع للوصول إلى دعم، وليس مورّداً يتقدم بعطاء لمناقصة مشترٍ محدد، وبالتالي لا يتناسب مع تصنيف ProcurementContext الخاص بالمشتري في هذا المحرك كما تفعل كل آلية أخرى منمذجة. يُفصَح عن هذا هنا كقرار نطاق صريح، وليس إغفالاً صامتاً.)',
  },
};

const UK_PROGRAMS: Record<'uk-below-threshold-reservation', CountryFrameworkInfo> = {
  'uk-below-threshold-reservation': {
    country: 'UK', countryNameEn: 'United Kingdom', countryNameAr: 'المملكة المتحدة',
    programNameEn: 'Below-Threshold Procurement Reservation (PPN 005)', programNameAr: 'تخصيص المشتريات دون العتبة (مذكرة PPN 005)',
    mechanismType: 'category-eligibility-gate', program: 'uk-below-threshold-reservation',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "The UK's Procurement Act 2023 (PA23) binds contracting authorities to a non-discrimination duty toward \'treaty state\' suppliers (WTO Government Procurement Agreement parties and FTA partners) for regulated procurement above the Act's own thresholds (Schedule 1, updated annually by Cabinet Office Procurement Policy Note -- PPN 023 sets goods/services at GBP 135,018 for central government and GBP 207,720 for other/sub-central contracting authorities, works at GBP 5,193,000, effective 1 Jan 2026). This is a structural, legal reason -- not a research gap -- why the UK runs no GCC/Jordan/Egypt/Turkey-style above-threshold price preference for domestic suppliers: doing so would breach that duty. Below those thresholds, however, Cabinet Office Procurement Policy Note 005 (\'Guide to Reserving Below Threshold Procurements\') lets in-scope public bodies reserve a below-threshold contract for suppliers by geography -- UK-wide, a single county, or individual London boroughs, explicitly NOT by constituent UK nation (England/Scotland/Wales/Northern Ireland may not be used as the reservation boundary) -- optionally combined with SME/VCSE (voluntary, community and social enterprise) supplier-type status, though that combination requires the geography reservation and cannot be applied on its own. PPN 005 sets no percentage or quota: a reserved procurement is a binary eligible/not-eligible gate per bidder, the same shape as Saudi/Oman's Mandatory List category-eligibility-gate mechanism, reused here rather than invented fresh. Northern Ireland goods procurement of cross-border interest is excluded from this reservation policy, per the Windsor Framework/Northern Ireland Protocol's EU treaty free-movement rights -- a real, disclosed carve-out, the same \'disclosed, not separately modeled\' treatment already applied to Egypt's defense/interior procurement exemption.\n\nA separate, real UK mechanism -- \'social value\' evaluation weighting under the Public Services (Social Value) Act 2012 and the Procurement Act 2023's National Procurement Policy Statement (Cabinet Office PPN 002; the devolved equivalents -- Wales' WPPN 003 and Northern Ireland -- both mandate a minimum 10% social-value weighting, England sets no mandated minimum, Scotland encourages but does not mandate one) -- is deliberately NOT modeled as a second UK program. It is real and sourced, but structurally different from every mechanism in this file: each contracting authority sets its own qualitative weighting per tender (bid-writing practitioners report social value comprising up to 25% of marking criteria in some tenders), the criteria span economic, social, AND environmental wellbeing (not local content specifically), and -- critically -- it must remain nationality-neutral to stay compliant with PA23 s.90, so no domestic/local-content sub-formula exists to source. A Parliamentary bill, the Public Procurement (British Goods and Services) Bill (second reading scheduled 17 Apr 2026, not yet law as of this research pass), would add mandatory consideration of UK goods/services and reporting duties (including UK-origin food-content disclosure) -- but its own drafters were explicit that it creates no price preference or quota, precisely because of the same s.90 non-discrimination duty. Disclosed here as an explicit scope decision, not a silent omission -- the same treatment already applied to Turkey's YEKDEM solar scheme.",
    sourceNoteAr: 'يُلزم قانون المشتريات البريطاني لعام ٢٠٢٣ (Procurement Act 2023) جهات التعاقد بواجب عدم التمييز تجاه موردي "دول المعاهدة" (الدول الأعضاء في اتفاقية منظمة التجارة العالمية للمشتريات الحكومية GPA وشركاء اتفاقيات التجارة الحرة) في المشتريات المنظَّمة التي تتجاوز عتبات القانون نفسها (الملحق ١، المُحدَّث سنوياً عبر مذكرة سياسة مشتريات صادرة عن مكتب مجلس الوزراء -- تحدد المذكرة PPN 023 عتبة السلع/الخدمات بـ ١٣٥,٠١٨ جنيهاً إسترلينياً للحكومة المركزية و٢٠٧,٧٢٠ جنيهاً لجهات التعاقد الأخرى دون المركزية، وعتبة الأشغال بـ ٥,١٩٣,٠٠٠ جنيه، اعتباراً من ١ يناير ٢٠٢٦). هذا سبب قانوني بنيوي -- وليس فجوة بحثية -- لعدم تشغيل المملكة المتحدة أي تفضيل سعري فوق العتبة على غرار الخليج/الأردن/مصر/تركيا لصالح الموردين المحليين: فالقيام بذلك يُخالف هذا الواجب. أما دون تلك العتبات، فتتيح مذكرة سياسة المشتريات رقم ٠٠٥ الصادرة عن مكتب مجلس الوزراء ("دليل تخصيص المشتريات دون العتبة") للجهات العامة المشمولة تخصيص عقد دون العتبة لموردين وفق النطاق الجغرافي -- على مستوى المملكة المتحدة كاملة، أو مقاطعة واحدة، أو أحياء لندن الفردية، دون استخدام أقاليم المملكة المتحدة المكوِّنة (إنجلترا/اسكتلندا/ويلز/أيرلندا الشمالية) كحدٍّ للتخصيص صراحةً -- ويمكن دمج ذلك اختيارياً مع صفة نوع المورّد (منشأة صغيرة أو متوسطة، أو منشأة مجتمعية/تطوعية)، لكن هذا الدمج يتطلب وجود تخصيص جغرافي ولا يمكن تطبيقه بمفرده. لا تحدد مذكرة PPN 005 أي نسبة أو حصة: فالمشتريات المخصصة هي بوابة ثنائية مؤهل/غير مؤهل لكل مزايد، بنفس شكل بوابة أهلية الفئة المستخدمة في القائمة الإلزامية السعودية والعمانية، ويُعاد استخدامها هنا بدلاً من اختراع آلية جديدة. تُستثنى مشتريات السلع لأيرلندا الشمالية ذات الاهتمام العابر للحدود من سياسة التخصيص هذه، بموجب حقوق حرية الحركة التعاهدية الأوروبية بموجب إطار ويندسور/بروتوكول أيرلندا الشمالية -- استثناء حقيقي ومُفصَح عنه، بنفس معالجة "الإفصاح دون نمذجة منفصلة" المُطبَّقة على استثناء مشتريات الدفاع والداخلية المصري.\n\nآلية بريطانية حقيقية أخرى -- ترجيح تقييم "القيمة الاجتماعية" بموجب قانون القيمة الاجتماعية في الخدمات العامة لعام ٢٠١٢ وبيان سياسة المشتريات الوطني التابع لقانون مشتريات ٢٠٢٣ (مذكرة مكتب مجلس الوزراء PPN 002؛ والمعادلات المفوَّضة: تفرض ويلز (WPPN 003) وأيرلندا الشمالية كلتاهما حداً أدنى ١٠٪ لترجيح القيمة الاجتماعية، بينما لا تفرض إنجلترا حداً أدنى، وتشجع اسكتلندا ذلك دون إلزامه) -- لا تُنمذَج عمداً كبرنامج بريطاني ثانٍ. إنها آلية حقيقية وموثّقة، لكنها مختلفة بنيوياً عن كل آلية في هذا الملف: تضع كل جهة تعاقد ترجيحها النوعي الخاص بها لكل مناقصة (يذكر ممارسو كتابة العطاءات أن القيمة الاجتماعية تبلغ حتى ٢٥٪ من معايير التقييم في بعض المناقصات)، وتشمل المعايير الرفاه الاقتصادي والاجتماعي والبيئي معاً (وليس المحتوى المحلي تحديداً)، والأهم أنها يجب أن تبقى محايدة تجاه الجنسية للامتثال للمادة ٩٠ من قانون ٢٠٢٣، فلا توجد صيغة فرعية للمحتوى المحلي يمكن توثيقها. مشروع قانون برلماني، هو مشروع قانون السلع والخدمات البريطانية (Public Procurement (British Goods and Services) Bill)، (قراءة ثانية مقررة في ١٧ إبريل ٢٠٢٦، لم يصبح قانوناً بعد حتى هذه المرحلة البحثية)، سيضيف اعتباراً إلزامياً للسلع/الخدمات البريطانية وواجبات إفصاح (بما في ذلك الإفصاح عن نسبة منشأ الغذاء البريطاني) -- لكن واضعيه أوضحوا صراحة أنه لا يُنشئ أي تفضيل سعري أو حصة، تحديداً بسبب واجب عدم التمييز نفسه في المادة ٩٠. يُفصَح عن هذا هنا كقرار نطاق صريح، وليس إغفالاً صامتاً -- بنفس المعالجة المُطبَّقة على نظام YEKDEM الشمسي التركي.',
  },
};

// ---------------------------------------------------------------------------
// Section 1f -- United States (USA). 16 Sep 2026 Part 2 continuation: the
// fourth non-GCC/Jordan country and the eleventh country overall. Three
// genuinely different, real, sourced mechanisms (a federal-procurement
// price preference, an infrastructure-specific domestic-content gate, and
// a small-business-status set-aside -- not a geography-based local-content
// set-aside, disclosed as a real structural difference from every GCC/
// Jordan program), plus one honest not-yet-sourced entry (the Berry
// Amendment's DoD-specific regime). See file header for the Trade
// Agreements Act (TAA) and state-level in-state-preference scope notes.
// ---------------------------------------------------------------------------

const USA_PROGRAMS: Record<'usa-buy-american-price-preference' | 'usa-baba-infrastructure-gate' | 'usa-sba-small-business-setaside' | 'usa-berry-amendment-dod', CountryFrameworkInfo> = {
  'usa-buy-american-price-preference': {
    country: 'USA', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameEn: 'Buy American Act Price Preference (FAR 25.1/25.2)', programNameAr: 'تفضيل سعر قانون الشراء الأمريكي (FAR ٢٥.١/٢٥.٢)',
    mechanismType: 'price-preference-margin', program: 'usa-buy-american-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "The Buy American Act (41 U.S.C. 8301-8305), implemented via FAR Subpart 25.1 (supplies) and 25.2 (construction materials), requires a federal executive-agency acquisition to be a \"domestic end product\" to receive this preference: the cost of the product's US-mined/produced/manufactured components must exceed a rising statutory threshold -- 65% for items delivered 2024-2028, stepping up to 75% from 2029 onward (a 2022 Executive Order 14005 / FAR Council rule raised both the threshold and, for items containing iron or steel, added a separate <5%-foreign-iron-or-steel sub-test not separately modeled here, disclosed as an open item). A qualifying domestic offer then receives an EVALUATION price preference against competing foreign offers, not a discount on the domestic bidder's own price: FAR 25.105 adds 20% to a competing foreign offer's price for a large-business domestic offeror, or 30% for a small-business domestic offeror (source: FAR 52.225-1/52.225-3 clause text via acquisition.gov), plus an additional item-specific factor for goods on the Made In America Office's published \"critical item\" list -- that additional factor is disclosed as an open item, not modeled, since it is set per critical item rather than as one universal percentage. This preference is suspended above the Trade Agreements Act (TAA) dollar threshold ($174,000 for WTO GPA-covered supplies/services, lower for several bilateral/regional FTA partners, as of the March 2026 Federal Register update) -- above that threshold, USTR's TAA waiver replaces the domestic-content test with a \"designated country end product\" (WTO GPA/FTA-partner origin) eligibility test instead, a structural fact disclosed here rather than modeled as a second program, since it governs foreign-bidder eligibility rather than a US supplier's own local-content standing. Modeled here as a binary threshold gate (qualify at the current 65% domestic-content threshold, then receive the size-dependent margin) using the same shape already used for Egypt's public-procurement preference, since FAR's domestic-content test is pass/fail at a threshold, not continuously scaled the way Jordan/Oman/Turkey's are. The margin defaults to the large-business rate (20%) unless the caller supplies isSmallBusinessConcern=true, per Decision Record 8.7's caller-overridable-default discipline -- not a platform-invented default, FAR's own two-tier structure.",
    sourceNoteAr: 'يشترط قانون الشراء الأمريكي (Buy American Act، ٤١ U.S.C. ٨٣٠١-٨٣٠٥)، المُطبَّق عبر الفصل الفرعي ٢٥.١ من نظام اللوائح الفيدرالية للاستحواذ (FAR) (للتوريدات) و٢٥.٢ (لمواد الإنشاء)، أن يكون المنتج "منتجاً محلياً" للحصول على هذا التفضيل: يجب أن تتجاوز تكلفة مكوناته المُعدَّنة/المُنتَجة/المُصنَّعة في الولايات المتحدة عتبة قانونية متصاعدة -- ٦٥٪ للأصناف المُسلَّمة بين ٢٠٢٤ و٢٠٢٨، ترتفع إلى ٧٥٪ اعتباراً من ٢٠٢٩ (رفع الأمر التنفيذي رقم ١٤٠٠٥ الصادر عام ٢٠٢٢ وقاعدة مجلس FAR كلاً من العتبة، وأضافا للمنتجات المحتوية على حديد أو صلب اختباراً فرعياً منفصلاً بأن تقل نسبة الحديد أو الصلب الأجنبي عن ٥٪، لا يُنمذَج هنا بشكل منفصل ويُفصَح عنه كبند مفتوح). ثم يحصل العرض المحلي المؤهل على تفضيل سعري في التقييم مقابل العروض الأجنبية المنافسة، وليس خصماً على سعر المزايد المحلي نفسه: تضيف المادة FAR 25.105 نسبة ٢٠٪ إلى سعر العرض الأجنبي المنافس لصالح عارض محلي من فئة المنشآت الكبيرة، أو ٣٠٪ لعارض محلي من فئة المنشآت الصغيرة (المصدر: نص بندي FAR 52.225-1/52.225-3 عبر acquisition.gov)، بالإضافة إلى عامل إضافي خاص بكل صنف من "الأصناف الحرجة" المنشورة عبر مكتب Made In America -- ويُفصَح عن هذا العامل الإضافي كبند مفتوح غير مُنمذَج، لأنه يُحدَّد لكل صنف حرج على حدة وليس كنسبة موحدة واحدة. يُعلَّق هذا التفضيل فوق عتبة قانون اتفاقيات التجارة (TAA) بالدولار (١٧٤,٠٠٠ دولار للتوريدات/الخدمات المشمولة باتفاقية GPA لمنظمة التجارة العالمية، وأقل من ذلك لعدة شركاء اتفاقيات تجارة حرة ثنائية/إقليمية، وفق تحديث السجل الفيدرالي في مارس ٢٠٢٦) -- وفوق تلك العتبة، يستبدل إعفاء USTR بموجب TAA اختبار المحتوى المحلي باختبار أهلية "منتج نهائي من دولة معتمَدة" (منشأ من دول اتفاقية GPA أو شركاء اتفاقيات التجارة الحرة) بدلاً منه -- حقيقة بنيوية يُفصَح عنها هنا بدلاً من نمذجتها كبرنامج ثانٍ، لأنها تحكم أهلية المزايد الأجنبي وليس وضع المحتوى المحلي للمورّد الأمريكي نفسه. يُنمذَج هذا هنا كبوابة حدّية ثنائية (التأهل عند عتبة المحتوى المحلي الحالية ٦٥٪، ثم الحصول على الهامش المعتمد على الحجم) بنفس الشكل المستخدم بالفعل لتفضيل المشتريات العامة المصري، لأن اختبار المحتوى المحلي في FAR هو اختبار نجاح/رسوب عند عتبة، وليس تدرجاً مستمراً كما هو الحال في الأردن وعُمان وتركيا. يُحدَّد الهامش افتراضياً عند نسبة المنشآت الكبيرة (٢٠٪) ما لم يُدخِل المستدعي isSmallBusinessConcern=true، وفق انضباط "الافتراض القابل للتجاوز من قبل المستدعي" في سجل القرار ٨.٧ -- وهذا ليس افتراضاً اخترعته المنصة، بل هو بنية FAR الثنائية نفسها.',
  },
  'usa-baba-infrastructure-gate': {
    country: 'USA', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameEn: 'Build America, Buy America Act Infrastructure Gate', programNameAr: 'بوابة قانون بناء أمريكا وشراء أمريكا للبنية التحتية',
    mechanismType: 'category-eligibility-gate', program: 'usa-baba-infrastructure-gate',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "The Build America, Buy America Act (BABA, Title IX of the Infrastructure Investment and Jobs Act, Pub. L. 117-58, 2021) requires ALL iron and steel used in a federally-funded infrastructure project to be produced in the United States (every manufacturing process, from initial melting through coating), ALL construction materials to be manufactured in the United States, and manufactured products to clear a minimum 55% domestic-component-cost threshold -- a substantially stricter, differently-shaped regime from the Buy American Act above, administered per-agency (DOT/FHWA, EPA, HUD, DOE and others each issue their own implementing guidance and waivers) rather than government-wide, and triggered by receipt of federal financial assistance for an infrastructure project -- not by the buyer's own government/private status alone -- so it reaches state DOTs, public water utilities, and public transit agencies (semi-government-soe context) as well as direct federal agency awards (government context), but not a purely privately-financed project carrying no federal infrastructure funding. Waivers (public-interest, non-availability, and unreasonable-cost, following the general OMB-guidance categories referenced across DOE/EPA/HUD implementing guidance) can exempt a specific project or an entire product category from the requirement -- a project operating under an approved general-applicability waiver is a real, disclosed reason a supplier could be gated OUT despite meeting the domestic-content test, or IN despite not meeting it, and this engine cannot see waiver status from a bid-level input alone; the two-toggle gate below asks the caller to state the post-waiver eligibility outcome directly, the same 'first toggle: does the gate apply; second toggle: does the supplier clear it' shape already used for the UK's PPN 005 reservation gate, reusing the existing category-eligibility-gate primitive rather than inventing a new mechanism type. No single national phase-in schedule to a higher domestic-content percentage (comparable to the Buy American Act's 65%->75% step-up) was found for BABA's 55% manufactured-products floor in this research pass; some individual agencies have proposed or piloted higher category-specific thresholds, disclosed as an open item rather than assumed.",
    sourceNoteAr: 'يشترط قانون بناء أمريكا وشراء أمريكا (Build America, Buy America Act، BABA، العنوان التاسع من قانون الاستثمار في البنية التحتية والوظائف IIJA، القانون العام ١١٧-٥٨ لعام ٢٠٢١) أن يكون كل الحديد والصلب المستخدم في مشروع بنية تحتية ممول فيدرالياً مُنتَجاً في الولايات المتحدة (كل عملية تصنيع، من الصهر الأولي وحتى الطلاء)، وأن تكون كل مواد الإنشاء مُصنَّعة في الولايات المتحدة، وأن تتجاوز المنتجات المُصنَّعة عتبة دنيا ٥٥٪ من تكلفة المكونات المحلية -- نظام أشد صرامة وأكثر اختلافاً جوهرياً في شكله عن قانون الشراء الأمريكي أعلاه، تُديره كل وكالة على حدة (تصدر وزارة النقل/الإدارة الفيدرالية للطرق السريعة، ووكالة حماية البيئة، ووزارة الإسكان، ووزارة الطاقة، وغيرها، كل منها إرشادات تطبيق وإعفاءات خاصة بها) وليس بشكل موحد على مستوى الحكومة، ويُشغَّل عند تلقي مساعدة مالية فيدرالية لمشروع بنية تحتية -- وليس بحسب صفة الجهة المشترية (حكومية أو خاصة) وحدها -- فيشمل إدارات النقل الحكومية ومرافق المياه العامة وهيئات النقل العام (سياق شبه حكومي/مؤسسة مملوكة للدولة) إلى جانب منح الوكالات الفيدرالية المباشرة (سياق حكومي)، لكنه لا يشمل مشروعاً ممولاً بالكامل من القطاع الخاص دون تمويل بنية تحتية فيدرالي. يمكن للإعفاءات (المصلحة العامة، وعدم التوفر، والتكلفة غير المعقولة، وفق الفئات العامة لإرشادات OMB المشار إليها عبر إرشادات تطبيق وزارة الطاقة ووكالة حماية البيئة ووزارة الإسكان) أن تُعفي مشروعاً محدداً أو فئة منتج كاملة من الشرط -- ووجود مشروع يعمل بموجب إعفاء معتمَد عام سبب حقيقي ومُفصَح عنه لاستبعاد مورّد رغم استيفائه لاختبار المحتوى المحلي، أو لقبوله رغم عدم استيفائه له، ولا يمكن لهذا المحرك رؤية حالة الإعفاء من مُدخل على مستوى العطاء وحده؛ لذا تطلب البوابة ذات المفتاحين أدناه من المستدعي إدخال نتيجة الأهلية بعد الإعفاء مباشرة، بنفس شكل "المفتاح الأول: هل تنطبق البوابة؛ المفتاح الثاني: هل يجتازها المورّد" المستخدم بالفعل لبوابة تخصيص PPN 005 البريطانية، معيداً استخدام بدائية بوابة أهلية الفئة القائمة بدلاً من اختراع نوع آلية جديد. لم يُعثر في هذا البحث على جدول تدرج وطني واحد لرفع نسبة المحتوى المحلي لأرضية ٥٥٪ الخاصة بالمنتجات المُصنَّعة في BABA (على غرار تصاعد ٦٥٪→٧٥٪ في قانون الشراء الأمريكي)؛ اقترحت أو جرّبت بعض الوكالات الفردية عتبات أعلى خاصة بفئات معينة، ويُفصَح عن ذلك كبند مفتوح بدلاً من افتراضه.',
  },
  'usa-sba-small-business-setaside': {
    country: 'USA', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameEn: 'SBA Small Business Contracting Goal & Set-Aside', programNameAr: 'هدف وتخصيص التعاقد مع المنشآت الصغيرة (SBA)',
    mechanismType: 'spend-set-aside-target', program: 'usa-sba-small-business-setaside',
    applicableContexts: ['government'],
    sourceNoteEn: "Federal law (15 U.S.C. 644 and FAR Part 19) sets a government-wide statutory small-business prime-contracting goal of 23% of total federal contract dollars, alongside four sourced sub-goals within that 23%: 5% to women-owned small businesses (WOSB), 5% to service-disabled veteran-owned small businesses (SDVOSB), 5% to small disadvantaged businesses (SDB/8(a)), and 3% to HUBZone small businesses (source: SBA.gov's own contracting-officials guidance page). These are annually-tracked government-wide GOALS, not a binding per-solicitation quota -- the actual per-solicitation mechanism is FAR 19.502-2's 'Rule of Two': a contracting officer MUST set aside an acquisition exclusively for small-business competition whenever there is a reasonable expectation of receiving fair-market-price offers from two or more small businesses, a real, sourced, mandatory (not discretionary) decision rule this research pass did not find a single closed-form supplier-facing formula for beyond the qualification/registration question modeled below -- the specific set-aside decision, and under which of the four sub-categories, depends on facts about that specific solicitation (the number and identity of interested small businesses) that only the contracting officer's own market research can determine, not a formula a supplier's own attributes alone can resolve. Modeled here via the same national/program-target-share-plus-supplier-qualification shape already used for Jordan's contractor quota and Bahrain/Kuwait's spend set-asides -- the sourced 23% overall goal as the target share, and the supplier's own small-business-concern status (SBA size standards, 13 CFR Part 121, industry-specific by NAICS code -- not modeled as its own formula here, self-reported by the caller, the same `isSmallBusinessConcern` field also used for the margin tier in `usa-buy-american-price-preference`) as the qualification. Unlike GCC/Jordan's nationality-based local-content set-asides, this is a US federal small-business-STATUS set-aside, not a sub-national geography or domestic-manufacturing-content requirement -- the United States has no single federal analog to a state/province-level local-content preference (individual states run their own, non-federal, in-state preference statutes, out of scope for this federal-procurement-focused pass, the same 'real but out of scope' disclosure already applied to the UK's absent England/Scotland/Wales/Northern-Ireland-level PPN 005 boundary).",
    sourceNoteAr: 'يحدد القانون الفيدرالي (١٥ U.S.C. ٦٤٤ والفصل ١٩ من FAR) هدفاً قانونياً على مستوى الحكومة الفيدرالية بأكملها بنسبة ٢٣٪ من إجمالي قيمة العقود الفيدرالية للمنشآت الصغيرة كمقاولين رئيسيين، إلى جانب أربعة أهداف فرعية موثّقة ضمن تلك النسبة: ٥٪ للمنشآت الصغيرة المملوكة لنساء (WOSB)، و٥٪ للمنشآت الصغيرة المملوكة لقدامى المحاربين ذوي الإعاقة المرتبطة بالخدمة (SDVOSB)، و٥٪ للمنشآت الصغيرة المحرومة (SDB/برنامج ٨(a))، و٣٪ للمنشآت الصغيرة ضمن مناطق HUBZone (المصدر: صفحة إرشادات SBA.gov الخاصة بمسؤولي التعاقد). هذه أهداف تُتابَع سنوياً على مستوى الحكومة، وليست حصة إلزامية لكل مناقصة على حدة -- الآلية الفعلية لكل مناقصة هي "قاعدة الاثنين" في المادة FAR 19.502-2: يجب على ضابط التعاقد تخصيص عملية الاستحواذ حصرياً للمنافسة بين المنشآت الصغيرة كلما كان هناك توقع معقول بتلقي عروض بأسعار السوق العادلة من منشأتين صغيرتين أو أكثر -- وهي قاعدة قرار حقيقية وموثّقة وإلزامية (وليست تقديرية)، ولم يعثر هذا البحث على صيغة حسابية مغلقة موجهة للمورّد بخلاف سؤال التأهل/التسجيل المُنمذَج أدناه؛ فقرار التخصيص المحدد، وتحت أي من الفئات الفرعية الأربع، يعتمد على وقائع خاصة بالمناقصة تحديداً (عدد وهوية المنشآت الصغيرة المهتمة) لا يمكن أن يحسمها إلا بحث السوق الخاص بضابط التعاقد نفسه، وليس صيغة تعتمد فقط على صفات المورّد ذاته. يُنمذَج هذا هنا عبر نفس شكل "الحصة المستهدفة الوطنية/البرنامجية زائد تأهل المورّد" المستخدم بالفعل لحصة المقاولين الأردنية وتخصيصات الإنفاق البحرينية والكويتية -- الهدف العام الموثّق ٢٣٪ كحصة مستهدفة، وحالة المورّد كمنشأة صغيرة (معايير حجم SBA، الفصل ١٢١ من CFR ١٣، خاصة بكل قطاع حسب رمز NAICS -- لا تُنمذَج هنا كصيغة مستقلة، ويُعتمَد فيها على إفادة المستدعي الذاتية، وهو نفس الحقل isSmallBusinessConcern المستخدم أيضاً لتحديد فئة الهامش في usa-buy-american-price-preference) كشرط التأهل. وخلافاً لتخصيصات المحتوى المحلي القائمة على الجنسية في دول الخليج والأردن، فإن هذا تخصيص فيدرالي أمريكي قائم على "صفة" المنشأة الصغيرة، وليس شرط نطاق جغرافي دون وطني أو محتوى تصنيع محلي -- فالولايات المتحدة لا تملك نظيراً فيدرالياً واحداً لتفضيل محتوى محلي على مستوى الولاية/المقاطعة (تدير كل ولاية على حدة أنظمة تفضيل داخل-الولاية خاصة بها، غير فيدرالية، وهي خارج نطاق هذه المرحلة التي تركز على المشتريات الفيدرالية -- نفس إفصاح "حقيقي لكن خارج النطاق" المُطبَّق بالفعل على غياب حد إنجلترا/اسكتلندا/ويلز/أيرلندا الشمالية في بوابة PPN 005 البريطانية).',
  },
  'usa-berry-amendment-dod': {
    country: 'USA', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameEn: 'Berry Amendment (DoD Textiles/Food/Tools) -- not yet sourced', programNameAr: 'تعديل بيري (منسوجات/أغذية/أدوات وزارة الدفاع) — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'usa-berry-amendment-dod',
    applicableContexts: [],
    sourceNoteEn: "The Berry Amendment (10 U.S.C. 4862) requires Department of Defense purchases of textiles, food, and hand or measuring tools to be almost entirely domestically sourced -- a narrower (DoD-only) and stricter (near-100% domestic, no partial credit) regime than the Buy American Act above, but one subject to complex component-level 'substantial transformation' tests and numerous exceptions (domestic non-availability determinations approvable by senior officials such as the USD(A&S) or a Military Department Secretary). Specialty metals were originally covered by the Berry Amendment but were carved out in 2006 to a separate statute (10 U.S.C. 2533b), not treated as part of this program. No single clean, supplier-computable numeric threshold (beyond 'near-100% domestic, no partial credit') that holds across all three product categories and their many exceptions was found in this research pass -- kept as an honest not-yet-sourced entry, per Decision Record 8.7, with this real, dated context disclosed rather than a guessed formula.",
    sourceNoteAr: 'يشترط تعديل بيري (Berry Amendment، ١٠ U.S.C. ٤٨٦٢) أن تكون مشتريات وزارة الدفاع الأمريكية من المنسوجات والأغذية والأدوات اليدوية/أدوات القياس مصدرها محلياً بالكامل تقريباً -- نظام أضيق نطاقاً (خاص بوزارة الدفاع فقط) وأكثر صرامة (قريب من ١٠٠٪ محلي دون درجات جزئية) من قانون الشراء الأمريكي أعلاه، لكنه يخضع لاختبارات "تحول جوهري" معقدة على مستوى المكوّن ولاستثناءات عديدة (تحديدات عدم التوفر المحلي، بموافقة مسؤولين رفيعي المستوى مثل نائب وزير الدفاع للاستحواذ والدعم أو وزراء الأفرع العسكرية). كانت المعادن الخاصة (Specialty Metals) مشمولة أصلاً ضمن تعديل بيري، لكنها نُقلت عام ٢٠٠٦ إلى قانون منفصل (١٠ U.S.C. ٢٥٣٣b) ولا تُعامَل هنا كجزء من هذا البرنامج. لم يُعثر في هذا البحث على نسبة عتبة رقمية واحدة نظيفة قابلة للحوسبة على مستوى المورّد (بخلاف "شبه ١٠٠٪ محلي، دون درجات جزئية") تصمد أمام كل فئات المنتجات الثلاث واستثناءاتها المتعددة -- ويُترَك هذا كإدخال صادق غير موثّق بعد، وفق سجل القرار ٨.٧، مع الإفصاح عن هذا السياق الحقيقي والمؤرَّخ بدلاً من صيغة مخمَّنة.',
  },
};

// ---------------------------------------------------------------------------
// Section 1g -- China (CN). 16 Sep 2026 Part 2 continuation: the fifth non-
// GCC/Jordan country and the twelfth overall, closing out the platform
// owner's explicitly stated "then the USA, then China" order. Three
// genuinely different, real, sourced mechanisms -- an OR-gated price
// preference (the first OR-gate eligibility shape in this file), a zero-
// new-logic reuse of the category-eligibility-gate primitive for the
// Government Procurement Law's Article 10 domestic-purchase mandate, and a
// role-x-procurement-type banded price deduction gated by a real 30%
// subcontract-share threshold -- plus one honest not-yet-sourced entry (PLA/
// military-civil fusion defense procurement, structurally similar to the
// USA's Berry Amendment above).
// ---------------------------------------------------------------------------

const CN_PROGRAMS: Record<'cn-domestic-product-price-preference' | 'cn-govt-procurement-law-domestic-mandate' | 'cn-sme-price-deduction' | 'cn-defense-domestic-sourcing', CountryFrameworkInfo> = {
  'cn-domestic-product-price-preference': {
    country: 'CN', countryNameEn: 'China', countryNameAr: 'جمهورية الصين الشعبية',
    programNameEn: 'Domestic Product Price Evaluation Deduction (State Council Doc. [2025] No. 34)', programNameAr: 'خصم تقييم سعري للمنتج المحلي (وثيقة مجلس الدولة رقم [2025] 34)',
    mechanismType: 'price-preference-margin', program: 'cn-domestic-product-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "State Council General Office Document [2025] No. 34 (guobanfa [2025] No. 34 / 国办发〔2025〕34号), issued 28 Sep 2025 and effective 1 Jan 2026, grants a flat 20% price-evaluation deduction to bids featuring domestic products in government procurement. Domestic-product status is reached via either of two independently-sufficient paths -- (1) THIS specific product passes the Document's domestic-product classification test (a substantial transformation occurring within China, explicitly excluding simple assembly, packaging, or relabeling; a local-component-cost-share threshold to be published later per product category, with products that pass the substantial-transformation test alone treated as domestic pending that category-specific figure; and localization of key components and critical processes for high-tech or security-sensitive products), or (2) for a mixed-category procurement bundle spanning multiple product types within one tender, domestically-made products reach at least 80% of the bundle's total product cost, in which case the same flat 20% deduction applies to the whole bundle. This OR-gated eligibility shape -- two structurally different, independently-sufficient paths feeding the same fixed margin -- is the first of its kind in this file; modeled via a new function, computePricePreferenceCnDomesticProduct, which evaluates both paths independently (meetsDomesticProductCriteria === true or bundleDomesticCostSharePct >= 80) before handing the resulting binary qualification to the shared computePricePreferenceMargin primitive -- an OR-gate feeding a shared primitive, not a disguised reuse of another country's formula with new constants. For over two decades, the Government Procurement Law's own Article 10 (see 'cn-govt-procurement-law-domestic-mandate' below) mandated domestic purchase by default without the State Council ever formally defining 'domestic product' in an implementing regulation; Document 34/2025, together with a follow-on joint interpretive opinion from the Ministry of Finance and the Ministry of Industry and Information Technology (19 Dec 2025) clarifying that products made in China's special customs supervision zones count as Made-in-China and that procurement may not discriminate by a supplier's place of registration, ownership structure, or investor nationality, is the first real, dated, sourced executive definition -- a genuine regulatory event, not an assumed baseline.",
    sourceNoteAr: 'تمنح وثيقة مكتب مجلس الدولة العام رقم [2025] 34 (国办发〔2025〕34号)، الصادرة في ٢٨ سبتمبر ٢٠٢٥ والنافذة اعتباراً من ١ يناير ٢٠٢٦، خصم تقييم سعري ثابتاً بنسبة ٢٠٪ للعروض التي تتضمن منتجات محلية في المشتريات الحكومية. يتحقق تصنيف "المنتج المحلي" عبر أحد مسارين مستقلين وكافيين كل منهما بذاته -- (١) استيفاء هذا المنتج تحديداً لاختبار تصنيف المنتج المحلي الوارد في الوثيقة (تحول جوهري يحدث داخل الصين، يستثني صراحة التجميع البسيط أو التعبئة أو إعادة التوسيم؛ وعتبة نسبة تكلفة المكون المحلي ستُنشر لاحقاً حسب فئة المنتج، مع اعتبار المنتجات المستوفية لاختبار التحول الجوهري وحده محلية إلى حين نشر تلك النسبة الخاصة بالفئة؛ وتوطين المكونات الرئيسية والعمليات الحرجة للمنتجات عالية التقنية أو الحساسة أمنياً)، أو (٢) بالنسبة لحزمة مشتريات مختلطة تضم أنواع منتجات متعددة ضمن مناقصة واحدة، بلوغ المنتجات المصنوعة محلياً ٨٠٪ على الأقل من إجمالي تكلفة منتجات الحزمة، وعندها يُطبَّق نفس الخصم الثابت ٢٠٪ على الحزمة بأكملها. شكل الأهلية هذا القائم على بوابة "أو" -- مساران مختلفان بنيوياً وكافيان كل منهما بذاته يغذيان نفس الهامش الثابت -- هو الأول من نوعه في هذا الملف؛ ويُنمذَج عبر دالة جديدة فعلياً، computePricePreferenceCnDomesticProduct، تُقيِّم كلا المسارين بشكل مستقل (meetsDomesticProductCriteria === true أو bundleDomesticCostSharePct >= 80) قبل تسليم نتيجة التأهل الثنائية إلى بدائية computePricePreferenceMargin المشتركة -- بوابة "أو" تُغذِّي بدائية مشتركة، وليست صيغة دولة أخرى مُعاد استخدامها بثوابت جديدة. على مدى أكثر من عقدين، ألزمت المادة العاشرة من قانون المشتريات الحكومية نفسها (انظر cn-govt-procurement-law-domestic-mandate أدناه) بالشراء المحلي افتراضياً دون أن يُعرِّف مجلس الدولة "المنتج المحلي" قط في لائحة تنفيذية -- ووثيقة ٣٤/٢٠٢٥، إلى جانب رأي تفسيري تنفيذي لاحق مشترك صادر عن وزارة المالية ووزارة الصناعة وتقنية المعلومات (١٩ ديسمبر ٢٠٢٥) يوضح أن منتجات المناطق الجمركية الخاصة تُعد مصنوعة في الصين وأنه لا يجوز للمشتريات التمييز بحسب مكان تسجيل المورّد أو هيكل الملكية أو جنسية المستثمر، هو أول تعريف تنفيذي حقيقي ومؤرَّخ وموثّق -- حدث تنظيمي حقيقي، وليس افتراضاً أساسياً مفترَضاً.',
  },
  'cn-govt-procurement-law-domestic-mandate': {
    country: 'CN', countryNameEn: 'China', countryNameAr: 'جمهورية الصين الشعبية',
    programNameEn: 'Government Procurement Law Article 10 Domestic Mandate', programNameAr: 'تفويض المادة العاشرة من قانون المشتريات الحكومية',
    mechanismType: 'category-eligibility-gate', program: 'cn-govt-procurement-law-domestic-mandate',
    applicableContexts: ['government'],
    sourceNoteEn: "Article 10 of the Government Procurement Law of the People's Republic of China (zhonghua renmin gongheguo zhengfu caigou fa / 中华人民共和国政府采购法, enacted 2002, last amended 2014) requires government procurement to purchase domestic goods, engineering, and services by default, subject to three real, sourced exemptions: (1) the goods/engineering/services are not available domestically, or not available on reasonable commercial terms; (2) procurement is for use outside China; or (3) another statute or administrative regulation provides otherwise. Modeled here via the exact same two-key computeCategoryEligibilityGate primitive already used for the Saudi and Omani Mandatory Lists and the UK's PPN 005 and USA's BABA gates (see PROGRAMS['sa-mandatory-list'] / ['om-mandatory-list'] / ['uk-below-threshold-reservation'] / ['usa-baba-infrastructure-gate'].sourceNoteEn) -- zero new computation logic, the same 'reuse before inventing' discipline applied to every prior country. The dispatcher maps the two real Article 10 facts onto that primitive's existing two-key shape: the first key asks whether an Article 10 exemption applies to THIS specific tender (inverted into the primitive's inMandatoryListCategory slot, since the primitive's 'gate applies' semantics are the logical negation of 'an exemption applies'); the second key, read only once the first confirms the mandate is not exempted, is whether this supplier's product meets the same domestic-product classification test from Document 34/2025 above -- a field genuinely SHARED with 'cn-domestic-product-price-preference', not a duplicated question, wired to the same inputs.cn.meetsDomesticProductCriteria value. This is the real structural domestic-purchase-by-default mandate under Article 10 -- a gate on bid eligibility itself, not a price preference layered on top of open competition the way the price-preference programs are.",
    sourceNoteAr: 'تُلزم المادة العاشرة من قانون المشتريات الحكومية لجمهورية الصين الشعبية (中华人民共和国政府采购法، الصادر عام ٢٠٠٢ وآخر تعديل له عام ٢٠١٤) المشتريات الحكومية بشراء السلع والأشغال والخدمات المحلية افتراضياً، مع ثلاثة إعفاءات حقيقية وموثّقة: (١) عدم توفر السلع/الأشغال/الخدمات محلياً، أو عدم توفرها بشروط تجارية معقولة؛ (٢) أن تكون المشتريات لاستخدام خارج الصين؛ أو (٣) وجود نص قانوني أو لائحة إدارية أخرى تنص على خلاف ذلك. يُنمذَج هذا هنا عبر نفس بدائية computeCategoryEligibilityGate ذات المفتاحين المستخدمة بالفعل للقائمة الإلزامية السعودية والعمانية وبوابة PPN 005 البريطانية وبوابة BABA الأمريكية -- دون أي منطق حساب جديد، بنفس انضباط "إعادة الاستخدام قبل الاختراع" المُطبَّق في كل دولة سابقة. يُترجم الموزِّع الحقيقتين الفعليتين للمادة العاشرة إلى شكل المفتاحين القائم لتلك البدائية: يسأل المفتاح الأول عما إذا كان أحد إعفاءات المادة العاشرة ينطبق على هذه المناقصة تحديداً (ويُعكَس ليلائم فتحة inMandatoryListCategory الخاصة بالبدائية، إذ إن دلالة "انطباق البوابة" في البدائية هي النفي المنطقي لعبارة "ينطبق إعفاء")؛ ويُقرأ المفتاح الثاني فقط بعد تأكيد المفتاح الأول عدم انطباق أي إعفاء، ويسأل عما إذا كان منتج هذا المورّد يستوفي نفس اختبار تصنيف المنتج المحلي الوارد في وثيقة ٣٤/٢٠٢٥ أعلاه -- وهو حقل مشترك فعلياً مع cn-domestic-product-price-preference، وليس سؤالاً مكرراً، ومربوط بنفس قيمة inputs.cn.meetsDomesticProductCriteria. هذا هو التفويض البنيوي الحقيقي بالشراء المحلي افتراضياً بموجب المادة العاشرة -- بوابة على أهلية العطاء نفسها، وليست تفضيلاً سعرياً مضافاً فوق منافسة مفتوحة كما هو حال برامج التفضيل السعري.',
  },
  'cn-sme-price-deduction': {
    country: 'CN', countryNameEn: 'China', countryNameAr: 'جمهورية الصين الشعبية',
    programNameEn: 'SME Government Procurement Price Deduction (Cai Ku [2020] No. 46 / [2022] No. 19)', programNameAr: 'خصم تقييم سعري لمشتريات المنشآت الصغيرة الحكومية (财库〔2020〕46号 / 财库〔2022〕19号)',
    mechanismType: 'price-preference-margin', program: 'cn-sme-price-deduction',
    applicableContexts: ['government'],
    sourceNoteEn: "Cai Ku [2020] No. 46 (caiku [2020] No. 46 / 财库〔2020〕46号, effective 1 Jan 2021) set a price-evaluation deduction of 6%-10% (3%-5% for engineering-works procurement) for small and micro enterprises bidding directly, and a smaller 2%-3% deduction (1%-2% for engineering works) for large/medium enterprises that subcontract to, or form a consortium with, small enterprises -- conditioned on the small-enterprise share reaching at least 30% of contract value. Cai Ku [2022] No. 19 (财库〔2022〕19号, effective 1 Jul 2022) roughly doubled both goods/services ranges (direct: 10%-20%; consortium/subcontract: 4%-6%) without touching the 2020 engineering-works ranges. Modeled here via a genuinely new function, computePricePreferenceCnSme: the applicable band depends on BOTH the supplier's role (direct small/micro vs. large/medium consortium-subcontract) AND the procurement type (goods/services vs. engineering works) together -- a 2x2 band-selection matrix with no counterpart elsewhere in this file -- and the consortium/subcontract path additionally requires clearing a real minimum 30% small-enterprise subcontract-share gate before any deduction applies at all (below it, the deduction is zero, not partial -- a gate, not a continuous taper, the same 'gate not taper' discipline already applied to the US Buy American Act threshold). Every legal range here is a genuine range, not a single number -- the procuring entity sets the exact figure within the range in its own tender documents. Because PricePreferenceMarginResult previously had no honest way to disclose a range (every prior program's preferenceMarginPct was either a fixed constant or a caller-dependent single figure), this phase extends the shared result shape with two new optional fields, preferenceMarginMinPct and preferenceMarginMaxPct -- preferenceMarginPct itself always shows the legal floor (the guaranteed minimum), while the new fields disclose the ceiling. Every other, non-Chinese price-preference program in this file leaves both fields undefined (verified via a dedicated regression test, see the test file), so this is a genuinely additive, backward-compatible extension to the shared result shape, not a breaking change.",
    sourceNoteAr: 'حددت وثيقة 财库〔2020〕46号 (النافذة اعتباراً من ١ يناير ٢٠٢١) خصم تقييم سعري بنسبة ٦٪-١٠٪ (٣٪-٥٪ لمشتريات الأشغال الهندسية) للمنشآت الصغيرة والمتناهية الصغر المتقدمة مباشرة بعطاء، وخصماً أصغر ٢٪-٣٪ (١٪-٢٪ للأشغال الهندسية) للمنشآت الكبيرة أو المتوسطة التي تتعاقد من الباطن مع منشآت صغيرة أو تُكوِّن معها تحالفاً -- بشرط بلوغ حصة المنشآت الصغيرة ٣٠٪ على الأقل من قيمة العقد. ورفعت وثيقة 财库〔2022〕19号 (النافذة اعتباراً من ١ يوليو ٢٠٢٢) كلا نطاقي السلع/الخدمات تقريباً إلى الضعف (مباشر: ١٠٪-٢٠٪؛ تحالف/تعاقد من الباطن: ٤٪-٦٪) دون المساس بنطاقات الأشغال الهندسية لعام ٢٠٢٠. يُنمذَج هذا هنا عبر دالة جديدة فعلياً، computePricePreferenceCnSme: يعتمد النطاق المطبَّق على كل من دور المورّد (مباشر صغير/متناهي الصغر مقابل تحالف/تعاقد من الباطن كبير/متوسط) ونوع المشتريات (سلع/خدمات مقابل أشغال هندسية) معاً -- مصفوفة اختيار نطاق ٢×٢ لا نظير لها في أي مكان آخر في هذا الملف -- ويتطلب مسار التحالف/التعاقد من الباطن إضافة إلى ذلك اجتياز بوابة حد أدنى حقيقي ٣٠٪ لحصة المنشآت الصغيرة في التعاقد من الباطن قبل تطبيق أي خصم إطلاقاً (دون بلوغها، الخصم صفر وليس جزئياً -- بوابة، لا تدرّج مستمر، بنفس انضباط "بوابة لا تدرّج" المُطبَّق بالفعل على عتبة قانون الشراء الأمريكي). كل نطاق قانوني هنا هو مدى حقيقي، وليس رقماً واحداً -- تحدد جهة الشراء الرقم الدقيق ضمن النطاق في وثائق مناقصتها الخاصة. ولأن PricePreferenceMarginResult لم يكن لديه سابقاً وسيلة صادقة للإفصاح عن نطاق (كانت قيمة preferenceMarginPct في كل برنامج سابق رقماً ثابتاً أو معتمداً على المستدعي فقط)، وسَّعت هذه المرحلة شكل النتيجة المشترك بحقلين اختياريين جديدين، preferenceMarginMinPct وpreferenceMarginMaxPct -- وتُظهر قيمة preferenceMarginPct نفسها دائماً الأرضية القانونية (الحد الأدنى المضمون)، بينما تُفصِح الحقول الجديدة عن السقف. يترك كل برنامج تفضيل سعري آخر غير صيني في هذا الملف كلا الحقلين undefined (تم التحقق من ذلك عبر اختبار ارتداد مخصص، انظر ملف الاختبار)، فهذا امتداد إضافي فعلي ومتوافق مع الإصدارات السابقة، وليس تغييراً كاسراً لشكل النتيجة المشترك.',
  },
  'cn-defense-domestic-sourcing': {
    country: 'CN', countryNameEn: 'China', countryNameAr: 'جمهورية الصين الشعبية',
    programNameEn: 'PLA / Military-Civil Fusion Defense Sourcing -- not yet sourced', programNameAr: 'مشتريات الدفاع لجيش التحرير الشعبي / الاندماج المدني العسكري — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'cn-defense-domestic-sourcing',
    applicableContexts: [],
    sourceNoteEn: "China's defense-procurement domestic-sourcing mandate for the People's Liberation Army, administered through the Military-Civil Fusion (junmin ronghe / 军民融合) national strategy and the Central Military Commission's Equipment Development Department, is real and well documented in secondary/policy literature, and structurally similar to the USA's Berry Amendment above (a defense-ministry-specific regime, near-total domestic sourcing) -- but core directives are issued through the Equipment Development Department and classified/internal procurement regulations rather than a single published statute carrying a clean numeric threshold. This research pass did not find a single clean, supplier-computable numeric threshold in open sources -- kept as an honest not-yet-sourced entry per Decision Record 8.7, with this real, dated context disclosed rather than a guessed formula, the same treatment already applied to the USA's Berry Amendment.",
    sourceNoteAr: 'نظام توطين مشتريات الدفاع الصيني لجيش التحرير الشعبي، المُدار عبر استراتيجية الاندماج المدني العسكري الوطنية (军民融合) وإدارة تطوير التسليح التابعة للجنة العسكرية المركزية، حقيقي وموثّق جيداً في الأدبيات الثانوية والسياسية، ومماثل بنيوياً لتعديل بيري الأمريكي أعلاه (نظام خاص بوزارة الدفاع، بتوطين شبه كامل) -- لكن التوجيهات الأساسية تصدر عبر إدارة تطوير التسليح ولوائح مشتريات سرية/داخلية بدلاً من قانون واحد منشور يحمل عتبة رقمية نظيفة. لم يعثر هذا البحث على عتبة رقمية واحدة نظيفة قابلة للحوسبة على مستوى المورّد في مصادر مفتوحة -- ويُترَك هذا كإدخال صادق غير موثّق بعد وفق سجل القرار ٨.٧، مع الإفصاح عن هذا السياق الحقيقي والمؤرَّخ بدلاً من صيغة مخمَّنة، بنفس المعالجة المُطبَّقة بالفعل على تعديل بيري الأمريكي.',
  },
};

export const PROGRAMS: Record<LocalContentProgram, CountryFrameworkInfo> = {
  ...SA_PROGRAMS, ...AE_PROGRAMS, ...JO_OM_QA_BH_KW_PROGRAMS, ...EG_PROGRAMS, ...TR_PROGRAMS, ...UK_PROGRAMS, ...USA_PROGRAMS, ...CN_PROGRAMS,
};

/** Derived view, kept for the UI's country-selector buttons and any caller
 * that only ever wants "the" framework for a country: each country's
 * DEFAULT program's framework. Not a second source of truth -- computed
 * from `PROGRAMS`. */
export const COUNTRY_FRAMEWORKS: Record<LocalContentCountry, CountryFrameworkInfo> = {
  SA: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.SA],
  AE: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.AE],
  JO: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.JO],
  OM: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.OM],
  QA: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.QA],
  BH: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.BH],
  KW: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.KW],
  EG: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.EG],
  TR: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.TR],
  UK: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.UK],
  USA: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.USA],
  CN: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.CN],
};

// ---------------------------------------------------------------------------
// Section 2 — supplier-level inputs (only the fields for the country/program
// you're assessing need to be populated; the rest are ignored)
// ---------------------------------------------------------------------------

export interface SupplierLocalContentInputs {
  /** LCGPA general (SA / 'sa-lcgpa-general') pillars -- SAR, same real
   * Guide G1 structure as lcgpaLocalContent.ts, expressed as this
   * SUPPLIER's own spend/labor breakdown. */
  sa?: {
    localLaborSAR: number | null; expatLaborSAR: number | null;
    localGoodsServicesSAR: number | null; foreignGoodsServicesSAR: number | null;
    capacityBuildingSAR: number | null;
    localAssetDepreciationSAR: number | null; totalAssetDepreciationSAR: number | null;
  };
  /** LCGPA Mandatory List (SA / 'sa-mandatory-list') -- category eligibility
   * gate inputs, deliberately binary (see file header: no sourced
   * percentage threshold). */
  saMandatoryList?: {
    /** Is the product/service category this supplier bids under one of
     * LCGPA's 233+ Mandatory List categories? */
    inMandatoryListCategory: boolean | null;
    /** Does this supplier hold the LCGPA certification/local-source status
     * required to bid in that category? Irrelevant if not in the list. */
    certifiedForCategory: boolean | null;
  };
  /** LCGPA national-product price preference (SA / 'sa-price-preference') --
   * % of this bid's value that is Saudi-national-product (self-reported,
   * caller-supplied), same shape as Jordan's mechanism. */
  saPricePreference?: {
    bidValueLocallyManufacturedPct: number | null;
  };
  /** Aramco IKTVA (SA / 'sa-iktva-aramco') -- SAR, per Aramco's own official
   * formula (see PROGRAMS['sa-iktva-aramco'].sourceNoteEn). */
  iktva?: {
    goodsServicesLocalSAR: number | null;
    assetDepreciationLocalSAR: number | null;
    expatCompensationInSaudiSAR: number | null;
    saudiWorkforceCompensationSAR: number | null;
    trainingDevelopmentSAR: number | null;
    supplierDevelopmentSAR: number | null;
    localRnDSAR: number | null;
    totalCostsSAR: number | null;
    /** Simplified single incentive-bonus input, 0-10 percentage points,
     * disclosed simplification of Aramco's tiered export-ratio/ESG bonus
     * sub-formula (see sourceNoteEn). */
    incentiveBonusPct: number | null;
  };
  /** UAE ICV (AE / 'ae-icv-general') pillars -- AED. Field-level sourced
   * bands documented next to their use in computeIcvAe(). */
  ae?: {
    manufacturingOrThirdPartySpendLocalAED: number | null;
    manufacturingOrThirdPartySpendTotalAED: number | null;
    investmentNBVLocalAED: number | null; investmentNBVTotalAED: number | null;
    emiratisationAnnualSpendAED: number | null;
    expatriateHeadcount: number | null;
    exportRevenueAED: number | null;
    emiratiHeadcountGrowthPct: number | null;
    investmentGrowthPct: number | null;
    registeredOnMainland: boolean | null;
  };
  /** Tawazun defense offset (AE / 'ae-tawazun-offset') -- AED, per the
   * Tawazun Economic Council's 2019 policy guidelines (see PROGRAMS[
   * 'ae-tawazun-offset'].sourceNoteEn for the full sourcing). */
  aeTawazun?: {
    contractValueAED: number | null;
    /** Optional -- how much offset credit this contractor has already
     * earned/banked toward this obligation, if known. Omit/null if unknown
     * (e.g. early in the contract, before any offset activity). */
    offsetCreditsEarnedAED: number | null;
  };
  /** Jordan price-preference mechanism -- % of this bid's value that is
   * Jordanian-manufactured (self-reported, caller-supplied). */
  jo?: {
    bidValueLocallyManufacturedPct: number | null;
  };
  /** Jordan contractor quota (JO / 'jo-contractor-quota', new 15 Sep 2026)
   * -- self-reported Jordanian-contractor registration status. See
   * PROGRAMS['jo-contractor-quota'].sourceNoteEn for the 35% target and its
   * disclosed post-2022 uncertainty. */
  joContractorQuota?: {
    isRegisteredJordanianContractor: boolean | null;
  };
  /** Oman PTLC Mandatory List (OM / 'om-mandatory-list', new 15 Sep 2026)
   * -- same binary category-eligibility-gate shape as Saudi's Mandatory
   * List (see `saMandatoryList` above). */
  omMandatoryList?: {
    inMandatoryListCategory: boolean | null;
    certifiedForCategory: boolean | null;
  };
  /** Oman OQ Group price preference (OM / 'om-oq-price-preference', new 17
   * Sep 2026) -- % of this bid's value that is Omani-manufactured
   * (self-reported, caller-supplied), same shape as Jordan's mechanism. */
  omOqPricePreference?: {
    bidValueLocallyManufacturedPct: number | null;
  };
  /** Qatar Tawteen/ICV (QA / 'qa-icv-tawteen', new 15 Sep 2026) -- QAR, per
   * icv.qa's official 5-cost-category methodology (see
   * PROGRAMS['qa-icv-tawteen'].sourceNoteEn for the full sourcing). */
  qa?: {
    localTangibleGoodsMaterialsQAR: number | null;
    /** Local services -- manpower, subcontractors, goods, per icv.qa's own
     * category grouping (modeled as one combined field; icv.qa does not
     * publish separate sub-weights across manpower/subcontractors/goods
     * within this category). */
    localServicesQAR: number | null;
    qatariNationalResidentTrainingCostQAR: number | null;
    supplierTrainingCertificationCostQAR: number | null;
    qatarAssetDepreciationQAR: number | null;
    totalQatarRevenueExclExportsQAR: number | null;
    /** ICV+ policy: eligible manufacturers get a 50% score increase. */
    isEligibleManufacturer: boolean | null;
    /** Blanket score: micro/small suppliers get a minimum 30% ICV score. */
    isMicroOrSmallSupplier: boolean | null;
    /** Capped 0-15 self-reported strategic-behaviour bonus (productivity,
     * capability building, investment growth, Qatarization, exports, R&D,
     * sustainability) -- disclosed simplification, see sourceNoteEn. */
    selfReportedBonusPct: number | null;
  };
  /** Bahrain SME qualification (BH / 'bh-sme-price-preference' AND
   * 'bh-sme-spend-setaside', new 15 Sep 2026) -- self-reported SME
   * qualification under Ministerial Decision No. 23 of 2026's ceiling
   * (<=250 employees or <=BHD 20M annual revenue). Shared by both Bahrain
   * SME programs, since it is the same underlying qualifying fact. */
  bhSme?: {
    qualifiesAsSme: boolean | null;
  };
  /** Kuwait KPC local-spend set-aside (KW / 'kw-kpc-local-spend', new 17
   * Sep 2026) -- self-reported Kuwaiti-supplier registration status (see
   * PROGRAMS['kw-kpc-local-spend'].sourceNoteEn for the disclosed gap on a
   * more granular sourced qualification definition). */
  kwLocalSpend?: {
    isRegisteredKuwaitiSupplier: boolean | null;
  };
  /** Egypt public-procurement price preference (EG / 'eg-price-preference',
   * new 15 Sep 2026 Part 2 pass) -- % of this bid's/project's estimated
   * value that is Egyptian-origin local content (self-reported,
   * caller-supplied). Law 5/2015 (as amended by Law 90/2018) requires
   * >=40% to qualify as an "Egyptian product"; qualifying bids then
   * receive a flat 15% price preference (a threshold gate, not a
   * continuously-scaled share -- see PROGRAMS['eg-price-preference']
   * .sourceNoteEn). */
  eg?: {
    egyptianContentSharePct: number | null;
  };
  /** Egypt oil & gas PSA local-contractor priority (EG / 'eg-oil-gas-
   * price-preference', new Part 2 pass) -- self-reported local-Egyptian-
   * contractor status, same binary-to-share conversion as Bahrain's SME
   * price preference (see PROGRAMS['eg-oil-gas-price-preference']
   * .sourceNoteEn). */
  egOilGas?: {
    isLocalEgyptianContractor: boolean | null;
  };
  /** Turkey public-procurement domestic-goods price preference (TR /
   * 'tr-price-preference', Part 2 continuation) -- % of this bid's value
   * covered by Yerli Mali Belgesi (Domestic Goods Certificate)-certified
   * domestic content (self-reported, caller-supplied), same continuously-
   * scaled shape as Jordan/Oman (see PROGRAMS['tr-price-preference']
   * .sourceNoteEn for the mandatory-vs-discretionary 15% ceiling and
   * item-by-item certification detail). */
  tr?: {
    bidValueDomesticCertifiedPct: number | null;
  };
  /** UK below-threshold procurement reservation (UK / 'uk-below-threshold-
   * reservation', Part 2 continuation) -- same category-eligibility-gate
   * shape as Saudi/Oman's Mandatory List (see PROGRAMS['uk-below-threshold-
   * reservation'].sourceNoteEn): is THIS specific procurement reserved under
   * PPN 005, and does the supplier meet its stated geography (and, if
   * combined, SME/VCSE) reservation. */
  uk?: {
    isBelowThresholdReservedProcurement: boolean | null;
    isQualifyingUkGeographySupplier: boolean | null;
  };
  /** USA Buy American Act price preference (USA / 'usa-buy-american-
   * price-preference', Part 2 continuation) -- % of the product's cost
   * that is US-mined/produced/manufactured (self-reported, caller-
   * supplied), compared against the current 65% statutory threshold
   * (2024-2028; steps to 75% from 2029, see PROGRAMS['usa-buy-american-
   * price-preference'].sourceNoteEn), same binary-threshold shape as
   * Egypt. `isSmallBusinessConcern` is shared with 'usa-sba-small-
   * business-setaside' below: it selects the FAR 25.105 margin tier
   * (20% large / 30% small) here, and is the set-aside qualification
   * there -- one real-world fact, two programs, the same reuse pattern
   * already used for Bahrain's shared `bhSme` object. */
  usa?: {
    domesticContentSharePct: number | null;
    isSmallBusinessConcern: boolean | null;
  };
  /** USA Build America, Buy America Act infrastructure gate (USA /
   * 'usa-baba-infrastructure-gate', Part 2 continuation) -- same two-
   * toggle category-eligibility-gate shape as the UK's PPN 005 gate
   * (see PROGRAMS['usa-baba-infrastructure-gate'].sourceNoteEn): is THIS
   * procurement a federally-funded infrastructure award BABA covers, and
   * does the supplier meet BABA's domestic-content requirement (post-
   * waiver, if any -- this engine cannot see waiver status separately). */
  usaBaba?: {
    isFederallyFundedInfrastructureProcurement: boolean | null;
    meetsBabaDomesticContentRequirement: boolean | null;
  };
  /** China domestic-product classification (CN / 'cn-domestic-product-
   * price-preference' AND 'cn-govt-procurement-law-domestic-mandate', 16
   * Sep 2026 China Part 2 continuation) -- a genuinely SHARED fact block,
   * not a duplicated question: `meetsDomesticProductCriteria` and
   * `bundleDomesticCostSharePct` feed the OR-gated price-preference margin
   * (see PROGRAMS['cn-domestic-product-price-preference'].sourceNoteEn for
   * the two independent paths), while `meetsDomesticProductCriteria` is
   * also read directly by the Article 10 mandate gate once its own first
   * key (no exemption applies) is confirmed, and `article10ExemptionApplies`
   * is read only by that gate. Mirrors the shared-field pattern already
   * used for Bahrain's `bhSme` object and the USA's `usa.isSmallBusinessConcern`. */
  cn?: {
    meetsDomesticProductCriteria: boolean | null;
    bundleDomesticCostSharePct: number | null;
    article10ExemptionApplies: boolean | null;
  };
  /** China SME government-procurement price deduction (CN / 'cn-sme-price-
   * deduction', China Part 2 continuation) -- see PROGRAMS['cn-sme-price-
   * deduction'].sourceNoteEn for the 2x2 role-x-procurement-type band
   * matrix and the real 30% consortium subcontract-share gate. */
  cnSme?: {
    supplierRole: 'direct-small-micro' | 'large-medium-consortium-subcontract' | null;
    procurementType: 'goods-services' | 'engineering-works' | null;
    /** Only read on the consortium/subcontract role path -- the % of
     * contract value subcontracted to, or shared within a consortium with,
     * small enterprises, tested against the real 30% gate. */
    consortiumSmallEnterpriseSubcontractSharePct: number | null;
  };
}

// ---------------------------------------------------------------------------
// Section 3 — result shapes (discriminated by mechanismType -- never averaged
// across incompatible mechanisms; Decision Record 8.7)
// ---------------------------------------------------------------------------

export interface EligibleSpendRatioResult {
  mechanismType: 'eligible-spend-ratio';
  scorePct: number | null;
  pillars: { key: string; eligible: number; total: number }[];
}

export interface WeightedPillarScoreResult {
  mechanismType: 'weighted-pillar-score';
  scorePct: number | null;
  pillars: { key: string; contributionPct: number; noteEn: string; noteAr: string }[];
  mainlandUpliftApplied: boolean;
}

export interface PricePreferenceMarginResult {
  mechanismType: 'price-preference-margin';
  /** The preference margin applied to the LOCAL portion of the bid during
   * evaluation -- this is not a local-content percentage score. */
  preferenceMarginPct: number;
  locallyManufacturedSharePct: number | null;
  effectiveBidDiscountPct: number | null; // preferenceMarginPct * locallyManufacturedSharePct / 100
  /** CN-only (cn-sme-price-deduction, 16 Sep 2026 China Part 2
   * continuation): discloses the full sourced legal range's ceiling, since
   * `preferenceMarginPct` alone always shows the legal floor (the
   * guaranteed minimum) -- the procuring entity sets the exact figure
   * within [preferenceMarginMinPct, preferenceMarginMaxPct] in its own
   * tender documents. Left `undefined` by every other, non-Chinese
   * price-preference program in this file (verified via a dedicated
   * regression test) -- a genuinely additive, backward-compatible
   * extension, not a breaking change to the shared result shape. */
  preferenceMarginMinPct?: number;
  preferenceMarginMaxPct?: number;
}

export interface CategoryEligibilityGateResult {
  mechanismType: 'category-eligibility-gate';
  inMandatoryListCategory: boolean | null;
  certifiedForCategory: boolean | null;
  /** true = may bid, false = gated out, null = insufficient inputs. */
  eligibleToBid: boolean | null;
}

export interface AnchorBuyerScoreResult {
  mechanismType: 'anchor-buyer-score';
  scorePct: number | null;
  components: { key: string; amountSAR: number; noteEn: string; noteAr: string }[];
  totalCostsSAR: number | null;
  incentiveBonusPct: number | null;
}

export interface OffsetObligationGateResult {
  mechanismType: 'offset-obligation-gate';
  /** true = contract value meets/exceeds the threshold (an obligation
   * exists), false = below threshold (no obligation), null = contract
   * value not supplied. */
  triggersObligation: boolean | null;
  thresholdAED: number;
  /** 60% of contractValueAED, only when triggersObligation === true;
   * 0 when triggersObligation === false (no obligation to speak of);
   * null when triggersObligation itself is unknown. */
  requiredOffsetCreditsAED: number | null;
  offsetCreditsEarnedAED: number | null;
  /** max(0, required - earned), only computable once both are known. */
  shortfallAED: number | null;
  /** 8.5% of shortfallAED -- the real sourced settlement/bank-guarantee
   * rate, only computable once shortfallAED is known. */
  shortfallPenaltyAED: number | null;
}

export interface NotYetSourcedResult {
  mechanismType: 'not-yet-sourced';
}

/** (New, 15 Sep 2026) Jordan contractor quota / Bahrain SME allocation /
 * Kuwait KPC local spend -- a sourced NATIONAL/PROGRAM target share plus
 * this supplier's own qualification for the reserved pool. Deliberately
 * NOT a per-supplier percentage score: the target is a portfolio/national
 * fact (disclosed for decision-readiness, per isc-ai-output-standards rule
 * 3), and qualification is binary. */
export interface SpendSetAsideResult {
  mechanismType: 'spend-set-aside-target';
  /** The sourced national/program target share (0-100) of total tender
   * value/count reserved for the qualifying supplier class. */
  targetSharePct: number;
  /** Does THIS supplier qualify for the reserved-share class (SME status /
   * Jordanian-contractor registration / Kuwaiti-supplier registration)? */
  qualifiesForSetAside: boolean | null;
  /** true = may compete within the reserved-share pool, false = does not
   * qualify, null = qualification status unknown. Mirrors
   * `qualifiesForSetAside` today (no separate certification step is
   * sourced for any of the three programs that use this mechanism) but
   * kept as its own field for the same reason CategoryEligibilityGateResult
   * keeps `eligibleToBid` distinct from `certifiedForCategory`. */
  eligibleForReservedShare: boolean | null;
}

/** (New, 15 Sep 2026) Qatar Tawteen/ICV -- an eligible-spend-ratio base
 * score plus icv.qa's own real, sourced modifiers. Kept as its own
 * mechanism type (not reused as `eligible-spend-ratio`) because the
 * modifiers are decision-relevant facts a reader must see, not an internal
 * computation detail to hide -- per isc-ai-output-standards rule 3
 * (decision-ready output) and Decision Record 8.7 (never smooth over a
 * materially different mechanism into a same-shaped result). */
export interface ModifiedIcvScoreResult {
  mechanismType: 'modified-icv-score';
  /** Eligible local spend / total Qatar revenue (excl. exports), BEFORE
   * the ICV+ manufacturer boost, blanket floor, or bonus are applied. */
  baseScorePct: number | null;
  pillars: { key: string; eligible: number; total: number }[];
  /** ICV+ policy: true if this supplier claimed (and the caller marked)
   * eligible-manufacturer status -- applies a 50% score increase. */
  isEligibleManufacturer: boolean;
  /** Blanket score: true if this supplier is a micro/small supplier --
   * guarantees a minimum 30% final score regardless of the base score. */
  isMicroOrSmallSupplier: boolean;
  /** Capped 0-15 self-reported strategic-behaviour bonus, as supplied
   * (not independently verified -- see PROGRAMS['qa-icv-tawteen']
   * .sourceNoteEn). */
  selfReportedBonusPct: number | null;
  /** baseScorePct (x1.5 if isEligibleManufacturer) + selfReportedBonusPct,
   * floored at 30 if isMicroOrSmallSupplier, capped at 100. Null only when
   * there is no base score AND the supplier is not micro/small (the
   * blanket floor is a policy guarantee independent of spend data, so it
   * still resolves even with no spend breakdown supplied). */
  finalScorePct: number | null;
}

export type LocalContentComputation =
  | EligibleSpendRatioResult
  | WeightedPillarScoreResult
  | PricePreferenceMarginResult
  | CategoryEligibilityGateResult
  | AnchorBuyerScoreResult
  | OffsetObligationGateResult
  | SpendSetAsideResult
  | ModifiedIcvScoreResult
  | NotYetSourcedResult;

export type LocalContentApplicability = 'applicable' | 'not-applicable' | 'insufficient-data';

export interface LocalContentAssessment {
  country: LocalContentCountry;
  /** Always resolved -- `DEFAULT_PROGRAM_BY_COUNTRY[country]` when the
   * caller omits `program`, so no caller ever has to guess a default. */
  program: LocalContentProgram;
  procurementContext: ProcurementContext;
  applicability: LocalContentApplicability;
  framework: CountryFrameworkInfo;
  computation: LocalContentComputation | null;
  /** Never a certified score -- always self-reported/directional, per
   * Decision Record 8.7's honesty convention (same framing as lcgpaLocalContent.ts). */
  certificationCaveatEn: string;
  certificationCaveatAr: string;
  reasonEn: string;
  reasonAr: string;
}

function n(v: number | null | undefined): number {
  return v === null || v === undefined || Number.isNaN(v) || v < 0 ? 0 : v;
}

const NOT_CERTIFIED_EN = 'This is a directional, self-reported estimate, not a certified score from the relevant national authority -- use it for early-stage planning before a formal audit/certification.';
const NOT_CERTIFIED_AR = 'هذا تقدير توجيهي ذاتي التصريح، وليس درجة معتمدة من الجهة الوطنية المختصة -- استخدمه للتخطيط المبكر قبل تدقيق/تصديق رسمي.';

// ---------------------------------------------------------------------------
// Section 4 — SA: LCGPA eligible-spend-ratio (same real Guide G1 formula as
// lcgpaLocalContent.ts, independently expressed for supplier-fact inputs
// per the standalone-first architecture rule)
// ---------------------------------------------------------------------------

const SA_EXPAT_LABOR_ELIGIBILITY = 0.37;

function computeLcgpaSa(sa: NonNullable<SupplierLocalContentInputs['sa']>): EligibleSpendRatioResult {
  const labor = { key: 'labor', eligible: n(sa.localLaborSAR) * 1.0 + n(sa.expatLaborSAR) * SA_EXPAT_LABOR_ELIGIBILITY, total: n(sa.localLaborSAR) + n(sa.expatLaborSAR) };
  const goodsServices = { key: 'goodsServices', eligible: n(sa.localGoodsServicesSAR), total: n(sa.localGoodsServicesSAR) + n(sa.foreignGoodsServicesSAR) };
  const capacityBuilding = { key: 'capacityBuilding', eligible: n(sa.capacityBuildingSAR), total: n(sa.capacityBuildingSAR) };
  const depreciation = { key: 'depreciation', eligible: n(sa.localAssetDepreciationSAR), total: n(sa.totalAssetDepreciationSAR) };
  const pillars = [labor, goodsServices, capacityBuilding, depreciation];
  const totalEligible = pillars.reduce((s, p) => s + p.eligible, 0);
  const totalSpend = pillars.reduce((s, p) => s + p.total, 0);
  return { mechanismType: 'eligible-spend-ratio', scorePct: totalSpend > 0 ? (totalEligible / totalSpend) * 100 : null, pillars };
}

// ---------------------------------------------------------------------------
// Section 4b — SA/OM: shared category-eligibility-gate primitive (type 3).
// Deliberately binary -- see PROGRAMS['sa-mandatory-list'] / PROGRAMS[
// 'om-mandatory-list'].sourceNoteEn for why no percentage threshold is
// modeled. Generalized 15 Sep 2026 (was SA-only, `computeMandatoryListSa`)
// the same way computePricePreferenceMargin below was already shared for
// SA/JO -- one computation, two source-notes, same pattern.
// ---------------------------------------------------------------------------

function computeCategoryEligibilityGate(input: { inMandatoryListCategory: boolean | null | undefined; certifiedForCategory: boolean | null | undefined }): CategoryEligibilityGateResult {
  const inList = input.inMandatoryListCategory;
  const certified = input.certifiedForCategory;
  let eligibleToBid: boolean | null;
  if (inList === null || inList === undefined) {
    eligibleToBid = null; // don't know if the gate even applies
  } else if (inList === false) {
    eligibleToBid = true; // gate doesn't apply outside Mandatory List categories
  } else if (certified === null || certified === undefined) {
    eligibleToBid = null; // in-list, but certification status unknown
  } else {
    eligibleToBid = certified === true;
  }
  return { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: inList ?? null, certifiedForCategory: certified ?? null, eligibleToBid };
}

// ---------------------------------------------------------------------------
// Section 4c — SA/JO/OM/BH: shared price-preference-margin primitive (type
// 4). Structurally identical mechanism across all four countries (see file
// header) -- one computation, four source-notes.
// ---------------------------------------------------------------------------

function computePricePreferenceMargin(marginPct: number, sharePct: number | null | undefined): PricePreferenceMarginResult {
  const share = sharePct === undefined ? null : sharePct;
  return {
    mechanismType: 'price-preference-margin',
    preferenceMarginPct: marginPct,
    locallyManufacturedSharePct: share,
    effectiveBidDiscountPct: share !== null ? (marginPct * share) / 100 : null,
  };
}

// ---------------------------------------------------------------------------
// Section 4d — JO/BH/KW: shared spend-set-aside-target primitive (type 5,
// new 15 Sep 2026). A sourced national/program target share plus this
// supplier's own binary qualification -- one computation, three source-notes.
// ---------------------------------------------------------------------------

function computeSpendSetAside(targetSharePct: number, qualifies: boolean | null | undefined): SpendSetAsideResult {
  const q = qualifies === undefined ? null : qualifies;
  return {
    mechanismType: 'spend-set-aside-target',
    targetSharePct,
    qualifiesForSetAside: q,
    eligibleForReservedShare: q,
  };
}

// ---------------------------------------------------------------------------
// Section 4d — SA: Aramco IKTVA anchor-buyer-score (type 2). Real formula
// from Aramco's own official guideline -- see PROGRAMS['sa-iktva-aramco'].
// iktva% = ((A+B+C+D+R)/E) + I
// ---------------------------------------------------------------------------

function computeIktvaAramco(iktva: NonNullable<SupplierLocalContentInputs['iktva']>): AnchorBuyerScoreResult {
  const a = n(iktva.goodsServicesLocalSAR) + n(iktva.assetDepreciationLocalSAR) + n(iktva.expatCompensationInSaudiSAR);
  const b = n(iktva.saudiWorkforceCompensationSAR);
  const c = n(iktva.trainingDevelopmentSAR);
  const d = n(iktva.supplierDevelopmentSAR);
  const r = n(iktva.localRnDSAR);
  const totalCosts = iktva.totalCostsSAR ?? null;
  const bonus = Math.max(0, Math.min(10, n(iktva.incentiveBonusPct)));

  const components: AnchorBuyerScoreResult['components'] = [
    { key: 'A_goodsServicesDepreciationExpat', amountSAR: a, noteEn: 'A: local goods/services spend + local asset depreciation + Saudi-based expatriate compensation.', noteAr: 'A: إنفاق السلع/الخدمات المحلية + إهلاك الأصول المحلية + تعويضات العمالة الوافدة المقيمة في السعودية.' },
    { key: 'B_saudiWorkforceCompensation', amountSAR: b, noteEn: 'B: Saudi national workforce compensation.', noteAr: 'B: تعويضات القوى العاملة السعودية.' },
    { key: 'C_trainingDevelopment', amountSAR: c, noteEn: 'C: training & development spend.', noteAr: 'C: إنفاق التدريب والتطوير.' },
    { key: 'D_supplierDevelopment', amountSAR: d, noteEn: 'D: supplier development spend.', noteAr: 'D: إنفاق تطوير الموردين.' },
    { key: 'R_localRnD', amountSAR: r, noteEn: 'R: local research & development spend.', noteAr: 'R: إنفاق البحث والتطوير المحلي.' },
  ];

  const numerator = a + b + c + d + r;
  const scorePct = totalCosts !== null && totalCosts > 0 ? Math.min(100, (numerator / totalCosts) * 100 + bonus) : null;

  return { mechanismType: 'anchor-buyer-score', scorePct, components, totalCostsSAR: totalCosts, incentiveBonusPct: iktva.incentiveBonusPct ?? null };
}

// ---------------------------------------------------------------------------
// Section 5 — AE: UAE ICV weighted-pillar-score. Banded percentages sourced
// from a public secondary read of MoIAT's official supplier certification
// guidelines (see PROGRAMS['ae-icv-general'].sourceNoteEn for the
// verification caveat). Each band is disclosed per-pillar, not hidden
// inside one opaque number.
// ---------------------------------------------------------------------------

/** Investment pillar: NBV-ratio component (x0.1) + a progressive component
 * from AED 5M to AED 150M NBV scaling toward 15%, per the sourced guideline. */
function investmentPillarPct(localNBV: number, totalNBV: number): number {
  if (totalNBV <= 0) return 0;
  const ratioComponent = (localNBV / totalNBV) * 10; // x0.1 expressed as percentage points
  const progressiveCeiling = 15;
  const progressiveFloor = 5_000_000;
  const progressiveCap = 150_000_000;
  const progressiveComponent = localNBV <= progressiveFloor
    ? 0
    : Math.min(progressiveCeiling, ((Math.min(localNBV, progressiveCap) - progressiveFloor) / (progressiveCap - progressiveFloor)) * progressiveCeiling);
  return Math.min(25, ratioComponent + progressiveComponent); // ratio + progressive components, disclosed as additive per sourced structure
}

/** Emiratisation pillar: progressive 2% (at <=AED 200K annual spend) to 15%
 * (at >=AED 20M annual spend), per the sourced guideline. */
function emiratisationPillarPct(annualSpendAED: number): number {
  if (annualSpendAED <= 200_000) return 2;
  if (annualSpendAED >= 20_000_000) return 15;
  const span = 20_000_000 - 200_000;
  return 2 + ((annualSpendAED - 200_000) / span) * (15 - 2);
}

/** Expatriate contribution pillar: banded by headcount, per the sourced
 * guideline (1-5: 1-3%, 6-50: 4-6%, 51-200: 7-9%, 200+: 10%). Midpoint of
 * each band used as the directional figure, disclosed as such. */
function expatriateContributionPillarPct(headcount: number): number {
  if (headcount <= 0) return 0;
  if (headcount <= 5) return 2;    // midpoint of 1-3%
  if (headcount <= 50) return 5;   // midpoint of 4-6%
  if (headcount <= 200) return 8;  // midpoint of 7-9%
  return 10;
}

function computeIcvAe(ae: NonNullable<SupplierLocalContentInputs['ae']>): WeightedPillarScoreResult {
  const pillars: WeightedPillarScoreResult['pillars'] = [];

  const spendLocal = n(ae.manufacturingOrThirdPartySpendLocalAED);
  const spendTotal = n(ae.manufacturingOrThirdPartySpendTotalAED);
  const spendPct = spendTotal > 0 ? (spendLocal / spendTotal) * 100 : 0;
  pillars.push({
    key: 'manufacturingOrThirdPartySpend', contributionPct: spendPct,
    noteEn: 'Manufacturing / Third-Party Spend: spend with UAE-based (and ICV-certified) suppliers contributes positively; international procurement reduces this share.',
    noteAr: 'التصنيع / إنفاق الطرف الثالث: الإنفاق مع موردين مقيمين في الإمارات (وحاصلين على شهادة ICV) يسهم إيجاباً؛ الشراء الدولي يقلّل هذه الحصة.',
  });

  const investPct = investmentPillarPct(n(ae.investmentNBVLocalAED), n(ae.investmentNBVTotalAED));
  pillars.push({
    key: 'investment', contributionPct: investPct,
    noteEn: 'Investment: net book value of UAE-based facilities/equipment/R&D assets, ratio component plus a progressive component from AED 5M to AED 150M NBV.',
    noteAr: 'الاستثمار: القيمة الدفترية الصافية لأصول المنشآت/المعدات/البحث والتطوير المقيمة في الإمارات، مكوّن نسبي بالإضافة إلى مكوّن تدريجي من ٥ مليون إلى ١٥٠ مليون درهم.',
  });

  const emiratisationPct = ae.emiratisationAnnualSpendAED !== null && ae.emiratisationAnnualSpendAED !== undefined
    ? emiratisationPillarPct(ae.emiratisationAnnualSpendAED) : 0;
  pillars.push({
    key: 'emiratisation', contributionPct: emiratisationPct,
    noteEn: 'Emiratisation: employment of UAE nationals, a heavily-weighted component, progressive from 2% (<=AED 200K annual spend) to 15% (>=AED 20M).',
    noteAr: 'التوطين: توظيف المواطنين الإماراتيين، مكوّن مرجّح بقوة، يتدرّج من ٢٪ (إنفاق سنوي ≤٢٠٠ ألف درهم) إلى ١٥٪ (≥٢٠ مليون درهم).',
  });

  const expatPct = ae.expatriateHeadcount !== null && ae.expatriateHeadcount !== undefined
    ? expatriateContributionPillarPct(ae.expatriateHeadcount) : 0;
  pillars.push({
    key: 'expatriateContribution', contributionPct: expatPct,
    noteEn: 'Expatriate Contribution: banded by expatriate headcount (1-5: ~2%, 6-50: ~5%, 51-200: ~8%, 200+: 10%) -- band midpoints used as a directional figure.',
    noteAr: 'مساهمة العمالة الوافدة: تصنّف حسب عدد الموظفين الوافدين (١-٥: ~٢٪، ٦-٥٠: ~٥٪، ٥١-٢٠٠: ~٨٪، أكثر من ٢٠٠: ١٠٪) -- تُستخدم نقطة المنتصف كرقم توجيهي.',
  });

  const bonusExport = ae.exportRevenueAED && ae.manufacturingOrThirdPartySpendTotalAED
    ? Math.min(5, (ae.exportRevenueAED / Math.max(1, ae.manufacturingOrThirdPartySpendTotalAED)) * 5) : 0;
  const bonusEmiratiGrowth = Math.min(5, Math.max(0, n(ae.emiratiHeadcountGrowthPct)) / 4);
  const bonusInvestGrowth = Math.min(5, Math.max(0, n(ae.investmentGrowthPct)) / 4);
  const bonusTotal = bonusExport + bonusEmiratiGrowth + bonusInvestGrowth;
  pillars.push({
    key: 'bonus', contributionPct: bonusTotal,
    noteEn: 'Bonus categories (export revenue, Emirati headcount growth, investment growth), each capped at 5 percentage points per the sourced guideline.',
    noteAr: 'فئات المكافآت (إيرادات التصدير، نمو التوطين، نمو الاستثمار)، كل منها محدود بسقف ٥ نقاط مئوية وفق الدليل الموثّق.',
  });

  const mainlandUplift = ae.registeredOnMainland === true;
  const baseScore = pillars.reduce((s, p) => s + p.contributionPct, 0);
  const scorePct = Math.min(100, baseScore * (mainlandUplift ? 1.10 : 1.0));

  const hasAnyAeInput = [
    ae.manufacturingOrThirdPartySpendTotalAED,
    ae.investmentNBVTotalAED,
    ae.emiratisationAnnualSpendAED,
    ae.expatriateHeadcount,
  ].some(v => v !== null && v !== undefined);

  return { mechanismType: 'weighted-pillar-score', scorePct: hasAnyAeInput ? scorePct : null, pillars, mainlandUpliftApplied: mainlandUplift };
}

// ---------------------------------------------------------------------------
// Section 5b — AE: Tawazun defense offset-obligation-gate (type 6). Real,
// sourced, computable -- see PROGRAMS['ae-tawazun-offset'] and the file
// header's "AE TAWAZUN SOURCING" section.
// ---------------------------------------------------------------------------

/** AED 36.73M -- the fixed-peg equivalent of the sourced USD 10M threshold
 * (AED/USD peg = 3.6725, unchanged since 1997). */
export const TAWAZUN_OFFSET_THRESHOLD_AED = 36_730_000;
export const TAWAZUN_OFFSET_TARGET_PCT = 60;
export const TAWAZUN_SHORTFALL_PENALTY_PCT = 8.5;

function computeTawazunOffset(input: NonNullable<SupplierLocalContentInputs['aeTawazun']>): OffsetObligationGateResult {
  const contractValue = input.contractValueAED;
  const triggersObligation = contractValue === null || contractValue === undefined ? null : contractValue >= TAWAZUN_OFFSET_THRESHOLD_AED;
  const requiredOffsetCreditsAED = triggersObligation === null
    ? null
    : triggersObligation === false
      ? 0
      : (contractValue as number) * TAWAZUN_OFFSET_TARGET_PCT / 100;
  const earned = input.offsetCreditsEarnedAED ?? null;
  const shortfallAED = requiredOffsetCreditsAED !== null && earned !== null ? Math.max(0, requiredOffsetCreditsAED - earned) : null;
  const shortfallPenaltyAED = shortfallAED !== null ? (shortfallAED * TAWAZUN_SHORTFALL_PENALTY_PCT) / 100 : null;
  return {
    mechanismType: 'offset-obligation-gate',
    triggersObligation, thresholdAED: TAWAZUN_OFFSET_THRESHOLD_AED,
    requiredOffsetCreditsAED, offsetCreditsEarnedAED: earned, shortfallAED, shortfallPenaltyAED,
  };
}

// ---------------------------------------------------------------------------
// Section 6 — JO/SA: price-preference-margin (a bid-evaluation adjustment,
// not a local-content score)
// ---------------------------------------------------------------------------

export const JORDAN_PRICE_PREFERENCE_MARGIN_PCT = 20;
export const SAUDI_PRICE_PREFERENCE_MARGIN_PCT = 10;

function computePricePreferenceJo(jo: NonNullable<SupplierLocalContentInputs['jo']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(JORDAN_PRICE_PREFERENCE_MARGIN_PCT, jo.bidValueLocallyManufacturedPct);
}

function computePricePreferenceSa(sa: NonNullable<SupplierLocalContentInputs['saPricePreference']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(SAUDI_PRICE_PREFERENCE_MARGIN_PCT, sa.bidValueLocallyManufacturedPct);
}

// ---------------------------------------------------------------------------
// Section 6b — OM: OQ Group price preference (type 4, new 15 Sep 2026).
// Same shared primitive as JO/SA above -- see PROGRAMS['om-oq-price-
// preference'].sourceNoteEn.
// ---------------------------------------------------------------------------

export const OMAN_OQ_PRICE_PREFERENCE_MARGIN_PCT = 10;

function computePricePreferenceOm(om: NonNullable<SupplierLocalContentInputs['omOqPricePreference']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(OMAN_OQ_PRICE_PREFERENCE_MARGIN_PCT, om.bidValueLocallyManufacturedPct);
}

// ---------------------------------------------------------------------------
// Section 6c — BH: SME price preference (type 4, new 15 Sep 2026). Same
// shared primitive -- the "share" here is the SME qualification itself
// (100 if qualified, 0 if not), not a locally-manufactured content % --
// see PROGRAMS['bh-sme-price-preference'].sourceNoteEn.
// ---------------------------------------------------------------------------

export const BAHRAIN_SME_PRICE_PREFERENCE_MARGIN_PCT = 10;

function computePricePreferenceBh(bh: NonNullable<SupplierLocalContentInputs['bhSme']>): PricePreferenceMarginResult {
  const qualifies = bh.qualifiesAsSme;
  const share = qualifies === null || qualifies === undefined ? null : (qualifies ? 100 : 0);
  return computePricePreferenceMargin(BAHRAIN_SME_PRICE_PREFERENCE_MARGIN_PCT, share);
}

// ---------------------------------------------------------------------------
// Section 6c-2 — EG: two price-preference-margin mechanisms (new, 15 Sep
// 2026 Part 2 pass). The general procurement preference is threshold-gated
// (qualify at >=40% local content, then a flat margin) rather than
// continuously scaled -- see PROGRAMS['eg-price-preference'].sourceNoteEn.
// The oil & gas PSA preference reuses the same binary-to-share conversion
// as Bahrain's SME preference above -- see PROGRAMS['eg-oil-gas-price-
// preference'].sourceNoteEn.
// ---------------------------------------------------------------------------

export const EGYPT_PRICE_PREFERENCE_MARGIN_PCT = 15;
export const EGYPT_PRICE_PREFERENCE_QUALIFYING_THRESHOLD_PCT = 40;
export const EGYPT_OIL_GAS_PRICE_PREFERENCE_MARGIN_PCT = 10;

function computePricePreferenceEg(eg: NonNullable<SupplierLocalContentInputs['eg']>): PricePreferenceMarginResult {
  const pct = eg.egyptianContentSharePct;
  const qualifies = pct === null || pct === undefined ? null : pct >= EGYPT_PRICE_PREFERENCE_QUALIFYING_THRESHOLD_PCT;
  const share = qualifies === null ? null : (qualifies ? 100 : 0);
  return computePricePreferenceMargin(EGYPT_PRICE_PREFERENCE_MARGIN_PCT, share);
}

function computePricePreferenceEgOilGas(egOilGas: NonNullable<SupplierLocalContentInputs['egOilGas']>): PricePreferenceMarginResult {
  const isLocal = egOilGas.isLocalEgyptianContractor;
  const share = isLocal === null || isLocal === undefined ? null : (isLocal ? 100 : 0);
  return computePricePreferenceMargin(EGYPT_OIL_GAS_PRICE_PREFERENCE_MARGIN_PCT, share);
}

export const TURKEY_PRICE_PREFERENCE_MARGIN_PCT = 15;

function computePricePreferenceTr(tr: NonNullable<SupplierLocalContentInputs['tr']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(TURKEY_PRICE_PREFERENCE_MARGIN_PCT, tr.bidValueDomesticCertifiedPct);
}


// ---------------------------------------------------------------------------
// Section 6a-2 -- USA: Buy American Act binary-threshold price preference
// (type 4, new 16 Sep 2026 Part 2 continuation). Unlike every other reuse
// of computePricePreferenceMargin, the margin itself is caller-dependent
// (business size), not a single fixed constant -- see PROGRAMS['usa-buy-
// american-price-preference'].sourceNoteEn for the disclosed default.
// ---------------------------------------------------------------------------

export const BUY_AMERICAN_DOMESTIC_CONTENT_THRESHOLD_PCT = 65; // 2024-2028; steps to 75% from 2029 (disclosed, not modeled as a second threshold)
export const BUY_AMERICAN_LARGE_BUSINESS_MARGIN_PCT = 20;
export const BUY_AMERICAN_SMALL_BUSINESS_MARGIN_PCT = 30;

function computePricePreferenceUsa(usa: NonNullable<SupplierLocalContentInputs['usa']>): PricePreferenceMarginResult {
  const pct = usa.domesticContentSharePct;
  const qualifies = pct === null || pct === undefined ? null : pct >= BUY_AMERICAN_DOMESTIC_CONTENT_THRESHOLD_PCT;
  const share = qualifies === null ? null : (qualifies ? 100 : 0);
  // Caller-overridable default (Decision Record 8.7): defaults to the
  // large-business rate unless isSmallBusinessConcern is explicitly true --
  // FAR's own two-tier structure, not a platform-invented assumption.
  const marginPct = usa.isSmallBusinessConcern === true ? BUY_AMERICAN_SMALL_BUSINESS_MARGIN_PCT : BUY_AMERICAN_LARGE_BUSINESS_MARGIN_PCT;
  return computePricePreferenceMargin(marginPct, share);
}

// ---------------------------------------------------------------------------
// Section 6a-3 -- CN: two genuinely distinct China mechanisms (China Part 2
// continuation). computePricePreferenceCnDomesticProduct evaluates the
// first OR-gated eligibility shape in this file (see PROGRAMS['cn-domestic-
// product-price-preference'].sourceNoteEn) before handing a binary
// qualification to the shared computePricePreferenceMargin primitive.
// computePricePreferenceCnSme selects a real 2x2 role-x-procurement-type
// band matrix, gated by a real 30% consortium subcontract-share threshold
// (see PROGRAMS['cn-sme-price-deduction'].sourceNoteEn) -- genuinely new
// selection/gating logic, not a reskinned copy of another country's formula.
// ---------------------------------------------------------------------------

export const CN_DOMESTIC_PRODUCT_PRICE_PREFERENCE_PCT = 20;
export const CN_DOMESTIC_PRODUCT_BUNDLE_THRESHOLD_PCT = 80;

function computePricePreferenceCnDomesticProduct(cn: NonNullable<SupplierLocalContentInputs['cn']>): PricePreferenceMarginResult {
  const meetsCriteria = cn.meetsDomesticProductCriteria ?? null;
  const bundleSharePct = cn.bundleDomesticCostSharePct ?? null;
  const bundleQualifies = bundleSharePct === null ? null : bundleSharePct >= CN_DOMESTIC_PRODUCT_BUNDLE_THRESHOLD_PCT;

  // Two independently-sufficient paths (Decision Record 8.7: never a
  // fabricated pass/fail when a path's own input is genuinely unknown) --
  // true if EITHER path is confirmed true; false only once BOTH paths are
  // confirmed false; null (insufficient data) otherwise.
  let qualifies: boolean | null;
  if (meetsCriteria === true || bundleQualifies === true) {
    qualifies = true;
  } else if (meetsCriteria === false && bundleQualifies === false) {
    qualifies = false;
  } else {
    qualifies = null;
  }
  const share = qualifies === null ? null : (qualifies ? 100 : 0);
  return computePricePreferenceMargin(CN_DOMESTIC_PRODUCT_PRICE_PREFERENCE_PCT, share);
}

export const CN_SME_DIRECT_ENGINEERING_MIN_PCT = 3;
export const CN_SME_DIRECT_ENGINEERING_MAX_PCT = 5;
export const CN_SME_CONSORTIUM_ENGINEERING_MIN_PCT = 1;
export const CN_SME_CONSORTIUM_ENGINEERING_MAX_PCT = 2;
export const CN_SME_DIRECT_GOODS_SERVICES_MIN_PCT = 10;
export const CN_SME_DIRECT_GOODS_SERVICES_MAX_PCT = 20;
export const CN_SME_CONSORTIUM_GOODS_SERVICES_MIN_PCT = 4;
export const CN_SME_CONSORTIUM_GOODS_SERVICES_MAX_PCT = 6;
export const CN_SME_CONSORTIUM_MIN_SUBCONTRACT_SHARE_PCT = 30;

function computePricePreferenceCnSme(cnSme: NonNullable<SupplierLocalContentInputs['cnSme']>): PricePreferenceMarginResult {
  const role = cnSme.supplierRole ?? null;
  const procurementType = cnSme.procurementType ?? null;
  const subcontractSharePct = cnSme.consortiumSmallEnterpriseSubcontractSharePct ?? null;

  if (role === null || procurementType === null) {
    return computePricePreferenceMargin(0, null); // insufficient inputs -- no band selectable yet
  }

  if (role === 'large-medium-consortium-subcontract') {
    // Real gate, not a continuous taper: below the 30% subcontract-share
    // threshold, the deduction is zero -- same discipline already applied
    // to the US Buy American Act threshold.
    if (subcontractSharePct === null) {
      return computePricePreferenceMargin(0, null); // gate status unknown
    }
    if (subcontractSharePct < CN_SME_CONSORTIUM_MIN_SUBCONTRACT_SHARE_PCT) {
      return { mechanismType: 'price-preference-margin', preferenceMarginPct: 0, preferenceMarginMinPct: 0, preferenceMarginMaxPct: 0, locallyManufacturedSharePct: 0, effectiveBidDiscountPct: 0 };
    }
    const [minPct, maxPct] = procurementType === 'engineering-works'
      ? [CN_SME_CONSORTIUM_ENGINEERING_MIN_PCT, CN_SME_CONSORTIUM_ENGINEERING_MAX_PCT]
      : [CN_SME_CONSORTIUM_GOODS_SERVICES_MIN_PCT, CN_SME_CONSORTIUM_GOODS_SERVICES_MAX_PCT];
    return { ...computePricePreferenceMargin(minPct, 100), preferenceMarginMinPct: minPct, preferenceMarginMaxPct: maxPct };
  }

  // role === 'direct-small-micro'
  const [minPct, maxPct] = procurementType === 'engineering-works'
    ? [CN_SME_DIRECT_ENGINEERING_MIN_PCT, CN_SME_DIRECT_ENGINEERING_MAX_PCT]
    : [CN_SME_DIRECT_GOODS_SERVICES_MIN_PCT, CN_SME_DIRECT_GOODS_SERVICES_MAX_PCT];
  return { ...computePricePreferenceMargin(minPct, 100), preferenceMarginMinPct: minPct, preferenceMarginMaxPct: maxPct };
}

// ---------------------------------------------------------------------------
// Section 6d — JO/BH/KW: spend-set-aside-target (type 5, new 15 Sep 2026).
// Real sourced national/program target shares -- see PROGRAMS[
// 'jo-contractor-quota' | 'bh-sme-spend-setaside' | 'kw-kpc-local-spend']
// .sourceNoteEn.
// ---------------------------------------------------------------------------

export const JORDAN_CONTRACTOR_QUOTA_TARGET_PCT = 35;
export const BAHRAIN_SME_SPEND_SETASIDE_TARGET_PCT = 20;
export const KUWAIT_KPC_LOCAL_SPEND_TARGET_PCT = 30;
export const USA_SBA_SMALL_BUSINESS_TARGET_PCT = 23; // government-wide statutory goal, 15 U.S.C. 644 / FAR Part 19

function computeContractorQuotaJo(jo: NonNullable<SupplierLocalContentInputs['joContractorQuota']>): SpendSetAsideResult {
  return computeSpendSetAside(JORDAN_CONTRACTOR_QUOTA_TARGET_PCT, jo.isRegisteredJordanianContractor);
}

function computeSpendSetAsideBh(bh: NonNullable<SupplierLocalContentInputs['bhSme']>): SpendSetAsideResult {
  return computeSpendSetAside(BAHRAIN_SME_SPEND_SETASIDE_TARGET_PCT, bh.qualifiesAsSme);
}

function computeLocalSpendKw(kw: NonNullable<SupplierLocalContentInputs['kwLocalSpend']>): SpendSetAsideResult {
  return computeSpendSetAside(KUWAIT_KPC_LOCAL_SPEND_TARGET_PCT, kw.isRegisteredKuwaitiSupplier);
}

// ---------------------------------------------------------------------------
// Section 6e — QA: Tawteen/ICV modified-icv-score (new 15 Sep 2026). Real
// formula from icv.qa's own official methodology pages -- see PROGRAMS[
// 'qa-icv-tawteen'].sourceNoteEn for the full sourcing.
// baseScorePct = eligible local spend (5 cost categories) / total Qatar
// revenue excluding exports; finalScorePct applies the ICV+ manufacturer
// boost, the micro/small blanket floor, and the capped self-reported bonus.
// ---------------------------------------------------------------------------

export const QATAR_ICV_PLUS_MANUFACTURER_BOOST_MULTIPLIER = 1.5; // ICV+: 50% score increase
export const QATAR_ICV_BLANKET_FLOOR_PCT_MICRO_SMALL = 30;       // blanket score: minimum for micro/small suppliers
export const QATAR_ICV_MAX_SELF_REPORTED_BONUS_PCT = 15;         // capped strategic-behaviour bonus

function computeIcvTawteenQa(qa: NonNullable<SupplierLocalContentInputs['qa']>): ModifiedIcvScoreResult {
  const tangible = { key: 'localTangibleGoodsMaterials', eligible: n(qa.localTangibleGoodsMaterialsQAR), total: n(qa.localTangibleGoodsMaterialsQAR) };
  const services = { key: 'localServices', eligible: n(qa.localServicesQAR), total: n(qa.localServicesQAR) };
  const training = { key: 'qatariNationalResidentTraining', eligible: n(qa.qatariNationalResidentTrainingCostQAR), total: n(qa.qatariNationalResidentTrainingCostQAR) };
  const supplierTraining = { key: 'supplierTrainingCertification', eligible: n(qa.supplierTrainingCertificationCostQAR), total: n(qa.supplierTrainingCertificationCostQAR) };
  const depreciation = { key: 'qatarAssetDepreciation', eligible: n(qa.qatarAssetDepreciationQAR), total: n(qa.qatarAssetDepreciationQAR) };
  const pillars = [tangible, services, training, supplierTraining, depreciation];

  const eligibleSpend = pillars.reduce((s, p) => s + p.eligible, 0);
  const totalRevenue = qa.totalQatarRevenueExclExportsQAR;
  const baseScorePct = totalRevenue !== null && totalRevenue !== undefined && totalRevenue > 0 ? (eligibleSpend / totalRevenue) * 100 : null;

  const isManufacturer = qa.isEligibleManufacturer === true;
  const isMicroSmall = qa.isMicroOrSmallSupplier === true;
  const bonus = Math.max(0, Math.min(QATAR_ICV_MAX_SELF_REPORTED_BONUS_PCT, n(qa.selfReportedBonusPct)));

  let finalScorePct: number | null;
  if (baseScorePct === null && !isMicroSmall) {
    // No spend denominator, and no blanket-floor guarantee to fall back on
    // -- an honest null, same convention as every other score-based
    // mechanism in this file (never a fabricated 0).
    finalScorePct = null;
  } else {
    let s = baseScorePct ?? 0;
    if (isManufacturer) s = s * QATAR_ICV_PLUS_MANUFACTURER_BOOST_MULTIPLIER;
    s = s + bonus;
    if (isMicroSmall) s = Math.max(s, QATAR_ICV_BLANKET_FLOOR_PCT_MICRO_SMALL);
    finalScorePct = Math.min(100, s);
  }

  return {
    mechanismType: 'modified-icv-score', baseScorePct, pillars,
    isEligibleManufacturer: isManufacturer, isMicroOrSmallSupplier: isMicroSmall,
    selfReportedBonusPct: qa.selfReportedBonusPct ?? null, finalScorePct,
  };
}

// ---------------------------------------------------------------------------
// Section 7 — top-level supplier assessment: resolves applicability first
// (government/SOE vs private-commercial, and sourced vs not-yet-sourced),
// then computes with the right mechanism. `program` defaults to
// `DEFAULT_PROGRAM_BY_COUNTRY[country]` when omitted, so every pre-existing
// caller keeps its exact prior behavior.
// ---------------------------------------------------------------------------

export function assessSupplierLocalContent(
  country: LocalContentCountry,
  procurementContext: ProcurementContext,
  inputs: SupplierLocalContentInputs,
  program?: LocalContentProgram,
): LocalContentAssessment {
  const resolvedProgram: LocalContentProgram = program ?? DEFAULT_PROGRAM_BY_COUNTRY[country];
  const framework: CountryFrameworkInfo = PROGRAMS[resolvedProgram];

  if (framework.mechanismType === 'not-yet-sourced') {
    return {
      country, program: resolvedProgram, procurementContext, applicability: 'insufficient-data', framework, computation: { mechanismType: 'not-yet-sourced' },
      certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
      reasonEn: `No local-content formula for ${framework.programNameEn} (${framework.countryNameEn}) has been sourced to this platform's verification standard yet. ${framework.sourceNoteEn}`,
      reasonAr: `لم يتم بعد توثيق صيغة محتوى محلي لـ${framework.programNameAr} (${framework.countryNameAr}) وفق معيار التحقق المعتمد في هذه المنصة. ${framework.sourceNoteAr}`,
    };
  }

  if (!framework.applicableContexts.includes(procurementContext)) {
    return {
      country, program: resolvedProgram, procurementContext, applicability: 'not-applicable', framework, computation: null,
      certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
      reasonEn: `${framework.programNameEn} is sourced as applying to ${framework.applicableContexts.join('/')} procurement in ${framework.countryNameEn}. No sourced evidence it applies to ${procurementContext} procurement -- this assessment does not apply here, not a zero score.`,
      reasonAr: `${framework.programNameAr} موثّق كأنه يسري على مشتريات ${framework.applicableContexts.map(c => PROCUREMENT_CONTEXT_LABEL_AR[c]).join(' / ')} في ${framework.countryNameAr}. لا يوجد دليل موثّق على سريانه على مشتريات من نوع ${PROCUREMENT_CONTEXT_LABEL_AR[procurementContext]} -- هذا التقييم لا ينطبق هنا، وليس درجة صفرية.`,
    };
  }

  let computation: LocalContentComputation;
  if (resolvedProgram === 'sa-lcgpa-general') {
    if (!inputs.sa) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'eligible-spend-ratio', scorePct: null, pillars: [] }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No SA/LCGPA pillar inputs supplied yet.', reasonAr: 'لم تُدخل بيانات أركان LCGPA بعد.' };
    }
    computation = computeLcgpaSa(inputs.sa);
  } else if (resolvedProgram === 'sa-mandatory-list') {
    if (!inputs.saMandatoryList) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Mandatory List category/certification inputs supplied yet.', reasonAr: 'لم تُدخل بيانات فئة القائمة الإلزامية أو الاعتماد بعد.' };
    }
    computation = computeCategoryEligibilityGate(inputs.saMandatoryList);
  } else if (resolvedProgram === 'sa-price-preference') {
    if (!inputs.saPricePreference) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(SAUDI_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Saudi locally-manufactured bid share supplied yet.', reasonAr: 'لم تُدخل نسبة التصنيع المحلي في العطاء بعد.' };
    }
    computation = computePricePreferenceSa(inputs.saPricePreference);
  } else if (resolvedProgram === 'sa-iktva-aramco') {
    if (!inputs.iktva) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'anchor-buyer-score', scorePct: null, components: [], totalCostsSAR: null, incentiveBonusPct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No IKTVA inputs supplied yet.', reasonAr: 'لم تُدخل بيانات إكتفاء بعد.' };
    }
    computation = computeIktvaAramco(inputs.iktva);
  } else if (resolvedProgram === 'ae-icv-general') {
    if (!inputs.ae) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'weighted-pillar-score', scorePct: null, pillars: [], mainlandUpliftApplied: false }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No AE/ICV pillar inputs supplied yet.', reasonAr: 'لم تُدخل بيانات أركان ICV بعد.' };
    }
    computation = computeIcvAe(inputs.ae);
  } else if (resolvedProgram === 'ae-tawazun-offset') {
    if (!inputs.aeTawazun) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'offset-obligation-gate', triggersObligation: null, thresholdAED: TAWAZUN_OFFSET_THRESHOLD_AED, requiredOffsetCreditsAED: null, offsetCreditsEarnedAED: null, shortfallAED: null, shortfallPenaltyAED: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Tawazun contract-value inputs supplied yet.', reasonAr: 'لم تُدخل بيانات قيمة العقد الخاصة بتوازن بعد.' };
    }
    computation = computeTawazunOffset(inputs.aeTawazun);
  } else if (resolvedProgram === 'jo-price-preference') {
    if (!inputs.jo) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'price-preference-margin', preferenceMarginPct: JORDAN_PRICE_PREFERENCE_MARGIN_PCT, locallyManufacturedSharePct: null, effectiveBidDiscountPct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Jordan locally-manufactured bid share supplied yet.', reasonAr: 'لم تُدخل نسبة التصنيع المحلي في العطاء بعد.' };
    }
    computation = computePricePreferenceJo(inputs.jo);
  } else if (resolvedProgram === 'jo-contractor-quota') {
    if (!inputs.joContractorQuota) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'spend-set-aside-target', targetSharePct: JORDAN_CONTRACTOR_QUOTA_TARGET_PCT, qualifiesForSetAside: null, eligibleForReservedShare: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Jordanian-contractor registration status supplied yet.', reasonAr: 'لم تُدخل حالة تسجيل المقاول الأردني بعد.' };
    }
    computation = computeContractorQuotaJo(inputs.joContractorQuota);
  } else if (resolvedProgram === 'om-mandatory-list') {
    if (!inputs.omMandatoryList) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No PTLC Mandatory List category/certification inputs supplied yet.', reasonAr: 'لم تُدخل بيانات فئة القائمة الإلزامية أو الاعتماد بعد.' };
    }
    computation = computeCategoryEligibilityGate(inputs.omMandatoryList);
  } else if (resolvedProgram === 'om-oq-price-preference') {
    if (!inputs.omOqPricePreference) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(OMAN_OQ_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Omani locally-manufactured bid share supplied yet.', reasonAr: 'لم تُدخل نسبة التصنيع العماني في العطاء بعد.' };
    }
    computation = computePricePreferenceOm(inputs.omOqPricePreference);
  } else if (resolvedProgram === 'qa-icv-tawteen') {
    if (!inputs.qa) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'modified-icv-score', baseScorePct: null, pillars: [], isEligibleManufacturer: false, isMicroOrSmallSupplier: false, selfReportedBonusPct: null, finalScorePct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Qatar Tawteen/ICV inputs supplied yet.', reasonAr: 'لم تُدخل بيانات توطين/القيمة المحلية القطرية بعد.' };
    }
    computation = computeIcvTawteenQa(inputs.qa);
  } else if (resolvedProgram === 'bh-sme-price-preference') {
    if (!inputs.bhSme) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(BAHRAIN_SME_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Bahrain SME qualification status supplied yet.', reasonAr: 'لم تُدخل حالة تأهل المؤسسة الصغيرة أو المتوسطة البحرينية بعد.' };
    }
    computation = computePricePreferenceBh(inputs.bhSme);
  } else if (resolvedProgram === 'bh-sme-spend-setaside') {
    if (!inputs.bhSme) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'spend-set-aside-target', targetSharePct: BAHRAIN_SME_SPEND_SETASIDE_TARGET_PCT, qualifiesForSetAside: null, eligibleForReservedShare: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Bahrain SME qualification status supplied yet.', reasonAr: 'لم تُدخل حالة تأهل المؤسسة الصغيرة أو المتوسطة البحرينية بعد.' };
    }
    computation = computeSpendSetAsideBh(inputs.bhSme);
  } else if (resolvedProgram === 'kw-kpc-local-spend') {
    if (!inputs.kwLocalSpend) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'spend-set-aside-target', targetSharePct: KUWAIT_KPC_LOCAL_SPEND_TARGET_PCT, qualifiesForSetAside: null, eligibleForReservedShare: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Kuwaiti-supplier registration status supplied yet.', reasonAr: 'لم تُدخل حالة تسجيل المورّد الكويتي بعد.' };
    }
    computation = computeLocalSpendKw(inputs.kwLocalSpend);
  } else if (resolvedProgram === 'eg-price-preference') {
    if (!inputs.eg) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(EGYPT_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Egyptian local-content share supplied yet.', reasonAr: 'لم تُدخل نسبة المحتوى المصري بعد.' };
    }
    computation = computePricePreferenceEg(inputs.eg);
  } else if (resolvedProgram === 'eg-oil-gas-price-preference') {
    if (!inputs.egOilGas) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(EGYPT_OIL_GAS_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Egyptian oil & gas local-contractor status supplied yet.', reasonAr: 'لم تُدخل حالة المقاول المصري المحلي في قطاع النفط والغاز بعد.' };
    }
    computation = computePricePreferenceEgOilGas(inputs.egOilGas);
  } else if (resolvedProgram === 'tr-price-preference') {
    if (!inputs.tr) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(TURKEY_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Turkish domestic-goods-certified bid share supplied yet.', reasonAr: 'لم تُدخل نسبة السلع المحلية المعتمدة في العطاء بعد.' };
    }
    computation = computePricePreferenceTr(inputs.tr);
  } else if (resolvedProgram === 'uk-below-threshold-reservation') {
    if (!inputs.uk) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No PPN 005 reservation/geography-qualification inputs supplied yet.', reasonAr: 'لم تُدخل بيانات التخصيص دون العتبة أو التأهل الجغرافي بعد.' };
    }
    computation = computeCategoryEligibilityGate({ inMandatoryListCategory: inputs.uk.isBelowThresholdReservedProcurement, certifiedForCategory: inputs.uk.isQualifyingUkGeographySupplier });
  } else if (resolvedProgram === 'usa-buy-american-price-preference') {
    if (!inputs.usa) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(BUY_AMERICAN_LARGE_BUSINESS_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Buy American Act domestic-content share supplied yet.', reasonAr: 'لم تُدخل نسبة المحتوى المحلي الأمريكي بعد.' };
    }
    computation = computePricePreferenceUsa(inputs.usa);
  } else if (resolvedProgram === 'usa-baba-infrastructure-gate') {
    if (!inputs.usaBaba) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No BABA infrastructure-coverage/domestic-content inputs supplied yet.', reasonAr: 'لم تُدخل بيانات شمول BABA للبنية التحتية أو المحتوى المحلي بعد.' };
    }
    computation = computeCategoryEligibilityGate({ inMandatoryListCategory: inputs.usaBaba.isFederallyFundedInfrastructureProcurement, certifiedForCategory: inputs.usaBaba.meetsBabaDomesticContentRequirement });
  } else if (resolvedProgram === 'usa-sba-small-business-setaside') {
    if (!inputs.usa) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'spend-set-aside-target', targetSharePct: USA_SBA_SMALL_BUSINESS_TARGET_PCT, qualifiesForSetAside: null, eligibleForReservedShare: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No small-business-concern status supplied yet.', reasonAr: 'لم تُدخل حالة صفة المنشأة الصغيرة بعد.' };
    }
    computation = computeSpendSetAside(USA_SBA_SMALL_BUSINESS_TARGET_PCT, inputs.usa.isSmallBusinessConcern);
  } else if (resolvedProgram === 'cn-domestic-product-price-preference') {
    if (!inputs.cn) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(CN_DOMESTIC_PRODUCT_PRICE_PREFERENCE_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Chinese domestic-product-classification or bundle-cost-share inputs supplied yet.', reasonAr: 'لم تُدخل بيانات تصنيف المنتج المحلي الصيني أو حصة تكلفة الحزمة بعد.' };
    }
    computation = computePricePreferenceCnDomesticProduct(inputs.cn);
  } else if (resolvedProgram === 'cn-govt-procurement-law-domestic-mandate') {
    if (!inputs.cn) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Article 10 exemption or domestic-product-classification inputs supplied yet.', reasonAr: 'لم تُدخل بيانات إعفاء المادة العاشرة أو تصنيف المنتج المحلي بعد.' };
    }
    computation = computeCategoryEligibilityGate({
      inMandatoryListCategory: inputs.cn.article10ExemptionApplies === null || inputs.cn.article10ExemptionApplies === undefined ? null : !inputs.cn.article10ExemptionApplies,
      certifiedForCategory: inputs.cn.meetsDomesticProductCriteria,
    });
  } else if (resolvedProgram === 'cn-sme-price-deduction') {
    if (!inputs.cnSme) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(0, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Chinese SME bidder-role/procurement-type inputs supplied yet.', reasonAr: 'لم تُدخل بيانات دور المزايد الصيني أو نوع المشتريات بعد.' };
    }
    computation = computePricePreferenceCnSme(inputs.cnSme);
  } else {
    computation = { mechanismType: 'not-yet-sourced' };
  }

  const scoreLine = computation.mechanismType === 'eligible-spend-ratio' || computation.mechanismType === 'weighted-pillar-score' || computation.mechanismType === 'anchor-buyer-score'
    ? (computation.scorePct !== null ? `directional score ${computation.scorePct.toFixed(1)}%` : 'incomplete inputs')
    : computation.mechanismType === 'modified-icv-score'
      ? (computation.finalScorePct !== null ? `directional score ${computation.finalScorePct.toFixed(1)}% (base ${computation.baseScorePct !== null ? computation.baseScorePct.toFixed(1) + '%' : 'n/a'})` : 'incomplete inputs')
      : computation.mechanismType === 'price-preference-margin'
        ? (computation.effectiveBidDiscountPct !== null ? `effective bid discount ${computation.effectiveBidDiscountPct.toFixed(1)} points` : 'incomplete inputs')
        : computation.mechanismType === 'category-eligibility-gate'
          ? (computation.eligibleToBid !== null ? (computation.eligibleToBid ? 'eligible to bid' : 'gated out of this category') : 'incomplete inputs')
          : computation.mechanismType === 'offset-obligation-gate'
            ? (computation.triggersObligation === null ? 'incomplete inputs' : computation.triggersObligation ? `offset obligation triggered, required credits AED ${computation.requiredOffsetCreditsAED?.toLocaleString()}` : 'below threshold, no offset obligation')
            : computation.mechanismType === 'spend-set-aside-target'
              ? (computation.qualifiesForSetAside === null ? 'incomplete inputs' : computation.qualifiesForSetAside ? `qualifies for the reserved share (program target ${computation.targetSharePct}%)` : `does not qualify for the reserved share (program target ${computation.targetSharePct}%)`)
              : 'not sourced';

  // scoreLineAr must carry the SAME information as scoreLine (bilingual-
  // completeness fix, 15 Sep 2026) -- never a shorter Arabic sentence.
  const scoreLineAr = computation.mechanismType === 'eligible-spend-ratio' || computation.mechanismType === 'weighted-pillar-score' || computation.mechanismType === 'anchor-buyer-score'
    ? (computation.scorePct !== null ? `درجة توجيهية ${computation.scorePct.toFixed(1)}٪` : 'بيانات غير مكتملة')
    : computation.mechanismType === 'modified-icv-score'
      ? (computation.finalScorePct !== null ? `درجة توجيهية ${computation.finalScorePct.toFixed(1)}٪ (الدرجة الأساسية ${computation.baseScorePct !== null ? computation.baseScorePct.toFixed(1) + '٪' : 'غير متاحة'})` : 'بيانات غير مكتملة')
      : computation.mechanismType === 'price-preference-margin'
        ? (computation.effectiveBidDiscountPct !== null ? `خصم عطاء فعّال ${computation.effectiveBidDiscountPct.toFixed(1)} نقطة` : 'بيانات غير مكتملة')
        : computation.mechanismType === 'category-eligibility-gate'
          ? (computation.eligibleToBid !== null ? (computation.eligibleToBid ? 'مؤهل للتقديم' : 'مستبعد من هذه الفئة') : 'بيانات غير مكتملة')
          : computation.mechanismType === 'offset-obligation-gate'
            ? (computation.triggersObligation === null ? 'بيانات غير مكتملة' : computation.triggersObligation ? `تم تفعيل التزام المقاصة، الائتمانات المطلوبة ${computation.requiredOffsetCreditsAED?.toLocaleString()} درهم` : 'أقل من الحد، لا يوجد التزام مقاصة')
            : computation.mechanismType === 'spend-set-aside-target'
              ? (computation.qualifiesForSetAside === null ? 'بيانات غير مكتملة' : computation.qualifiesForSetAside ? `مؤهل للحصة المخصصة (الهدف البرنامجي ${computation.targetSharePct}٪)` : `غير مؤهل للحصة المخصصة (الهدف البرنامجي ${computation.targetSharePct}٪)`)
              : 'غير موثّق';

  return {
    country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation,
    certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR,
    reasonEn: `${framework.programNameEn} (${framework.countryNameEn}, ${procurementContext}): ${scoreLine}.`,
    reasonAr: `${framework.programNameAr} (${framework.countryNameAr}، ${PROCUREMENT_CONTEXT_LABEL_AR[procurementContext]}): ${scoreLineAr}.`,
  };
}

// ---------------------------------------------------------------------------
// Section 8 — primary + alternative recommendation (Core Instruction / Rule
// 8: never a single-path recommendation)
// ---------------------------------------------------------------------------

export interface LocalContentRecommendation {
  primaryEn: string; primaryAr: string;
  alternativeEn: string; alternativeAr: string;
}

export function recommendLocalContentAction(assessment: LocalContentAssessment, targetThresholdPct: number | null): LocalContentRecommendation | null {
  if (assessment.applicability !== 'applicable' || !assessment.computation) return null;
  const c = assessment.computation;

  if (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score' || c.mechanismType === 'anchor-buyer-score') {
    if (c.scorePct === null || targetThresholdPct === null || c.scorePct >= targetThresholdPct) return null;
    const gap = targetThresholdPct - c.scorePct;
    return {
      primaryEn: `Close the ${gap.toFixed(1)}-point gap directly: increase spend in the pillar(s)/component(s) with the lowest eligible share first (see the breakdown above) -- this raises the certified/directional score itself, the durable fix.`,
      primaryAr: `أغلق الفجوة البالغة ${gap.toFixed(1)} نقطة مباشرة: زد الإنفاق في الركن (المكوّن) ذي النسبة المؤهلة الأدنى أولاً (انظر التفصيل أعلاه) -- هذا يرفع الدرجة المعتمدة/التوجيهية نفسها، وهو الحل الدائم.`,
      alternativeEn: 'If the gap cannot close before this tender\'s deadline: partner or subcontract the shortfall portion of scope with an already-certified local entity, or target a different tender/procuring entity whose threshold this supplier already clears.',
      alternativeAr: 'إذا تعذّر إغلاق الفجوة قبل موعد هذه المناقصة: أشرك جهة محلية معتمدة مسبقاً كشريك أو مقاول من الباطن للجزء الناقص من النطاق، أو استهدف مناقصة/جهة شراء أخرى يفي هذا المورّد بحدّها الأدنى بالفعل.',
    };
  }
  if (c.mechanismType === 'modified-icv-score') {
    if (c.finalScorePct === null || targetThresholdPct === null || c.finalScorePct >= targetThresholdPct) return null;
    const gap = targetThresholdPct - c.finalScorePct;
    const manufacturerHint = c.isEligibleManufacturer ? '' : ' Confirming eligible-manufacturer status (if applicable) would apply icv.qa\'s own ICV+ 50% score boost on top of the base ratio -- check eligibility before assuming this gap requires new spend.';
    const manufacturerHintAr = c.isEligibleManufacturer ? '' : ' تأكد من استيفاء شروط صفة "المصنّع المؤهل" (إن انطبقت)، إذ تطبّق icv.qa مكافأة ICV+ بنسبة ٥٠٪ على الدرجة الأساسية -- تحقق من الأهلية قبل افتراض أن سد هذه الفجوة يتطلب إنفاقاً جديداً.';
    return {
      primaryEn: `Close the ${gap.toFixed(1)}-point gap directly: increase eligible Qatar spend (local goods/materials, local services, Qatari-national/resident training, supplier training/certification, or Qatar-based asset depreciation) against total Qatar revenue excluding exports -- this raises the base ratio the whole score is built on.${manufacturerHint}`,
      primaryAr: `أغلق الفجوة البالغة ${gap.toFixed(1)} نقطة مباشرة: زد الإنفاق القطري المؤهل (سلع/مواد محلية، خدمات محلية، تدريب مواطنين/مقيمين قطريين، تدريب/اعتماد الموردين، أو إهلاك أصول مقيمة في قطر) مقابل إجمالي إيرادات قطر باستثناء الصادرات -- هذا يرفع النسبة الأساسية التي تُبنى عليها الدرجة كاملة.${manufacturerHintAr}`,
      alternativeEn: 'If the gap cannot close before this tender\'s deadline: confirm micro/small-supplier status for icv.qa\'s blanket 30% score floor if genuinely eligible, or partner/subcontract the shortfall portion of scope with an already-ICV-certified local entity.',
      alternativeAr: 'إذا تعذّر إغلاق الفجوة قبل موعد هذه المناقصة: تحقق من استيفاء شروط صفة المورّد متناهي الصغر أو الصغير للاستفادة من الحد الأدنى الشامل لدرجة icv.qa البالغ ٣٠٪ إن كانت الأهلية حقيقية، أو أشرك جهة محلية معتمدة من icv.qa كشريك أو مقاول من الباطن للجزء الناقص من النطاق.',
    };
  }
  if (c.mechanismType === 'price-preference-margin') {
    if (c.locallyManufacturedSharePct === null || c.locallyManufacturedSharePct >= 100) return null;
    return {
      primaryEn: `Increasing the locally-manufactured share of this bid raises the effective price-preference discount directly (currently ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} of a possible ${c.preferenceMarginPct} points) -- source more of the bid's content from local manufacturing where the specification allows it.`,
      primaryAr: `زيادة الحصة المصنّعة محلياً في هذا العطاء ترفع الخصم السعري الفعلي مباشرة (حالياً ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} من أصل ${c.preferenceMarginPct} نقطة ممكنة) -- استمد جزءاً أكبر من محتوى العطاء من التصنيع المحلي حيثما تسمح المواصفة.`,
      alternativeEn: 'If the specification genuinely cannot be met locally, the bid still competes on its own technical/commercial merits without the preference -- confirm whether the gap is decisive before investing in re-sourcing.',
      alternativeAr: 'إذا تعذّر فعلياً استيفاء المواصفة محلياً، يظل العطاء قادراً على المنافسة بمزاياه الفنية والتجارية دون التفضيل -- تأكد من أن الفجوة حاسمة قبل الاستثمار في إعادة التوريد.',
    };
  }
  if (c.mechanismType === 'category-eligibility-gate') {
    if (c.eligibleToBid !== false) return null; // only recommend when genuinely gated out
    const programNameEn = assessment.framework.programNameEn;
    const programNameAr = assessment.framework.programNameAr;
    return {
      primaryEn: `This category is on ${programNameEn}'s Mandatory List and this supplier is not yet certified for it: pursue certification for this specific category before the next bid cycle -- this is the only way to remove the gate itself.`,
      primaryAr: `هذه الفئة مدرجة في القائمة الإلزامية لـ${programNameAr}، وهذا المورّد غير معتمد لها بعد: تابع الحصول على الاعتماد لهذه الفئة تحديداً قبل دورة العطاءات القادمة -- هذا هو السبيل الوحيد لإزالة البوابة نفسها.`,
      alternativeEn: 'If certification cannot complete in time: bid jointly with, or subcontract to, an already-certified local entity for the mandatory-list portion of scope, or target a lot/category that is not on the Mandatory List.',
      alternativeAr: 'إذا تعذّر إتمام الاعتماد في الوقت المناسب: قدّم عطاءً مشتركاً مع جهة محلية معتمدة مسبقاً أو أسند لها كمقاول من الباطن الجزء المشمول بالقائمة الإلزامية من النطاق، أو استهدف حزمة/فئة غير مدرجة في القائمة الإلزامية.',
    };
  }
  if (c.mechanismType === 'spend-set-aside-target') {
    if (c.qualifiesForSetAside !== false) return null; // only recommend when genuinely not qualifying
    const programNameEn = assessment.framework.programNameEn;
    const programNameAr = assessment.framework.programNameAr;
    return {
      primaryEn: `This supplier does not currently qualify for ${programNameEn}'s reserved ${c.targetSharePct}% share: pursue the underlying qualification (registration/classification with the sourced authority) before the next bid cycle -- this is the only way to compete within the reserved pool itself, not just around it.`,
      primaryAr: `لا يستوفي هذا المورّد حالياً شروط التأهل للحصة المخصصة البالغة ${c.targetSharePct}٪ ضمن ${programNameAr}: تابع استيفاء شرط التأهل الأساسي (التسجيل/التصنيف لدى الجهة الموثّقة) قبل دورة العطاءات القادمة -- هذا هو السبيل الوحيد للمنافسة ضمن الحصة المخصصة نفسها، وليس الالتفاف حولها فقط.`,
      alternativeEn: 'If qualification cannot complete in time: this supplier still competes for the open (non-reserved) portion of spend on its own technical/commercial merits -- confirm whether the reserved-share advantage is decisive before investing in the qualification process.',
      alternativeAr: 'إذا تعذّر استيفاء شرط التأهل في الوقت المناسب: يظل هذا المورّد قادراً على المنافسة على الجزء المفتوح (غير المخصص) من الإنفاق بمزاياه الفنية والتجارية -- تأكد من أن ميزة الحصة المخصصة حاسمة قبل الاستثمار في عملية التأهل.',
    };
  }
  if (c.mechanismType === 'offset-obligation-gate') {
    if (c.triggersObligation !== true || c.shortfallAED === null || c.shortfallAED <= 0) return null;
    return {
      primaryEn: `Bank real offset credits toward the AED ${c.shortfallAED.toLocaleString()} shortfall before the performance period closes (local investment, JV, or technology-transfer activity that Tawazun recognizes as credit) -- this is the only path that both closes the gap and avoids the cash/guarantee cost below.`,
      primaryAr: `اكتسب ائتمانات مقاصة حقيقية لسد النقص البالغ ${c.shortfallAED.toLocaleString()} درهم قبل إغلاق فترة الأداء (استثمار محلي، مشروع مشترك، أو نشاط نقل تقني يعترف به توازن كائتمان) -- هذا هو المسار الوحيد الذي يغلق الفجوة ويتجنب تكلفة النقد/الضمان أدناه معاً.`,
      alternativeEn: `If new offset activity cannot be arranged in time: settle the shortfall in cash at 8.5% (AED ${c.shortfallPenaltyAED?.toLocaleString() ?? '—'}) or negotiate rolling the remaining obligation into a future project with Tawazun -- both are the program's own disclosed fallback options, not a compliance failure.`,
      alternativeAr: `إذا تعذّر ترتيب نشاط مقاصة جديد في الوقت المناسب: سوِّ النقص نقداً بنسبة ٨.٥٪ (${c.shortfallPenaltyAED?.toLocaleString() ?? '—'} درهم) أو تفاوض مع توازن لترحيل الالتزام المتبقي إلى مشروع مستقبلي -- كلا الخيارين من البدائل المُفصَح عنها رسمياً في البرنامج نفسه، وليسا إخفاقاً في الامتثال.`,
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Section 9 — portfolio-level rollup (mirrors Module 05's HHI rollup
// pattern: weighted by spend share, grouped by mechanism type AND program,
// never averaged across incompatible mechanisms)
// ---------------------------------------------------------------------------

export interface PortfolioLocalContentInput {
  supplierId: string;
  spendShare: number; // 0-100, this supplier's share of the relevant portfolio spend
  assessment: LocalContentAssessment;
}

export interface PortfolioLocalContentGroup {
  country: LocalContentCountry;
  program: LocalContentProgram;
  procurementContext: ProcurementContext;
  mechanismType: LocalContentMechanismType;
  supplierCount: number;
  portfolioSpendSharePct: number; // sum of spendShare across suppliers in this group
  weightedScorePct: number | null; // score-based mechanisms (eligible-spend-ratio / weighted-pillar-score / anchor-buyer-score / modified-icv-score [finalScorePct])
  weightedEffectiveDiscountPct: number | null; // only for price-preference-margin
  gateEligibleSharePct: number | null; // only for category-eligibility-gate: spend-share-weighted % eligible to bid
  /** Only for offset-obligation-gate: the plain SUM (not spend-weighted --
   * these are absolute currency exposures, not comparable percentages) of
   * every supplier's shortfallPenaltyAED in this group whose shortfall is
   * known. Client-level real-money exposure, not an averaged rate. */
  totalShortfallPenaltyAED: number | null;
  /** Only for spend-set-aside-target (new, 15 Sep 2026): spend-share-
   * weighted % of suppliers in this group who qualify for the reserved
   * share -- the supplier-level counterpart to the program's own national
   * `targetSharePct` (shown separately per-supplier, not rolled up here,
   * since it is a fixed program fact, not a computed portfolio figure). */
  setAsideQualifyingSharePct: number | null;
  suppliersWithInsufficientData: number;
  suppliersNotApplicable: number;
}

export function rollUpPortfolioLocalContent(inputs: PortfolioLocalContentInput[]): PortfolioLocalContentGroup[] {
  const groups = new Map<string, PortfolioLocalContentInput[]>();
  for (const item of inputs) {
    const key = `${item.assessment.country}__${item.assessment.program}__${item.assessment.procurementContext}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  const result: PortfolioLocalContentGroup[] = [];
  for (const [, items] of groups) {
    const first = items[0]!.assessment;
    const applicableItems = items.filter(i => i.assessment.applicability === 'applicable' && i.assessment.computation);
    const insufficientCount = items.filter(i => i.assessment.applicability === 'insufficient-data').length;
    const notApplicableCount = items.filter(i => i.assessment.applicability === 'not-applicable').length;
    const totalSpendShare = items.reduce((s, i) => s + i.spendShare, 0);

    let weightedScorePct: number | null = null;
    let weightedEffectiveDiscountPct: number | null = null;
    let gateEligibleSharePct: number | null = null;
    let totalShortfallPenaltyAED: number | null = null;
    let setAsideQualifyingSharePct: number | null = null;

    if (first.framework.mechanismType === 'eligible-spend-ratio' || first.framework.mechanismType === 'weighted-pillar-score' || first.framework.mechanismType === 'anchor-buyer-score') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && (c.mechanismType === 'eligible-spend-ratio' || c.mechanismType === 'weighted-pillar-score' || c.mechanismType === 'anchor-buyer-score') && c.scorePct !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        weightedScorePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as EligibleSpendRatioResult | WeightedPillarScoreResult | AnchorBuyerScoreResult;
          return s + (c.scorePct as number) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'modified-icv-score') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'modified-icv-score' && c.finalScorePct !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        weightedScorePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as ModifiedIcvScoreResult;
          return s + (c.finalScorePct as number) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'spend-set-aside-target') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'spend-set-aside-target' && c.qualifiesForSetAside !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        setAsideQualifyingSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as SpendSetAsideResult;
          return s + (c.qualifiesForSetAside ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'price-preference-margin') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'price-preference-margin' && c.effectiveBidDiscountPct !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        weightedEffectiveDiscountPct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as PricePreferenceMarginResult;
          return s + (c.effectiveBidDiscountPct as number) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'category-eligibility-gate') {
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'category-eligibility-gate' && c.eligibleToBid !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as CategoryEligibilityGateResult;
          return s + (c.eligibleToBid ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'offset-obligation-gate') {
      const withPenalty = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'offset-obligation-gate' && c.shortfallPenaltyAED !== null;
      });
      if (withPenalty.length > 0) {
        totalShortfallPenaltyAED = withPenalty.reduce((s, i) => {
          const c = i.assessment.computation as OffsetObligationGateResult;
          return s + (c.shortfallPenaltyAED as number);
        }, 0);
      }
    }

    result.push({
      country: first.country, program: first.program, procurementContext: first.procurementContext, mechanismType: first.framework.mechanismType,
      supplierCount: items.length, portfolioSpendSharePct: totalSpendShare,
      weightedScorePct, weightedEffectiveDiscountPct, gateEligibleSharePct, totalShortfallPenaltyAED, setAsideQualifyingSharePct,
      suppliersWithInsufficientData: insufficientCount, suppliersNotApplicable: notApplicableCount,
    });
  }
  return result;
}
