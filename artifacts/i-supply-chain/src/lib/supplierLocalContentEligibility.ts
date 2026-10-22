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
 *     brief's own flagged "$10M vs AED10M" ambiguity. A 20 Sep 2026 pass
 *     added a THIRD AE program, `ae-gcc-origin-treatment` -- a genuinely
 *     different legal basis again (the GCC Unified Economic Agreement's own
 *     Article 3 rules-of-origin eligibility gate for GCC-origin products,
 *     not a MoIAT certification), sourced with an explicitly disclosed gap:
 *     the treaty entitles a qualifying GCC-origin product to the same
 *     treatment as a UAE national product, but neither MoIAT's ICV
 *     methodology nor UAE Federal Law No. 11 of 2023's own text confirms
 *     that entitlement is actually operationalized as an ICV score uplift.
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

export type LocalContentCountry = 'SA' | 'AE' | 'JO' | 'OM' | 'QA' | 'BH' | 'KW' | 'EG' | 'TR' | 'UK' | 'USA' | 'CN' | 'IN' | 'DE' | 'JP' | 'KR';

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
  | 'sa-gami-defense'     // SA type 6: RESOLVED 2 Oct 2026 (Module 08 nine-program closure pass) -- GAMI's own official Industrial Participation Policy PDF (gami.gov.sa) gives the full computable structure: 60% minimum commitment on contracts >=SAR 150M, discharged via Valuation-Factor-weighted credits, 10% Performance Security, and a disclosed liquidation formula on shortfall
  | 'sa-likt'             // SA type 6: offset/tech-transfer obligation (not-yet-sourced -- re-confirmed 2 Oct 2026 against LCGPA's own primary Local Content Mechanisms page, a genuinely separate instrument from GAMI's defense program, still no published formula; this same 2 Oct 2026 round separately confirmed LIKT is ALSO genuinely distinct from LCGPA's own 2023 Economic Participation Policy -- see 'sa-economic-participation-policy' below and PROGRAMS['sa-likt'].sourceNoteEn)
  | 'sa-economic-participation-policy' // SA type 6 (new, 2 Oct 2026 -- SA-LIKT/EP-Policy pass): RESOLVED -- LCGPA's own 2023 Economic Participation (EP) Policy, a genuinely separate instrument from 'sa-likt' (LIKT): 35%-of-imported-content-value commitment on government contracts where imported goods/services exceed SAR 100 million, discharged via a 7-category Valuation Factor credit (1.0x-3.0x); see PROGRAMS['sa-economic-participation-policy'].sourceNoteEn
  | 'sa-rawafed-stc'      // SA type 2-ish (new, 18 Sep 2026): stc's own Rawafed local-content program -- real LCGPA-approved formula, sourced from stc's own 2021 Rawafed Annual Report PDF; reuses eligible-spend-ratio (same 4-pillar shape as LCGPA general), a company-specific anchor-buyer program like Aramco IKTVA
  | 'sa-sabic-lc-commitment' // SA type 6-ish (new, 18 Sep 2026): SABIC per-contract local-content commitment deviation gate -- NOT a published SABIC-wide standard (none was found); models a per-contract negotiated target vs. audited actual, per the platform owner's explicit business rule, with a disclosed tolerance/penalty default
  | 'sa-tharwah-maaden'   // SA type 6 (new, 18 Sep 2026): Ma'aden's real, named "Tharwah" local content program (confirmed via maaden.com/tharwah and press coverage) -- not-yet-sourced: no public per-supplier computable formula found, unlike stc's Rawafed
  | 'ae-icv-general'      // AE type 1: certification score (the module's original mechanism)
  | 'ae-tawazun-offset'   // AE type 6: offset/tech-transfer obligation (Tawazun Economic Council, real formula)
  | 'ae-gcc-origin-treatment' // AE type 3-ish (new, 20 Sep 2026): GCC Unified Economic Agreement Article 3 rules-of-origin eligibility gate -- a treaty-level "national treatment" entitlement for GCC-origin products, genuinely different legal basis from MoIAT's ICV certification, with an explicitly disclosed gap between the treaty right and confirmed UAE domestic operationalization
  | 'jo-price-preference' // JO type 4: bid-evaluation price preference (the module's original mechanism)
  | 'jo-contractor-quota' // JO type 5 (new, 15 Sep 2026): international-tender contractor quota, real Cabinet decision
  | 'om-icv'              // OM: not-yet-sourced (the module's original mechanism -- general national ICV formula)
  | 'om-mandatory-list'   // OM type 3 (new, 15 Sep 2026): PTLC Mandatory List category eligibility gate
  | 'om-oq-price-preference' // OM type 4 (new, 15 Sep 2026): OQ Group price preference (company-specific, like AE Tawazun/QA QatarEnergy)
  | 'qa-national-strategy' // QA: not-yet-sourced (the module's original mechanism -- the NEW Cabinet-approved National Local Content Strategy specifically)
  | 'qa-icv-tawteen'      // QA type 1 (new, 15 Sep 2026): official icv.qa Tawteen ICV score with real modifiers -- QatarEnergy's own energy-sector program, NOT a universal government-wide platform (see PROGRAMS['qa-tenders-icv'].sourceNoteEn for the cross-government contrast)
  | 'qa-tenders-icv'      // QA type 1-ish (new, 20 Sep 2026): Tenders and Auctions Law (Law No. 24/2015) Executive Regulations Arts. 2-3 -- self-certified/planned local-value ratio considered (not scored against a published threshold) in government bid evaluation; a genuinely different, cross-government legal basis from icv.qa's energy-sector-specific program above; reuses eligible-spend-ratio with a single combined pillar
  | 'bh-local-content'    // BH: not-yet-sourced (the module's original mechanism -- general national framework)
  | 'bh-sme-price-preference' // BH type 4 (new, 15 Sep 2026): 10% SME bidding price advantage, Ministerial Decision 23/2026
  | 'bh-sme-spend-setaside'   // BH type 5 (new, 15 Sep 2026): 20% SME spend allocation, Ministerial Decision 23/2026
  | 'kw-local-content'    // KW: RESOLVED 1 Oct 2026 (Module 08 twelve-gap closure pass) -- Public Tenders Law Art. 87 dual 30%/30% local-materials/local-works sourcing gate
  | 'kw-kpc-local-spend'  // KW type 5 (new, 15 Sep 2026): KPC 30% Kuwaiti-supplier spend target
  | 'kw-tender-law-price-preference' // KW type 4 (new, 20 Sep 2026): Public Tenders Law No. 49/2016 Art. 62 + Executive Regulation Decree No. 30/2017 -- 15% national/GCC-origin product price preference, CAPT-administered, cross-government -- a genuinely different legal basis and buyer scope from KPC's own anchor-buyer spend target above; reuses price-preference-margin
  | 'bh-takamul-local-value'       // BH type 4 (new, 29 Sep 2026 verify-then-extend pass): 10% price preference for local industrial establishments holding a Takamul (Local Value Certificate), Cabinet Decision No. (11-2679), per Bahrain Tender Board's own official "Guideline for Suppliers & Contractors" v1.0 (Nov 2025) -- a genuinely different qualifying criterion (a certified local-VALUE-ADD credential) from the general SME-status preference above; reuses price-preference-margin
  | 'bh-gulf-made-preference'      // BH type 4 (new, 29 Sep 2026 verify-then-extend pass): 10% price preference for Gulf-made/GCC-origin products, Decision No. (40) of 2015 adopting the amended unified GCC rules for national-product priority -- same GCC Unified Economic Agreement national-treatment logic already modeled for the UAE ('ae-gcc-origin-treatment') and Kuwait ('kw-tender-law-price-preference'), sourced from the same official Bahrain Tender Board guideline as Takamul above; reuses price-preference-margin
  | 'kw-nationality-price-preference' // KW type 4 (new, 29 Sep 2026 verify-then-extend pass): 10% price preference for Kuwaiti-NATIONALITY companies (qualifying criterion is company nationality, not product origin) -- the "real candidate fourth Kuwait program" explicitly flagged for a future pass in 'kw-tender-law-price-preference''s own sourceNoteEn, corroborated there by trade.gov + tenderspedia.com; reuses price-preference-margin
  | 'eg-price-preference'          // EG type 4 (new, 15 Sep 2026 Part 2 pass): public-procurement price preference, Law 5/2015 as amended by Law 90/2018 (the module's default/original mechanism for Egypt)
  | 'eg-oil-gas-price-preference'  // EG type 4 (new, Part 2 pass): PSA local-contractor price-band priority, Ministry of Petroleum PSA framework -- a genuinely different buyer/program from the general procurement preference above
  | 'eg-auto-local-content'         // EG type 6-ish target (new, Part 2 pass): revamped AIDP 60% local-content target, not-yet-sourced (no published per-supplier formula)
  | 'tr-price-preference'           // TR type 4 (new, Part 2 continuation): public-procurement domestic-goods ("yerli mali") price preference, Law 4734 Art. 63(c) -- the module's default/original mechanism for Turkey
  | 'tr-defense-offset'             // TR type 6: RESOLVED 2 Oct 2026 (Module 08 nine-program closure pass) -- SSB's 2022 Industrialization Guideline's own three granular sub-liabilities (herdemlaw.com's primary-text-grounded 2011-vs-2022 comparison): YS/SME work share >=21% of contract value, EYDEP-accredited work share >=70%, TUK technology-acquisition liability >=2% of bid value -- the conflicting mondaq.com "70% of bid amount" headline figure is deliberately NOT modeled (disclosed, unreconciled)
  | 'uk-below-threshold-reservation' // UK type 3 (new, Part 2 continuation): PPN 005 below-threshold reservation gate (category-eligibility-gate) -- the module's default/only mechanism for the UK, which structurally cannot run an above-threshold price preference (PA23 s.90 non-discrimination duty)
  | 'usa-buy-american-price-preference' // USA type 4 (new, Part 2 continuation): FAR Subpart 25.1/25.2 Buy American Act binary-threshold price preference -- the module's default/original mechanism for the USA
  | 'usa-baba-infrastructure-gate'      // USA type 3 (new, Part 2 continuation): Build America, Buy America Act (BABA, IIJA Title IX) federally-funded-infrastructure domestic-content category eligibility gate
  | 'usa-sba-small-business-setaside'   // USA type 5 (new, Part 2 continuation): SBA/FAR Part 19 small-business federal-contracting goal (23%) + Rule of Two set-aside
  | 'usa-berry-amendment-dod'           // USA type 3-ish (resolved 29 Sep 2026 verify-then-extend pass, was not-yet-sourced Part 2 continuation): Berry Amendment (10 U.S.C. 4862) DoD textiles/food/hand-tools domestic-sourcing mandate -- reuses category-eligibility-gate (the underlying rule is binary -- near-100% domestic, no partial credit -- once Berry-covered, the same "ask the caller for the post-exception outcome" shape already used for BABA's waiver toggle, zero new compute code)
  | 'cn-domestic-product-price-preference'    // CN type 4 (new, 16 Sep 2026 China Part 2 continuation): State Council Doc [2025] No. 34 (国办发〔2025〕34号) 20% price-evaluation deduction, OR-gated eligibility (first OR-gate shape in this file) -- the module's default/original mechanism for China
  | 'cn-govt-procurement-law-domestic-mandate' // CN type 3: Government Procurement Law (中华人民共和国政府采购法, 2002, last amended 2014) Article 10 domestic-purchase-by-default mandate -- zero-new-logic reuse of computeCategoryEligibilityGate
  | 'cn-sme-price-deduction'            // CN type 4 (genuinely new mechanism): 财库〔2020〕46号 / 财库〔2022〕19号 SME price-evaluation deduction, banded by bidder role AND procurement type together, gated by a real 30% consortium small-enterprise subcontract-share threshold
  | 'cn-defense-domestic-sourcing'     // CN type 6-ish: PLA/military-civil fusion (军民融合) defense-procurement domestic-sourcing mandate -- not-yet-sourced (no single clean numeric threshold found), structurally similar to the Berry Amendment above
  | 'in-make-in-india-price-preference' // IN type 4 (17 Sep 2026, 13th country, India/Germany/Japan/Korea batch): Public Procurement (Preference to Make in India) Order 2017, as revised 4 Jun 2020 -- Class-I (>=50% local content)/Class-II (20-<50%)/Non-local (<=20%) classification feeding a real 20% margin-of-purchase-preference right-to-match-L1 -- the module's default/original mechanism for India
  | 'in-dap-2020-defense-offset'          // IN: RESOLVED 1 Oct 2026 (Module 08 twelve-gap closure pass) -- Defence Acquisition Procedure (DAP) 2020, Buy (Global): 30%-of-contract-value offset obligation above the INR 2000-crore trigger, dischargeable via a real, two-source-corroborated avenue-multiplier table
  | 'de-eu-gpa-non-discrimination-baseline' // DE: not-yet-sourced -- confirmed ABSENT, not merely unresearched (see sourceNoteEn): Germany, as an EU member and WTO GPA party, has no unilateral local-content price-preference or set-aside mechanism in general civil public procurement -- the module's default/original mechanism for Germany
  | 'de-edip-defense-local-content'         // DE: RESOLVED 1 Oct 2026 (Module 08 twelve-gap closure pass) -- European Defence Industry Programme (EDIP Regulation (EU) 2025/2643, in force 30 Dec 2025) single 65% EU/associated-content threshold gate
  | 'jp-kankoju-sme-target-ratio'           // JP type 5: Act on Ensuring Receipt of Orders from the Government and Other Public Agencies by SMEs (官公需法, 1966) -- annual Cabinet-decided Basic Policy (基本方針) sets a fiscal-year SME procurement target ratio, NOT a fixed statutory percentage -- the module's default/only mechanism for Japan, genuinely different from JO/BH/KW's fixed-constant spend-set-aside wrappers because the target itself must be caller-supplied per fiscal year, not hardcoded
  | 'kr-sme-purchase-target-ratio'          // KR type 5: Act on Facilitation of Purchase of Small and Medium Enterprise-Manufactured Products and Support for Their Marketing (중소기업제품 구매촉진 및 판로지원에 관한 법률), Article 5 -- >=50% overall SME product purchase target, >=15% technology-development-product sub-target -- a genuinely new 2-way category selector, the module's default mechanism for Korea
  | 'kr-sme-competitive-products-gate'     // KR type 3: Act on Facilitation of Purchase of Small and Medium Enterprise-Manufactured Products and Support for Their Marketing (중소기업제품 구매촉진 및 판로지원에 관한 법률), Arts. 4/8/9 -- the SAME act as 'kr-sme-purchase-target-ratio' above, a different set of articles within it, not a separate statute -- SME-exclusive competitive-bidding category-eligibility gate (213 products / 632 subcategories, 2022-2024 designation cycle) -- legitimate thin-wrapper reuse of computeCategoryEligibilityGate (structurally identical binary AND-gate to SA Mandatory List / OM PTLC)
  | 'bh-bahrainisation-tender-workforce';  // BH: RESOLVED 2 Oct 2026 (Module 08 nine-program closure pass) -- genuinely distinct WORKFORCE-nationality gate (not a goods/local-content mechanism) sourced from Bahrain's Parliament-approved 20% Bahrainisation rule for government tender bidders (lexis.ae, 20 Nov 2024 approval) -- see PROGRAMS['bh-bahrainisation-tender-workforce'].sourceNoteEn for the disclosed gap between that Parliament-approved figure and the Tender Board's own Nov 2025 Guideline, which requires a certificate but delegates the exact percentage to separate Ministry of Labour regulations

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
  IN: 'in-make-in-india-price-preference', DE: 'de-eu-gpa-non-discrimination-baseline',
  JP: 'jp-kankoju-sme-target-ratio', KR: 'kr-sme-purchase-target-ratio',
};

/** Every program that exists for a given country, in display order -- used
 * by the UI to render the routing-question button row whenever a country
 * has more than one. As of the 15 Sep 2026 Part-1-continuation pass, every
 * country now has more than one program -- the routing question is no
 * longer an SA/AE-only UI affordance. */
export const PROGRAMS_BY_COUNTRY: Record<LocalContentCountry, LocalContentProgram[]> = {
  SA: ['sa-lcgpa-general', 'sa-mandatory-list', 'sa-price-preference', 'sa-iktva-aramco', 'sa-gami-defense', 'sa-likt', 'sa-economic-participation-policy', 'sa-rawafed-stc', 'sa-sabic-lc-commitment', 'sa-tharwah-maaden'],
  AE: ['ae-icv-general', 'ae-tawazun-offset', 'ae-gcc-origin-treatment'],
  JO: ['jo-price-preference', 'jo-contractor-quota'],
  OM: ['om-icv', 'om-mandatory-list', 'om-oq-price-preference'],
  QA: ['qa-national-strategy', 'qa-icv-tawteen', 'qa-tenders-icv'],
  BH: ['bh-local-content', 'bh-sme-price-preference', 'bh-sme-spend-setaside', 'bh-takamul-local-value', 'bh-gulf-made-preference', 'bh-bahrainisation-tender-workforce'],
  KW: ['kw-local-content', 'kw-kpc-local-spend', 'kw-tender-law-price-preference', 'kw-nationality-price-preference'],
  EG: ['eg-price-preference', 'eg-oil-gas-price-preference', 'eg-auto-local-content'],
  TR: ['tr-price-preference', 'tr-defense-offset'],
  UK: ['uk-below-threshold-reservation'],
  USA: ['usa-buy-american-price-preference', 'usa-baba-infrastructure-gate', 'usa-sba-small-business-setaside', 'usa-berry-amendment-dod'],
  CN: ['cn-domestic-product-price-preference', 'cn-govt-procurement-law-domestic-mandate', 'cn-sme-price-deduction', 'cn-defense-domestic-sourcing'],
  IN: ['in-make-in-india-price-preference', 'in-dap-2020-defense-offset'],
  DE: ['de-eu-gpa-non-discrimination-baseline', 'de-edip-defense-local-content'],
  JP: ['jp-kankoju-sme-target-ratio'],
  KR: ['kr-sme-purchase-target-ratio', 'kr-sme-competitive-products-gate'],
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
  | 'commitment-deviation-gate' // (new, 18 Sep 2026) SABIC per-contract local-content commitment gate -- a covenant-compliance check against a per-contract negotiated target, NOT a published SABIC-wide standard (see PROGRAMS['sa-sabic-lc-commitment'].sourceNoteEn)
  | 'gcc-origin-national-treatment-gate' // (new, 20 Sep 2026) UAE GCC Unified Economic Agreement Article 3 rules-of-origin eligibility gate -- see PROGRAMS['ae-gcc-origin-treatment'].sourceNoteEn for the full sourcing and the disclosed treaty-vs-operationalization gap
  | 'production-incentive-eligibility-gate' // (new, 1 Oct 2026) Egypt AIDP/National Automotive Program incentive-eligibility gate -- see PROGRAMS['eg-auto-local-content'].sourceNoteEn; deliberately a gate on incentive ELIGIBILITY, not the incentive AMOUNT (disclosed as unreconciled)
  | 'dual-local-sourcing-gate'  // (new, 1 Oct 2026 -- Module 08 twelve-gap closure pass) Kuwait Public Tenders Law No. 49/2016 Art. 87 -- two independent 30% thresholds (local materials/goods share, local works share), both real and sourced via Al Tamimi's own primary-text-sourced legal summary; see PROGRAMS['kw-local-content'].sourceNoteEn
  | 'offset-multiplier-credit-gate' // (new, 1 Oct 2026 -- Module 08 twelve-gap closure pass) India DAP 2020 Buy (Global) offset obligation -- a 30%-of-contract-value offset liability dischargeable via a real, two-source-corroborated avenue-multiplier table (1.0/0.5/1.5/2.0/3.0/4.0), multipliers not clubbable; see PROGRAMS['in-dap-2020-defense-offset'].sourceNoteEn
  | 'eu-content-threshold-gate' // (new, 1 Oct 2026 -- Module 08 twelve-gap closure pass) Germany/EU EDIP Regulation (EU) 2025/2643 -- a single 65% EU/associated-country content threshold (35% non-EU cap) for co-funding eligibility; see PROGRAMS['de-edip-defense-local-content'].sourceNoteEn
  | 'gami-valuation-factor-credit-gate' // (new, 2 Oct 2026 -- Module 08 nine-program closure pass) Saudi GAMI Industrial Participation Policy -- 60%-of-contract-value commitment above SAR 150M, discharged via a per-category Valuation Factor credit, 10% Performance Security, disclosed liquidation formula; see PROGRAMS['sa-gami-defense'].sourceNoteEn
  | 'industrialization-liability-gate' // (new, 2 Oct 2026 -- Module 08 nine-program closure pass) Turkey SSB 2022 Industrialization Guideline -- three independent sub-liabilities (YS/SME work share >=21%, EYDEP work share >=70%, TUK tech-acquisition >=2% of bid value); see PROGRAMS['tr-defense-offset'].sourceNoteEn
  | 'percentage-threshold-gate' // (new, 2 Oct 2026 -- Module 08 nine-program closure pass) a fully generic single-percentage-threshold gate -- first use is Bahrain's Parliament-approved 20% Bahrainisation workforce rule for tender bidders; see PROGRAMS['bh-bahrainisation-tender-workforce'].sourceNoteEn
  | 'import-value-participation-gate' // (new, 2 Oct 2026 -- SA-LIKT/EP-Policy + BH circular pass) LCGPA's own 2023 Economic Participation (EP) Policy -- 35%-of-imported-content-value commitment above a SAR 100M imported-goods/services trigger, discharged via a 7-category Valuation Factor credit; see PROGRAMS['sa-economic-participation-policy'].sourceNoteEn. Genuinely distinct from GAMI's gate: the percentage base is imported-content value (not contract value), there is no SME/sole-source bonus, and no liquidation/performance-security formula is sourced for this program, so only meetsCommitment/shortfall is computed, never a penalty amount.
  | 'not-yet-sourced';          // Oman general ICV / Qatar National Local Content Strategy / Bahrain general (goods) framework / Saudi LIKT / China PLA-specific defense domestic-sourcing threshold

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

const SA_PROGRAMS: Record<'sa-lcgpa-general' | 'sa-mandatory-list' | 'sa-price-preference' | 'sa-iktva-aramco' | 'sa-gami-defense' | 'sa-likt' | 'sa-economic-participation-policy' | 'sa-rawafed-stc' | 'sa-sabic-lc-commitment' | 'sa-tharwah-maaden', CountryFrameworkInfo> = {
  'sa-lcgpa-general': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Local Content (general score)', programNameAr: 'المحتوى المحلي العام (هيئة المحتوى المحلي والمشتريات الحكومية)',
    mechanismType: 'eligible-spend-ratio', program: 'sa-lcgpa-general',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA Guide G1 (Version 5.0, 15 Nov 2022): baseline score = locally-eligible spend / total spend across 4 pillars. Government procurement is directly covered; extended June 2022 to entities >=50% state-owned. No sourced evidence this governs private-to-private commercial contracts. Last verified date not recorded.',
    sourceNoteAr: 'دليل هيئة المحتوى المحلي والمشتريات الحكومية ⁦G1⁩ (الإصدار ٥.٠، ١٥ نوفمبر ٢٠٢٢): الدرجة الأساسية = الإنفاق المؤهل محلياً ÷ إجمالي الإنفاق عبر أربعة أركان. تشمل مباشرة المشتريات الحكومية، ووُسِّع نطاقها في يونيو ٢٠٢٢ ليغطي الجهات المملوكة للدولة بنسبة ٥٠٪ فأكثر. لا يوجد دليل موثّق على سريانها على العقود التجارية بين القطاع الخاص فقط. لم يُسجَّل تاريخ آخر مراجعة.',
    usageNotesEn: [
      'LCGPA\'s own official Local Content Mechanisms page (lcgpa.gov.sa) states that for high-value government contracts (excluding sourcing contracts), technical/commercial evaluation weighs local content at 40% against 60% price, plus a bonus for Tadawul-listed companies. This is the SAME general score above being used in a specific evaluation weighting -- not a separate score to compute.',
      'A separately-cited figure (attributed to SPA, Saudi Press Agency) describes a ~30%, phased local-content weighting specific to consulting/IT-sector bid evaluation. This research pass could not confirm with full confidence whether this is the same 40% high-value-contract rule described differently, or a genuinely separate sector-specific rule -- spa.gov.sa returned 403 on every direct verification attempt. Disclosed as an open item, not resolved by assumption.',
    ],
    usageNotesAr: [
      'تذكر الصفحة الرسمية لآليات المحتوى المحلي التابعة لهيئة المحتوى المحلي والمشتريات الحكومية (lcgpa.gov.sa) أن التقييم الفني/التجاري للعقود الحكومية عالية القيمة (باستثناء عقود التوريد) يمنح المحتوى المحلي وزناً ٤٠٪ مقابل ٦٠٪ للسعر، إضافة إلى ميزة إضافية للشركات المدرجة في تداول. هذه هي نفس الدرجة العامة أعلاه تُستخدم ضمن ترجيح تقييم محدد — وليست درجة منفصلة يجب حسابها.',
      'يشير رقم آخر منسوب إلى وكالة الأنباء السعودية (واس) إلى ترجيح محتوى محلي يقارب ٣٠٪، متدرّج زمنياً، خاص بتقييم عطاءات قطاعي الاستشارات وتقنية المعلومات. لم يتمكن هذا البحث من التأكد بثقة كاملة مما إذا كانت هذه نفس قاعدة الـ٤٠٪ للعقود عالية القيمة موصوفة بصياغة مختلفة، أو قاعدة قطاعية منفصلة فعلاً — إذ أعاد موقع spa.gov.sa خطأ ٤٠٣ في كل محاولة تحقق مباشرة. يُفصَح عن هذه النقطة كمسألة مفتوحة، دون حسمها بافتراض.',
    ],
  },
  'sa-mandatory-list': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Mandatory List (category eligibility gate)', programNameAr: 'القائمة الإلزامية لهيئة المحتوى المحلي (بوابة أهلية الفئة)',
    mechanismType: 'category-eligibility-gate', program: 'sa-mandatory-list',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA\'s official Local Content Mechanisms page lists a Mandatory List of 233+ products/services where government entities MUST procure from LCGPA-certified local sources -- a pass/fail bidding gate for the listed categories, not a percentage score. No single sourced percentage threshold applies here; eligibility is binary (in-list + certified, or not). Last verified date not recorded.',
    sourceNoteAr: 'تُدرج الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة قائمة إلزامية تضم أكثر من ٢٣٣ منتجاً وخدمة يتوجب على الجهات الحكومية شراءها من مصادر محلية معتمدة من الهيئة فقط — بوابة ثنائية (نجاح/فشل) للفئات المدرجة، وليست درجة نسبية. لا تنطبق هنا نسبة مئوية موثّقة واحدة؛ الأهلية ثنائية (مدرج ومعتمد، أو لا). لم يُسجَّل تاريخ آخر مراجعة.',
  },
  'sa-price-preference': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA National Product Price Preference', programNameAr: 'تفضيل سعر المنتج الوطني (هيئة المحتوى المحلي)',
    mechanismType: 'price-preference-margin', program: 'sa-price-preference',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'LCGPA\'s official Local Content Mechanisms page states a 10% price preference is added to foreign products when compared against qualifying national products in government tenders -- structurally identical to Jordan\'s price-preference mechanism (a bid-evaluation adjustment, not a local-content percentage score), reusing the same computation shape. Last verified date not recorded.',
    sourceNoteAr: 'تنص الصفحة الرسمية لآليات المحتوى المحلي التابعة للهيئة على إضافة تفضيل سعري بنسبة ١٠٪ للمنتجات الأجنبية عند مقارنتها بالمنتجات الوطنية المؤهلة في المناقصات الحكومية — آلية مطابقة من حيث البنية لآلية التفضيل السعري الأردنية (تعديل في تقييم العطاء، وليست درجة نسبة محتوى محلي)، وتُستخدم نفس بنية الحساب. لم يُسجَّل تاريخ آخر مراجعة.',
  },
  'sa-iktva-aramco': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'Aramco IKTVA (In-Kingdom Total Value Add)', programNameAr: 'برنامج أرامكو لإجمالي القيمة المضافة داخل المملكة (اكتفاء)',
    mechanismType: 'anchor-buyer-score', program: 'sa-iktva-aramco',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'Aramco\'s own official "2021 iktva Guideline v13" (iktva.sa): iktva% = ((A+B+C+D+R)/E) + I, where A = local goods/services spend + local asset depreciation + Saudi-based expatriate compensation, B = Saudi workforce compensation, C = training & development spend, D = supplier development spend, R = local R&D spend, E = total costs (denominator), I = incentive bonuses (export ratio, ESG/cybersecurity/regional-HQ bonuses). This is Aramco\'s OWN separate anchor-buyer program, distinct from the LCGPA general government score -- a real, computable formula, not a guessed one. Simplification disclosed: the I bonus component is modeled here as a single optional bonus-points input (0-10, caller-supplied) rather than the full tiered export-ratio/ESG sub-formula -- directional only, not a substitute for Aramco\'s own certified iktva calculation. Last verified date not recorded.',
    sourceNoteAr: 'دليل أرامكو الرسمي "⁦iktva Guideline v13⁩ لعام ٢٠٢١" (iktva.sa): نسبة اكتفاء = ((A+B+C+D+R)/E) + I، حيث A = إنفاق السلع/الخدمات المحلية + إهلاك الأصول المحلية + تعويضات العمالة الوافدة المقيمة في السعودية، B = تعويضات القوى العاملة السعودية، C = إنفاق التدريب والتطوير، D = إنفاق تطوير الموردين، R = إنفاق البحث والتطوير المحلي، E = إجمالي التكاليف (المقام)، I = مكافآت تحفيزية (نسبة التصدير، مكافآت الاستدامة/الأمن السيبراني/المقر الإقليمي). هذا برنامج أرامكو الخاص بها كمشترٍ رئيسي، منفصل عن الدرجة الحكومية العامة لهيئة المحتوى المحلي — صيغة حقيقية قابلة للحساب، وليست مخمّنة. تبسيط مُفصَح عنه: تُمثَّل مكافأة I هنا كمُدخل نقاط مكافأة اختياري واحد (٠-١٠، يُدخله المستخدم) بدلاً من الصيغة الفرعية الكاملة المتدرجة لنسبة التصدير/الاستدامة — توجيهي فقط، وليس بديلاً عن حساب اكتفاء المعتمد من أرامكو نفسها. لم يُسجَّل تاريخ آخر مراجعة.',
  },
  'sa-gami-defense': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'GAMI Industrial Participation (Defense Localization)', programNameAr: 'المشاركة الصناعية الدفاعية (الهيئة العامة للصناعات العسكرية)',
    mechanismType: 'gami-valuation-factor-credit-gate', program: 'sa-gami-defense',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: Saudi military contracts worth SAR 150 million or more carry a minimum Industrial Participation commitment of 60% of contract value, confirmed directly from GAMI's own Industrial Participation Policy PDF (Version 1.0, 15 Sep 2019 AD). This is discharged through a credit system across two categories — Localization (factors 1.0-2.0, plus bonuses for SME or sole-source suppliers) and Capability Development (factors 1.0-5.0) — with a 10% performance security that GAMI can partially or fully liquidate on shortfall. This models a single discharge line item against that commitment; GAMI's own multi-year credit-banking and bonus-credit systems are real but not aggregated across contracts here. Last checked 2 Oct 2026, against GAMI's own PDF. Confirm your specific contract's category and credit calculation with GAMI directly.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: تحمل العقود العسكرية السعودية التي تبلغ قيمتها ١٥٠ مليون ريال أو أكثر التزاماً أدنى بمشاركة صناعية تبلغ ٦٠٪ من قيمة العقد، وهو مؤكَّد مباشرة من وثيقة سياسة المشاركة الصناعية الرسمية للهيئة العامة للصناعات العسكرية (GAMI) (الإصدار ١.٠، ١٥ سبتمبر ٢٠١٩م). ويُستوفى هذا عبر نظام ائتمان ضمن فئتين — التوطين (عوامل ١.٠-٢.٠، مع مكافآت للمنشآت الصغيرة والمتوسطة أو المصدر الوحيد) وتنمية القدرات (عوامل ١.٠-٥.٠) — مع ضمان أداء بنسبة ١٠٪ يمكن للهيئة تصفيته جزئياً أو كلياً عند التقصير. وتُحتسب هذه الآلية كبند صرف واحد مقابل هذا الالتزام؛ أما أنظمة ترحيل الائتمان متعددة السنوات والائتمان التحفيزي الخاصة بالهيئة فهي حقيقية لكنها لا تُجمَع عبر عقود متعددة هنا. تاريخ آخر مراجعة: ٢ أكتوبر ٢٠٢٦، بالرجوع إلى وثيقة الهيئة الرسمية. يُفضَّل تأكيد فئة عقدك المحدد وحساب الائتمان مباشرة مع الهيئة.",
  },
  'sa-likt': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LIKT (Localization of Industry & Knowledge Transfer)', programNameAr: 'برنامج توطين الصناعة ونقل المعرفة (LIKT)',
    mechanismType: 'not-yet-sourced', program: 'sa-likt',
    applicableContexts: [],
    sourceNoteEn: "No published eligibility threshold or scoring formula exists for LIKT, so this program is shown for reference and is not calculated. LCGPA names LIKT (Localization of Industry & Knowledge Transfer) as its own mechanism for collaborating with global investors and technology leaders on targeted industries, activated in 2021 as a contracting method run through sector-specific government-to-industry agreements. No eligibility threshold, contract-value figure, or scoring formula has been published for LIKT itself. A SAR 100 million figure sometimes mentioned elsewhere actually belongs to a different, separately-modeled LCGPA program (its Economic Participation Policy), not LIKT. Last checked 2 Oct 2026 against LCGPA's own website, lcgpa.gov.sa. Ask your LCGPA contact or the tender authority directly for LIKT's current eligibility criteria before relying on this program.",
    sourceNoteAr: "لا توجد عتبة أهلية أو صيغة احتساب منشورة لبرنامج \"LIKT\"، ولذلك يُعرض هذا البرنامج للاطلاع فقط ولا يُحتسب. تُسمّي هيئة المحتوى المحلي والمشتريات الحكومية (LCGPA) برنامج \"LIKT\" (توطين الصناعة ونقل المعرفة) كآلية مستقلة للتعاون مع مستثمرين عالميين وشركات تقنية رائدة لتوطين صناعات مستهدفة، فُعِّل عام ٢٠٢١ كطريقة تعاقد تُدار عبر اتفاقيات قطاعية بين الجهات الحكومية والقطاع الصناعي. لم تُنشر عتبة أهلية أو قيمة عقد بالريال أو صيغة احتساب خاصة بـLIKT نفسه. ويُذكر أحياناً رقم \"١٠٠ مليون ريال\" لكنه يخص في الواقع برنامجاً آخر لدى الهيئة (سياسة المشاركة الاقتصادية)، وليس LIKT. تاريخ آخر مراجعة: ٢ أكتوبر ٢٠٢٦، بالرجوع مباشرة إلى موقع الهيئة الرسمي lcgpa.gov.sa. يُفضَّل التواصل مع جهة الاتصال لدى الهيئة أو جهة المناقصة للحصول على معايير أهلية LIKT الحالية قبل الاعتماد على هذا البرنامج.",
  },
  'sa-economic-participation-policy': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'LCGPA Economic Participation (EP) Policy', programNameAr: 'سياسة المشاركة الاقتصادية (هيئة المحتوى المحلي والمشتريات الحكومية)',
    mechanismType: 'import-value-participation-gate', program: 'sa-economic-participation-policy',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: Saudi government contracts where imported goods/services exceed SAR 100 million trigger a minimum Economic Participation requirement of 35% of that imported value, confirmed by a law-firm analysis (DGA Group, 3 Jul 2023) and corroborated by Global Trade Alert. Bidders submit a proposal with their bid and sign the commitment within 30 days of winning, discharged through activities each carrying its own multiplier (subcontracting = 1.0x; localization = 0.5x-2.0x; knowledge/technology transfer = 0.5x-3.0x; investment = 1.0x-3.0x; R&D = 3.0x fixed). No published penalty formula exists for shortfalls under this policy. An updated, lower, tiered version is in public consultation but not yet in force. Last checked 2 Oct 2026. Submit your Economic Participation proposal with your bid.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: تحمل العقود الحكومية السعودية التي تتجاوز فيها قيمة السلع/الخدمات المستوردة ١٠٠ مليون ريال حداً أدنى لمتطلب المشاركة الاقتصادية يبلغ ٣٥٪ من قيمة ذلك المحتوى المستورد، وهو مؤكَّد بتحليل قانوني (مجموعة DGA، ٣ يوليو ٢٠٢٣) ومؤكَّد من Global Trade Alert. ويقدّم المتنافسون مقترحاً مع عطائهم ويوقّعون الالتزام خلال ٣٠ يوماً من الترسية، يُستوفى عبر أنشطة لكل منها عامل مضاعِف خاص (تعاقد من الباطن = ١.٠×؛ توطين = ٠.٥×-٢.٠×؛ نقل معرفة/تقنية = ٠.٥×-٣.٠×؛ استثمار = ١.٠×-٣.٠×؛ بحث وتطوير = ٣.٠× ثابت). ولا توجد صيغة غرامة منشورة للنقص بموجب هذه السياسة. وتوجد نسخة محدَّثة أقل ومتدرجة قيد التشاور العام ولم تدخل حيز النفاذ بعد. تاريخ آخر مراجعة: ٢ أكتوبر ٢٠٢٦. يُفضَّل تقديم مقترح المشاركة الاقتصادية مع عطائك.",
  },
  'sa-rawafed-stc': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'stc Rawafed Local Content Program', programNameAr: 'برنامج روافد لتنمية المحتوى المحلي (stc)',
    mechanismType: 'eligible-spend-ratio', program: 'sa-rawafed-stc',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'This program is calculated: stc\'s own Rawafed Program Annual Report (2021) publishes an explicit local-content formula — local content % = (local goods/services + local salaries + local asset depreciation + local capacity development) ÷ the same four totals — the same four-pillar ratio shape as LCGPA\'s general score, reused here rather than duplicated. Rawafed launched in 2018 as part of Vision 2030; stc, itself a majority state/PIF-linked entity, applied it to roughly SAR 16 billion of large project procurement. No sourced evidence this applies to private-commercial (non-stc) buyers. Last checked 22 Oct 2026, against stc\'s own published Annual Report. Confirm with stc\'s own procurement team whether Rawafed\'s formula applies to your specific contract.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: ينشر تقرير شركة stc السنوي لبرنامج روافد (٢٠٢١) صيغة صريحة لاحتساب نسبة المحتوى المحلي = (السلع والخدمات المحلية + الرواتب المحلية + استهلاك الأصول المحلية + تطوير القدرات المحلية) ÷ مجموع البنود نفسها على مستوى الشركة — وهي نفس بنية الأركان الأربعة المستخدمة في الدرجة العامة لهيئة المحتوى المحلي (LCGPA). أُطلق روافد عام ٢٠١٨ ضمن رؤية ٢٠٣٠؛ وطبّقته stc، وهي كيان مملوك بأغلبية حكومية/لصندوق الاستثمارات العامة، على نحو ١٦ مليار ريال من مشتريات المشاريع الكبرى. لا يوجد دليل مصدري على انطباقه على مشترين من القطاع الخاص غير stc. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦، بالرجوع إلى تقرير stc السنوي المنشور. يُفضَّل التأكد من فريق مشتريات stc من انطباق صيغة روافد على عقدك تحديداً.',
  },
  'sa-sabic-lc-commitment': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: 'SABIC Local Content Commitment Gate', programNameAr: 'بوابة التزام المحتوى المحلي (سابك)',
    mechanismType: 'commitment-deviation-gate', program: 'sa-sabic-lc-commitment',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'This is NOT a published SABIC-wide local-content standard: no public company-wide percentage target exists. SABIC\'s actual practice, confirmed directly by the platform owner, is a per-contract negotiated local-content commitment — each supplier contract states its own target, audited against actual delivered local content. This platform models that as a covenant-compliance gate: deviationPct = proposedTargetPct − actualAuditedPct, tested against a 5-percentage-point tolerance and a penalty capped at 1% of contract value — both of these are this platform\'s own business-rule defaults, not a published SABIC or third-party standard. SABIC is a majority Saudi-government/PIF-owned entity, modeled as a semi-government buyer like Aramco and stc. Last checked 22 Oct 2026. Confirm your own contract\'s specific target percentage and tolerance with SABIC\'s procurement team.',
    sourceNoteAr: 'هذا ليس معياراً معلناً على مستوى سابك للمحتوى المحلي: لا يوجد هدف نسبي منشور على مستوى الشركة بأكملها. الممارسة الفعلية لسابك، المؤكَّدة مباشرة من مالك المنصة نفسه، هي التزام محتوى محلي يُتفاوَض عليه لكل عقد على حدة — إذ ينص كل عقد مع مورّد على هدفه الخاص، ويُدقَّق مقابل المحتوى المحلي المسلَّم فعلياً. تُحتسب هذه الآلية كبوابة امتثال تعاقدي: نسبة الانحراف = النسبة المستهدفة المقترحة − النسبة المدقَّقة فعلياً، تُختبر مقابل هامش سماح قدره ٥ نقاط مئوية وغرامة سقفها ١٪ من قيمة العقد — وكلاهما افتراضان خاصان بهذه المنصة نفسها، وليسا معياراً منشوراً من سابك أو جهة أخرى. سابك كيان مملوك بأغلبية حكومية/لصندوق الاستثمارات العامة، ويُعامَل كمشترٍ شبه حكومي مثل أرامكو وstc. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد نسبة عقدك وهامش السماح مع فريق مشتريات سابك.',
  },
  'sa-tharwah-maaden': {
    country: 'SA', countryNameEn: 'Saudi Arabia', countryNameAr: 'المملكة العربية السعودية',
    programNameEn: "Tharwah (Ma'aden Local Content Program)", programNameAr: 'برنامج ثروة لتنمية المحتوى المحلي (معادن)',
    mechanismType: 'not-yet-sourced', program: 'sa-tharwah-maaden',
    applicableContexts: [],
    sourceNoteEn: "No published per-supplier scoring formula exists for Tharwah, so this program is shown for reference and is not calculated. Ma'aden's own site (maaden.com/tharwah) describes five goals (Saudi employment, local-business participation, SME support, regional development, mining-industry integration) delivered through a supplier portal and an opportunities catalog of 16+ categories, not a scoring methodology. Figures sometimes cited (SAR 55bn planned spend by 2040, SAR 33bn local-content contribution, up to 47,000 jobs, a $110bn investment plan, and a 19-month LCGPA certificate validity) are secondary-source, not confirmed against Ma'aden's own materials, and are company-level targets, not supplier qualification criteria. A scoring method could exist behind Ma'aden's login-gated supplier portal, which this platform cannot check. Last checked 20 Oct 2026. Register on Ma'aden's supplier portal and ask your Tharwah contact directly for qualification criteria.",
    sourceNoteAr: "لا توجد صيغة احتساب منشورة على مستوى المورّد لبرنامج \"ثروة\"، ولذلك يُعرض هذا البرنامج للاطلاع فقط ولا يُحتسب. يصف موقع معادن الرسمي (maaden.com/tharwah) خمسة أهداف (التوطين الوظيفي، مشاركة الأعمال المحلية، دعم المنشآت الصغيرة والمتوسطة، تنمية المناطق، وتكامل صناعة التعدين) تُنفَّذ عبر بوابة موردين وكتالوج فرص يضم أكثر من ١٦ فئة، دون منهجية احتساب. الأرقام التي تُذكر أحياناً (إنفاق مخطط ٥٥ مليار ريال بحلول ٢٠٤٠، ومساهمة محتوى محلي ٣٣ مليار ريال، وحتى ٤٧ ألف وظيفة، وخطة استثمار بقيمة ١١٠ مليارات دولار، وصلاحية شهادة الهيئة لمدة ١٩ شهراً) مصدرها ثانوي وغير مؤكَّد من مواد معادن نفسها، وهي أهداف على مستوى الشركة لا معايير تأهيل للموردين. قد توجد منهجية احتساب خلف بوابة معادن المحمية بتسجيل دخول، وهو ما لا يمكن لهذه المنصة فحصه. تاريخ آخر مراجعة: ٢٠ أكتوبر ٢٠٢٦. يُفضَّل التسجيل في بوابة موردي معادن والتواصل مباشرة مع جهة الاتصال الخاصة بثروة لمعرفة معايير التأهل.",
  },
};

// ---------------------------------------------------------------------------
// Section 1c — UAE: 2 programs (ae-icv-general + ae-tawazun-offset). See
// file header's "AE TAWAZUN SOURCING" section for the full sourcing.
// ---------------------------------------------------------------------------

const AE_PROGRAMS: Record<'ae-icv-general' | 'ae-tawazun-offset' | 'ae-gcc-origin-treatment', CountryFrameworkInfo> = {
  'ae-icv-general': {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'National In-Country Value (ICV)', programNameAr: 'برنامج القيمة الوطنية المضافة (ICV)',
    mechanismType: 'weighted-pillar-score', program: 'ae-icv-general',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'This program is calculated: MoIAT\'s National ICV Program (unified with ADNOC\'s original program) scores a weighted formula across Manufacturing/Third-Party Spend, Investment, Emiratisation, and Expatriate Contribution, plus capped bonus categories, audited by a MoIAT-authorized firm with 14-month certificate validity. It applies to public spending and "Program Partner" (government/semi-government) tenders; no sourced evidence covers private-to-private bids. The formula below is a best-available reconstruction from public secondary sourcing, not a byte-verified transcription of MoIAT\'s own document — verify it before a real certification decision. MoIAT\'s own page confirms ICV is an INCENTIVE: certified suppliers gain an advantage in tender evaluation, not a mandatory bidding gate like Saudi\'s Mandatory List. Last checked 22 Oct 2026. Confirm your current score and formula with a MoIAT-authorized certifying body.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: يحتسب برنامج القيمة المحلية الوطني التابع لوزارة الصناعة والتكنولوجيا المتقدمة (MoIAT)، الموحَّد مع برنامج أدنوك الأصلي، درجة مرجَّحة عبر فئات التصنيع/الإنفاق مع أطراف ثالثة، الاستثمار، التوطين، مساهمة الموظفين الوافدين، وفئات مكافأة محدودة سقفاً، يدقِّقها مكتب معتمَد من MoIAT، بصلاحية ١٤ شهراً. ينطبق على الإنفاق الحكومي ومناقصات "الشركاء البرنامجيين" (حكومية/شبه حكومية)؛ ولا يوجد دليل مصدري على انطباقه بين شركات القطاع الخاص. الصيغة أدناه إعادة بناء من أفضل المصادر الثانوية المتاحة علنياً، وليست نسخة حرفية موثَّقة من وثيقة MoIAT نفسها — تحقق منها قبل اتخاذ قرار اعتماد فعلي. تؤكد صفحة MoIAT الرسمية أن شهادة القيمة المحلية تحفيزية: تمنح المورّدين ميزة تقييمية، وليست بوابة إلزامية كقائمة السعودية الإلزامية. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد درجتك الحالية مع جهة اعتماد معتمَدة من MoIAT.',
    usageNotesEn: [
      'Abu Dhabi\'s own Department of Economic Development (idb.added.gov.ae, its In-Country Value / ADLC FAQ page) states: "The ICV factor accounts for 40% of the financial evaluation" in Abu Dhabi tenders, and that a bidder who does not submit an ICV certificate receives zero points on that 40% -- a real, sourced, heavily-weighted incentive, though this is an Abu Dhabi emirate-level figure, not confirmed as the UAE-wide MoIAT figure (the national MoIAT page does not itself state a percentage). Per the brief\'s own precedent for this exact situation: this is "how the score gets used" by one specific evaluating entity, not a new mechanism -- shown here as a usage note on the existing general score.',
    ],
    usageNotesAr: [
      'تذكر دائرة التنمية الاقتصادية في أبوظبي (صفحة أسئلة القيمة المحلية/ADLC على idb.added.gov.ae): "يمثّل عامل القيمة المحلية ٤٠٪ من التقييم المالي" في مناقصات أبوظبي، وأن مقدّم العطاء الذي لا يقدّم شهادة ICV يحصل على صفر نقاط من هذه الـ٤٠٪ — حافز حقيقي وموثّق وذو وزن كبير، إلا أنه رقم على مستوى إمارة أبوظبي، وليس مؤكداً كرقم وطني موحّد لدى الوزارة (الصفحة الوطنية للوزارة لا تذكر نسبة بعينها). وفق سابقة الموجز نفسها لهذه الحالة تحديداً: هذا "كيفية استخدام الدرجة" من جهة تقييم واحدة محددة، وليس آلية جديدة — يُعرض هنا كملاحظة استخدام على الدرجة العامة القائمة.',
    ],
  },
  'ae-tawazun-offset': {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'Tawazun Economic Program (defense offset obligation)', programNameAr: 'البرنامج الاقتصادي توازن (التزام المقاصة الدفاعية)',
    mechanismType: 'offset-obligation-gate', program: 'ae-tawazun-offset',
    applicableContexts: ['government'],
    sourceNoteEn: 'This program is calculated: the Tawazun Economic Council\'s 2019 policy requires offset obligations on UAE Armed Forces / Abu Dhabi Police defense contracts worth USD 10 million or more (AED 36.73 million at the UAE\'s fixed 3.6725 peg). The offset-credit target is 60% of contract value; an end-of-period shortfall can be settled by paying 8.5% of the shortfall value, or rolled into a new project, and contractors post an 8.5% bank guarantee against their obligation. This is Tawazun\'s own defense-sector program — a different body, buyer, and legal basis from MoIAT\'s general ICV program above, not a variant of it. Last checked 22 Oct 2026, against Tawazun\'s own guidelines and trade.gov\'s UAE Defense Country Commercial Guide. Confirm your contract\'s offset obligations directly with the Tawazun Economic Council.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: تشترط سياسة مجلس توازن الاقتصادي لعام ٢٠١٩ التزامات تعويض (offset) على عقود القوات المسلحة الإماراتية/شرطة أبوظبي الدفاعية التي تبلغ قيمتها ١٠ ملايين دولار أمريكي أو أكثر (ما يعادل ٣٦.٧٣ مليون درهم بسعر الربط الثابت ٣.٦٧٢٥). هدف ائتمان التعويض ٦٠٪ من قيمة العقد؛ ويمكن تسوية أي عجز في نهاية فترة الأداء بدفع ٨.٥٪ من قيمة العجز، أو ترحيله إلى مشروع جديد، ويقدّم المقاولون ضماناً مصرفياً بنسبة ٨.٥٪ من التزامهم. هذا برنامج توازن الدفاعي الخاص — جهة وجمهور وأساس قانوني مختلف تماماً عن برنامج MoIAT العام للقيمة المحلية أعلاه، وليس نسخة منه. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦، بالرجوع إلى إرشادات توازن ودليل trade.gov الدفاعي للإمارات. يُفضَّل تأكيد التزامات التعويض الخاصة بعقدك مباشرة مع مجلس توازن الاقتصادي.',
  },
  'ae-gcc-origin-treatment': {
    country: 'AE', countryNameEn: 'United Arab Emirates', countryNameAr: 'دولة الإمارات العربية المتحدة',
    programNameEn: 'GCC Unified Economic Agreement -- National Treatment (Art. 3 Rules of Origin)', programNameAr: 'الاتفاقية الاقتصادية الموحدة لدول مجلس التعاون — المعاملة الوطنية (قواعد المنشأ، المادة ٣)',
    mechanismType: 'gcc-origin-national-treatment-gate', program: 'ae-gcc-origin-treatment',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'This program is calculated: under the GCC Unified Economic Agreement (in force since 1983), Article 3(1) requires at least 40% GCC in-region value-added AND at least 51% GCC-citizen ownership of the producing plant for a product to qualify as a \'national manufactured product\' — both conditions together. Saudi Arabia\'s gaft.gov.sa separately claims this gives GCC entities \'the same privileges as citizens in government procurement,\' but this platform could not independently verify that wording against a numbered article. Neither MoIAT\'s own ICV materials nor UAE\'s Federal Decree-Law No. 11 of 2023 (Articles 13(2)/22(2)) mentions GCC-origin treatment at all — a real, disclosed gap between treaty entitlement and confirmed domestic application. This models only the Article 3 eligibility test, not a guaranteed ICV-score uplift. Last checked 22 Oct 2026. Confirm actual procurement treatment with the contracting entity.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: بموجب الاتفاقية الاقتصادية الموحدة لدول مجلس التعاون الخليجي (سارية منذ ١٩٨٣)، تشترط المادة ٣(١) حداً أدنى ٤٠٪ قيمة مضافة خليجية داخل المنطقة، وحداً أدنى ٥١٪ ملكية خليجية الجنسية لمنشأة الإنتاج، معاً، ليُعتبر المنتج "منتجاً وطنياً مصنَّعاً". وتذكر الهيئة العامة للتجارة الخارجية السعودية (gaft.gov.sa) أن هذا يمنح الكيانات الخليجية "نفس امتيازات المواطنين في المشتريات الحكومية"، لكن هذه المنصة لم تتمكن من التحقق المستقل من هذه الصياغة مقابل مادة مرقَّمة من الاتفاقية. لا تذكر مواد MoIAT الخاصة بالقيمة المحلية ولا المرسوم بقانون اتحادي رقم ١١ لسنة ٢٠٢٣ (المادتان ١٣(٢) و٢٢(٢)) معاملة المنشأ الخليجي إطلاقاً — فجوة حقيقية ومُفصَح عنها بين الاستحقاق التعاهدي والتطبيق المؤكَّد فعلياً. يُحتسب هنا اختبار الأهلية بموجب المادة ٣ فقط، لا زيادة مضمونة على درجة MoIAT الفعلية. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد المعاملة الفعلية مع جهة التعاقد.',
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
  | 'qa-national-strategy' | 'qa-icv-tawteen' | 'qa-tenders-icv'
  | 'bh-local-content' | 'bh-sme-price-preference' | 'bh-sme-spend-setaside'
  | 'bh-takamul-local-value' | 'bh-gulf-made-preference' | 'bh-bahrainisation-tender-workforce'
  | 'kw-local-content' | 'kw-kpc-local-spend' | 'kw-tender-law-price-preference' | 'kw-nationality-price-preference',
  CountryFrameworkInfo
> = {
  'jo-price-preference': {
    country: 'JO', countryNameEn: 'Jordan', countryNameAr: 'المملكة الأردنية الهاشمية',
    programNameEn: 'National Industry Price Preference', programNameAr: 'تفضيل السعر للصناعة الوطنية',
    mechanismType: 'price-preference-margin', program: 'jo-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: a 20% price preference applies to locally-manufactured products in Jordanian government tenders, raised from a prior 15% and announced by Jordan's Minister of Industry, Trade & Supply (Petra, Jordan's state news agency, 8-9 Jun 2026). The legal basis is Government Procurement Bylaw No. 8 of 2022 (Article 8(a)(7) authorizes the preference; Article 15(b)(1) governs applying it to tied bids); the Bylaw itself does not fix the percentage, which is set separately by Cabinet decision and can change over time. This adjusts how bids are evaluated, not a company's own local-content percentage. Last checked 21 Sep 2026, against the Bylaw's own text and multiple official mirrors. Confirm the current preference rate with the procuring authority, since it has changed before.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُمنح تفضيل سعري بنسبة ٢٠٪ للمنتجات المصنَّعة محلياً في المناقصات الحكومية الأردنية، بعد رفعه من ١٥٪ سابقاً، بحسب إعلان وزير الصناعة والتجارة والتموين (وكالة بترا، ٨-٩ يونيو ٢٠٢٦). والسند القانوني هو نظام المشتريات الحكومية رقم ٨ لسنة ٢٠٢٢ (المادة ٨(أ)(٧) تُخوّل منح التفضيل، والمادة ١٥(ب)(١) تنظّم تطبيقه عند تعادل العروض)؛ والنظام نفسه لا يحدد النسبة، التي تُحدَّد بقرار منفصل من مجلس الوزراء ويمكن أن تتغيّر. ويُعدِّل هذا تقييم العروض، لا نسبة المحتوى المحلي للشركة نفسها. تاريخ آخر مراجعة: ٢١ سبتمبر ٢٠٢٦، بالرجوع إلى نص النظام نفسه وعدة مصادر رسمية. يُفضَّل تأكيد نسبة التفضيل الحالية مع جهة الشراء، فقد تغيّرت سابقاً.",
  },
  'jo-contractor-quota': {
    country: 'JO', countryNameEn: 'Jordan', countryNameAr: 'المملكة الأردنية الهاشمية',
    programNameEn: 'International Tender Contractor Quota', programNameAr: 'حصة المقاولين الأردنيين في المناقصات الدولية',
    mechanismType: 'spend-set-aside-target', program: 'jo-contractor-quota',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'This program is calculated: Jordan\'s Council of Ministers approved (7 May 2018) a minimum 35% quota for Jordanian contractors in international tenders for projects in Jordan, applying to ministries, public institutions, government-owned or government-shareholding companies, and private entities floating tenders to foreign contractors; it also required Jordanian consultants for design/supervision, and set a 20%-40% local-contractor quota for six named energy/environment projects. Framed under the 2018-2022 Economic Growth Plan, with a 5-percentage-point annual rise \'during the plan\'s timeframe.\' No primary-source reconfirmation exists beyond 2022, so this platform computes only against the disclosed 2018 base of 35%, never an extrapolated current figure. Last checked 22 Oct 2026, against Jordan Times\' reporting of the Cabinet decision. Confirm the current quota percentage with the contracting authority before relying on 35%.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: أقرّ مجلس الوزراء الأردني (٧ مايو ٢٠١٨) حصة دنيا ٣٥٪ للمقاولين الأردنيين في المناقصات الدولية للمشاريع المنفَّذة في الأردن، تشمل الوزارات والمؤسسات العامة والشركات المملوكة للحكومة أو التي تساهم فيها، والجهات الخاصة التي تطرح مناقصات لمقاولين أجانب؛ واشترط القرار أيضاً استشاريين أردنيين للتصميم والإشراف، وحدد حصة ٢٠٪-٤٠٪ لستة مشاريع طاقة وبيئة محدَّدة بالاسم. جاء هذا ضمن خطة النمو الاقتصادي ٢٠١٨-٢٠٢٢، مع ارتفاع سنوي بواقع ٥ نقاط مئوية "خلال الإطار الزمني" لتلك الخطة. لا يوجد تأكيد من مصدر أساسي لما بعد ٢٠٢٢، فتحتسب هذه المنصة فقط على أساس ٣٥٪ لعام ٢٠١٨ المُفصَح عنه، لا رقماً مُسقَطاً لعام حالي. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦، بالرجوع إلى تغطية Jordan Times لقرار مجلس الوزراء. يُفضَّل تأكيد النسبة الحالية مع جهة التعاقد قبل الاعتماد على ٣٥٪.',
  },
  'om-icv': {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'In-Country Value (ICV) -- not yet sourced', programNameAr: 'القيمة المحلية (ICV) — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced', program: 'om-icv',
    applicableContexts: [],
    sourceNoteEn: "No published percentage weighting exists for Oman's general ICV score, so this program is shown for reference and is not calculated. PTLC names seven real scoring elements (fixed-asset investment, workforce skills, Omani training, local goods sourcing, local subcontracted services, national supplier development, training/R&D institution development) through initiatives like the Rabt supplier platform and a National ICV Laboratory, but publishes no weighting formula. A separate National Local Content Policy (2024-2030), approved by Cabinet (Oman Observer, 4 Aug 2026), sets four broad pillars but is a roadmap, not a scoring tool, and does not resolve this. Last checked 20 Oct 2026, against PTLC's own site, ptlc.gov.om. Ask PTLC or your contracting authority for the current ICV weighting before relying on this program.",
    sourceNoteAr: "لا توجد نسبة ترجيح منشورة لمؤشر القيمة المحلية (ICV) العام في عُمان، ولذلك يُعرض هذا البرنامج للاطلاع فقط ولا يُحتسب. تُسمّي هيئة المشاريع والمناقصات والمحتوى المحلي (PTLC) سبعة عناصر للاحتساب (الاستثمار في الأصول الثابتة، تطوير مهارات القوى العاملة، تدريب العُمانيين، التوريد المحلي للسلع، الخدمات المتعاقَد عليها من الباطن محلياً، تطوير الموردين الوطنيين، وتطوير مؤسسات التدريب والبحث والتطوير) عبر مبادرات مثل منصة \"ربط\" ومختبر ICV الوطني، دون نشر صيغة ترجيح. وتضع السياسة الوطنية للمحتوى المحلي (٢٠٢٤-٢٠٣٠)، المعتمدة من مجلس الوزراء (عُمان أوبزرفر، ٤ أغسطس ٢٠٢٦)، أربعة أركان عامة، لكنها خريطة طريق لا أداة احتساب، ولا تسد هذه الفجوة في المعلومات المنشورة. تاريخ آخر مراجعة: ٢٠ أكتوبر ٢٠٢٦، بالرجوع إلى موقع PTLC الرسمي ptlc.gov.om. يُفضَّل سؤال الهيئة أو جهة التعاقد عن ترجيح ICV الحالي قبل الاعتماد على هذا البرنامج.",
  },
  'om-mandatory-list': {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'PTLC Mandatory List (category eligibility gate)', programNameAr: 'القائمة الإلزامية لهيئة المشاريع والمناقصات والمحتوى المحلي (بوابة أهلية الفئة)',
    mechanismType: 'category-eligibility-gate', program: 'om-mandatory-list',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'Oman\'s Tender Board itself still exists: Royal Decree 57/2025 renamed only its General Secretariat -- not the Board -- to the Projects, Tenders, and Local Content Authority (PTLC), which now supports the Board with expanded powers (confirmed from the Decree\'s own text, Arts. 1/4/7-8, and omandaily.om, 24 Jun 2025). PTLC maintains a Mandatory List reserving defined categories of goods/services for Omani SMEs and local suppliers (per tendersarabia.com\'s 2026 guide) -- structurally the same pass/fail gate as Saudi\'s LCGPA Mandatory List, reused via the same computation. No published enumeration of Oman\'s specific categories was found (unlike Saudi\'s 233+-item count); bidders must check the actual list. This engine\'s gate logic is real, but category coverage is not, and is disclosed as such. Last checked 22 Oct 2026, against Royal Decree 57/2025 and omandaily.om.',
    sourceNoteAr: 'يستمر مجلس المناقصات العُماني قائماً بذاته: أعاد المرسوم السلطاني رقم ٥٧/٢٠٢٥ تسمية أمانته العامة فقط — لا المجلس نفسه — إلى "هيئة المشاريع والمناقصات والمحتوى المحلي" (PTLC)، التي تتولى الآن معاونة المجلس بصلاحيات إدارية موسَّعة (مؤكَّد من نص المرسوم نفسه، المواد ١/٤/٧-٨، وموقع omandaily.om، ٢٤ يونيو ٢٠٢٥). تُدير PTLC قائمة إلزامية تُخصّص فئات محددة من السلع والخدمات للمؤسسات الصغيرة والمتوسطة والموردين المحليين العُمانيين (بحسب دليل مناقصات عُمان ٢٠٢٦ الصادر عن tendersarabia.com) — آلية بوابة نجاح/فشل مطابقة من حيث البنية للقائمة الإلزامية السعودية، وتُستخدم هنا نفس صيغة الحساب. لم يُعثر على قائمة منشورة بالفئات المحددة العُمانية (بخلاف السعودية الموثّقة بأكثر من ٢٣٣ بنداً) — على مقدمي العطاءات التحقق من القائمة الفعلية. منطق البوابة في هذا المحرك حقيقي، أما نطاق تغطية الفئات فغير موثّق، ويُفصَح عن ذلك صراحة. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦، بالرجوع إلى المرسوم السلطاني رقم ٥٧/٢٠٢٥ وموقع omandaily.om.',
  },
  'om-oq-price-preference': {
    country: 'OM', countryNameEn: 'Oman', countryNameAr: 'سلطنة عُمان',
    programNameEn: 'OQ Group Price Preference (Omani-manufactured goods)', programNameAr: 'تفضيل سعري لمجموعة OQ (السلع المصنّعة عمانياً)',
    mechanismType: 'price-preference-margin', program: 'om-oq-price-preference',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'OQ Group (Oman\'s state-owned integrated energy company, formerly Orpic/OOC) "offers a 10 percent price preference for Omani-manufactured goods in qualifying contract categories" (per a 2026 Oman tenders market guide). This is OQ Group\'s own company-specific procurement preference -- a genuinely different buyer/program from Oman\'s general national ICV program, the same "anchor-buyer-specific mechanism" pattern already modeled for Saudi Aramco (IKTVA) and Qatar\'s QatarEnergy Tawteen program. Structurally identical to Jordan\'s price-preference mechanism, reusing the same computation. No further detail on which contract categories qualify was found in this research pass. Last verified date not recorded.',
    sourceNoteAr: 'تقدّم مجموعة OQ (شركة الطاقة المتكاملة المملوكة للدولة في عُمان، والمعروفة سابقاً بأوربيك/شركة عُمان للنفط) "تفضيلاً سعرياً بنسبة ١٠٪ للسلع المصنّعة عمانياً ضمن فئات العقود المؤهلة" (بحسب دليل سوق المناقصات العُمانية لعام ٢٠٢٦). هذا تفضيل خاص بمشتريات مجموعة OQ نفسها — برنامج ومشترٍ مختلفان فعلياً عن برنامج القيمة المحلية الوطني العام في عُمان، على غرار نمط "الآلية الخاصة بمشترٍ رئيسي محدد" المحسوب بشكل مستقل مسبقاً لبرنامج اكتفاء لدى أرامكو السعودية وبرنامج توطين التابع لقطر للطاقة. مطابق من حيث البنية لآلية التفضيل السعري الأردنية، ويُستخدم نفس أسلوب الحساب. لم يُعثر في هذا البحث على تفاصيل إضافية حول فئات العقود المؤهلة تحديداً. لم يُسجَّل تاريخ آخر مراجعة.',
  },
  'qa-national-strategy': {
    country: 'QA', countryNameEn: 'Qatar', countryNameAr: 'دولة قطر',
    programNameEn: 'National Local Content Strategy -- not yet sourced', programNameAr: 'الاستراتيجية الوطنية للمحتوى المحلي — غير موثّقة بعد',
    mechanismType: 'not-yet-sourced', program: 'qa-national-strategy',
    applicableContexts: [],
    sourceNoteEn: "No published scoring formula exists for Qatar's National Local Content Strategy, so this program is shown for reference and is not calculated. The Strategy — officially the General Policy and Strategy for National Local Content — was approved by Cabinet on 10 Jun 2026, prepared by the Ministry of Finance with the National Planning Council. Qatar's state news agency (qna.org.qa) confirms the approval and its broad aims (expanding local content in government procurement, building sustainable local value), with no percentage target or supplier-facing criteria. A separate, fully-published mechanism, the Tawteen/ICV score run via icv.qa, is modeled separately and unaffected by this gap. Last checked 22 Oct 2026, against QNA's own English-language article for this date. Ask the Ministry of Finance directly for implementing rules before relying on this program.",
    sourceNoteAr: "لا توجد صيغة احتساب منشورة للاستراتيجية الوطنية للمحتوى المحلي في قطر، ولذلك يُعرض هذا البرنامج للاطلاع فقط ولا يُحتسب. أقرّ مجلس الوزراء هذه الاستراتيجية — واسمها الرسمي \"السياسة العامة والاستراتيجية الوطنية للمحتوى المحلي\" — في ١٠ يونيو ٢٠٢٦، بإعداد من وزارة المالية ومجلس التخطيط الوطني. تؤكد وكالة الأنباء القطرية الرسمية (qna.org.qa) إقرارها وأهدافها العامة (توسيع المحتوى المحلي في المشتريات الحكومية وبناء قيمة محلية مستدامة)، دون هدف نسبي أو معايير خاصة بالموردين. وتوجد آلية منفصلة منشورة بالكامل، وهي درجة التوطين (ICV) عبر icv.qa، وهي محسوبة بشكل مستقل ولا تتأثر بهذه الفجوة في المعلومات المنشورة. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦، بالرجوع إلى مقال وكالة الأنباء القطرية الرسمية بالإنجليزية لهذا التاريخ. يُفضَّل التواصل مباشرة مع وزارة المالية لمعرفة القواعد التنفيذية قبل الاعتماد على هذا البرنامج.",
  },
  'qa-icv-tawteen': {
    country: 'QA', countryNameEn: 'Qatar', countryNameAr: 'دولة قطر',
    programNameEn: 'Tawteen / ICV Score (official methodology)', programNameAr: 'درجة توطين / القيمة المحلية (المنهجية الرسمية)',
    mechanismType: 'modified-icv-score', program: 'qa-icv-tawteen',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'This program is calculated: Qatar\'s official In-Country Value Digital Portal (icv.qa) scores base ICV = eligible local spend (local goods/materials, local services, Qatari-national training, supplier training, Qatar-asset depreciation) ÷ total Qatar revenue excluding exports; sub-supplier development costs count 100% toward the primary supplier\'s score. Real modifiers: an \'ICV+\' policy adds 50% to an eligible manufacturer\'s score; a \'blanket score\' guarantees micro/small suppliers a minimum 30%; suppliers can claim up to 15 additional percentage points through disclosed strategic behaviors (self-reported, capped, not independently verified since icv.qa doesn\'t publish its internal weighting). In tender evaluation, icv.qa states higher ICV bids earn a price premium if competitive — not a guaranteed win, so this is disclosed as context, not a computed discount. Last checked 22 Oct 2026. Confirm your current score calculation with icv.qa.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: تحتسب منصة القيمة المحلية الرقمية الرسمية في قطر (icv.qa) درجة القيمة المحلية الأساسية = الإنفاق المحلي المؤهَّل (سلع ومواد محلية، خدمات محلية، تدريب للمواطنين والمقيمين القطريين، تدريب الموردين، استهلاك أصول الشركة داخل قطر) ÷ إجمالي إيرادات قطر باستثناء الصادرات؛ وتُحتسب تكاليف تطوير الموردين الفرعيين بنسبة ١٠٠٪ ضمن درجة المورّد الرئيسي. معدِّلات حقيقية فوق الدرجة الأساسية: سياسة "ICV+" تضيف ٥٠٪ لدرجة المصنِّع المؤهَّل؛ و"الدرجة الشاملة" تضمن للموردين متناهي الصغر والصغار حداً أدنى ٣٠٪؛ ويمكن للموردين المطالبة بما يصل إلى ١٥ نقطة مئوية إضافية عبر سلوكيات استراتيجية مُفصَح عنها (تصريح ذاتي، بسقف محدَّد، غير مُتحقَّق منه مستقلاً لأن icv.qa لا تنشر ترجيحه الداخلي). في تقييم المناقصات، تذكر icv.qa أن العروض ذات الدرجة الأعلى تحصل على علاوة سعرية إن كانت تنافسية — وهذا ليس فوزاً مضموناً، فيُفصَح عنه كسياق لا كخصم محتسَب. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد احتساب درجتك الحالية مع icv.qa.',
  },
  'qa-tenders-icv': {
    country: 'QA', countryNameEn: 'Qatar', countryNameAr: 'دولة قطر',
    programNameEn: 'Tenders Law ICV Consideration (Executive Regulations, Arts. 2-3)', programNameAr: 'اعتبار القيمة المحلية بموجب قانون المناقصات (اللائحة التنفيذية، المادتان ٢-٣)',
    mechanismType: 'eligible-spend-ratio', program: 'qa-tenders-icv',
    applicableContexts: ['government'],
    sourceNoteEn: 'This program is calculated: Qatar\'s Tenders and Auctions Law (Law No. 24 of 2015) Executive Regulations are a general, cross-government basis, distinct from QatarEnergy\'s own icv.qa platform modeled separately. Article 2 defines In-Country Value (ICV) as total local spend on works, services, or national human-resource development; Article 3 requires procuring entities to consider bidders\' ICV ratios in evaluation, but does NOT specify a percentage, weighting formula, or calculation method (per two independent legal summaries). This platform computes the Article 2 local-value ratio as a decision-supporting figure, not a pass/fail score, since no cutoff is published. A Pinsent Masons claim of a 30% local-market-purchase mandate under Articles 33/34 was investigated and NOT modeled: three more summaries do not mention it. Last checked 22 Oct 2026. Ask the procuring entity how your ICV ratio will be weighted.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: تمثل اللائحة التنفيذية لقانون المناقصات والمزايدات القطري (القانون رقم ٢٤ لسنة ٢٠١٥) أساساً قانونياً عاماً شاملاً لكل الجهات الحكومية، مختلفاً عن منصة icv.qa الخاصة بقطر للطاقة والمُحتسبة بشكل منفصل أعلاه. تُعرِّف المادة ٢ القيمة المحلية (ICV) بأنها إجمالي الإنفاق المحلي على الأعمال أو الخدمات أو تنمية الموارد البشرية الوطنية؛ وتُلزم المادة ٣ الجهات المشترية بمراعاة نسب القيمة المحلية للعارضين عند التقييم، لكنها لا تحدد نسبة مئوية أو صيغة ترجيح أو طريقة احتساب (بتأكيد ملخصين قانونيين مستقلين). تحتسب هذه المنصة وتُفصح عن نسبة القيمة المحلية المعرَّفة في المادة ٢ نفسها كرقم داعم للقرار، لا كدرجة نجاح/فشل مقابل حد منشور، لأنه لا يوجد. ادعاء من Pinsent Masons بإلزام ٣٠٪ شراء محلي بموجب المادتين ٣٣/٣٤ جرى التحقق منه ولم يُحتسب: ثلاثة ملخصات قانونية مستقلة أخرى لا تذكره إطلاقاً. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل سؤال الجهة المشترية عن كيفية ترجيح نسبة القيمة المحلية لديك.',
  },
  'bh-local-content': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'Local content framework -- not yet sourced', programNameAr: 'إطار المحتوى المحلي — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'bh-local-content',
    applicableContexts: [],
    sourceNoteEn: "No published general national local-content framework exists for Bahrain, so this program is shown for reference and is not calculated. Bahrain's Tender Board instead publishes four specific, narrower mechanisms — an SME price preference, an SME spend set-aside, the Takamul local-value certificate preference, and the Gulf-made products preference — each modeled separately, plus a 20% Bahrainisation workforce rule. The Tender Board's own Guideline (Nov 2025) and Circular No. 1 of 2023 were checked directly and confirm no separate general framework exists beyond these four. A secondary claim of a stacking 10%+10% preference for all Bahraini companies does not match the Circular's own text. Last checked 2 Oct 2026, against the Tender Board's Guideline and Circular No. 1 of 2023. Ask the Tender Board which of the four specific mechanisms applies to your tender.",
    sourceNoteAr: "لا يوجد إطار وطني عام منشور للمحتوى المحلي في البحرين، ولذلك يُعرض هذا البرنامج للاطلاع فقط ولا يُحتسب. ينشر مجلس المناقصات والمزايدات البحريني بدلاً من ذلك أربع آليات محددة وأضيق نطاقاً — تفضيل سعري للمنشآت الصغيرة والمتوسطة، وتخصيص حصة لها، وتفضيل شهادة تكامل، وتفضيل المنتجات الخليجية — وكل منها محسوب بشكل مستقل، إضافة إلى قاعدة بحرنة القوى العاملة بنسبة ٢٠٪. وتم فحص دليل المجلس (نوفمبر ٢٠٢٥) والتعميم رقم ١ لسنة ٢٠٢٣ مباشرة، وكلاهما يؤكد عدم وجود إطار عام منفصل يتجاوز هذه الآليات الأربع. وثمة ادعاء ثانوي بتفضيل متراكم ١٠٪ إضافة إلى ١٠٪ لكل الشركات البحرينية، لا يطابق نص التعميم نفسه. تاريخ آخر مراجعة: ٢ أكتوبر ٢٠٢٦، بالرجوع إلى دليل المجلس والتعميم رقم ١ لسنة ٢٠٢٣. يُفضَّل سؤال المجلس عن أي من الآليات الأربع ينطبق على مناقصتك.",
  },
  'bh-sme-price-preference': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'SME Bidding Price Advantage', programNameAr: 'ميزة سعرية للمؤسسات الصغيرة والمتوسطة في المناقصات',
    mechanismType: 'price-preference-margin', program: 'bh-sme-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: 'Under Ministerial Decision No. 23 of 2026 (Bahrain\'s Minister of Industry and Commerce, published in the Official Gazette 11 Jun 2026, effective 12 Jun 2026, repealing the 2017 SME-classification criteria), SMEs qualifying under the new ceiling (up to 250 employees or up to BHD 20 million in annual revenue, up from the prior 100 employees / BHD 3 million) receive "a 10% advantage in bidding for government tenders" (per mondaq.com\'s legal summary). A separate, related 10% advantage applies to public-utility auctions -- disclosed here as related context, not separately modeled (this program covers tender bidding specifically). Structurally the same price-preference-margin mechanism as Jordan/Saudi, but the qualifying share here is binary (SME status), not a locally-manufactured content percentage. Last verified date not recorded.',
    sourceNoteAr: 'بموجب القرار الوزاري رقم ٢٣ لسنة ٢٠٢٦ (الصادر عن وزير الصناعة والتجارة البحريني، ونُشر في الجريدة الرسمية بتاريخ ١١ يونيو ٢٠٢٦، ونفذ اعتباراً من ١٢ يونيو ٢٠٢٦، وألغى معايير تصنيف المؤسسات الصغيرة والمتوسطة لعام ٢٠١٧)، تحصل المؤسسات المؤهلة ضمن السقف الجديد (حتى ٢٥٠ موظفاً أو حتى ٢٠ مليون دينار بحريني إيرادات سنوية، مقارنة بالسقف السابق البالغ ١٠٠ موظف / ٣ ملايين دينار) على "ميزة بنسبة ١٠٪ في تقديم العطاءات للمناقصات الحكومية" (بحسب الملخص القانوني الصادر عن mondaq.com). وتنطبق ميزة منفصلة ذات صلة بنسبة ١٠٪ على مزادات المرافق العامة — تُذكر هنا كسياق ذي صلة ولا يُحتسب هنا بشكل منفصل (يغطي هذا البرنامج تقديم العطاءات تحديداً). آلية مطابقة من حيث البنية لتفضيل السعر الأردني/السعودي، إلا أن الحصة المؤهلة هنا ثنائية (صفة مؤسسة صغيرة أو متوسطة)، وليست نسبة محتوى مصنّع محلياً. لم يُسجَّل تاريخ آخر مراجعة.',
  },
  'bh-sme-spend-setaside': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'SME Government Spend Allocation', programNameAr: 'تخصيص إنفاق حكومي للمؤسسات الصغيرة والمتوسطة',
    mechanismType: 'spend-set-aside-target', program: 'bh-sme-spend-setaside',
    applicableContexts: ['government'],
    sourceNoteEn: 'The same Ministerial Decision No. 23 of 2026 sourcing (mondaq.com) states a "20% allocation of the value of government procurements and tenders to SMEs" qualifying under the new ceiling -- a real, sourced national spend-reservation target, structurally the SME/local spend set-aside mechanism type (per the brief\'s own original taxonomy note that Bahrain "reserves a share of tenders for SMEs"). This is a national/program-level target share, not a per-supplier score -- disclosed here alongside this supplier\'s own SME qualification for the reserved pool. Last verified date not recorded.',
    sourceNoteAr: 'يذكر المصدر نفسه لقرار وزاري ٢٣ لسنة ٢٠٢٦ (mondaq.com) تخصيص "٢٠٪ من قيمة المشتريات والمناقصات الحكومية للمؤسسات الصغيرة والمتوسطة" المؤهلة ضمن السقف الجديد — هدف وطني حقيقي وموثّق لتخصيص حصة من الإنفاق، وهو من نوع آلية تخصيص الإنفاق المحلي/للمؤسسات الصغيرة والمتوسطة (بحسب ملاحظة التصنيف الأصلية في الموجز التي أشارت إلى أن البحرين "تخصص حصة من المناقصات للمؤسسات الصغيرة والمتوسطة"). هذا هدف وطني/برنامجي على مستوى الحصة، وليس درجة خاصة بمورّد بعينه — يُعرض هنا إلى جانب مدى استيفاء هذا المورّد لشرط التأهل كمؤسسة صغيرة أو متوسطة للاستفادة من هذه الحصة المخصصة. لم يُسجَّل تاريخ آخر مراجعة.',
  },
  'bh-takamul-local-value': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'Takamul Local Value Certificate Preference', programNameAr: 'تفضيل شهادة القيمة المحلية (تكامل)',
    mechanismType: 'price-preference-margin', program: 'bh-takamul-local-value',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: a 10% price preference applies to local industrial establishments holding a Takamul Local Value Certificate for the products listed on it. Bahrain's Tender Board Guideline (Version 1.0, Nov 2025, page 25) sets this under Cabinet Decision No. (11-2679); the certificate itself is issued through the Ministry of Industry and Commerce's online portal, service.moic.gov.bh/takamul. This is separate from the SME-status preference above, since it depends on holding the certificate for specific products, not company size. Where more than one preference could apply, the Guideline grants only the higher single rate. Last checked 29 Sep 2026, against the Tender Board's own Guideline. Apply for your Takamul certificate through the Ministry's portal if you don't already hold one.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُمنح تفضيل سعري بنسبة ١٠٪ للمنشآت الصناعية المحلية الحاصلة على شهادة تكامل للقيمة المحلية، للمنتجات المدرجة في الشهادة. يحدد دليل مجلس المناقصات والمزايدات (الإصدار ١.٠، نوفمبر ٢٠٢٥، صفحة ٢٥) هذا التفضيل بموجب القرار الوزاري رقم (١١-٢٦٧٩)؛ وتُصدَر الشهادة عبر بوابة وزارة الصناعة والتجارة service.moic.gov.bh/takamul. وهذا مختلف عن تفضيل صفة المنشآت الصغيرة والمتوسطة، لأنه يعتمد على حيازة الشهادة لمنتجات محددة، لا على حجم الشركة. وإذا انطبق أكثر من تفضيل واحد، يمنح الدليل النسبة الأعلى فقط. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦، بالرجوع إلى دليل المجلس. يُفضَّل التقدّم بطلب شهادة تكامل عبر بوابة الوزارة إن لم تكن لديك شهادة سارية.",
  },
  'bh-gulf-made-preference': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'Gulf-Made Products Preference', programNameAr: 'تفضيل المنتجات المصنّعة خليجياً',
    mechanismType: 'price-preference-margin', program: 'bh-gulf-made-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: a 10% price preference applies to Gulf-made products in Bahrain government tenders. Bahrain's Tender Board Guideline (Version 1.0, Nov 2025, page 24) sets this under Cabinet Decision No. 40 of 2015, which adopted the GCC's unified rules for preferring GCC-origin products. This is based on where the product was made, separate from the SME-status preference and the Takamul local-value certificate preference. Where more than one preference could apply to the same bid, the Guideline grants only the higher single rate, not a combined total. Last checked 29 Sep 2026, against the Tender Board's own Guideline. Confirm your product's GCC origin documentation before bidding.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُمنح تفضيل سعري بنسبة ١٠٪ للمنتجات المصنَّعة خليجياً في المناقصات الحكومية البحرينية. يحدد دليل مجلس المناقصات والمزايدات (الإصدار ١.٠، نوفمبر ٢٠٢٥، صفحة ٢٤) هذا التفضيل بموجب القرار رقم ٤٠ لسنة ٢٠١٥، الذي اعتمد القواعد الموحَّدة لدول مجلس التعاون الخليجي لتفضيل المنتجات ذات المنشأ الخليجي. ويقوم هذا التفضيل على مكان تصنيع المنتج، وهو مختلف عن تفضيل صفة المنشآت الصغيرة والمتوسطة وتفضيل شهادة تكامل. وإذا انطبق أكثر من تفضيل واحد على نفس العرض، يمنح الدليل النسبة الأعلى فقط، لا مجموعاً متراكماً. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦، بالرجوع إلى دليل المجلس. يُفضَّل التأكد من وثائق المنشأ الخليجي لمنتجك قبل تقديم العرض.",
  },
  'bh-bahrainisation-tender-workforce': {
    country: 'BH', countryNameEn: 'Bahrain', countryNameAr: 'مملكة البحرين',
    programNameEn: 'Bahrainisation Rule for Tender Bidders (20%)', programNameAr: 'قاعدة البحرنة لمقدمي عروض المناقصات (٢٠٪)',
    mechanismType: 'percentage-threshold-gate', program: 'bh-bahrainisation-tender-workforce',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: suppliers bidding on Bahrain government tenders must show at least 20% Bahraini nationals in their workforce. Bahrain's Parliament approved this requirement on 20 Nov 2024 (Lexis Middle East, 22 Nov 2024); some legislators described 20% as a starting point that could rise over time. The Tender Board's own Guideline (Nov 2025) requires a valid Bahrainisation Certificate from the Ministry of Labour but does not itself restate the percentage. A separate, higher 50% requirement applies only to privatised state-service contracts, not general tenders, and is not used here. Last checked 2 Oct 2026, against Lexis Middle East and the Tender Board's Guideline. Obtain your Bahrainisation Certificate from the Ministry of Labour before bidding.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يجب على المورّدين المتقدمين لمناقصات حكومية بحرينية إثبات أن ٢٠٪ على الأقل من قوتهم العاملة بحرينية الجنسية. وافق مجلس النواب البحريني على هذا الاشتراط في ٢٠ نوفمبر ٢٠٢٤ (Lexis Middle East، ٢٢ نوفمبر ٢٠٢٤)؛ ووصف بعض النواب نسبة ٢٠٪ بأنها نقطة بداية قابلة للارتفاع مستقبلاً. يشترط دليل مجلس المناقصات والمزايدات (نوفمبر ٢٠٢٥) تقديم شهادة بحرنة سارية من وزارة العمل، دون أن يُعيد ذكر النسبة نفسها. وهناك اشتراط أعلى بنسبة ٥٠٪ يخص فقط عقود الخدمات الحكومية المخصخصة، لا المناقصات العامة، وغير مُستخدَم هنا. تاريخ آخر مراجعة: ٢ أكتوبر ٢٠٢٦، بالرجوع إلى Lexis Middle East ودليل المجلس. يُفضَّل الحصول على شهادة البحرنة من وزارة العمل قبل تقديم العطاء.",
  },
  'kw-local-content': {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: "Public Tenders Law Local Sourcing Gate (Art. 87)", programNameAr: 'بوابة التوريد المحلي بموجب المادة ٨٧ من قانون المناقصات العامة',
    mechanismType: 'dual-local-sourcing-gate', program: 'kw-local-content',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: Kuwait's Public Tenders Law No. 49 of 2016 (Article 87) requires a foreign contractor on a covered tender to purchase at least 30% of its contractual requirements from local suppliers, and separately to award at least 30% of contract works to registered local contractors — two independent 30% thresholds, confirmed directly from Al Tamimi & Company's legal analysis of the Law's own text. This is a compliance mandate on contract performance, different from Kuwait's other three programs (KPC's own spend target, the Article 62 product-origin price preference, and the company-nationality price preference), which are modeled separately and do not overlap with this one. Last checked 1 Oct 2026. Confirm both the materials-purchase and works-award thresholds are met before and during contract performance.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُلزم قانون المناقصات العامة الكويتي رقم ٤٩ لسنة ٢٠١٦ (المادة ٨٧) المقاول الأجنبي في مناقصة مشمولة بشراء ٣٠٪ على الأقل من مستلزماته التعاقدية من موردين محليين، وبترسية ٣٠٪ على الأقل من أعمال العقد على مقاولين محليين مسجَّلين — وهما حدّان مستقلان بنسبة ٣٠٪ لكل منهما، مؤكَّدان مباشرة من تحليل مكتب التميمي لنص القانون نفسه. وهذا اشتراط امتثال على تنفيذ العقد، يختلف عن برامج الكويت الثلاثة الأخرى (هدف إنفاق مؤسسة البترول الكويتية، وتفضيل منشأ المنتج بموجب المادة ٦٢، وتفضيل جنسية الشركة)، وهي محسوبة بشكل مستقل ولا تتداخل مع هذا البرنامج. تاريخ آخر مراجعة: ١ أكتوبر ٢٠٢٦. يُفضَّل التأكد من استيفاء حدّي شراء المواد وترسية الأعمال قبل وأثناء تنفيذ العقد.",
  },
  'kw-kpc-local-spend': {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: 'KPC Kuwaiti-Supplier Spend Target', programNameAr: 'هدف إنفاق مؤسسة البترول الكويتية مع الموردين الكويتيين',
    mechanismType: 'spend-set-aside-target', program: 'kw-kpc-local-spend',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'Per the U.S. government\'s own trade.gov Kuwait market-intelligence guide (citing Kuwait Petroleum Corporation\'s own stated objectives), KPC aims to "increase local private sector share in KPC spending by requiring a minimum of 30% of a project spending be designated for Kuwaiti suppliers," targeted "by 2040." This is KPC\'s own anchor-buyer-style spend target across its "K-company" group (KOC, KNPC, and other KPC subsidiaries) -- the real sourced mechanism the brief\'s own taxonomy note anticipated ("Kuwait\'s KPC/KOC run anchor-buyer-style programs... plus a spend set-aside"). No further per-supplier qualification criteria (a formal "Kuwaiti supplier" registration/certification scheme, as opposed to simple national ownership/registration) were found in this research pass -- disclosed as self-reported registration status pending a more granular sourced definition. Last verified date not recorded.',
    sourceNoteAr: 'بحسب دليل الحكومة الأمريكية الرسمي على trade.gov حول قطاع النفط الكويتي (نقلاً عن أهداف مؤسسة البترول الكويتية المعلنة)، تهدف المؤسسة إلى "زيادة حصة القطاع الخاص المحلي في إنفاق المؤسسة عبر اشتراط تخصيص ما لا يقل عن ٣٠٪ من إنفاق المشاريع للموردين الكويتيين"، بحلول عام ٢٠٤٠. هذا هدف إنفاق خاص بمؤسسة البترول الكويتية بصفتها مشترياً رئيسياً عبر مجموعة "شركات الكاف" التابعة لها (شركة نفط الكويت، شركة البترول الوطنية الكويتية، وشركات أخرى تابعة للمؤسسة) — وهو الآلية الحقيقية والموثّقة التي توقّعتها ملاحظة التصنيف الأصلية في الموجز ("تدير مؤسسة البترول الكويتية/شركة نفط الكويت برامج على غرار المشتري الرئيسي... إضافة إلى تخصيص حصة من الإنفاق"). لم يُعثر في هذا البحث على معايير تأهيل إضافية على مستوى المورّد (نظام تسجيل/اعتماد رسمي لصفة "المورّد الكويتي"، بخلاف الملكية/التسجيل الوطني البسيط) — يُفصَح عن ذلك كحالة تسجيل ذاتية التصريح ريثما تتوفر مصادر أدق. لم يُسجَّل تاريخ آخر مراجعة.',
  },
  'kw-tender-law-price-preference': {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: 'Public Tenders Law National Product Price Preference (Art. 62)', programNameAr: 'تفضيل سعري للمنتج الوطني بموجب قانون المناقصات العامة (المادة ٦٢)',
    mechanismType: 'price-preference-margin', program: 'kw-tender-law-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: Kuwait's Public Tenders Law No. 49 of 2016 (Article 62) applies to government procurement above KD 75,000 and gives a 'national product' bid — meeting GCC or Kuwaiti standards — priority over an imported alternative whenever its price does not exceed the lowest comparable import price by more than 15%, confirmed by three independent sources including the law's own text and trade.gov. This applies to products from Kuwait or any GCC country, not company nationality (see the separate nationality-based preference). It is a general, cross-government rule, different from KPC's own spend target. A 10% nationality preference and a 30% local-sourcing mandate are modeled as separate programs. Last checked 29 Sep 2026, against the law's own text (kdipa.gov.kw) and trade.gov. Confirm your product's GCC-standards conformity before bidding.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: تنطبق المادة ٦٢ من قانون المناقصات العامة الكويتي رقم ٤٩ لسنة ٢٠١٦ على المشتريات الحكومية التي تتجاوز قيمتها ٧٥ ألف دينار كويتي، وتمنح عرض \"المنتج الوطني\" (المطابق لمواصفات خليجية أو كويتية) أولوية على البديل المستورد كلما لم يتجاوز سعره أقل سعر مماثل للمستورد بأكثر من ١٥٪، وهو مؤكَّد بثلاثة مصادر مستقلة من ضمنها نص القانون نفسه وموقع trade.gov الأمريكي. وينطبق هذا على المنتجات من الكويت أو أي دولة خليجية، لا على جنسية الشركة (انظر التفضيل القائم على الجنسية). وهذه قاعدة عامة شاملة لكل الجهات الحكومية، تختلف عن هدف إنفاق مؤسسة البترول الكويتية الخاص. ويُحتسب تفضيل الجنسية بنسبة ١٠٪ واشتراط التوريد المحلي بنسبة ٣٠٪ كبرنامجين منفصلين. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦، بالرجوع إلى نص القانون نفسه (kdipa.gov.kw) وموقع trade.gov. يُفضَّل التأكد من مطابقة منتجك للمواصفات الخليجية قبل تقديم العرض.",
  },
  'kw-nationality-price-preference': {
    country: 'KW', countryNameEn: 'Kuwait', countryNameAr: 'دولة الكويت',
    programNameEn: 'Kuwaiti-Nationality Company Price Preference', programNameAr: 'تفضيل سعري للشركات الكويتية الجنسية',
    mechanismType: 'price-preference-margin', program: 'kw-nationality-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: a 10% price preference applies specifically to companies of Kuwaiti nationality, confirmed by two independent sources (the US government's trade.gov Kuwait guide and tenderspedia.com's 2026 market guide). This is different from the related product-origin preference below, which is based on where the product was made, not the bidding company's nationality. It is also different from Kuwait's general local-sourcing mandate and KPC's own spend target, which are modeled separately. A separately-reported 30% local-market-sourcing requirement for foreign bidders, and a single-sourced 20% SME preference that could not be independently confirmed, are disclosed but not modeled here. Last checked 29 Sep 2026. Confirm your company's nationality-qualification status with the Central Agency for Public Tenders.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُمنح تفضيل سعري بنسبة ١٠٪ خاص بالشركات الكويتية الجنسية تحديداً، مؤكَّد بمصدرين مستقلين (دليل الحكومة الأمريكية trade.gov للأعمال في الكويت، ودليل سوق المناقصات لعام ٢٠٢٦ على tenderspedia.com). ويختلف هذا عن تفضيل منشأ المنتج أدناه، الذي يقوم على مكان تصنيع المنتج لا جنسية الشركة المتقدمة بالعطاء. ويختلف أيضاً عن اشتراط التوريد المحلي العام في الكويت وهدف إنفاق مؤسسة البترول الكويتية، وهما يُحتسبان بشكل مستقل. ويُفصَح هنا، دون احتسابه في هذا البرنامج، عن اشتراط منفصل بنسبة ٣٠٪ للتوريد من السوق المحلية لمقدمي العطاءات الأجانب، وتفضيل ٢٠٪ للمنشآت الصغيرة والمتوسطة من مصدر واحد لم يتأكَّد بشكل مستقل. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦. يُفضَّل تأكيد حالة تأهل شركتك من ناحية الجنسية مع الجهاز المركزي للمناقصات العامة.",
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
    sourceNoteEn: 'This program is calculated: Egypt\'s Law No. 5 of 2015 (amended by Law No. 90 of 2018) requires a bid\'s goods/services to reach at least 40% Egyptian-origin content, by estimated project value, to qualify as an \'Egyptian product\'; qualifying bidders then receive a flat 15% price preference against foreign bids, confirmed by trade.gov\'s own guide. This is threshold-gated, not continuously scaled: a bidder either clears 40% and receives the full 15%, or doesn\'t. Exempted: Defense, Interior, Military Production, and General Intelligence procurement. Sources disagree on the governing framework law (trade.gov cites Law 89/1998; a separate legal summary cites Law 182/2018 as its replacement) — disclosed, not resolved by assumption. No dedicated certifying authority for the 40% determination was identified. Last checked 22 Oct 2026. Confirm your product\'s qualifying status with the procuring entity.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: يشترط قانون مصر رقم ٥ لسنة ٢٠١٥ (المعدَّل بالقانون رقم ٩٠ لسنة ٢٠١٨) أن يبلغ محتوى السلع/الخدمات المصرية المنشأ في العرض ٤٠٪ على الأقل من القيمة التقديرية للمشروع ليُعتبر "منتجاً مصرياً"؛ ويحصل العارضون المؤهَّلون حينها على تفضيل سعري ثابت ١٥٪ مقابل العروض الأجنبية، بتأكيد من دليل trade.gov الأمريكي الرسمي. هذا تفضيل مشروط بعتبة، لا متدرِّج باستمرار: إما أن يبلغ العارض ٤٠٪ ويحصل على ١٥٪ كاملة، أو لا شيء. المستثنى من هذا التفضيل: مشتريات وزارات الدفاع والداخلية والإنتاج الحربي والمخابرات العامة. تختلف المصادر حول القانون الحاكم العام (trade.gov يذكر القانون ٨٩ لسنة ١٩٩٨؛ وملخص قانوني آخر يذكر القانون ١٨٢ لسنة ٢٠١٨ كبديل له) — وهذا تعارض مُفصَح عنه لا محسوماً بافتراض. لم تُحدَّد جهة معتمِدة مخصَّصة لتحديد نسبة الـ٤٠٪. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد أهلية منتجك مع الجهة المشترية.',
  },
  'eg-oil-gas-price-preference': {
    country: 'EG', countryNameEn: 'Egypt', countryNameAr: 'جمهورية مصر العربية',
    programNameEn: 'Oil & Gas PSA Local-Contractor Priority', programNameAr: 'أولوية المقاول المحلي في اتفاقيات تقاسم الإنتاج النفطية',
    mechanismType: 'price-preference-margin', program: 'eg-oil-gas-price-preference',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: 'This program is calculated: under Egypt\'s Production Sharing Agreement (PSA) model (Mines and Quarries Law 1953, Investment Guarantees and Incentives Act 1997, Ministry of Petroleum PSA terms), operating oil & gas contractors must prioritize local Egyptian contractors and domestically-manufactured equipment when performance is comparable and prices are not more than 10% higher than competitors — a 10% price-band preference. This is genuinely different from the general procurement preference above: a different buyer (petroleum operators under Ministry of Petroleum oversight), legal basis (PSA terms, not Law 5/2015), and margin (10%, not 15%). No dedicated local-content administering department was confirmed to exist; the source\'s own recommendation to create one implies none does yet. Modeled as a binary qualifying-status gate (qualifies → 100% share). Last checked 22 Oct 2026. Confirm current PSA terms with the Ministry of Petroleum.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: بموجب نموذج اتفاقية تقاسم الإنتاج (PSA) المصري (قانون المناجم والمحاجر ١٩٥٣، وقانون ضمانات وحوافز الاستثمار ١٩٩٧، وشروط PSA الخاصة بوزارة البترول)، يجب على مقاولي التشغيل في النفط والغاز إعطاء أولوية للمقاولين المصريين والمعدات المصنَّعة محلياً عندما يكون الأداء مماثلاً والأسعار لا تتجاوز المنافسين بأكثر من ١٠٪ — تفضيل سعري بهامش ١٠٪. هذا مختلف تماماً عن التفضيل العام أعلاه: مشترٍ مختلف (شركات تشغيل النفط تحت إشراف وزارة البترول)، أساس قانوني مختلف (شروط PSA، لا القانون ٥/٢٠١٥)، وهامش مختلف (١٠٪ لا ١٥٪). لم تُؤكَّد جهة إدارية مخصَّصة للمحتوى المحلي؛ وتوصية المصدر نفسه بإنشاء إدارة متخصصة بوزارة البترول تُلمِّح إلى عدم وجودها بعد. يُحتسب عبر بوابة ثنائية (مؤهَّل → ١٠٠٪). تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد شروط PSA الحالية مع وزارة البترول.',
  },
  'eg-auto-local-content': {
    country: 'EG', countryNameEn: 'Egypt', countryNameAr: 'جمهورية مصر العربية',
    programNameEn: 'National Automotive Industry Development Program -- Incentive Eligibility Gate', programNameAr: 'البرنامج الوطني لتنمية صناعة السيارات — بوابة أهلية الحوافز',
    mechanismType: 'production-incentive-eligibility-gate', program: 'eg-auto-local-content',
    // Disclosed approximation: this is a manufacturer-facing national
    // incentive program, not a buyer-side tender preference, so it does
    // not map cleanly onto this engine's buyer-context taxonomy the way
    // every other modeled mechanism does (the same mismatch Turkey's
    // YEKDEM scheme raised, see PROGRAMS['tr-defense-offset'].sourceNoteEn
    // -- that one was left unmodeled for this exact reason; this one is
    // modeled anyway since it IS a real per-manufacturer gate, with
    // 'private-commercial' used as the nearest-fit context because
    // vehicles sold under this program go to the general commercial
    // market, not a specific government or SOE buyer).
    applicableContexts: ['private-commercial'],
    sourceNoteEn: "This program is calculated: Egypt's National Automotive Industry Development Program (effective 1 Jul 2025) sets eligibility for fossil-fuel vehicles at a minimum 20% local content, 10,000+ units/year production (5,000+ per model), an ex-factory price ceiling of EGP 1.25 million, and a 1,600cc engine ceiling; electric vehicles need a minimum 10% local content, starting at 1,000 units/year. Figures are confirmed by a Cabinet statement (28 Apr 2026) and corroborated by two independent outlets. This platform calculates only eligibility — whether a vehicle/manufacturer qualifies for some incentive — not the incentive amount itself, since the sources do not clearly state how a local-content bonus combines with the base incentive cap. Last checked 1 Oct 2026. Ask the Ministry of Trade and Industry for the current incentive-amount formula if you need it.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يحدد البرنامج الوطني لتنمية صناعة السيارات في مصر (النافذ من ١ يوليو ٢٠٢٥) أهلية المركبات التقليدية بحد أدنى ٢٠٪ محتوى محلي، وإنتاج ١٠ آلاف وحدة سنوياً فأكثر (٥ آلاف للطراز الواحد فأكثر)، وسقف سعر تصنيع ١.٢٥ مليون جنيه، وسقف سعة محرك ١٦٠٠ سم³؛ وتحتاج المركبات الكهربائية حداً أدنى ١٠٪ محتوى محلي، بدءاً من ١٠٠٠ وحدة سنوياً. هذه الأرقام مؤكَّدة ببيان لمجلس الوزراء (٢٨ أبريل ٢٠٢٦) ومصدرين إعلاميين مستقلين. وتحسب هذه المنصة الأهلية فقط — هل تستوفي المركبة/المصنّع شروط أي حافز — لا قيمة الحافز نفسها، لأن المصادر لا تذكر بوضوح كيفية دمج مكافأة المحتوى المحلي مع سقف الحافز الأساسي. تاريخ آخر مراجعة: ١ أكتوبر ٢٠٢٦. يُفضَّل سؤال وزارة التجارة والصناعة عن صيغة قيمة الحافز الحالية إذا احتجت إليها.",
  },
};

const TR_PROGRAMS: Record<'tr-price-preference' | 'tr-defense-offset', CountryFrameworkInfo> = {
  'tr-price-preference': {
    country: 'TR', countryNameEn: 'Turkey', countryNameAr: 'جمهورية تركيا',
    programNameEn: 'Public Procurement Domestic Goods Price Preference', programNameAr: 'تفضيل سعر السلع المحلية في المشتريات العامة',
    mechanismType: 'price-preference-margin', program: 'tr-price-preference',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'This program is calculated: Turkey\'s Public Procurement Law No. 4734, Article 63(c), lets authorities grant domestic goods (\'yerli mali\') a price advantage of up to 15% in tender evaluation — mandatory, not discretionary, for goods on the official medium/high-technology list. A KIK ruling found a contracting authority\'s use of only 7% for high-tech medical equipment non-compliant and voided that tender — 7% is a documented violation, not an alternative statutory rate. The advantage is added to competing non-domestic bids\' prices, not discounted from the domestic bidder\'s own price. Domestic status is certified per item via a Yerli Mali Belgesi (Domestic Goods Certificate) from local Chambers of Commerce or the Turkish Standards Institution, applied item-by-item in multi-item tenders. No sourced SME-specific rate exists. Last checked 22 Oct 2026. Confirm the exact rate your tender sets.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: تتيح المادة ٦٣(ج) من قانون المشتريات العامة التركي رقم ٤٧٣٤ للجهات المتعاقدة منح السلع المحلية ("يرلي مالي") ميزة سعرية تصل إلى ١٥٪ في تقييم المناقصات — إلزامية، لا تقديرية، للسلع المدرجة في القائمة الرسمية للصناعات متوسطة/عالية التقنية. وجد قرار من هيئة المشتريات العامة التركية (KIK) أن استخدام جهة متعاقدة نسبة ٧٪ فقط لمعدات طبية عالية التقنية غير متوافق وألغى أجزاء المناقصة ذات الصلة — فنسبة ٧٪ مخالفة موثَّقة، لا نسبة قانونية بديلة. تُضاف الميزة إلى أسعار العروض غير المحلية المنافسة، لا تُخصَم من سعر العارض المحلي نفسه. تُعتمَد الصفة المحلية لكل بند عبر "وثيقة يرلي مالي" (شهادة السلع المحلية) من غرف التجارة/الصناعة المحلية أو معهد المواصفات التركي، وتُطبَّق بنداً ببند في المناقصات متعددة البنود. لا توجد نسبة خاصة بالمنشآت الصغيرة والمتوسطة موثَّقة. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد النسبة الدقيقة في مناقصتك.',
  },
  'tr-defense-offset': {
    country: 'TR', countryNameEn: 'Turkey', countryNameAr: 'جمهورية تركيا',
    programNameEn: 'SSB Industrialization Liability (2022 Guideline)', programNameAr: 'التزام التصنيع لدى رئاسة الصناعات الدفاعية (دليل ٢٠٢٢)',
    mechanismType: 'industrialization-liability-gate', program: 'tr-defense-offset',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: Turkish defense contracts carry three separate domestic-work obligations under the Presidency of Defence Industries' 2022 Guideline — a minimum 21% sub-industry/SME work share, a minimum 70% of EYDEP-accredited work carried out by Turkish SMEs specifically (not 70% of the whole bid), and a minimum 2% technology-acquisition share — confirmed from the regulator's own 2011 guideline and an independent legal comparison. All three must be met independently. A separate secondary-source figure of '70% of bid amount' could not be reconciled with the regulator's own text and is not used. Shortfall penalties exist but depend on multi-period program dynamics this platform does not model as a single number. Last checked 2 Oct 2026. Confirm your specific sub-thresholds and penalty terms directly with the Presidency of Defence Industries.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: تحمل العقود الدفاعية التركية ثلاثة التزامات عمل محلي مستقلة بموجب دليل رئاسة الصناعات الدفاعية لعام ٢٠٢٢ — حصة عمل للصناعات الفرعية/المنشآت الصغيرة والمتوسطة لا تقل عن ٢١٪، وحد أدنى ٧٠٪ من العمل المعتمَد (EYDEP) تحديداً تنفّذه منشآت تركية صغيرة ومتوسطة (لا ٧٠٪ من العطاء كله)، وحصة اكتساب تقنية لا تقل عن ٢٪ — وهي مؤكَّدة من دليل الرئاسة نفسه لعام ٢٠١١ ومقارنة قانونية مستقلة. ويجب استيفاء الثلاثة جميعاً بشكل مستقل. وثمة رقم من مصدر ثانوي بنسبة \"٧٠٪ من قيمة العطاء\" لم يتسنَّ التوفيق بينه وبين نص الجهة التنظيمية نفسها، ولا يُستخدَم. وتوجد غرامات على النقص لكنها تعتمد على ديناميكيات برنامج متعددة الفترات لا تحتسبها هذه المنصة كرقم واحد. تاريخ آخر مراجعة: ٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد الحدود الفرعية وشروط الغرامة مباشرة مع رئاسة الصناعات الدفاعية.",
  },
};

const UK_PROGRAMS: Record<'uk-below-threshold-reservation', CountryFrameworkInfo> = {
  'uk-below-threshold-reservation': {
    country: 'UK', countryNameEn: 'United Kingdom', countryNameAr: 'المملكة المتحدة',
    programNameEn: 'Below-Threshold Procurement Reservation (PPN 005)', programNameAr: 'تخصيص المشتريات دون العتبة (مذكرة PPN 005)',
    mechanismType: 'category-eligibility-gate', program: 'uk-below-threshold-reservation',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "This program is calculated: below the Procurement Act 2023's thresholds (GBP 135,018 for central government goods/services, GBP 207,720 for other bodies, GBP 5,193,000 for works, effective 1 Jan 2026), UK public bodies may reserve a contract for suppliers by geography (UK-wide, a single county, or a London borough — not by England/Scotland/Wales/Northern Ireland), optionally combined with SME or voluntary-sector status. Above these thresholds, UK law requires equal treatment of suppliers from WTO Government Procurement Agreement countries, so no general domestic price preference exists. A proposed British Goods and Services Bill would add reporting duties, not a price preference. Last checked 29 Sep 2026, against the Act's own thresholds and Cabinet Office PPN 005/023. Ask the contracting authority whether your specific tender uses a geographic reservation.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: دون عتبات قانون المشتريات البريطاني لعام ٢٠٢٣ (١٣٥٬٠١٨ جنيهاً إسترلينياً لسلع/خدمات الحكومة المركزية، و٢٠٧٬٧٢٠ جنيهاً للجهات الأخرى، و٥٬١٩٣٬٠٠٠ جنيه للأعمال، نافذة من ١ يناير ٢٠٢٦)، يمكن للجهات العامة البريطانية حجز عقد لموردين بحسب الموقع الجغرافي (على مستوى المملكة المتحدة، أو مقاطعة واحدة، أو حي لندني — لا بحسب إنجلترا/اسكتلندا/ويلز/أيرلندا الشمالية)، مع إمكانية الدمج مع صفة منشأة صغيرة ومتوسطة أو قطاع تطوعي. وفوق هذه العتبات، يُلزم القانون البريطاني بمعاملة متساوية لموردي دول اتفاقية منظمة التجارة العالمية للمشتريات الحكومية، فلا يوجد تفضيل سعري محلي عام. ومشروع قانون السلع والخدمات البريطانية المقترح يضيف واجبات إفصاح، لا تفضيلاً سعرياً. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦، بالرجوع إلى عتبات القانون نفسه وتعليمات مكتب مجلس الوزراء ⁦PPN ٠٠٥/٠٢٣⁩. يُفضَّل سؤال جهة التعاقد عن استخدام حجز جغرافي في مناقصتك المحددة.",
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
    sourceNoteEn: 'This program is calculated: the Buy American Act (41 U.S.C. 8301-8305, FAR Subparts 25.1/25.2) requires a \'domestic end product\' — US-sourced component cost above 65% for 2024-2028, rising to 75% from 2029 (a 2022 Executive Order raised both this threshold and added a separate under-5%-foreign-iron-or-steel sub-test, not modeled here). A qualifying domestic offer gets an evaluation price preference, not a discount: FAR 25.105 adds 20% to competing foreign offers for large businesses, or 30% for small businesses (defaults to the large-business rate unless you flag small-business status). This preference is suspended above the Trade Agreements Act threshold ($174,000 for WTO-covered items as of March 2026), above which a \'designated country end product\' eligibility test applies instead. Last checked 22 Oct 2026. Confirm your current threshold and margin with your contracting officer.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: يشترط قانون المشتريات الأمريكية (Buy American Act) أن يكون "المنتج محلي الصنع" — بتجاوز تكلفة المكوِّنات الأمريكية المصدر عتبة ٦٥٪ للأعوام ٢٠٢٤-٢٠٢٨، ترتفع إلى ٧٥٪ اعتباراً من ٢٠٢٩ (أمر تنفيذي صدر عام ٢٠٢٢ رفع العتبة وأضاف اختباراً فرعياً منفصلاً بشأن الحديد/الصلب الأجنبي دون ٥٪، غير محتسَب هنا). يحصل العرض المحلي المؤهَّل على ميزة تقييمية، لا خصماً من سعره: تضيف لائحة الاستحواذ الفيدرالية (⁦FAR 25.105⁩) ٢٠٪ لعروض الشركات الكبرى الأجنبية المنافسة، أو ٣٠٪ للشركات الصغيرة (يُطبَّق معدَّل الشركات الكبرى ما لم تُحدَّد صفة الشركة الصغيرة). يُعلَّق هذا التفضيل فوق عتبة اتفاقية التجارة (١٧٤٬٠٠٠ دولار للبنود المشمولة بمنظمة التجارة العالمية حتى مارس ٢٠٢٦)، وفوقها يُطبَّق اختبار "منتج نهائي من دولة معتمدة" بدلاً منه. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد العتبة والهامش مع مسؤول التعاقد.',
  },
  'usa-baba-infrastructure-gate': {
    country: 'USA', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameEn: 'Build America, Buy America Act Infrastructure Gate', programNameAr: 'بوابة قانون بناء أمريكا وشراء أمريكا للبنية التحتية',
    mechanismType: 'category-eligibility-gate', program: 'usa-baba-infrastructure-gate',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: 'This program is calculated: the Build America, Buy America Act (BABA, Title IX of the 2021 Infrastructure Investment and Jobs Act) requires all iron and steel in a federally-funded infrastructure project to be produced in the US (every process from initial melting), all construction materials to be US-manufactured, and manufactured products to clear a minimum 55% domestic-component-cost threshold. It\'s triggered by receipt of federal infrastructure funding, not by the buyer\'s own government/private status, and administered per-agency (DOT/FHWA, EPA, HUD, DOE each issue their own guidance and waivers). Public-interest, non-availability, and unreasonable-cost waivers can exempt a project entirely; this platform cannot see waiver status from bid data alone, so you must state the post-waiver eligibility outcome. No national phase-in schedule above 55% was found. Last checked 22 Oct 2026. Confirm waiver status with the funding agency.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: يشترط قانون بناء أمريكا وشراء أمريكا (BABA، الباب التاسع من قانون الاستثمار في البنية التحتية لعام ٢٠٢١) أن يكون كل الحديد والصلب المستخدم في مشروع بنية تحتية ممول فيدرالياً منتَجاً داخل الولايات المتحدة (كل مرحلة بدءاً من الصهر الأولي)، وأن تكون كل مواد البناء مصنَّعة أمريكياً، وأن تبلغ المنتجات المصنَّعة عتبة دنيا ٥٥٪ من تكلفة المكوِّنات المحلية. يُفعَّل هذا البرنامج بتلقي التمويل الفيدرالي للبنية التحتية، لا بصفة المشتري نفسه، ويُدار لكل جهة على حدة (إدارة الطرق الفيدرالية، وكالة حماية البيئة، الإسكان، الطاقة، ولكل منها إرشاداتها وإعفاءاتها الخاصة). يمكن لإعفاءات المصلحة العامة أو عدم التوفر أو التكلفة غير المعقولة استثناء مشروع كامل؛ ولا يمكن لهذه المنصة رؤية حالة الإعفاء من بيانات العرض وحدها، فيجب تحديد نتيجة الأهلية بعد الإعفاء مباشرة. لم يُعثر على جدول تدرُّج وطني فوق ٥٥٪. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد حالة الإعفاء مع جهة التمويل.',
  },
  'usa-sba-small-business-setaside': {
    country: 'USA', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameEn: 'SBA Small Business Contracting Goal & Set-Aside', programNameAr: 'هدف وتخصيص التعاقد مع المنشآت الصغيرة (SBA)',
    mechanismType: 'spend-set-aside-target', program: 'usa-sba-small-business-setaside',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: US federal law (15 U.S.C. 644, FAR Part 19) sets a government-wide goal of 23% of contract dollars to small businesses, with sub-goals of 5% women-owned, 5% service-disabled veteran-owned, 5% small disadvantaged, and 3% HUBZone. The actual per-solicitation decision uses the 'Rule of Two': a contracting officer must set aside a solicitation if two or more small businesses are expected to bid at a fair price — based on that market, not a formula a supplier alone can resolve. This platform calculates your qualification status, not whether a given solicitation will be set aside. Last checked 22 Oct 2026, against SBA.gov's own guidance. Confirm your size-standard classification under 13 CFR Part 121 for your NAICS code.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يحدد القانون الفيدرالي الأمريكي (⁦15 U.S.C. 644⁩، وFAR الجزء ١٩) هدفاً حكومياً عاماً بنسبة ٢٣٪ من قيمة العقود للمنشآت الصغيرة، مع أهداف فرعية: ٥٪ للمملوكة من نساء، و٥٪ للمملوكة من ذوي الهمم من قدامى المحاربين، و٥٪ للمنشآت الصغيرة المحرومة، و٣٪ لمنشآت HUBZone. ويعتمد قرار كل مناقصة فعلياً على \"قاعدة الاثنين\": يجب على ضابط التعاقد تخصيص المناقصة للمنشآت الصغيرة إذا توقَّع تقدّم اثنتين أو أكثر منها بسعر عادل — وهذا يعتمد على سوق تلك المناقصة، لا على صيغة يحسمها المورّد بمفرده. وتحسب هذه المنصة حالة تأهلك، لا تخصيص مناقصة معينة. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦، بالرجوع إلى إرشادات SBA.gov الرسمية. يُفضَّل تأكيد تصنيف حجم منشأتك بموجب ⁦13 CFR⁩ الجزء ١٢١ لرمز NAICS الخاص بك.",
  },
  'usa-berry-amendment-dod': {
    country: 'USA', countryNameEn: 'United States', countryNameAr: 'الولايات المتحدة الأمريكية',
    programNameEn: 'Berry Amendment (DoD Textiles/Food/Tools) Coverage Gate', programNameAr: 'بوابة شمول تعديل بيري (منسوجات/أغذية/أدوات وزارة الدفاع)',
    mechanismType: 'category-eligibility-gate', program: 'usa-berry-amendment-dod',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: the Berry Amendment (10 U.S.C. 4862) requires Department of Defense purchases of textiles, food, and hand/measuring tools to be almost entirely domestically sourced, with no partial credit once a purchase is covered. Specialty metals are covered under a separate statute, not this one. This platform checks whether a purchase is Berry-covered at all, and — once covered — asks whether it clears the domestic-sourcing test after any substantial-transformation determination or non-availability exception; it cannot determine that compliance outcome from bid data alone. A purchase with unknown coverage or compliance status returns an incomplete result rather than a guess. Last checked 29 Sep 2026. Confirm Berry Amendment coverage and compliance status with your contracting officer.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُلزم تعديل بيري (⁦10 U.S.C. 4862⁩) مشتريات وزارة الدفاع الأمريكية من المنسوجات والأغذية والأدوات اليدوية/القياسية بأن تكون محلية المصدر بالكامل تقريباً، دون احتساب جزئي بعد شمول المشترى. وتخضع المعادن الخاصة لقانون منفصل، لا لهذا التعديل. وتتحقق هذه المنصة من شمول المشترى بتعديل بيري أصلاً، وإذا كان مشمولاً، تسأل عن استيفائه اختبار التوطين بعد أي تحديد لتحوّل جوهري أو إعفاء عدم توفر — ولا يمكنها تحديد نتيجة الامتثال هذه من بيانات العطاء وحدها. ويُعاد لمشترى غير معروف الشمول أو الامتثال نتيجة غير مكتملة لا تخميناً. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦. يُفضَّل تأكيد شمول تعديل بيري وحالة الامتثال مع ضابط التعاقد.",
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
    sourceNoteEn: 'This program is calculated: China\'s State Council General Office Document [2025] No. 34 (effective 1 Jan 2026) grants a flat 20% price-evaluation deduction to bids featuring domestic products. Domestic-product status is reached via either of two independent paths: (1) this specific product passes a substantial-transformation-in-China test (excludes simple assembly, packaging, or relabeling; a cost-ratio threshold is pending), or (2) for a mixed-category bundle, domestically-made products reach at least 80% of total bundle cost, applying the same 20% deduction to the whole bundle. China\'s Government Procurement Law (Article 10) mandated domestic purchase for decades without defining \'domestic product\' — Document 34/2025, plus a 19 Dec 2025 joint Ministry opinion (customs-zone products count as Made-in-China; no discrimination by registration), is the first definition. Last checked 22 Oct 2026. Confirm your product\'s classification with the procuring entity.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: تمنح وثيقة مكتب مجلس الدولة العام رقم ⁦[2025] 34⁩ (سارية من ١ يناير ٢٠٢٦) خصم تقييم سعري ثابتاً بنسبة ٢٠٪ للعروض التي تتضمن منتجات محلية. يتحقق تصنيف "المنتج المحلي" عبر أحد مسارين مستقلين: (١) اجتياز هذا المنتج تحديداً لاختبار التحول الجوهري داخل الصين (يستثني التجميع البسيط أو التعبئة أو إعادة التوسيم؛ وعتبة نسبة التكلفة المحلية لكل فئة لا تزال قيد النشر)، أو (٢) بالنسبة لحزمة مشتريات مختلطة، بلوغ المنتجات المصنوعة محلياً ٨٠٪ على الأقل من إجمالي تكلفة الحزمة، فيُطبَّق نفس خصم الـ٢٠٪ على الحزمة كاملة. ألزمت المادة العاشرة من قانون المشتريات الحكومية بالشراء المحلي افتراضياً لعقود دون تعريف "المنتج المحلي" رسمياً — ووثيقة ٣٤/٢٠٢٥، مع رأي تفسيري مشترك صدر ١٩ ديسمبر ٢٠٢٥ (منتجات المناطق الجمركية الخاصة تُعد صينية الصنع؛ لا تمييز بحسب التسجيل أو الملكية أو الجنسية)، هو أول تعريف حقيقي. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد تصنيف منتجك مع الجهة المشترية.',
  },
  'cn-govt-procurement-law-domestic-mandate': {
    country: 'CN', countryNameEn: 'China', countryNameAr: 'جمهورية الصين الشعبية',
    programNameEn: 'Government Procurement Law Article 10 Domestic Mandate', programNameAr: 'تفويض المادة العاشرة من قانون المشتريات الحكومية',
    mechanismType: 'category-eligibility-gate', program: 'cn-govt-procurement-law-domestic-mandate',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: China's Government Procurement Law (Article 10, enacted 2002, last amended 2014) requires government purchases to default to domestic goods, engineering, and services, unless one of three exemptions applies — the item is unavailable domestically or on reasonable commercial terms, the purchase is for use outside China, or another law provides otherwise. Where no exemption applies, the supplier's product must also meet the domestic-product cost-ratio test set out in the Ministry of Finance's 2025 Notice (Guobanfa [2025] No. 34). This is a bid-eligibility gate, not a price preference layered on top of open competition. Last checked 22 Oct 2026, against the Law's own text and the 2025 Notice. Confirm with the procuring entity whether an exemption applies to your specific tender.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُلزم قانون المشتريات الحكومية الصيني (المادة العاشرة، الصادر عام ٢٠٠٢ وآخر تعديل له عام ٢٠١٤) المشتريات الحكومية بشراء السلع والأشغال والخدمات المحلية افتراضياً، إلا في حال انطباق أحد ثلاثة إعفاءات — عدم توفر السلعة محلياً أو بشروط تجارية معقولة، أو أن تكون المشتريات لاستخدام خارج الصين، أو وجود قانون آخر ينص على خلاف ذلك. وفي حال عدم انطباق أي إعفاء، يجب أن يستوفي منتج المورّد أيضاً اختبار نسبة التكلفة المحلية الوارد في إشعار وزارة المالية لعام ٢٠٢٥ (⁦Guobanfa [2025] No. 34⁩). وهذه بوابة أهلية للعطاء نفسه، لا تفضيلاً سعرياً يُضاف فوق منافسة مفتوحة. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦، بالرجوع إلى نص القانون نفسه وإشعار ٢٠٢٥. يُفضَّل التأكد من جهة الشراء بشأن انطباق أي إعفاء على مناقصتك المحددة.",
  },
  'cn-sme-price-deduction': {
    country: 'CN', countryNameEn: 'China', countryNameAr: 'جمهورية الصين الشعبية',
    programNameEn: 'SME Government Procurement Price Deduction (Cai Ku [2020] No. 46 / [2022] No. 19)', programNameAr: 'خصم تقييم سعري في المشتريات الحكومية لصالح المنشآت الصغيرة والمتوسطة (财库〔2020〕46号 / 财库〔2022〕19号)',
    mechanismType: 'price-preference-margin', program: 'cn-sme-price-deduction',
    applicableContexts: ['government'],
    sourceNoteEn: 'This program is calculated: China\'s Cai Ku [2020] No. 46 (effective 1 Jan 2021) set a price-evaluation deduction of 6%-10% (3%-5% for engineering works) for small/micro enterprises bidding directly, and 2%-3% (1%-2% engineering) for large/medium enterprises subcontracting to or forming a consortium with small enterprises — conditioned on the small-enterprise share reaching at least 30% of contract value; below 30%, the deduction is zero, not partial. Cai Ku [2022] No. 19 (effective 1 Jul 2022) roughly doubled the goods/services ranges (direct: 10%-20%; consortium: 4%-6%), leaving the engineering-works ranges unchanged. Each range is genuine — the procuring entity sets the exact figure within it. This platform shows the legal floor as the guaranteed minimum, with the ceiling in a separate field. Last checked 22 Oct 2026. Confirm your procurement\'s exact rate with the procuring entity.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: حدَّد تعميم الخزانة الصيني ⁦Cai Ku [2020]⁩ رقم ٤٦ (ساري من ١ يناير ٢٠٢١) خصم تقييم سعري بنسبة ٦٪-١٠٪ (٣٪-٥٪ لأعمال الهندسة) للمنشآت الصغيرة/متناهية الصغر المتقدِّمة مباشرة، وخصماً أصغر ٢٪-٣٪ (١٪-٢٪ للهندسة) للمنشآت الكبيرة/المتوسطة التي تتعاقد من الباطن مع منشآت صغيرة أو تُشكِّل تحالفاً معها — بشرط بلوغ حصة المنشأة الصغيرة ٣٠٪ على الأقل من قيمة العقد؛ ودون هذه النسبة يكون الخصم صفراً لا جزئياً. وتعميم ⁦Cai Ku [2022]⁩ رقم ١٩ (ساري من ١ يوليو ٢٠٢٢) ضاعف تقريباً نطاقي السلع/الخدمات (مباشر: ١٠٪-٢٠٪؛ تحالف/باطن: ٤٪-٦٪) دون تغيير نطاقات الهندسة. كل نطاق هو نطاق حقيقي — تحدد الجهة المشترية الرقم الدقيق ضمنه في وثائق مناقصتها. تعرض هذه المنصة الحد الأدنى القانوني كضمان أدنى، مع سقف منفصل في حقل آخر. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد النسبة الدقيقة لمشترياتك مع الجهة المشترية.',
  },
  'cn-defense-domestic-sourcing': {
    country: 'CN', countryNameEn: 'China', countryNameAr: 'جمهورية الصين الشعبية',
    programNameEn: 'PLA / Military-Civil Fusion Defense Sourcing -- not yet sourced', programNameAr: 'مشتريات الدفاع لجيش التحرير الشعبي / الاندماج المدني العسكري — غير موثّق بعد',
    mechanismType: 'not-yet-sourced', program: 'cn-defense-domestic-sourcing',
    applicableContexts: [],
    sourceNoteEn: "No published numeric threshold exists for China's defense domestic-sourcing requirement, so this program is shown for reference and is not calculated. China's defense procurement runs under the Military-Civil Fusion strategy and the Central Military Commission's Equipment Development Department, which issue classified or internal rules rather than a public statute with a number. China's general government-procurement rule (Ministry of Finance Notice, Guobanfa [2025] No. 34, effective 1 Jan 2026) covers defense procurement too, but explicitly defers its cost-ratio thresholds to a multi-year rulemaking process not yet complete. This is a confirmed publication gap, not a research gap. Last checked 2 Oct 2026. Ask the contracting defense entity directly for its current domestic-sourcing requirement.",
    sourceNoteAr: "لا توجد عتبة رقمية منشورة لتوطين مشتريات الدفاع الصينية، ولذلك يُعرض هذا البرنامج للاطلاع فقط ولا يُحتسب. تُدار مشتريات الدفاع الصينية بموجب استراتيجية الاندماج المدني العسكري وإدارة تطوير التسليح التابعة للجنة العسكرية المركزية، وتصدر هاتان الجهتان لوائح سرية أو داخلية بدلاً من قانون منشور يحمل رقماً. وتشمل اللائحة العامة الصينية للمشتريات الحكومية (إشعار وزارة المالية ⁦Guobanfa [2025] No. 34⁩، النافذ من ١ يناير ٢٠٢٦) مشتريات الدفاع أيضاً، لكنها تؤجل صراحة عتبات نسبة التكلفة إلى عملية وضع لوائح متعددة السنوات لم تكتمل بعد. وهذه فجوة نشر مؤكَّدة، لا فجوة بحث. تاريخ آخر مراجعة: ٢ أكتوبر ٢٠٢٦. يُفضَّل سؤال جهة التعاقد الدفاعية مباشرة عن المتطلبات الحالية.",
  },
};

// ---------------------------------------------------------------------------
// Section 1h -- India (IN), Germany (DE), Japan (JP), South Korea (KR).
// 17 Sep 2026: the India/Germany/Japan/Korea batch (13th-16th countries).
// Researched fresh per the platform owner's brief: India gets a genuinely
// new three-tier classification gate (Class-I/Class-II/Non-local) feeding
// the shared price-preference-margin primitive, plus an honest not-yet-
// sourced DAP 2020 defense-offset entry; Germany is a confirmed-ABSENT
// finding (no unilateral local-content mechanism -- EU/WTO GPA non-
// discrimination law -- disclosed as a genuine negative result, not a
// research gap) plus an honest not-yet-sourced EDIP defense-industrial
// entry; Japan gets a genuinely new caller-supplied-target wrapper because
// its SME procurement target is not fixed by statute (set fresh each
// fiscal year by Cabinet decision); Korea gets a genuinely new 2-way
// category-selector wrapper (overall vs. technology-development SME
// target) plus a legitimate thin-wrapper reuse of the existing category-
// eligibility-gate primitive for its SME-exclusive competitive-products
// scheme (the same "reuse when genuinely identical, invent when not"
// discipline already applied throughout this file).
// ---------------------------------------------------------------------------

const IN_PROGRAMS: Record<'in-make-in-india-price-preference' | 'in-dap-2020-defense-offset', CountryFrameworkInfo> = {
  'in-make-in-india-price-preference': {
    country: 'IN', countryNameEn: 'India', countryNameAr: 'جمهورية الهند',
    programNameEn: 'Make in India Purchase Preference (PPP-MII Order 2017)', programNameAr: 'تفضيل الشراء لصنع في الهند (أمر تفضيل صنع في الهند للمشتريات الحكومية لعام 2017)',
    mechanismType: 'price-preference-margin', program: 'in-make-in-india-price-preference',
    applicableContexts: ['government'],
    sourceNoteEn: 'This program is calculated: India\'s Public Procurement (Preference to Make in India) Order 2017 (DPIIT, revised 4 June 2020) classifies bidders into three tiers: Class-I (local content 50% or more), Class-II (20%-50%), and Non-Local (20% or less). Only Class-I suppliers get the Order\'s 20% margin of purchase preference — the maximum a Class-I bid may exceed the lowest bid (L1) and still be invited to match it. For divisible procurement, 50% goes to L1 and 50% to the lowest-price matching Class-I bidder; for non-divisible procurement, the lowest-price Class-I bidder gets first right to match. Class-II suppliers may bid under Rs 200 crore tenders but get no price-match right; Non-Local suppliers are excluded, subject to ministry exceptions. Nodal ministries may set higher thresholds. Last checked 22 Oct 2026. Confirm your tier classification with the procuring ministry.',
    sourceNoteAr: 'هذا البرنامج قابل للحساب: يصنِّف أمر الهند للتفضيل لـ"صنع في الهند" (٢٠١٧، بإصدار وزارة ترويج الصناعة والتجارة الداخلية DPIIT، والمعدَّل بأمر ٤ يونيو ٢٠٢٠) العارضين إلى ثلاث فئات: الفئة الأولى (محتوى محلي ٥٠٪ فأكثر)، الفئة الثانية (٢٠٪-٥٠٪)، وغير المحلي (٢٠٪ أو أقل). فقط موردو الفئة الأولى يحصلون على هامش تفضيل الشراء بنسبة ٢٠٪ بموجب الأمر — أقصى ما يمكن أن يتجاوز به عرض الفئة الأولى أقل عرض (⁦L1⁩) ويُدعى رغم ذلك لمجاراته. في المشتريات القابلة للتجزئة، يُمنح ٥٠٪ من العقد لـ⁦L1⁩ و٥٠٪ لأقل عارض فئة أولى يوافق على مجاراته؛ وفي غير القابلة للتجزئة، يحصل أقل عارض فئة أولى على حق الأولوية بمجاراة ⁦L1⁩. يمكن لموردي الفئة الثانية التقدُّم للمناقصات دون ٢٠٠ كرور روبية دون حق مجاراة السعر؛ ويُستبعَد غير المحليين، مع استثناءات حسب الوزارة. يجوز للوزارات تحديد عتبات أعلى. تاريخ آخر مراجعة: ٢٢ أكتوبر ٢٠٢٦. يُفضَّل تأكيد تصنيف فئتك مع الوزارة المعنية.',
  },
  'in-dap-2020-defense-offset': {
    country: 'IN', countryNameEn: 'India', countryNameAr: 'جمهورية الهند',
    programNameEn: 'Defence Acquisition Procedure 2020 Offset Multiplier Gate (Buy Global)', programNameAr: 'بوابة مضاعِف مقاصة إجراء اقتناء الدفاع لعام 2020 (فئة الشراء العالمي)',
    mechanismType: 'offset-multiplier-credit-gate', program: 'in-dap-2020-defense-offset',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: under India's Defence Acquisition Procedure (DAP) 2020, a Buy (Global) contract worth INR 2,000 crore or more carries an offset obligation of 30% of contract value, discharged through one selected avenue multiplier (direct purchase/export = 1.0; components = 0.5; MSME-channeled = 1.5; defense-manufacturing investment = 1.5; industrial-corridor investment = 2.0; technology transfer = 2.0; government/DRDO technology acquisition = 3.0; critical-technology acquisition = 4.0). Multipliers cannot be combined across avenues. This covers Ministry of Defence Buy (Global) purchases only, not the separate Make-in-India price preference. A draft DAP 2026 exists but is not yet finalized, so DAP 2020 remains current. Last checked 1 Oct 2026, against two independent legal analyses (mondaq.com, lexcounsel.in). Confirm your offset avenue selection with the Ministry of Defence before committing.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: بموجب إجراء اقتناء الدفاع الهندي (DAP) لعام ٢٠٢٠، تحمل عقود الشراء العالمي التي تبلغ قيمتها ٢٠٠٠ كرور روبية أو أكثر التزام مقاصة بنسبة ٣٠٪ من قيمة العقد، يُستوفى عبر مضاعِف قناة واحدة يختارها المورّد (شراء مباشر/تصدير = ١.٠؛ مكوّنات = ٠.٥؛ استيفاء عبر منشآت صغيرة ومتوسطة = ١.٥؛ استثمار في التصنيع الدفاعي = ١.٥؛ استثمار في ممر صناعي = ٢.٠؛ نقل تقنية = ٢.٠؛ اكتساب تقنية حكومية/DRDO = ٣.٠؛ اكتساب تقنية حرجة = ٤.٠). ولا يمكن جمع المضاعِفات بين القنوات. ويخص هذا مشتريات وزارة الدفاع من فئة الشراء العالمي فقط، لا تفضيل صنع في الهند المنفصل. وتوجد مسودة ⁦DAP 2026⁩ لكنها لم تُعتمد نهائياً، فيبقى ⁦DAP 2020⁩ سارياً. تاريخ آخر مراجعة: ١ أكتوبر ٢٠٢٦، بالرجوع إلى تحليلين قانونيين مستقلين (mondaq.com وlexcounsel.in). يُفضَّل تأكيد اختيار قناة المقاصة مع وزارة الدفاع قبل الالتزام.",
  },
};

const DE_PROGRAMS: Record<'de-eu-gpa-non-discrimination-baseline' | 'de-edip-defense-local-content', CountryFrameworkInfo> = {
  'de-eu-gpa-non-discrimination-baseline': {
    country: 'DE', countryNameEn: 'Germany', countryNameAr: 'جمهورية ألمانيا الاتحادية',
    programNameEn: 'No Unilateral Local-Content Preference -- confirmed absent (EU/WTO GPA non-discrimination)', programNameAr: 'لا يوجد تفضيل أحادي للمحتوى المحلي — غياب مؤكَّد (عدم التمييز بموجب الاتحاد الأوروبي ومنظمة التجارة العالمية)',
    mechanismType: 'not-yet-sourced', program: 'de-eu-gpa-non-discrimination-baseline',
    applicableContexts: [],
    sourceNoteEn: "Germany has no local-content price preference or set-aside in general civil procurement — confirmed absent, not simply unresearched. As an EU member, Germany procures under EU rules (Directive 2014/24/EU) and the WTO Government Procurement Agreement, both requiring equal treatment of suppliers and banning offset-style local-content requirements. The only related mechanism is the EU-level European Defence Industry Programme, a narrow defense co-funding rule modeled separately, not a German civil-procurement preference. On 9 Sep 2026 the European Commission proposed an EU Public Procurement Act that would add an EU-content preference, but as of this check it remains a proposal, with feedback open until 16 Nov 2026 and no agreement expected before late 2027. Last checked 1 Oct 2026. Watch the EU Public Procurement Act's progress if this could affect your bid.",
    sourceNoteAr: "لا تملك ألمانيا تفضيلاً سعرياً أو حصة مخصصة للمحتوى المحلي في المشتريات المدنية العامة — وهذا غياب مؤكَّد لا مجرد عدم بحث. تشتري ألمانيا، بصفتها عضواً في الاتحاد الأوروبي، بموجب قواعد الاتحاد (التوجيه ⁦2014/24/EU⁩) واتفاقية منظمة التجارة العالمية للمشتريات الحكومية، وكلاهما يُلزم بمعاملة متساوية للموردين ويحظر شروط المحتوى المحلي من نوع المقاصة. الآلية الوحيدة ذات الصلة هي برنامج الصناعة الدفاعية الأوروبي، وهو قاعدة أهلية تمويل دفاعي ضيقة النطاق محسوبة بشكل مستقل، لا تفضيلاً للمشتريات المدنية الألمانية. وفي ٩ سبتمبر ٢٠٢٦ قدّمت المفوضية الأوروبية مشروع قانون مشتريات عامة يتضمن تفضيلاً للمحتوى الأوروبي، لكنه حتى هذا التحقق لا يزال مقترحاً، وجمع الملاحظات مفتوح حتى ١٦ نوفمبر ٢٠٢٦ ولا يُتوقع اتفاق قبل أواخر ٢٠٢٧. تاريخ آخر مراجعة: ١ أكتوبر ٢٠٢٦. يُفضَّل متابعة تطور مشروع القانون الأوروبي إذا كان سيؤثر على عطائك.",
  },
  'de-edip-defense-local-content': {
    country: 'DE', countryNameEn: 'Germany', countryNameAr: 'جمهورية ألمانيا الاتحادية',
    programNameEn: 'European Defence Industry Programme (EDIP) EU-Content Threshold Gate', programNameAr: 'بوابة عتبة المحتوى الأوروبي لبرنامج الصناعة الدفاعية الأوروبي (EDIP)',
    mechanismType: 'eu-content-threshold-gate', program: 'de-edip-defense-local-content',
    applicableContexts: ['semi-government-soe'],
    sourceNoteEn: "This program is calculated: to qualify for EU co-funding under the European Defence Industry Programme, at least 65% of a covered product's value must come from EU or associated-country content (no more than 35% from elsewhere). EDIP Regulation (EU) 2025/2643 took effect 30 December 2025; the 65%/35% figures are confirmed by two independent legal analyses (CMS and Gleiss Lutz), though the exact article number they cite could not be independently verified against the EU's own text. This applies to EU co-funding eligibility for defense-industrial consortia, not to German civil tenders, which have no comparable preference (see the related program below). Last checked 1 Oct 2026. Confirm current EDIP call terms with the European Commission before applying for co-funding.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: للتأهل للتمويل المشترك الأوروبي بموجب برنامج الصناعة الدفاعية الأوروبي (EDIP)، يجب أن تبلغ نسبة المحتوى الأوروبي أو من دول منتسبة ٦٥٪ على الأقل من قيمة المنتج المشمول (بحد أقصى ٣٥٪ من مصادر أخرى). دخلت لائحة EDIP رقم ⁦(EU) 2025/2643⁩ حيز النفاذ في ٣٠ ديسمبر ٢٠٢٥؛ وتؤكد رقمي ٦٥٪/٣٥٪ مقالتان قانونيتان مستقلتان (CMS وGleiss Lutz)، مع أن رقم المادة المحدد الذي تستشهدان به لم يتسنَّ تأكيده بشكل مستقل من نص الاتحاد الأوروبي نفسه. وينطبق هذا على أهلية التمويل المشترك لائتلافات الصناعة الدفاعية، لا على المناقصات المدنية الألمانية التي لا تملك تفضيلاً مماثلاً (انظر البرنامج المرتبط أدناه). تاريخ آخر مراجعة: ١ أكتوبر ٢٠٢٦. يُفضَّل التأكد من شروط دعوة EDIP الحالية لدى المفوضية الأوروبية قبل التقديم للتمويل المشترك.",
  },
};

const JP_PROGRAMS: Record<'jp-kankoju-sme-target-ratio', CountryFrameworkInfo> = {
  'jp-kankoju-sme-target-ratio': {
    country: 'JP', countryNameEn: 'Japan', countryNameAr: 'اليابان',
    programNameEn: 'Kankouju SME Government-Contract Target Ratio', programNameAr: 'نسبة استهداف المشتريات الحكومية للمنشآت الصغيرة والمتوسطة (كانكوجو)',
    mechanismType: 'spend-set-aside-target', program: 'jp-kankoju-sme-target-ratio',
    applicableContexts: ['government'],
    sourceNoteEn: "This program is calculated: Japan's Kankouju Law (1966) requires the government to set a new SME-procurement target every fiscal year by Cabinet decision, rather than fixing one percentage permanently. For FY2025 (decided 22 Apr 2025), the target is 61% of government contracts going to SMEs/small enterprises overall, plus a separate sub-target of at least 3% of contract value specifically for new SME contractors — both up from the FY2013 reference figure of 56%. Each year's own figure must be read from that year's Cabinet Basic Policy document, published around April by Japan's Ministry of Economy, Trade and Industry. Last checked 29 Sep 2026, against METI's own 22 Apr 2025 press release. Confirm the current fiscal year's target with METI before relying on an older figure.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُلزم قانون كانكوجو الياباني (١٩٦٦) الحكومة بتحديد هدف جديد لمشتريات المنشآت الصغيرة والمتوسطة كل سنة مالية بقرار من مجلس الوزراء، بدلاً من تثبيت نسبة واحدة دائمة. وبالنسبة للسنة المالية ٢٠٢٥ (المقرَّرة في ٢٢ أبريل ٢٠٢٥)، يبلغ الهدف ٦١٪ من العقود الحكومية للمنشآت الصغيرة والمتناهية الصغر إجمالاً، إضافة إلى هدف فرعي منفصل لا يقل عن ٣٪ من قيمة العقود للمتعاقدين الجدد تحديداً — وكلاهما أعلى من الرقم المرجعي لعام ٢٠١٣ البالغ ٥٦٪. ويجب قراءة رقم كل سنة من وثيقة السياسة الأساسية الخاصة بها، التي تُنشَر في أبريل تقريباً من وزارة الاقتصاد والتجارة والصناعة اليابانية. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦، بالرجوع إلى البيان الصحفي الرسمي للوزارة بتاريخ ٢٢ أبريل ٢٠٢٥. يُفضَّل تأكيد هدف السنة المالية الحالية مع الوزارة قبل الاعتماد على رقم أقدم.",
  },
};

const KR_PROGRAMS: Record<'kr-sme-purchase-target-ratio' | 'kr-sme-competitive-products-gate', CountryFrameworkInfo> = {
  'kr-sme-purchase-target-ratio': {
    country: 'KR', countryNameEn: 'South Korea', countryNameAr: 'جمهورية كوريا الجنوبية',
    programNameEn: 'SME Product Purchase Target Ratio System', programNameAr: 'نظام نسبة استهداف شراء منتجات المنشآت الصغيرة والمتوسطة',
    mechanismType: 'spend-set-aside-target', program: 'kr-sme-purchase-target-ratio',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "This program is calculated: South Korea's SME Product Purchase Promotion Act (Article 5) sets two separate purchase targets for public institutions: an overall SME-product target of at least 50% of total procurement value, and a technology-development-product sub-target of at least 15% within SME goods purchases specifically. A caller must specify which target applies. In 2025, 847 public institutions purchased a combined KRW 126.2 trillion of SME products, exceeding their own plan — a real compliance data point, not a substitute for the statutory targets themselves. This is a different mechanism from the related category-eligibility program above, which covers specific designated products rather than overall spend targets. Last checked 29 Sep 2026, against the Ministry of SMEs and Startups' own figures. Confirm which of the two targets applies to your procurement.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يحدد قانون تيسير شراء منتجات المنشآت الصغيرة والمتوسطة الكوري (المادة ٥) هدفين منفصلين للمؤسسات العامة: هدف شراء عام للمنشآت الصغيرة والمتوسطة لا يقل عن ٥٠٪ من إجمالي قيمة المشتريات، وهدف فرعي لا يقل عن ١٥٪ لمنتجات التطوير التقني ضمن مشتريات هذه المنشآت تحديداً. ويجب تحديد أي الهدفين ينطبق. وفي عام ٢٠٢٥، اشترت ٨٤٧ مؤسسة عامة ما مجموعه ١٢٦.٢ تريليون وون من منتجات هذه المنشآت، متجاوزة خطتها — وهي نقطة بيانات امتثال حقيقية، لا بديلاً عن الهدفين القانونيين أنفسهما. وهذا يختلف عن برنامج بوابة الفئات المحددة أعلاه، الذي يغطي منتجات مُصنَّفة تحديداً لا أهداف إنفاق عامة. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦، بالرجوع إلى أرقام الوزارة الرسمية. يُفضَّل تأكيد أي من الهدفين ينطبق على مشترياتك.",
  },
  'kr-sme-competitive-products-gate': {
    country: 'KR', countryNameEn: 'South Korea', countryNameAr: 'جمهورية كوريا الجنوبية',
    programNameEn: 'SME-Exclusive Competitive Products Designation', programNameAr: 'تصنيف المنتجات التنافسية الحصرية للمنشآت الصغيرة والمتوسطة',
    mechanismType: 'category-eligibility-gate', program: 'kr-sme-competitive-products-gate',
    applicableContexts: ['government', 'semi-government-soe'],
    sourceNoteEn: "This program is calculated: South Korea's SME Product Purchase Promotion Act (Articles 4, 8, 9) requires public institutions to buy designated product categories directly from small/medium enterprises certified as the direct producer, not a reseller. The 2025-2027 designation (effective 1 Jan 2025) lists 610 product items, administered by the Ministry of SMEs and Startups since 2007. This differs from the related purchase-target-ratio program below, which covers overall SME spend targets rather than specific designated categories. Qualification depends on both the product category being on the designated list and the supplier holding direct-production certification. Last checked 29 Sep 2026, against the Ministry's own 2025-2027 designation announcement. Confirm your product is on the current designated list and that you hold valid direct-production certification.",
    sourceNoteAr: "هذا البرنامج قابل للحساب: يُلزم قانون تيسير شراء منتجات المنشآت الصغيرة والمتوسطة الكوري (المواد ٤ و٨ و٩) المؤسسات العامة بالشراء المباشر من منشآت صغيرة ومتوسطة معتمدة كمُنتِج مباشر، لا كموزِّع، لفئات منتجات محددة. وتُدرج دورة التصنيف ٢٠٢٥-٢٠٢٧ (النافذة من ١ يناير ٢٠٢٥) ٦١٠ بنود منتجات، وتديرها وزارة المنشآت الصغيرة والمتوسطة والشركات الناشئة منذ عام ٢٠٠٧. ويختلف هذا عن برنامج نسبة استهداف الشراء أدناه، الذي يغطي أهداف إنفاق عامة للمنشآت الصغيرة والمتوسطة لا فئات محددة. ويعتمد التأهل على وجود المنتج في القائمة المصنَّفة الحالية وحيازة المورّد شهادة إنتاج مباشر سارية. تاريخ آخر مراجعة: ٢٩ سبتمبر ٢٠٢٦، بالرجوع إلى إعلان الوزارة الرسمي لدورة ٢٠٢٥-٢٠٢٧. يُفضَّل التأكد من وجود منتجك في القائمة الحالية وحيازتك شهادة إنتاج مباشر سارية.",
  },
};

export const PROGRAMS: Record<LocalContentProgram, CountryFrameworkInfo> = {
  ...SA_PROGRAMS, ...AE_PROGRAMS, ...JO_OM_QA_BH_KW_PROGRAMS, ...EG_PROGRAMS, ...TR_PROGRAMS, ...UK_PROGRAMS, ...USA_PROGRAMS, ...CN_PROGRAMS,
  ...IN_PROGRAMS, ...DE_PROGRAMS, ...JP_PROGRAMS, ...KR_PROGRAMS,
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
  IN: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.IN],
  DE: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.DE],
  JP: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.JP],
  KR: PROGRAMS[DEFAULT_PROGRAM_BY_COUNTRY.KR],
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
  /** stc Rawafed local-content program (SA / 'sa-rawafed-stc', new 18 Sep
   * 2026) -- SAR, per stc's own official 2021 Rawafed Annual Report
   * formula (see PROGRAMS['sa-rawafed-stc'].sourceNoteEn): the SAME
   * 4-pillar eligible-spend-ratio shape as LCGPA's general score, computed
   * from stc's own audited local/total breakdown rather than the
   * supplier's own labor/goods split used for `sa`. */
  rawafedStc?: {
    localGoodsServicesSAR: number | null; totalGoodsServicesSAR: number | null;
    localSalariesSAR: number | null; totalSalariesSAR: number | null;
    localAssetDepreciationSAR: number | null; totalAssetDepreciationSAR: number | null;
    localCapacityDevelopmentSAR: number | null; totalCapacityDevelopmentSAR: number | null;
  };
  /** SABIC per-contract local-content commitment gate (SA / 'sa-sabic-lc-
   * commitment', new 18 Sep 2026) -- deliberately NOT a spend breakdown:
   * SABIC's real practice is a per-contract negotiated target audited
   * against actual delivered performance (see PROGRAMS['sa-sabic-lc-
   * commitment'].sourceNoteEn), so this mechanism's only inputs are the
   * two percentages the contract and its audit actually produce. */
  sabicLcCommitment?: {
    /** This specific contract's own negotiated local-content target (0-
     * 100), NOT a fixed SABIC-wide rate -- there isn't one. */
    proposedTargetPct: number | null;
    /** The supplier's actual audited local-content performance (0-100)
     * against that same contract's target. */
    actualAuditedPct: number | null;
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
  /** GCC Unified Economic Agreement Article 3 rules-of-origin inputs (AE /
   * 'ae-gcc-origin-treatment', new 20 Sep 2026) -- see PROGRAMS[
   * 'ae-gcc-origin-treatment'].sourceNoteEn for the full sourcing. Both
   * conditions of Article 3(1) are required together; neither is a
   * proxy/derivable from the other. */
  aeGccOrigin?: {
    /** % of the product's final value added through production within GCC
     * member states (Article 3(1)'s 40% threshold). */
    gccValueAddedPct: number | null;
    /** % ownership of the producing plant held by GCC member-state
     * citizens (Article 3(1)'s 51% threshold). */
    gccCitizenOwnershipPct: number | null;
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
  /** Tenders Law ICV consideration (QA / 'qa-tenders-icv', new 20 Sep 2026)
   * -- QAR, per the Tenders and Auctions Law (Law No. 24/2015) Executive
   * Regulations Article 2's self-certified/planned local-value definition
   * (see PROGRAMS['qa-tenders-icv'].sourceNoteEn for the full sourcing).
   * Deliberately a SINGLE combined pillar, not LCGPA's four -- Article 2
   * itself bundles works/services/national-human-resources development
   * into one definition, so splitting it further would not be sourced. */
  qaTendersIcv?: {
    /** Article 2's full local-value amount for this contract/bidder --
     * works, services, and/or national-human-resources development spent
     * within Qatar (self-certified via a prior-contract certificate, or
     * the bidder's own tender-submitted target-value plan). */
    localValueQAR: number | null;
    /** Total value of the same contract/tender this local value is being
     * measured against. */
    totalContractValueQAR: number | null;
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
  /** Kuwait Public Tenders Law national-product price preference (KW /
   * 'kw-tender-law-price-preference', new 20 Sep 2026) -- % of this bid's
   * value that is a certified national/GCC-origin product (self-reported,
   * caller-supplied), same continuously-scaled shape as Jordan/Saudi/
   * Oman-OQ. See PROGRAMS['kw-tender-law-price-preference'].sourceNoteEn
   * for the full sourcing and the two disclosed-but-not-modeled related
   * findings (a separate 10% Kuwaiti-company preference and a mandatory
   * 30% local-sourcing requirement, both investigated this same pass). */
  kwTenderLawPricePreference?: {
    bidValueNationalProductPct: number | null;
  };
  /** Bahrain Takamul Local Value Certificate preference (BH /
   * 'bh-takamul-local-value', new 29 Sep 2026 verify-then-extend pass) --
   * self-reported: does this supplier hold a Takamul (Local Value
   * Certificate) covering the product(s) being bid, per Cabinet Decision
   * No. (11-2679) as documented in Bahrain Tender Board's own Guideline
   * for Suppliers & Contractors v1.0 (Nov 2025). Genuinely distinct from
   * `bhSme` above -- a certified local-value-add credential, not a
   * company-size classification. */
  bhTakamul?: {
    hasLocalValueCertificate: boolean | null;
  };
  /** Bahrain Gulf-Made Products preference (BH / 'bh-gulf-made-preference',
   * new 29 Sep 2026 verify-then-extend pass) -- % of this bid's value that
   * is Gulf/GCC-origin product (self-reported, caller-supplied), same
   * continuously-scaled shape as Jordan/Saudi/Oman-OQ/Kuwait Art. 62, per
   * Decision No. (40) of 2015's GCC unified rules as documented in the
   * same Bahrain Tender Board guideline as `bhTakamul` above. */
  bhGulfMade?: {
    bidValueGulfOriginPct: number | null;
  };
  /** Kuwait Kuwaiti-nationality company price preference (KW /
   * 'kw-nationality-price-preference', new 29 Sep 2026 verify-then-extend
   * pass) -- self-reported: is this bidding company itself of Kuwaiti
   * nationality/ownership (a company-nationality test), as distinct from
   * `kwTenderLawPricePreference` above's product-origin test. See
   * PROGRAMS['kw-nationality-price-preference'].sourceNoteEn for the full
   * sourcing (trade.gov + tenderspedia.com, first flagged as a real
   * candidate fourth Kuwait program in a prior pass, now implemented). */
  kwNationality?: {
    isKuwaitiNationalityCompany: boolean | null;
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
  /** USA Berry Amendment DoD textiles/food/hand-tools domestic-sourcing
   * mandate (USA / 'usa-berry-amendment-dod', resolved 29 Sep 2026 verify-
   * then-extend pass -- see PROGRAMS['usa-berry-amendment-dod'].sourceNoteEn
   * for the full resolution rationale). The existing sourceNote already
   * disclosed the operative rule as binary -- "near-100% domestic, no
   * partial credit" -- once a purchase is Berry-covered at all; this pass
   * found no reason to keep that as not-yet-sourced merely because no
   * single percentage threshold exists, since the same "ask the caller for
   * the post-exception eligibility outcome directly" shape already used for
   * BABA's waiver toggle (see PROGRAMS['usa-baba-infrastructure-gate']) fits
   * a genuinely binary rule without fabricating a formula. Same two-toggle
   * category-eligibility-gate shape: is THIS purchase Berry-covered (a DoD
   * acquisition of textiles, food, or hand/measuring tools, above the
   * simplified acquisition threshold, not a specialty-metals purchase --
   * those were carved out to 10 U.S.C. 2533b in 2006 and are out of scope),
   * and does the item clear the domestic-sourcing test after every
   * substantial-transformation determination and non-availability exception
   * is applied (this engine cannot see exception status from a bid-level
   * input alone, the same disclosed limitation as BABA's waiver toggle). */
  usaBerry?: {
    isBerryCoveredDodPurchase: boolean | null;
    meetsBerryDomesticSourcingTest: boolean | null;
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

  /** India Make in India price preference (IN / 'in-make-in-india-price-
   * preference', 17 Sep 2026 India/Germany/Japan/Korea batch) -- % of this
   * bid's value that is local content under the PPP-MII Order's own
   * classification test (self-reported, caller-supplied). See PROGRAMS[
   * 'in-make-in-india-price-preference'].sourceNoteEn for the real
   * Class-I (>=50%) / Class-II (20-<50%) / Non-Local (<=20%) thresholds. */
  inMakeInIndia?: {
    localContentSharePct: number | null;
  };
  /** Japan Kankouju SME target ratio (JP / 'jp-kankoju-sme-target-ratio',
   * 17 Sep 2026 batch) -- genuinely different from every other spend-set-
   * aside program in this file: the target itself is NOT a fixed statutory
   * constant, so it must be supplied by the caller from the current fiscal
   * year's own Cabinet Basic Policy document (see PROGRAMS['jp-kankoju-sme-
   * target-ratio'].sourceNoteEn). */
  jp?: {
    /** The current fiscal year's published SME procurement target ratio
     * (0-100), read from that year's Basic Policy on Government Contracts
     * for SMEs. Null/omitted -- not defaulted to a stale figure -- means
     * insufficient data, not a fabricated current-year assumption. */
    policyYearTargetRatioPct: number | null;
    isSmeQualified: boolean | null;
  };
  /** Korea SME Product Purchase Target Ratio System (KR / 'kr-sme-
   * purchase-target-ratio', 17 Sep 2026 batch) -- a real 2-way category
   * selector between the 50% overall target and the 15% technology-
   * development-product sub-target (see PROGRAMS['kr-sme-purchase-target-
   * ratio'].sourceNoteEn). */
  krSmeTarget?: {
    productCategory: 'general-sme-product' | 'technology-development-product' | null;
    isSmeQualified: boolean | null;
  };
  /** Korea SME-Exclusive Competitive Products designation (KR / 'kr-sme-
   * competitive-products-gate', 17 Sep 2026 batch) -- same binary
   * category-eligibility-gate shape as Saudi/Oman's Mandatory List (see
   * PROGRAMS['kr-sme-competitive-products-gate'].sourceNoteEn). */
  krCompetitiveProducts?: {
    inDesignatedCompetitiveProductCategory: boolean | null;
    directProductionCertified: boolean | null;
  };
  /** Egypt National Automotive Industry Development Program (EG / 'eg-
   * auto-local-content', resolved 1 Oct 2026 verify-then-extend pass) --
   * an incentive-ELIGIBILITY gate, not the incentive-value calculator (see
   * PROGRAMS['eg-auto-local-content'].sourceNoteEn and
   * ProductionIncentiveEligibilityGateResult for the full disclosed
   * incentive-amount gap this deliberately does not compute). */
  egAuto?: {
    vehicleCategory: 'ice' | 'ev' | null;
    localContentPct: number | null;
    /** ICE only -- ignored for EV (no sourced price ceiling for EVs). */
    exFactoryPriceEGP: number | null;
    /** ICE only -- ignored for EV (no sourced engine-size ceiling for EVs). */
    engineCC: number | null;
    annualProductionUnits: number | null;
    /** ICE only -- no sourced per-model minimum for EV. */
    unitsPerModel: number | null;
  };
  /** Kuwait Public Tenders Law No. 49/2016, Article 87 (KW / 'kw-local-
   * content', resolved 1 Oct 2026, Module 08 twelve-gap closure pass) --
   * two independent 30% local-sourcing thresholds (see
   * PROGRAMS['kw-local-content'].sourceNoteEn and
   * DualLocalSourcingGateResult for the full sourcing and the disclosed
   * KD 75,000-threshold scoping note). */
  kwLocalContent?: {
    localMaterialsSharePct: number | null;
    localWorksSharePct: number | null;
  };
  /** India Defence Acquisition Procedure (DAP) 2020, Buy (Global) category
   * (IN / 'in-dap-2020-defense-offset', resolved 1 Oct 2026, Module 08
   * twelve-gap closure pass) -- see PROGRAMS['in-dap-2020-defense-offset']
   * .sourceNoteEn and OffsetMultiplierCreditGateResult for the full
   * sourcing, the avenue-multiplier table, and the DAP 2026 draft-status
   * disclosure. */
  inDap?: {
    contractValueINR: number | null;
    offsetAvenue:
      | 'eligible-products-direct-purchase'
      | 'eligible-product-components'
      | 'msme-investment'
      | 'defence-manufacturing-investment'
      | 'defence-industrial-corridor-investment'
      | 'technology-transfer-to-indian-enterprises'
      | 'technology-acquisition-by-drdo-government'
      | 'critical-technology-acquisition-by-drdo'
      | null;
    rawDischargedAmountINR: number | null;
  };
  /** Germany/EU European Defence Industry Programme (EDIP) Regulation (EU)
   * 2025/2643 (DE / 'de-edip-defense-local-content', resolved 1 Oct 2026,
   * Module 08 twelve-gap closure pass) -- see
   * PROGRAMS['de-edip-defense-local-content'].sourceNoteEn and
   * EuContentThresholdGateResult for the full sourcing, including the
   * disclosed single-sourced-article-number gap. */
  deEdip?: {
    euOrAssociatedContentPct: number | null;
  };
  /** Saudi GAMI Industrial Participation Policy, Version 1.0.0 (16/01/1441
   * AH / 15 Sep 2019 AD), adopted under Council of Ministers Resolution No.
   * (210) of 01/01/2019 AD (SA / 'sa-gami-defense', resolved 2 Oct 2026,
   * Module 08 nine-program closure pass) -- see
   * PROGRAMS['sa-gami-defense'].sourceNoteEn and
   * GamiValuationFactorCreditGateResult for the full sourcing, the
   * category/Valuation-Factor table, and the disclosed single-line-item
   * scope (multi-category aggregation and the 5-year/25%-cap credit-
   * banking system are NOT modeled -- see the type's own doc comment). */
  saGami?: {
    contractValueSAR: number | null;
    category: GamiValuationFactorCategory | null;
    /** Only meaningful for a ranged category (A.2, B.1-B.5) -- ignored for
     * the two fixed-factor categories (A.1, A.3), which always resolve to
     * 1.0 regardless of this input. */
    chosenFactor: number | null;
    baseActivityValueSAR: number | null;
    smeBonusApplies: boolean | null;
    soleSourceBonusApplies: boolean | null;
  };
  /** Turkey SSB Industrialization Guideline (2022, superseding the 2011
   * edition) (TR / 'tr-defense-offset', resolved 2 Oct 2026, Module 08
   * nine-program closure pass) -- see
   * PROGRAMS['tr-defense-offset'].sourceNoteEn and
   * TrIndustrializationLiabilityGateResult for the full sourcing and the
   * disclosed, deliberately-unmodeled mondaq.com "70% of bid amount"
   * figure conflict. */
  trDefenseOffset?: {
    contractValueTRY: number | null;
    ysSmeWorkSharePct: number | null;
    eydepWorkSharePct: number | null;
    techAcquisitionValueTRY: number | null;
  };
  /** Bahrain's Parliament-approved 20% Bahrainisation rule for government
   * tender bidders (BH / 'bh-bahrainisation-tender-workforce', resolved
   * 2 Oct 2026, Module 08 nine-program closure pass) -- see
   * PROGRAMS['bh-bahrainisation-tender-workforce'].sourceNoteEn for the
   * full sourcing and the disclosed gap against the Tender Board's own
   * Nov 2025 Guideline (which requires a certificate but delegates the
   * exact percentage to separate Ministry of Labour regulation) and the
   * separate, higher, 50% figure that applies only to privatised-state-
   * service contracts specifically (a different scope, not this gate). */
  bhBahrainisation?: {
    bahrainiWorkforceSharePct: number | null;
  };
  /** LCGPA's own 2023 Economic Participation (EP) Policy (SA /
   * 'sa-economic-participation-policy', resolved 2 Oct 2026, SA-LIKT/EP-
   * Policy + BH circular pass) -- see
   * PROGRAMS['sa-economic-participation-policy'].sourceNoteEn and
   * ImportValueParticipationGateResult for the full sourcing. Unlike
   * saGami above, there is no SME/sole-source bonus field here -- neither
   * is sourced for this policy, so none is offered as a caller input. */
  saEp?: {
    importedContentValueSAR: number | null;
    category: EpValuationFactorCategory | null;
    /** Only meaningful for a ranged category -- ignored for the two
     * fixed-factor categories (subcontracting, rnd), which always resolve
     * to their single disclosed value regardless of this input. */
    chosenFactor: number | null;
    baseActivityValueSAR: number | null;
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

/** (New, 20 Sep 2026) GCC Unified Economic Agreement Article 3 rules-of-
 * origin eligibility gate for UAE -- see PROGRAMS['ae-gcc-origin-treatment']
 * .sourceNoteEn for the full sourcing and the disclosed gap between this
 * treaty entitlement and MoIAT's own confirmed ICV methodology. */
export interface GccOriginNationalTreatmentGateResult {
  mechanismType: 'gcc-origin-national-treatment-gate';
  gccValueAddedPct: number | null;
  gccCitizenOwnershipPct: number | null;
  /** The Agreement's own disclosed Article 3(1) thresholds -- 40 and 51. */
  valueAddedThresholdPct: number;
  ownershipThresholdPct: number;
  /** true = both thresholds met (qualifies as a "national manufactured
   * product" under Article 3, entitled to Article 1(b) national
   * treatment); false = at least one threshold is known and not met
   * (short-circuits even if the other input is still missing, the same
   * "a known failure is decisive" precedent as CategoryEligibilityGateResult
   * .eligibleToBid); null = neither known value has failed, but at least
   * one input is still missing. */
  qualifiesAsGccNationalProduct: boolean | null;
}

/** (New, 18 Sep 2026) SABIC per-contract local-content commitment gate --
 * a covenant-compliance check against THIS contract's own negotiated
 * target, not a national program score or a fixed company-wide rate (see
 * PROGRAMS['sa-sabic-lc-commitment'].sourceNoteEn for the full honesty
 * disclosure: this tolerance/penalty pair is the platform's own business
 * rule, not a published SABIC standard). */
export interface CommitmentDeviationGateResult {
  mechanismType: 'commitment-deviation-gate';
  proposedTargetPct: number | null;
  actualAuditedPct: number | null;
  /** proposedTargetPct - actualAuditedPct, positive = under-delivery,
   * negative = over-delivery. Null when either input is missing. */
  deviationPct: number | null;
  /** The disclosed tolerance band, in percentage points -- see
   * SABIC_LC_DEVIATION_TOLERANCE_PCT. */
  toleranceThresholdPct: number;
  /** true = deviationPct <= toleranceThresholdPct (a negative deviation,
   * i.e. the supplier met or exceeded its own target, is never a breach),
   * false = breach, null = insufficient inputs. */
  withinTolerance: boolean | null;
}

export interface NotYetSourcedResult {
  mechanismType: 'not-yet-sourced';
}

/** (New, 1 Oct 2026) Egypt National Automotive Industry Development
 * Program incentive-eligibility gate (EG / 'eg-auto-local-content',
 * resolved this pass -- see PROGRAMS['eg-auto-local-content'].sourceNoteEn
 * for the full resolution rationale). Deliberately an ELIGIBILITY gate,
 * not an incentive-VALUE calculator: the program's real, sourced incentive
 * AMOUNT (a base subsidy capped at 30% of ex-factory price / EGP 150,000,
 * plus a disclosed-but-unreconciled EGP 5,000-per-1%-above-35% bonus) is
 * NOT computed here, because no source found in this pass states whether
 * that bonus stacks with or is bounded by the base cap -- forcing an
 * assumed stacking order would fabricate a formula, the same "disclose
 * richly rather than force a fit" discipline already applied to GAMI
 * (PROGRAMS['sa-gami-defense']) and Germany's EDIP. The gate itself --
 * does this vehicle/manufacturer qualify for ANY incentive at all -- is a
 * genuinely different, cleanly computable question, sourced independently
 * across two corroborating outlets citing the same 28 Apr 2026 Cabinet
 * media-center statement (see sourceNoteEn). */
export interface ProductionIncentiveEligibilityGateResult {
  mechanismType: 'production-incentive-eligibility-gate';
  vehicleCategory: 'ice' | 'ev' | null;
  localContentPct: number | null;
  /** The sourced starting minimum for this vehicle category (20 for ICE,
   * 10 for EV) -- null until vehicleCategory is known. Both figures are
   * disclosed as the program's STARTING thresholds (subject to biennial
   * review for ICE, annual review for EV); this engine computes against
   * the currently-disclosed starting figure only, never an extrapolated
   * future-year figure, per Decision Record 8.7. */
  localContentThresholdPct: number | null;
  meetsLocalContentThreshold: boolean | null;
  /** ICE only (price <= EGP 1.25m AND engine <= 1600cc). Null for EV by
   * design -- no sourced price/engine ceiling applies to EVs, this is a
   * disclosed "not applicable", not a missing-input gap, and does not
   * block `eligibleForIncentive` for an EV vehicle. */
  meetsPriceAndEngineCriteria: boolean | null;
  /** ICE: annual production >= 10,000 AND >= 5,000 per model. EV: annual
   * production >= 1,000 (the program's own disclosed EV entry point; the
   * separately-disclosed 7,000-unit figure is an end-of-program scale-up
   * target, not a per-assessment eligibility minimum). */
  meetsProductionVolumeCriteria: boolean | null;
  /** true = qualifies for SOME AIDP incentive (the exact EGP amount is not
   * computed -- see the type-level disclosure above); false = a known
   * failure on an applicable gate is decisive; null = no known failure,
   * but at least one applicable input is still missing, or vehicleCategory
   * itself is unknown. */
  eligibleForIncentive: boolean | null;
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

/** (New, 1 Oct 2026 -- Module 08 twelve-gap closure pass) Kuwait Public
 * Tenders Law No. 49/2016, Article 87 -- two independent, real, sourced
 * 30% local-sourcing thresholds for a foreign contractor: a local-
 * materials/goods-purchase share and a separately-stated local-works
 * share awarded to contractors on Kuwait's own contractor-classification
 * lists. Sourced directly from Al Tamimi's own primary-text-grounded
 * legal summary ("The Impact of Kuwait's New Tender Law", tamimi.com),
 * which quotes Article 87 itself rather than a tertiary aggregator (see
 * PROGRAMS['kw-local-content'].sourceNoteEn for the full citation and the
 * disclosed KD 75,000 scoping note -- that figure is a DIFFERENT
 * provision, the Central Tenders Committee approval-exemption ceiling,
 * not an Article 87 trigger threshold, and is deliberately NOT modeled
 * as this gate's trigger). Modeled via the same "a known failure on
 * either threshold is decisive" null-handling already established for
 * GccOriginNationalTreatmentGateResult (UAE), since Article 87's two
 * shares are independent conditions, not components of one ratio. */
export interface DualLocalSourcingGateResult {
  mechanismType: 'dual-local-sourcing-gate';
  localMaterialsSharePct: number | null;
  localWorksSharePct: number | null;
  /** Article 87's own disclosed thresholds -- 30 and 30 (two separately-
   * stated requirements that happen to share the same figure; kept as two
   * distinct constants rather than one shared one, so a future revision to
   * either alone does not silently change the other). */
  materialsThresholdPct: number;
  worksThresholdPct: number;
  meetsMaterialsThreshold: boolean | null;
  meetsWorksThreshold: boolean | null;
  /** true = both thresholds met; false = a known failure on either
   * threshold is decisive (mirrors qualifiesAsGccNationalProduct's own
   * precedent); null = neither known value has failed, but at least one
   * input is still missing. */
  meetsLocalSourcingRequirement: boolean | null;
}

/** (New, 1 Oct 2026 -- Module 08 twelve-gap closure pass) India Defence
 * Acquisition Procedure (DAP) 2020, Buy (Global) category -- the same
 * threshold-vs-offset-obligation shape already modeled for UAE Tawazun
 * (OffsetObligationGateResult / computeTawazunOffset), extended with a
 * real, sourced, two-independently-corroborated avenue-multiplier
 * selector (mondaq.com's "Offset Obligations Under the Defence
 * Acquisition Procedure 2020" and lexcounsel.in's own article of the same
 * title independently publish the identical multiplier table -- see
 * PROGRAMS['in-dap-2020-defense-offset'].sourceNoteEn for the full
 * citation). DAP 2020's own Para 3.1 states offset multipliers may not be
 * clubbed/combined -- this engine therefore takes a single caller-
 * selected avenue, never a sum across avenues. */
export interface OffsetMultiplierCreditGateResult {
  mechanismType: 'offset-multiplier-credit-gate';
  contractValueINR: number | null;
  /** DAP 2020 Para 2.1's own disclosed trigger -- INR 2000 crore. */
  obligationTriggerThresholdINR: number;
  /** true = contractValueINR >= obligationTriggerThresholdINR (an offset
   * obligation exists); false = below threshold; null = value not
   * supplied. */
  triggersObligation: boolean | null;
  /** 30% of contractValueINR, per DAP 2020 Para 2.2 -- only computable
   * once triggersObligation is known; 0 when false, null when unknown. */
  requiredOffsetValueINR: number | null;
  /** The caller-selected discharge avenue, per DAP 2020 Para 3.1's own
   * named categories. */
  offsetAvenue:
    | 'eligible-products-direct-purchase'
    | 'eligible-product-components'
    | 'msme-investment'
    | 'defence-manufacturing-investment'
    | 'defence-industrial-corridor-investment'
    | 'technology-transfer-to-indian-enterprises'
    | 'technology-acquisition-by-drdo-government'
    | 'critical-technology-acquisition-by-drdo'
    | null;
  /** The sourced multiplier for the selected avenue -- 1.0 / 0.5 / 1.5 /
   * 1.5 / 2.0 / 2.0 / 3.0 / 4.0 respectively (see
   * OFFSET_MULTIPLIER_CREDIT_GATE_AVENUE_MULTIPLIERS). Null until an
   * avenue is selected. */
  avenueMultiplier: number | null;
  /** The raw amount the supplier discharged through the selected avenue,
   * before the multiplier is applied. */
  rawDischargedAmountINR: number | null;
  /** rawDischargedAmountINR x avenueMultiplier -- the credited offset
   * value DAP 2020 actually recognizes. */
  creditedOffsetValueINR: number | null;
  /** max(0, requiredOffsetValueINR - creditedOffsetValueINR), only
   * computable once both are known. */
  shortfallINR: number | null;
  /** true = creditedOffsetValueINR >= requiredOffsetValueINR (or no
   * obligation triggers at all); false = a known shortfall; null =
   * insufficient inputs. */
  meetsOffsetObligation: boolean | null;
}

/** (New, 1 Oct 2026 -- Module 08 twelve-gap closure pass) Germany/EU
 * European Defence Industry Programme (EDIP), Regulation (EU) 2025/2643,
 * in force 30 Dec 2025 -- the simplest of this pass's three new
 * mechanisms, a single percentage-threshold gate. See
 * PROGRAMS['de-edip-defense-local-content'].sourceNoteEn for the full
 * citation, including the disclosed gap on the exact implementing
 * article number (corroborated by two law-firm secondary sources on the
 * 65%/35% figures themselves -- CMS and Gleiss Lutz -- but only Gleiss
 * Lutz's own AI-mediated summary attributes those figures to "Article
 * 10(3)-(4)"; this pass could not independently verify that article
 * number against EUR-Lex's own primary text, which -- consistent with
 * every EUR-Lex fetch attempt across this engagement -- returned only
 * page metadata, not article text, so the article number is disclosed as
 * single-sourced rather than independently confirmed). */
export interface EuContentThresholdGateResult {
  mechanismType: 'eu-content-threshold-gate';
  euOrAssociatedContentPct: number | null;
  /** The Regulation's own disclosed minimum -- 65. */
  euContentThresholdPct: number;
  /** The Regulation's own disclosed non-EU/non-associated cap -- 35
   * (the same fact expressed as a ceiling; kept alongside the threshold
   * for direct readability against the 35% figure sources themselves
   * quote). */
  nonEuContentCapPct: number;
  /** true = euOrAssociatedContentPct >= euContentThresholdPct; false = a
   * known shortfall; null = value not supplied. */
  meetsEuContentThreshold: boolean | null;
}

// ---------------------------------------------------------------------------
// Section 5e — Module 08 nine-program closure pass (2 Oct 2026): three
// genuinely new, real, sourced mechanisms resolved this pass after the
// owner's own independent re-research found GAMI's primary policy PDF --
// GAMI's Valuation-Factor credit gate, Turkey SSB's three-part
// industrialization-liability gate, and Bahrain's Parliament-approved
// Bahrainisation workforce gate (a generic percentage-threshold-gate, the
// first fully generic mechanism shape in this file). See each PROGRAMS
// entry's own sourceNoteEn for the full citation chain; this section holds
// only the result shapes -- the computation functions are in Section 5f.
// ---------------------------------------------------------------------------

/** GAMI's own eight named discharge categories (Industrial Participation
 * Policy, pages 12-13) -- two fixed-factor categories (A.1, A.3, both
 * factor 1.0 exactly) and six genuinely ranged categories, per the
 * policy's own table. Kept as a dedicated union (not reused from any
 * other mechanism) because no other program in this file has a caller-
 * selectable, per-category VALUE RANGE -- India's DAP 2020 avenue table is
 * the closest precedent, but its multipliers are single fixed values, not
 * ranges requiring a bounded caller input. */
export type GamiValuationFactorCategory =
  | 'a1-domestic-production' | 'a2-export-production' | 'a3-technical-support'
  | 'b1-fdi' | 'b2-special-equipment' | 'b3-tech-transfer' | 'b4-training' | 'b5-rt-programs';

/** (New, 2 Oct 2026 -- Module 08 nine-program closure pass) Saudi GAMI
 * Industrial Participation Policy -- see PROGRAMS['sa-gami-defense']
 * .sourceNoteEn for the full citation (the policy PDF itself, fetched
 * directly from gami.gov.sa). Deliberately a SINGLE-LINE-ITEM model: the
 * real policy lets a contractor earn credit across MULTIPLE categories on
 * MULTIPLE contracts, bank excess credit for up to 5 years (capped at 25%
 * of a future commitment), and claim a separate 10%-of-commitment bonus
 * credit at >=30% localization -- none of that cross-contract, multi-
 * year, credit-banking machinery is modeled here, because collapsing it
 * into one assessment would fabricate an aggregation rule the policy does
 * not itself state as a single formula. What IS modeled -- the per-
 * category Valuation Factor credit calculation, the 60%-of-contract-value
 * commitment trigger at the policy's own SAR 150 million threshold, the
 * 10% Performance Security, and the policy's own disclosed liquidation
 * formula on shortfall -- is genuinely computable and fully sourced from
 * the policy's own pages 8, 9, 12-13, and 17. */
export interface GamiValuationFactorCreditGateResult {
  mechanismType: 'gami-valuation-factor-credit-gate';
  contractValueSAR: number | null;
  /** The policy's own disclosed trigger -- SAR 150,000,000 (page 8). */
  contractValueThresholdSAR: number;
  /** true = contractValueSAR >= contractValueThresholdSAR (an Industrial
   * Participation commitment exists); false = below threshold; null =
   * value not supplied. */
  triggersCommitment: boolean | null;
  /** The policy's own disclosed minimum -- 60 (page 9). */
  commitmentPctOfContractValue: number;
  /** commitmentPctOfContractValue% of contractValueSAR, only once
   * triggersCommitment is known; 0 when false, null when unknown. */
  requiredCommitmentSAR: number | null;
  category: GamiValuationFactorCategory | null;
  /** The category's own disclosed Valuation Factor range (page 12-13) --
   * [1,1] for the two fixed categories, a genuine [min,max] for the other
   * six. Null until a category is chosen. */
  categoryMinFactor: number | null;
  categoryMaxFactor: number | null;
  /** The caller-supplied point within [categoryMinFactor,
   * categoryMaxFactor] -- clamped to that range, since the exact point
   * within a disclosed range is a GAMI-determined/negotiated fact this
   * engine cannot look up, only validate as policy-consistent once
   * supplied. Always categoryMinFactor for a fixed category, regardless
   * of caller input. */
  chosenFactor: number | null;
  /** true/false per caller input -- the policy's own disclosed SME bonus
   * (+0.5) and sole-source-supplier bonus (+1.0), page 12. */
  smeBonusApplied: boolean;
  soleSourceBonusApplied: boolean;
  /** chosenFactor + 0.5 if smeBonusApplied + 1.0 if soleSourceBonusApplied
   * -- null until chosenFactor itself is known. */
  effectiveFactor: number | null;
  baseActivityValueSAR: number | null;
  /** baseActivityValueSAR x effectiveFactor -- the credited Industrial
   * Participation value this single line item earns. */
  creditedValueSAR: number | null;
  /** creditedValueSAR / requiredCommitmentSAR x 100, only once both are
   * known and requiredCommitmentSAR > 0. */
  achievementPct: number | null;
  /** true = no commitment triggers at all, OR achievementPct >= 100;
   * false = a known shortfall; null = insufficient inputs. */
  meetsCommitment: boolean | null;
  /** The policy's own disclosed rate -- 10% of contractValueSAR (page 9). */
  performanceSecurityPctOfContractValue: number;
  performanceSecuritySAR: number | null;
  /** The policy's own disclosed liquidation formula (page 17): 100% of
   * Performance Security below 50% achievement; (Outstanding Commitment /
   * Commitment) x Initial Performance Security Value between 50-100%
   * achievement; 0 at or above 100% achievement. Null until
   * achievementPct itself is known. */
  liquidationSAR: number | null;
}

/** (New, 2 Oct 2026 -- Module 08 nine-program closure pass) Turkey SSB's
 * 2022 Industrialization Guideline -- see
 * PROGRAMS['tr-defense-offset'].sourceNoteEn for the full citation
 * (herdemlaw.com's primary-text-grounded 2011-vs-2022 guideline
 * comparison) and the disclosed, deliberately-unmodeled conflict against
 * mondaq.com's "70% of bid amount" headline figure. Models the three
 * granular sub-liabilities herdemlaw.com's own breakdown states as
 * independent, separately-stated thresholds -- the same "a known failure
 * on any one threshold is decisive" null-handling already established
 * for DualLocalSourcingGateResult (Kuwait Art. 87), extended here to
 * three conditions instead of two. */
export interface TrIndustrializationLiabilityGateResult {
  mechanismType: 'industrialization-liability-gate';
  contractValueTRY: number | null;
  ysSmeWorkSharePct: number | null;
  /** herdemlaw.com's own disclosed minimum -- 21 (% of contract value). */
  ysSmeThresholdPct: number;
  meetsYsSmeThreshold: boolean | null;
  eydepWorkSharePct: number | null;
  /** herdemlaw.com's own disclosed minimum -- 70 (% of EYDEP-accredited
   * work specifically, NOT of the whole bid -- see the disclosed mondaq
   * figure-conflict note in sourceNoteEn). */
  eydepThresholdPct: number;
  meetsEydepThreshold: boolean | null;
  techAcquisitionValueTRY: number | null;
  /** herdemlaw.com's own disclosed minimum -- 2 (% of bid value). */
  techAcquisitionThresholdPct: number;
  /** techAcquisitionThresholdPct% of contractValueTRY, only once
   * contractValueTRY is known. */
  requiredTechAcquisitionValueTRY: number | null;
  meetsTechAcquisitionThreshold: boolean | null;
  /** true = all three liabilities met; false = a known failure on any one
   * of the three is decisive; null = no known failure, but at least one
   * input is still missing. */
  meetsAllLiabilities: boolean | null;
}

/** (New, 2 Oct 2026 -- Module 08 nine-program closure pass) A fully
 * generic single-percentage-threshold gate -- the first mechanism in this
 * file with no country/program-specific field names, deliberately kept
 * generic because Bahrain's Parliament-approved Bahrainisation workforce
 * rule is a genuinely simple "is this one percentage >= this one
 * threshold" fact with no second dimension (unlike EuContentThresholdGate
 * Result, which is EDIP-specific and also carries a non-EU-content-cap
 * field). See PROGRAMS['bh-bahrainisation-tender-workforce'].sourceNoteEn
 * for the full citation and the disclosed gap between the Parliament-
 * approved 20% figure and the Tender Board's own Guideline, which
 * requires a Bahrainisation certificate but delegates the exact
 * percentage to separate Ministry of Labour regulation. */
export interface PercentageThresholdGateResult {
  mechanismType: 'percentage-threshold-gate';
  actualPct: number | null;
  thresholdPct: number;
  meetsThreshold: boolean | null;
}

/** LCGPA's own seven named Economic Participation activity categories
 * (DGA Group's 3 Jul 2023 analysis table) -- two fixed-factor categories
 * (subcontracting, rnd) and five genuinely ranged categories, mirroring
 * GamiValuationFactorCategory's own fixed-vs-ranged shape but a distinct
 * union (not reused), since the two policies' category names and ranges
 * are genuinely different and conflating them would misattribute a GAMI-
 * specific figure to the EP Policy or vice versa. */
export type EpValuationFactorCategory =
  | 'subcontracting' | 'localization' | 'knowledge-transfer' | 'technology-transfer'
  | 'export-promotion' | 'investment' | 'rnd';

/** (New, 2 Oct 2026 -- SA-LIKT/EP-Policy + BH circular pass) LCGPA's own
 * 2023 Economic Participation (EP) Policy -- see
 * PROGRAMS['sa-economic-participation-policy'].sourceNoteEn for the full
 * citation (DGA Group's 3 Jul 2023 law-firm analysis, corroborated by
 * Global Trade Alert's independent 14 Dec 2023 entry) and the disclosed
 * pending-reform/not-yet-in-force 2026 consultation draft. Deliberately a
 * SINGLE EP-ACTIVITY LINE ITEM model, mirroring GamiValuationFactorCredit
 * GateResult's own single-discharge-line-item scope decision -- see that
 * type's own doc comment for why this file does not attempt cross-
 * contract/multi-year aggregation for either policy. Three disclosed,
 * deliberate differences from GAMI's gate (not oversights): the
 * percentage base is IMPORTED-CONTENT value, not contract value; there is
 * no SME or sole-source bonus (neither is sourced for this policy); and
 * no performance-security/liquidation formula is sourced for this policy
 * specifically, so only meetsCommitment/shortfall is computed here, never
 * a penalty amount -- per Decision Record 8.7, this engine does not
 * fabricate a figure GAMI's own policy happens to disclose but this one
 * does not. */
export interface ImportValueParticipationGateResult {
  mechanismType: 'import-value-participation-gate';
  importedContentValueSAR: number | null;
  /** The policy's own disclosed trigger -- SAR 100,000,000. */
  importedContentValueThresholdSAR: number;
  /** true = importedContentValueSAR >= importedContentValueThresholdSAR
   * (an Economic Participation commitment exists); false = below
   * threshold; null = value not supplied. */
  triggersCommitment: boolean | null;
  /** The policy's own disclosed minimum -- 35 (% of imported content
   * value), currently in force; a lower, tiered 25% replacement is
   * reported as a pending public-consultation draft, not yet modeled --
   * see the program's own sourceNoteEn. */
  commitmentPctOfImportedValue: number;
  /** commitmentPctOfImportedValue% of importedContentValueSAR, only once
   * triggersCommitment is known; 0 when false, null when unknown. */
  requiredCommitmentSAR: number | null;
  category: EpValuationFactorCategory | null;
  /** The category's own disclosed Valuation Factor range -- [min,max],
   * with min === max for the two fixed-factor categories (subcontracting,
   * rnd). Null until a category is chosen. */
  categoryMinFactor: number | null;
  categoryMaxFactor: number | null;
  /** The caller-supplied point within [categoryMinFactor,
   * categoryMaxFactor] -- clamped to that range; always categoryMinFactor
   * for a fixed category, regardless of caller input. */
  chosenFactor: number | null;
  baseActivityValueSAR: number | null;
  /** baseActivityValueSAR x chosenFactor -- the credited Economic
   * Participation value this single EP activity earns. No bonus terms
   * apply (none are sourced for this policy), so chosenFactor is also the
   * effective factor here, unlike GAMI's gate. */
  creditedValueSAR: number | null;
  /** creditedValueSAR / requiredCommitmentSAR x 100, only once both are
   * known and requiredCommitmentSAR > 0. */
  achievementPct: number | null;
  /** true = no commitment triggers at all, OR achievementPct >= 100;
   * false = a known shortfall; null = insufficient inputs. */
  meetsCommitment: boolean | null;
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
  | CommitmentDeviationGateResult
  | GccOriginNationalTreatmentGateResult
  | ProductionIncentiveEligibilityGateResult
  | DualLocalSourcingGateResult
  | OffsetMultiplierCreditGateResult
  | EuContentThresholdGateResult
  | GamiValuationFactorCreditGateResult
  | TrIndustrializationLiabilityGateResult
  | PercentageThresholdGateResult
  | ImportValueParticipationGateResult
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
const NOT_CERTIFIED_AR = 'هذا تقدير توجيهي ذاتي التصريح، وليس درجة معتمدة من الجهة الوطنية المختصة — استخدمه للتخطيط المبكر قبل تدقيق/تصديق رسمي.';

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
// Section 4e — SA: stc Rawafed (eligible-spend-ratio, reused -- real
// LCGPA-approved formula, see PROGRAMS['sa-rawafed-stc']) + SABIC
// per-contract commitment-deviation-gate (new mechanism type, 18 Sep 2026,
// NOT a published SABIC standard -- see PROGRAMS['sa-sabic-lc-commitment']
// for the full honesty disclosure).
// ---------------------------------------------------------------------------

function computeRawafedStc(input: NonNullable<SupplierLocalContentInputs['rawafedStc']>): EligibleSpendRatioResult {
  const goodsServices = { key: 'goodsServices', eligible: n(input.localGoodsServicesSAR), total: n(input.totalGoodsServicesSAR) };
  const salaries = { key: 'salaries', eligible: n(input.localSalariesSAR), total: n(input.totalSalariesSAR) };
  const assetDepreciation = { key: 'assetDepreciation', eligible: n(input.localAssetDepreciationSAR), total: n(input.totalAssetDepreciationSAR) };
  const capacityDevelopment = { key: 'capacityDevelopment', eligible: n(input.localCapacityDevelopmentSAR), total: n(input.totalCapacityDevelopmentSAR) };
  const pillars = [goodsServices, salaries, assetDepreciation, capacityDevelopment];
  const totalEligible = pillars.reduce((s, p) => s + p.eligible, 0);
  const totalSpend = pillars.reduce((s, p) => s + p.total, 0);
  return { mechanismType: 'eligible-spend-ratio', scorePct: totalSpend > 0 ? (totalEligible / totalSpend) * 100 : null, pillars };
}

/** This platform's own disclosed business-rule defaults for the SABIC
 * commitment gate -- NOT a published SABIC standard (see PROGRAMS[
 * 'sa-sabic-lc-commitment'].sourceNoteEn). Set directly by the platform
 * owner. */
export const SABIC_LC_DEVIATION_TOLERANCE_PCT = 5;
export const SABIC_LC_PENALTY_MAX_PCT_OF_CONTRACT_VALUE = 1;

function computeSabicLcCommitmentGate(input: NonNullable<SupplierLocalContentInputs['sabicLcCommitment']>): CommitmentDeviationGateResult {
  const target = input.proposedTargetPct ?? null;
  const actual = input.actualAuditedPct ?? null;
  const deviationPct = target !== null && actual !== null ? target - actual : null;
  const withinTolerance = deviationPct === null ? null : deviationPct <= SABIC_LC_DEVIATION_TOLERANCE_PCT;
  return {
    mechanismType: 'commitment-deviation-gate',
    proposedTargetPct: target, actualAuditedPct: actual, deviationPct,
    toleranceThresholdPct: SABIC_LC_DEVIATION_TOLERANCE_PCT, withinTolerance,
  };
}

/** Decision-ready actionable next step for a SABIC commitment breach (per
 * isc-ai-output-standards rule 3) -- returns null when the gate is within
 * tolerance or its inputs are incomplete. Per the platform owner's
 * explicit instruction: state the disclosed penalty-of-up-to-1%-of-
 * contract-value exposure as the next step once a supplier is over the
 * 5-percentage-point tolerance line. */
export function actionableNextStepForSabicLcGate(c: CommitmentDeviationGateResult): { en: string; ar: string } | null {
  if (c.withinTolerance !== false || c.deviationPct === null || c.proposedTargetPct === null || c.actualAuditedPct === null) return null;
  const deviationPct = c.deviationPct;
  const proposedTargetPct = c.proposedTargetPct;
  const actualAuditedPct = c.actualAuditedPct;
  return {
    en: `Actual audited local content (${actualAuditedPct.toFixed(1)}%) is ${deviationPct.toFixed(1)} points below this contract's committed target (${proposedTargetPct.toFixed(1)}%), exceeding the ${c.toleranceThresholdPct}-percentage-point tolerance. Raise this with the supplier now and agree a corrective plan before the next audit cycle -- unresolved, this contract's own terms expose the supplier to a penalty of up to ${SABIC_LC_PENALTY_MAX_PCT_OF_CONTRACT_VALUE}% of contract value.`,
    ar: `المحتوى المحلي المدقَّق فعلياً (${actualAuditedPct.toFixed(1)}٪) أقل بمقدار ${deviationPct.toFixed(1)} نقطة من الهدف الملتزم به في هذا العقد (${proposedTargetPct.toFixed(1)}٪)، متجاوزاً هامش التسامح البالغ ٥ نقاط مئوية. أثِر هذا الأمر مع المورّد الآن واتفق على خطة تصحيحية قبل دورة التدقيق القادمة — فإن لم تُحل، تعرّض شروط هذا العقد نفسه المورّد لغرامة تصل إلى ١٪ من قيمة العقد.`,
  };
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
    noteAr: 'مساهمة العمالة الوافدة: تصنّف حسب عدد الموظفين الوافدين (١-٥: ~٢٪، ٦-٥٠: ~٥٪، ٥١-٢٠٠: ~٨٪، أكثر من ٢٠٠: ١٠٪) — تُستخدم نقطة المنتصف كرقم توجيهي.',
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
// Section 5c — AE: GCC Unified Economic Agreement Article 3 rules-of-origin
// eligibility gate (new, 20 Sep 2026). See PROGRAMS['ae-gcc-origin-
// treatment'].sourceNoteEn for the full sourcing and the disclosed gap
// between this treaty entitlement and MoIAT's own confirmed ICV
// methodology -- this mechanism computes real, sourced Article 3(1)
// eligibility; it does NOT modify or feed into computeIcvAe's score.
// ---------------------------------------------------------------------------

/** Article 3(1)'s own disclosed thresholds -- these are the treaty's real,
 * published figures, not a platform business-rule default (contrast with
 * SABIC_LC_DEVIATION_TOLERANCE_PCT above, which IS a platform default). */
export const GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT = 40;
export const GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT = 51;

function computeGccOriginNationalTreatmentGate(input: NonNullable<SupplierLocalContentInputs['aeGccOrigin']>): GccOriginNationalTreatmentGateResult {
  const valueAdded = input.gccValueAddedPct ?? null;
  const ownership = input.gccCitizenOwnershipPct ?? null;
  const valueAddedFails = valueAdded !== null && valueAdded < GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT;
  const ownershipFails = ownership !== null && ownership < GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT;
  let qualifies: boolean | null;
  if (valueAddedFails || ownershipFails) {
    qualifies = false; // a known failure on either threshold is decisive, regardless of the other input
  } else if (valueAdded === null || ownership === null) {
    qualifies = null; // neither known value has failed, but at least one input is still missing
  } else {
    qualifies = true; // both known and both meet their threshold
  }
  return {
    mechanismType: 'gcc-origin-national-treatment-gate',
    gccValueAddedPct: valueAdded, gccCitizenOwnershipPct: ownership,
    valueAddedThresholdPct: GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT, ownershipThresholdPct: GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT,
    qualifiesAsGccNationalProduct: qualifies,
  };
}

/** Egypt National Automotive Industry Development Program's own disclosed
 * STARTING thresholds (1 Oct 2026 resolution pass) -- real, sourced,
 * dated figures (Ahram Online and EgyptToday, both independently citing
 * the Cabinet media center's 28 Apr 2026 statement, corroborating Daily
 * News Egypt's 7 Jul 2025 reporting of the same program taking effect
 * 1 Jul 2025), not platform business-rule defaults. Both local-content
 * minimums are the program's STARTING figures, subject to periodic review
 * (biennial for ICE, annual for EV) -- this engine deliberately computes
 * against the currently-disclosed starting figure only, never projecting
 * a future-year increase, per Decision Record 8.7. */
export const EG_AUTO_ICE_MIN_LOCAL_CONTENT_PCT = 20;
export const EG_AUTO_EV_MIN_LOCAL_CONTENT_PCT = 10;
export const EG_AUTO_ICE_MAX_PRICE_EGP = 1_250_000;
export const EG_AUTO_ICE_MAX_ENGINE_CC = 1600;
export const EG_AUTO_ICE_MIN_ANNUAL_UNITS = 10_000;
export const EG_AUTO_ICE_MIN_UNITS_PER_MODEL = 5_000;
/** The program's disclosed EV entry point. A separately-sourced 7,000-unit
 * figure is an end-of-program scale-up TARGET, not a per-assessment
 * eligibility minimum, and is deliberately not modeled as a gate here. */
export const EG_AUTO_EV_MIN_ANNUAL_UNITS = 1_000;

function computeEgAutoProductionIncentiveGate(input: NonNullable<SupplierLocalContentInputs['egAuto']>): ProductionIncentiveEligibilityGateResult {
  const category = input.vehicleCategory ?? null;
  const localContentPct = input.localContentPct ?? null;
  const exFactoryPriceEGP = input.exFactoryPriceEGP ?? null;
  const engineCC = input.engineCC ?? null;
  const annualProductionUnits = input.annualProductionUnits ?? null;
  const unitsPerModel = input.unitsPerModel ?? null;

  const localContentThresholdPct = category === 'ice' ? EG_AUTO_ICE_MIN_LOCAL_CONTENT_PCT : category === 'ev' ? EG_AUTO_EV_MIN_LOCAL_CONTENT_PCT : null;
  const localContentFails = localContentThresholdPct !== null && localContentPct !== null && localContentPct < localContentThresholdPct;
  const meetsLocalContentThreshold: boolean | null =
    category === null ? null : localContentFails ? false : (localContentPct === null ? null : true);

  // Price/engine ceiling: ICE-only. Null for EV is a disclosed "not
  // applicable" (no sourced ceiling exists for EVs), never treated as a
  // missing-input gap for EV assessments -- see the applicableGates filter
  // below.
  let meetsPriceAndEngineCriteria: boolean | null;
  if (category === 'ice') {
    const priceFails = exFactoryPriceEGP !== null && exFactoryPriceEGP > EG_AUTO_ICE_MAX_PRICE_EGP;
    const engineFails = engineCC !== null && engineCC > EG_AUTO_ICE_MAX_ENGINE_CC;
    if (priceFails || engineFails) meetsPriceAndEngineCriteria = false;
    else if (exFactoryPriceEGP === null || engineCC === null) meetsPriceAndEngineCriteria = null;
    else meetsPriceAndEngineCriteria = true;
  } else {
    meetsPriceAndEngineCriteria = null;
  }

  let meetsProductionVolumeCriteria: boolean | null;
  if (category === 'ice') {
    const volFails = annualProductionUnits !== null && annualProductionUnits < EG_AUTO_ICE_MIN_ANNUAL_UNITS;
    const modelFails = unitsPerModel !== null && unitsPerModel < EG_AUTO_ICE_MIN_UNITS_PER_MODEL;
    if (volFails || modelFails) meetsProductionVolumeCriteria = false;
    else if (annualProductionUnits === null || unitsPerModel === null) meetsProductionVolumeCriteria = null;
    else meetsProductionVolumeCriteria = true;
  } else if (category === 'ev') {
    const volFails = annualProductionUnits !== null && annualProductionUnits < EG_AUTO_EV_MIN_ANNUAL_UNITS;
    if (volFails) meetsProductionVolumeCriteria = false;
    else if (annualProductionUnits === null) meetsProductionVolumeCriteria = null;
    else meetsProductionVolumeCriteria = true;
  } else {
    meetsProductionVolumeCriteria = null;
  }

  // Only gates that actually apply to this vehicle category can block or
  // withhold eligibility -- EV's always-null meetsPriceAndEngineCriteria
  // (no sourced ceiling) must never be read as "missing data" the way ICE's
  // null would be.
  const applicableGates: (boolean | null)[] =
    category === 'ice' ? [meetsLocalContentThreshold, meetsPriceAndEngineCriteria, meetsProductionVolumeCriteria]
    : category === 'ev' ? [meetsLocalContentThreshold, meetsProductionVolumeCriteria]
    : [];
  let eligibleForIncentive: boolean | null;
  if (category === null) {
    eligibleForIncentive = null;
  } else if (applicableGates.some(g => g === false)) {
    eligibleForIncentive = false; // a known failure on any applicable gate is decisive
  } else if (applicableGates.some(g => g === null)) {
    eligibleForIncentive = null; // no known failure yet, but at least one applicable input is still missing
  } else {
    eligibleForIncentive = true;
  }

  return {
    mechanismType: 'production-incentive-eligibility-gate',
    vehicleCategory: category,
    localContentPct, localContentThresholdPct,
    meetsLocalContentThreshold, meetsPriceAndEngineCriteria, meetsProductionVolumeCriteria,
    eligibleForIncentive,
  };
}

/** Decision-ready output (isc-ai-output-standards rule 3) for a supplier
 * that qualifies under the Agreement's Article 3 rules-of-origin test --
 * states the treaty basis AND the disclosed gap (Decision Record 8.7) that
 * MoIAT's own ICV methodology does not confirm this translates into an
 * actual score uplift. Returns null when the gate does not (yet) resolve
 * to true, the same "no fabricated filler" precedent as
 * actionableNextStepForSabicLcGate above. */
export function actionableNextStepForGccOriginTreatment(c: GccOriginNationalTreatmentGateResult): { en: string; ar: string } | null {
  if (c.qualifiesAsGccNationalProduct !== true || c.gccValueAddedPct === null || c.gccCitizenOwnershipPct === null) return null;
  const valueAddedPct = c.gccValueAddedPct;
  const ownershipPct = c.gccCitizenOwnershipPct;
  return {
    en: `This product qualifies as a GCC "national manufactured product" under Article 3 of the GCC Unified Economic Agreement (${valueAddedPct.toFixed(1)}% GCC value-added, ${ownershipPct.toFixed(1)}% GCC-citizen ownership -- both above the Agreement's ${c.valueAddedThresholdPct}%/${c.ownershipThresholdPct}% thresholds), entitling it under Article 1(b) to the same treatment as a UAE national product. Cite this treaty basis explicitly to the procuring entity -- but do not assume it is applied automatically: neither MoIAT's ICV certification methodology nor UAE Federal Law No. 11 of 2023's own text confirms this treaty right is operationalized as an ICV score uplift, so raise it as a distinct claim alongside (not folded into) this supplier's actual MoIAT ICV certificate.`,
    ar: `يستوفي هذا المنتج شرط "المنتج الوطني المصنَّع" الخليجي بموجب المادة ٣ من الاتفاقية الاقتصادية الموحدة لدول مجلس التعاون (قيمة مضافة خليجية ${valueAddedPct.toFixed(1)}٪، وملكية مواطني دول المجلس ${ownershipPct.toFixed(1)}٪ — كلتاهما أعلى من حدّي الاتفاقية ${c.valueAddedThresholdPct}٪/${c.ownershipThresholdPct}٪)، ما يخوّله بموجب المادة ١(ب) معاملة المنتج الوطني الإماراتي نفسها. استشهد بهذا الأساس التعاهدي صراحة أمام الجهة المشترية — لكن لا تفترض تطبيقه تلقائياً: فلا منهجية تصديق ICV لدى وزارة الصناعة ولا نص القانون الاتحادي رقم ١١ لسنة ٢٠٢٣ يؤكدان تفعيل هذا الحق التعاهدي كرفع فعلي لدرجة ICV، فارفعه كمطالبة مستقلة إلى جانب شهادة ICV الفعلية لهذا المورّد لدى الوزارة، لا كجزء مدمج فيها.`,
  };
}

// ---------------------------------------------------------------------------
// Section 5d — Module 08 twelve-gap closure pass (1 Oct 2026): three
// genuinely new, real, sourced mechanisms resolved this pass -- Kuwait's
// Public Tenders Law Art. 87 dual local-sourcing gate, India's DAP 2020
// Buy (Global) offset-multiplier credit gate, and Germany/EU EDIP's
// single EU-content threshold gate. See each PROGRAMS entry's own
// sourceNoteEn for the full citation chain; this section holds only the
// computation.
// ---------------------------------------------------------------------------

/** Kuwait Public Tenders Law No. 49/2016, Article 87 -- both of the law's
 * own disclosed thresholds (30% local materials/goods purchase share, 30%
 * local works share), per Al Tamimi's own primary-text-grounded summary.
 * Kept as two distinct constants (not one shared one) since the two
 * requirements are separately stated in the Article's own text, even
 * though they currently share the same figure. */
export const KUWAIT_ART87_LOCAL_MATERIALS_THRESHOLD_PCT = 30;
export const KUWAIT_ART87_LOCAL_WORKS_THRESHOLD_PCT = 30;

function computeKwLocalSourcingGate(input: NonNullable<SupplierLocalContentInputs['kwLocalContent']>): DualLocalSourcingGateResult {
  const materials = input.localMaterialsSharePct ?? null;
  const works = input.localWorksSharePct ?? null;
  const materialsFails = materials !== null && materials < KUWAIT_ART87_LOCAL_MATERIALS_THRESHOLD_PCT;
  const worksFails = works !== null && works < KUWAIT_ART87_LOCAL_WORKS_THRESHOLD_PCT;
  let meetsRequirement: boolean | null;
  if (materialsFails || worksFails) {
    meetsRequirement = false; // a known failure on either Art. 87 threshold is decisive, regardless of the other input
  } else if (materials === null || works === null) {
    meetsRequirement = null; // neither known value has failed, but at least one input is still missing
  } else {
    meetsRequirement = true;
  }
  return {
    mechanismType: 'dual-local-sourcing-gate',
    localMaterialsSharePct: materials, localWorksSharePct: works,
    materialsThresholdPct: KUWAIT_ART87_LOCAL_MATERIALS_THRESHOLD_PCT, worksThresholdPct: KUWAIT_ART87_LOCAL_WORKS_THRESHOLD_PCT,
    meetsMaterialsThreshold: materials === null ? null : !materialsFails,
    meetsWorksThreshold: works === null ? null : !worksFails,
    meetsLocalSourcingRequirement: meetsRequirement,
  };
}

/** India DAP 2020, Buy (Global) category -- Para 2.1's own disclosed
 * contract-value trigger (INR 2000 crore) and Para 2.2's own disclosed
 * offset-value share (30%). Figures corroborated across two independent
 * professionally-published sources (mondaq.com, lexcounsel.in), both
 * titled "Offset Obligations Under the Defence Acquisition Procedure
 * 2020" and both publishing the identical multiplier table below. */
export const INDIA_DAP_OFFSET_TRIGGER_THRESHOLD_INR_CRORE = 2000;
export const INDIA_DAP_OFFSET_OBLIGATION_PCT = 30;
/** 1 crore = 10,000,000 (1e7) -- used only to convert the Para 2.1
 * trigger threshold (disclosed in crore) into the same INR-rupee unit as
 * contractValueINR, never to convert any other figure in this file. */
const INR_CRORE_TO_RUPEES = 1e7;

/** Para 3.1's own disclosed avenue-multiplier table -- identical across
 * both corroborating sources, with an explicit "clubbing of multipliers
 * is not permitted" rule (modeled here by accepting exactly one avenue
 * per assessment, never a sum across avenues). */
export const OFFSET_MULTIPLIER_CREDIT_GATE_AVENUE_MULTIPLIERS: Record<NonNullable<OffsetMultiplierCreditGateResult['offsetAvenue']>, number> = {
  'eligible-products-direct-purchase': 1.0,
  'eligible-product-components': 0.5,
  'msme-investment': 1.5,
  'defence-manufacturing-investment': 1.5,
  'defence-industrial-corridor-investment': 2.0,
  'technology-transfer-to-indian-enterprises': 2.0,
  'technology-acquisition-by-drdo-government': 3.0,
  'critical-technology-acquisition-by-drdo': 4.0,
};

function computeInDapOffsetGate(input: NonNullable<SupplierLocalContentInputs['inDap']>): OffsetMultiplierCreditGateResult {
  const contractValueINR = input.contractValueINR ?? null;
  const triggerThresholdINR = INDIA_DAP_OFFSET_TRIGGER_THRESHOLD_INR_CRORE * INR_CRORE_TO_RUPEES;
  const triggersObligation = contractValueINR === null ? null : contractValueINR >= triggerThresholdINR;
  const requiredOffsetValueINR = triggersObligation === null
    ? null
    : triggersObligation === false
      ? 0
      : (contractValueINR as number) * INDIA_DAP_OFFSET_OBLIGATION_PCT / 100;

  const avenue = input.offsetAvenue ?? null;
  const avenueMultiplier = avenue === null ? null : OFFSET_MULTIPLIER_CREDIT_GATE_AVENUE_MULTIPLIERS[avenue];
  const rawDischargedAmountINR = input.rawDischargedAmountINR ?? null;
  const creditedOffsetValueINR = avenueMultiplier !== null && rawDischargedAmountINR !== null
    ? rawDischargedAmountINR * avenueMultiplier
    : null;
  const shortfallINR = requiredOffsetValueINR !== null && creditedOffsetValueINR !== null
    ? Math.max(0, requiredOffsetValueINR - creditedOffsetValueINR)
    : null;

  let meetsOffsetObligation: boolean | null;
  if (triggersObligation === false) {
    meetsOffsetObligation = true; // no obligation at all below the Para 2.1 trigger
  } else if (shortfallINR !== null) {
    meetsOffsetObligation = shortfallINR <= 0;
  } else {
    meetsOffsetObligation = null;
  }

  return {
    mechanismType: 'offset-multiplier-credit-gate',
    contractValueINR, obligationTriggerThresholdINR: triggerThresholdINR, triggersObligation,
    requiredOffsetValueINR, offsetAvenue: avenue, avenueMultiplier,
    rawDischargedAmountINR, creditedOffsetValueINR, shortfallINR, meetsOffsetObligation,
  };
}

/** Germany/EU EDIP Regulation (EU) 2025/2643 -- the Regulation's own
 * disclosed content thresholds (65% minimum EU/associated-country
 * content, equivalently a 35% non-EU/non-associated cap), corroborated
 * by two independent law-firm secondary sources (CMS, Gleiss Lutz). See
 * EuContentThresholdGateResult's own doc comment for the disclosed gap on
 * the exact implementing article number. */
export const EDIP_EU_CONTENT_THRESHOLD_PCT = 65;
export const EDIP_NON_EU_CONTENT_CAP_PCT = 35;

function computeDeEdipContentGate(input: NonNullable<SupplierLocalContentInputs['deEdip']>): EuContentThresholdGateResult {
  const euContent = input.euOrAssociatedContentPct ?? null;
  const meets = euContent === null ? null : euContent >= EDIP_EU_CONTENT_THRESHOLD_PCT;
  return {
    mechanismType: 'eu-content-threshold-gate',
    euOrAssociatedContentPct: euContent,
    euContentThresholdPct: EDIP_EU_CONTENT_THRESHOLD_PCT, nonEuContentCapPct: EDIP_NON_EU_CONTENT_CAP_PCT,
    meetsEuContentThreshold: meets,
  };
}

// ---------------------------------------------------------------------------
// Section 5f — Module 08 nine-program closure pass (2 Oct 2026): GAMI's
// Valuation-Factor credit gate, Turkey SSB's industrialization-liability
// gate, and Bahrain's Bahrainisation workforce gate. See each
// PROGRAMS entry's own sourceNoteEn for the full citation chain.
// ---------------------------------------------------------------------------

/** GAMI Industrial Participation Policy's own disclosed figures --
 * gami.gov.sa, "Industrial Participation Policy" PDF, pages 8, 9, 12-13,
 * 15, 17 (fetched directly 2 Oct 2026). */
export const GAMI_CONTRACT_VALUE_THRESHOLD_SAR = 150_000_000; // page 8
export const GAMI_COMMITMENT_PCT_OF_CONTRACT_VALUE = 60; // page 9
export const GAMI_PERFORMANCE_SECURITY_PCT_OF_CONTRACT_VALUE = 10; // page 9
export const GAMI_LIQUIDATION_FULL_FORFEIT_BELOW_ACHIEVEMENT_PCT = 50; // page 17

/** The policy's own eight named categories and their disclosed Valuation
 * Factor ranges (pages 12-13) -- [min, max] for each; the two fixed-
 * factor categories (A.1, A.3) have min === max === 1.0. */
export const GAMI_VALUATION_FACTOR_RANGES: Record<GamiValuationFactorCategory, [number, number]> = {
  'a1-domestic-production': [1.0, 1.0],
  'a2-export-production': [1.0, 2.0],
  'a3-technical-support': [1.0, 1.0],
  'b1-fdi': [2.0, 5.0],
  'b2-special-equipment': [1.0, 2.0],
  'b3-tech-transfer': [1.0, 3.0],
  'b4-training': [1.0, 2.0],
  'b5-rt-programs': [2.0, 5.0],
};
export const GAMI_SME_BONUS_FACTOR = 0.5; // page 12
export const GAMI_SOLE_SOURCE_BONUS_FACTOR = 1.0; // page 12

/** Models ONE discharge line item against GAMI's own disclosed per-
 * contract commitment and liquidation formula -- see
 * GamiValuationFactorCreditGateResult's own doc comment for the disclosed
 * multi-category/multi-contract/credit-banking scope limitation. */
function computeGamiValuationFactorCreditGate(input: NonNullable<SupplierLocalContentInputs['saGami']>): GamiValuationFactorCreditGateResult {
  const contractValueSAR = input.contractValueSAR ?? null;
  const triggersCommitment = contractValueSAR === null ? null : contractValueSAR >= GAMI_CONTRACT_VALUE_THRESHOLD_SAR;
  const requiredCommitmentSAR = triggersCommitment === null
    ? null
    : triggersCommitment === false ? 0 : (contractValueSAR as number) * GAMI_COMMITMENT_PCT_OF_CONTRACT_VALUE / 100;

  const category = input.category ?? null;
  const range = category === null ? null : GAMI_VALUATION_FACTOR_RANGES[category];
  const categoryMinFactor = range ? range[0] : null;
  const categoryMaxFactor = range ? range[1] : null;
  // A fixed-factor category (min === max) always resolves to that single
  // value, regardless of caller input -- never clamps a caller value that
  // was never meaningful to begin with.
  const rawFactor = input.chosenFactor ?? null;
  const chosenFactor = range === null
    ? null
    : range[0] === range[1] ? range[0] : (rawFactor === null ? null : Math.min(range[1], Math.max(range[0], rawFactor)));

  const smeBonusApplied = input.smeBonusApplies === true;
  const soleSourceBonusApplied = input.soleSourceBonusApplies === true;
  const effectiveFactor = chosenFactor === null
    ? null
    : chosenFactor + (smeBonusApplied ? GAMI_SME_BONUS_FACTOR : 0) + (soleSourceBonusApplied ? GAMI_SOLE_SOURCE_BONUS_FACTOR : 0);

  const baseActivityValueSAR = input.baseActivityValueSAR ?? null;
  const creditedValueSAR = effectiveFactor !== null && baseActivityValueSAR !== null ? baseActivityValueSAR * effectiveFactor : null;

  const achievementPct = requiredCommitmentSAR !== null && requiredCommitmentSAR > 0 && creditedValueSAR !== null
    ? (creditedValueSAR / requiredCommitmentSAR) * 100
    : null;

  let meetsCommitment: boolean | null;
  if (triggersCommitment === false) {
    meetsCommitment = true; // no commitment at all below the page-8 trigger
  } else if (achievementPct !== null) {
    meetsCommitment = achievementPct >= 100;
  } else {
    meetsCommitment = null;
  }

  const performanceSecuritySAR = contractValueSAR !== null ? contractValueSAR * GAMI_PERFORMANCE_SECURITY_PCT_OF_CONTRACT_VALUE / 100 : null;
  let liquidationSAR: number | null;
  if (achievementPct === null || requiredCommitmentSAR === null || creditedValueSAR === null || performanceSecuritySAR === null) {
    liquidationSAR = null;
  } else if (achievementPct < GAMI_LIQUIDATION_FULL_FORFEIT_BELOW_ACHIEVEMENT_PCT) {
    liquidationSAR = performanceSecuritySAR; // page 17: 100% liquidation below 50% achievement
  } else if (achievementPct < 100) {
    liquidationSAR = ((requiredCommitmentSAR - creditedValueSAR) / requiredCommitmentSAR) * performanceSecuritySAR; // page 17's own formula
  } else {
    liquidationSAR = 0;
  }

  return {
    mechanismType: 'gami-valuation-factor-credit-gate',
    contractValueSAR, contractValueThresholdSAR: GAMI_CONTRACT_VALUE_THRESHOLD_SAR, triggersCommitment,
    commitmentPctOfContractValue: GAMI_COMMITMENT_PCT_OF_CONTRACT_VALUE, requiredCommitmentSAR,
    category, categoryMinFactor, categoryMaxFactor, chosenFactor,
    smeBonusApplied, soleSourceBonusApplied, effectiveFactor,
    baseActivityValueSAR, creditedValueSAR, achievementPct, meetsCommitment,
    performanceSecurityPctOfContractValue: GAMI_PERFORMANCE_SECURITY_PCT_OF_CONTRACT_VALUE, performanceSecuritySAR,
    liquidationSAR,
  };
}

/** LCGPA's own 2023 Economic Participation (EP) Policy -- see
 * PROGRAMS['sa-economic-participation-policy'].sourceNoteEn for the full
 * citation (DGA Group's 3 Jul 2023 analysis, corroborated by Global
 * Trade Alert's 14 Dec 2023 entry). The currently-in-force flat figures
 * below; a pending, not-yet-confirmed-in-force tiered reform (25%) is
 * disclosed in the sourceNote but deliberately not modeled here. */
export const EP_IMPORTED_VALUE_THRESHOLD_SAR = 100_000_000;
export const EP_COMMITMENT_PCT_OF_IMPORTED_VALUE = 35;

/** DGA Group's own disclosed Valuation Factor table -- [min, max] per
 * category; the two fixed-factor categories (subcontracting, rnd) have
 * min === max. */
export const EP_VALUATION_FACTOR_RANGES: Record<EpValuationFactorCategory, [number, number]> = {
  subcontracting: [1.0, 1.0],
  localization: [0.5, 2.0],
  'knowledge-transfer': [0.5, 2.0],
  'technology-transfer': [0.5, 3.0],
  'export-promotion': [0.5, 3.0],
  investment: [1.0, 3.0],
  rnd: [3.0, 3.0],
};

/** Models ONE EP-activity line item against LCGPA's own disclosed per-
 * contract Economic Participation commitment -- see
 * ImportValueParticipationGateResult's own doc comment for the disclosed
 * scope decision (single line item, no bonus terms, no sourced
 * liquidation formula). */
function computeImportValueParticipationGate(input: NonNullable<SupplierLocalContentInputs['saEp']>): ImportValueParticipationGateResult {
  const importedContentValueSAR = input.importedContentValueSAR ?? null;
  const triggersCommitment = importedContentValueSAR === null ? null : importedContentValueSAR >= EP_IMPORTED_VALUE_THRESHOLD_SAR;
  const requiredCommitmentSAR = triggersCommitment === null
    ? null
    : triggersCommitment === false ? 0 : (importedContentValueSAR as number) * EP_COMMITMENT_PCT_OF_IMPORTED_VALUE / 100;

  const category = input.category ?? null;
  const range = category === null ? null : EP_VALUATION_FACTOR_RANGES[category];
  const categoryMinFactor = range ? range[0] : null;
  const categoryMaxFactor = range ? range[1] : null;
  // A fixed-factor category (min === max) always resolves to that single
  // value, regardless of caller input -- same discipline as GAMI's gate.
  const rawFactor = input.chosenFactor ?? null;
  const chosenFactor = range === null
    ? null
    : range[0] === range[1] ? range[0] : (rawFactor === null ? null : Math.min(range[1], Math.max(range[0], rawFactor)));

  const baseActivityValueSAR = input.baseActivityValueSAR ?? null;
  // No bonus terms are sourced for this policy, so chosenFactor is also
  // the effective (credited) factor -- unlike GAMI's gate, which adds
  // SME/sole-source bonuses on top of chosenFactor.
  const creditedValueSAR = chosenFactor !== null && baseActivityValueSAR !== null ? baseActivityValueSAR * chosenFactor : null;

  const achievementPct = requiredCommitmentSAR !== null && requiredCommitmentSAR > 0 && creditedValueSAR !== null
    ? (creditedValueSAR / requiredCommitmentSAR) * 100
    : null;

  let meetsCommitment: boolean | null;
  if (triggersCommitment === false) {
    meetsCommitment = true; // no commitment at all below the SAR 100M trigger
  } else if (achievementPct !== null) {
    meetsCommitment = achievementPct >= 100;
  } else {
    meetsCommitment = null;
  }

  return {
    mechanismType: 'import-value-participation-gate',
    importedContentValueSAR, importedContentValueThresholdSAR: EP_IMPORTED_VALUE_THRESHOLD_SAR, triggersCommitment,
    commitmentPctOfImportedValue: EP_COMMITMENT_PCT_OF_IMPORTED_VALUE, requiredCommitmentSAR,
    category, categoryMinFactor, categoryMaxFactor, chosenFactor,
    baseActivityValueSAR, creditedValueSAR, achievementPct, meetsCommitment,
  };
}

/** herdemlaw.com's own disclosed figures, from its primary-text-grounded
 * 2011-vs-2022 SSB Industrialization Guideline comparison (fetched
 * directly 1-2 Oct 2026). The conflicting mondaq.com "70% of bid amount"
 * headline figure is deliberately NOT modeled here -- see
 * PROGRAMS['tr-defense-offset'].sourceNoteEn for the full disclosure. */
export const TR_YS_SME_WORK_SHARE_THRESHOLD_PCT = 21;
export const TR_EYDEP_WORK_SHARE_THRESHOLD_PCT = 70;
export const TR_TECH_ACQUISITION_THRESHOLD_PCT = 2;

function computeTrIndustrializationLiabilityGate(input: NonNullable<SupplierLocalContentInputs['trDefenseOffset']>): TrIndustrializationLiabilityGateResult {
  const contractValueTRY = input.contractValueTRY ?? null;
  const ysSme = input.ysSmeWorkSharePct ?? null;
  const eydep = input.eydepWorkSharePct ?? null;
  const techValue = input.techAcquisitionValueTRY ?? null;

  const requiredTechAcquisitionValueTRY = contractValueTRY === null ? null : contractValueTRY * TR_TECH_ACQUISITION_THRESHOLD_PCT / 100;

  const ysSmeFails = ysSme !== null && ysSme < TR_YS_SME_WORK_SHARE_THRESHOLD_PCT;
  const eydepFails = eydep !== null && eydep < TR_EYDEP_WORK_SHARE_THRESHOLD_PCT;
  const techFails = requiredTechAcquisitionValueTRY !== null && techValue !== null && techValue < requiredTechAcquisitionValueTRY;

  let meetsAllLiabilities: boolean | null;
  if (ysSmeFails || eydepFails || techFails) {
    meetsAllLiabilities = false; // a known failure on any one of the three liabilities is decisive
  } else if (ysSme === null || eydep === null || requiredTechAcquisitionValueTRY === null || techValue === null) {
    meetsAllLiabilities = null; // no known failure, but at least one input is still missing
  } else {
    meetsAllLiabilities = true;
  }

  return {
    mechanismType: 'industrialization-liability-gate',
    contractValueTRY,
    ysSmeWorkSharePct: ysSme, ysSmeThresholdPct: TR_YS_SME_WORK_SHARE_THRESHOLD_PCT, meetsYsSmeThreshold: ysSme === null ? null : !ysSmeFails,
    eydepWorkSharePct: eydep, eydepThresholdPct: TR_EYDEP_WORK_SHARE_THRESHOLD_PCT, meetsEydepThreshold: eydep === null ? null : !eydepFails,
    techAcquisitionValueTRY: techValue, techAcquisitionThresholdPct: TR_TECH_ACQUISITION_THRESHOLD_PCT,
    requiredTechAcquisitionValueTRY, meetsTechAcquisitionThreshold: techValue === null ? null : !techFails,
    meetsAllLiabilities,
  };
}

/** Bahrain's Parliament-approved Bahrainisation rule for government
 * tender bidders -- lexis.ae, "Bahrain: 20% Bahrainisation Rule For
 * Tenders Approved", 20 Nov 2024 (Parliament approval). See
 * PROGRAMS['bh-bahrainisation-tender-workforce'].sourceNoteEn for the
 * full disclosure, including the gap against the Tender Board's own Nov
 * 2025 Guideline (which requires a certificate but delegates the exact
 * figure to Ministry of Labour regulation) and the separate, higher, 50%
 * figure for privatised-state-service contracts specifically. */
export const BAHRAIN_TENDER_BAHRAINISATION_THRESHOLD_PCT = 20;

function computeBhBahrainisationGate(input: NonNullable<SupplierLocalContentInputs['bhBahrainisation']>): PercentageThresholdGateResult {
  const actualPct = input.bahrainiWorkforceSharePct ?? null;
  const meetsThreshold = actualPct === null ? null : actualPct >= BAHRAIN_TENDER_BAHRAINISATION_THRESHOLD_PCT;
  return {
    mechanismType: 'percentage-threshold-gate',
    actualPct, thresholdPct: BAHRAIN_TENDER_BAHRAINISATION_THRESHOLD_PCT, meetsThreshold,
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
// Section 6e -- India/Germany/Japan/Korea batch (17 Sep 2026). India's
// computePricePreferenceInMakeInIndia evaluates a real three-tier
// classification gate (Class-I/Class-II/Non-Local) before handing a binary
// qualification to the shared computePricePreferenceMargin primitive, the
// same "gate feeding a shared primitive" shape already used for China's
// OR-gate. Japan's computeSpendSetAsideJp and Korea's computeSpendSetAsideKr
// both use the shared computeSpendSetAside primitive, but neither is a
// renamed copy of the JO/BH/KW fixed-constant wrappers below: Japan's
// target is caller-supplied per fiscal year (no statutory constant exists
// to hardcode), and Korea's selects between two real, differently-sourced
// targets (50% overall vs. 15% technology-development) depending on the
// caller-supplied product category. Germany has no wrapper function at all
// -- both its programs are honestly not-yet-sourced and resolve via the
// early-return path in assessSupplierLocalContent, the same as Oman's
// general ICV / Qatar's National Strategy / the USA's Berry Amendment.
// ---------------------------------------------------------------------------

export const INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT = 20;
export const INDIA_CLASS_I_MIN_LOCAL_CONTENT_PCT = 50;
export const INDIA_CLASS_II_MIN_LOCAL_CONTENT_PCT = 20;

function computePricePreferenceInMakeInIndia(inMakeInIndia: NonNullable<SupplierLocalContentInputs['inMakeInIndia']>): PricePreferenceMarginResult {
  const share = inMakeInIndia.localContentSharePct ?? null;
  if (share === null) {
    return computePricePreferenceMargin(INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT, null);
  }
  // Real three-tier classification (PPP-MII Order 2017, as revised 4 Jun
  // 2020): only Class-I (>=50%) receives the 20% margin-of-purchase-
  // preference right-to-match-L1. Class-II (20-<50%) may still be eligible
  // to bid in smaller tenders (a separate fact this engine does not model)
  // but gets no price-match right here; Non-Local (<=20%) is excluded
  // outright. A gate, not a taper -- the same discipline already applied
  // to China's SME 30% subcontract gate and the USA's Buy American
  // threshold.
  if (share >= INDIA_CLASS_I_MIN_LOCAL_CONTENT_PCT) {
    return computePricePreferenceMargin(INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT, 100);
  }
  return computePricePreferenceMargin(INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT, 0);
}

function computeSpendSetAsideJp(jp: NonNullable<SupplierLocalContentInputs['jp']>): SpendSetAsideResult {
  const target = jp.policyYearTargetRatioPct ?? null;
  const qualifies = jp.isSmeQualified ?? null;
  if (target === null) {
    // Genuinely different from every JO/BH/KW/USA-SBA wrapper below: those
    // fall back to a real, sourced, fixed statutory constant when the
    // caller doesn't supply a qualification status. Japan has no such
    // constant to fall back to -- the Kankouju Law itself sets no fixed
    // percentage; only the annual Cabinet Basic Policy does (see
    // PROGRAMS['jp-kankoju-sme-target-ratio'].sourceNoteEn). Returning 0
    // here would misrepresent an unknown target as a known zero target, so
    // this is surfaced to the caller as insufficient data at the dispatch
    // level instead (see assessSupplierLocalContent).
    return { mechanismType: 'spend-set-aside-target', targetSharePct: 0, qualifiesForSetAside: null, eligibleForReservedShare: null };
  }
  return computeSpendSetAside(target, qualifies);
}

export const KOREA_SME_OVERALL_PURCHASE_TARGET_PCT = 50;
export const KOREA_SME_TECH_DEVELOPMENT_PRODUCT_TARGET_PCT = 15;

function computeSpendSetAsideKr(kr: NonNullable<SupplierLocalContentInputs['krSmeTarget']>): SpendSetAsideResult {
  const category = kr.productCategory ?? null;
  const qualifies = kr.isSmeQualified ?? null;
  if (category === null) {
    // Real 2-way selector, not a single fixed constant -- see PROGRAMS[
    // 'kr-sme-purchase-target-ratio'].sourceNoteEn. Defaults the DISPLAYED
    // target to the overall 50% figure (the program's own default program
    // name) while leaving qualification unknown, mirroring how JO/BH/KW
    // handle an unsupplied qualification against their own known constant.
    return { mechanismType: 'spend-set-aside-target', targetSharePct: KOREA_SME_OVERALL_PURCHASE_TARGET_PCT, qualifiesForSetAside: null, eligibleForReservedShare: null };
  }
  const target = category === 'technology-development-product' ? KOREA_SME_TECH_DEVELOPMENT_PRODUCT_TARGET_PCT : KOREA_SME_OVERALL_PURCHASE_TARGET_PCT;
  return computeSpendSetAside(target, qualifies);
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
// Section 6d-2 — KW: Public Tenders Law national-product price preference
// (type 4, new 20 Sep 2026). Reuses the shared price-preference-margin
// primitive -- see PROGRAMS['kw-tender-law-price-preference'].sourceNoteEn
// for the full sourcing (Law 49/2016 Art. 62 + Decree No. 30/2017, 15%).
// ---------------------------------------------------------------------------

export const KUWAIT_TENDER_LAW_PRICE_PREFERENCE_MARGIN_PCT = 15;

function computePricePreferenceKw(kw: NonNullable<SupplierLocalContentInputs['kwTenderLawPricePreference']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(KUWAIT_TENDER_LAW_PRICE_PREFERENCE_MARGIN_PCT, kw.bidValueNationalProductPct);
}

// ---------------------------------------------------------------------------
// Section 6d-3 — BH: Takamul Local Value Certificate preference, Gulf-Made
// Products preference (both type 4, new 29 Sep 2026 verify-then-extend
// pass) -- see PROGRAMS['bh-takamul-local-value' | 'bh-gulf-made-
// preference'].sourceNoteEn for the full sourcing (Bahrain Tender Board's
// own Guideline for Suppliers & Contractors v1.0, Nov 2025, both 10%).
// Takamul is a binary certificate-holding fact (same binary-to-share
// conversion as Bahrain SME/Egypt oil & gas); Gulf-Made is evaluated per
// bid/product share, same continuously-scaled shape as Kuwait Art. 62.
// ---------------------------------------------------------------------------

export const BAHRAIN_TAKAMUL_PRICE_PREFERENCE_MARGIN_PCT = 10;
export const BAHRAIN_GULF_MADE_PRICE_PREFERENCE_MARGIN_PCT = 10;

function computePricePreferenceBhTakamul(bh: NonNullable<SupplierLocalContentInputs['bhTakamul']>): PricePreferenceMarginResult {
  const hasCert = bh.hasLocalValueCertificate;
  const share = hasCert === null || hasCert === undefined ? null : (hasCert ? 100 : 0);
  return computePricePreferenceMargin(BAHRAIN_TAKAMUL_PRICE_PREFERENCE_MARGIN_PCT, share);
}

function computePricePreferenceBhGulfMade(bh: NonNullable<SupplierLocalContentInputs['bhGulfMade']>): PricePreferenceMarginResult {
  return computePricePreferenceMargin(BAHRAIN_GULF_MADE_PRICE_PREFERENCE_MARGIN_PCT, bh.bidValueGulfOriginPct);
}

// ---------------------------------------------------------------------------
// Section 6d-4 — KW: Kuwaiti-nationality company price preference (type 4,
// new 29 Sep 2026 verify-then-extend pass) -- see PROGRAMS['kw-nationality-
// price-preference'].sourceNoteEn for the full sourcing (trade.gov +
// tenderspedia.com, 10%). A company-nationality test, binary like Takamul
// above -- not a product-origin share like 'kw-tender-law-price-preference'.
// ---------------------------------------------------------------------------

export const KUWAIT_NATIONALITY_PRICE_PREFERENCE_MARGIN_PCT = 10;

function computePricePreferenceKwNationality(kw: NonNullable<SupplierLocalContentInputs['kwNationality']>): PricePreferenceMarginResult {
  const isKuwaiti = kw.isKuwaitiNationalityCompany;
  const share = isKuwaiti === null || isKuwaiti === undefined ? null : (isKuwaiti ? 100 : 0);
  return computePricePreferenceMargin(KUWAIT_NATIONALITY_PRICE_PREFERENCE_MARGIN_PCT, share);
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

/** Tenders Law ICV consideration (QA / 'qa-tenders-icv', new 20 Sep 2026) --
 * reuses eligible-spend-ratio with a SINGLE combined pillar, since Article
 * 2 of the Executive Regulations bundles works/services/national-human-
 * resources development into one local-value definition (see PROGRAMS[
 * 'qa-tenders-icv'].sourceNoteEn for the full sourcing, including the
 * disclosed absence of any published Article 3 weighting/threshold). */
function computeQaTendersIcv(input: NonNullable<SupplierLocalContentInputs['qaTendersIcv']>): EligibleSpendRatioResult {
  const localValue = { key: 'qaTendersIcvLocalValue', eligible: n(input.localValueQAR), total: n(input.totalContractValueQAR) };
  return { mechanismType: 'eligible-spend-ratio', scorePct: localValue.total > 0 ? (localValue.eligible / localValue.total) * 100 : null, pillars: [localValue] };
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
      reasonAr: `${framework.programNameAr} موثّق كأنه يسري على مشتريات ${framework.applicableContexts.map(c => PROCUREMENT_CONTEXT_LABEL_AR[c]).join(' / ')} في ${framework.countryNameAr}. لا يوجد دليل موثّق على سريانه على مشتريات من نوع ${PROCUREMENT_CONTEXT_LABEL_AR[procurementContext]} — هذا التقييم لا ينطبق هنا، وليس درجة صفرية.`,
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
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'anchor-buyer-score', scorePct: null, components: [], totalCostsSAR: null, incentiveBonusPct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No IKTVA inputs supplied yet.', reasonAr: 'لم تُدخل بيانات اكتفاء بعد.' };
    }
    computation = computeIktvaAramco(inputs.iktva);
  } else if (resolvedProgram === 'sa-rawafed-stc') {
    if (!inputs.rawafedStc) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'eligible-spend-ratio', scorePct: null, pillars: [] }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Rawafed pillar inputs supplied yet.', reasonAr: 'لم تُدخل بيانات أركان روافد بعد.' };
    }
    computation = computeRawafedStc(inputs.rawafedStc);
  } else if (resolvedProgram === 'sa-sabic-lc-commitment') {
    if (!inputs.sabicLcCommitment) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'commitment-deviation-gate', proposedTargetPct: null, actualAuditedPct: null, deviationPct: null, toleranceThresholdPct: SABIC_LC_DEVIATION_TOLERANCE_PCT, withinTolerance: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No SABIC contract target/audited-actual inputs supplied yet.', reasonAr: 'لم تُدخل بيانات هدف العقد أو النسبة المدققة الخاصة بسابك بعد.' };
    }
    computation = computeSabicLcCommitmentGate(inputs.sabicLcCommitment);
  } else if (resolvedProgram === 'sa-gami-defense') {
    if (!inputs.saGami) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'gami-valuation-factor-credit-gate', contractValueSAR: null, contractValueThresholdSAR: GAMI_CONTRACT_VALUE_THRESHOLD_SAR, triggersCommitment: null, commitmentPctOfContractValue: GAMI_COMMITMENT_PCT_OF_CONTRACT_VALUE, requiredCommitmentSAR: null, category: null, categoryMinFactor: null, categoryMaxFactor: null, chosenFactor: null, smeBonusApplied: false, soleSourceBonusApplied: false, effectiveFactor: null, baseActivityValueSAR: null, creditedValueSAR: null, achievementPct: null, meetsCommitment: null, performanceSecurityPctOfContractValue: GAMI_PERFORMANCE_SECURITY_PCT_OF_CONTRACT_VALUE, performanceSecuritySAR: null, liquidationSAR: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No GAMI Industrial Participation contract-value/category inputs supplied yet.', reasonAr: 'لم تُدخل بيانات قيمة العقد أو فئة المشاركة الصناعية الخاصة بالهيئة العامة للصناعات العسكرية بعد.' };
    }
    computation = computeGamiValuationFactorCreditGate(inputs.saGami);
  } else if (resolvedProgram === 'sa-economic-participation-policy') {
    if (!inputs.saEp) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'import-value-participation-gate', importedContentValueSAR: null, importedContentValueThresholdSAR: EP_IMPORTED_VALUE_THRESHOLD_SAR, triggersCommitment: null, commitmentPctOfImportedValue: EP_COMMITMENT_PCT_OF_IMPORTED_VALUE, requiredCommitmentSAR: null, category: null, categoryMinFactor: null, categoryMaxFactor: null, chosenFactor: null, baseActivityValueSAR: null, creditedValueSAR: null, achievementPct: null, meetsCommitment: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No LCGPA Economic Participation Policy imported-value/category inputs supplied yet.', reasonAr: 'لم تُدخل بيانات قيمة المحتوى المستورد أو فئة المشاركة الاقتصادية الخاصة بالهيئة بعد.' };
    }
    computation = computeImportValueParticipationGate(inputs.saEp);
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
  } else if (resolvedProgram === 'ae-gcc-origin-treatment') {
    if (!inputs.aeGccOrigin) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'gcc-origin-national-treatment-gate', gccValueAddedPct: null, gccCitizenOwnershipPct: null, valueAddedThresholdPct: GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT, ownershipThresholdPct: GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT, qualifiesAsGccNationalProduct: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No GCC value-added/ownership inputs supplied yet.', reasonAr: 'لم تُدخل بيانات القيمة المضافة الخليجية أو نسبة الملكية بعد.' };
    }
    computation = computeGccOriginNationalTreatmentGate(inputs.aeGccOrigin);
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
  } else if (resolvedProgram === 'qa-tenders-icv') {
    if (!inputs.qaTendersIcv) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'eligible-spend-ratio', scorePct: null, pillars: [] }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Tenders Law local-value/contract-value inputs supplied yet.', reasonAr: 'لم تُدخل بيانات القيمة المحلية أو قيمة العقد بموجب قانون المناقصات بعد.' };
    }
    computation = computeQaTendersIcv(inputs.qaTendersIcv);
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
  } else if (resolvedProgram === 'kw-tender-law-price-preference') {
    if (!inputs.kwTenderLawPricePreference) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(KUWAIT_TENDER_LAW_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Kuwaiti national/GCC-product bid share supplied yet.', reasonAr: 'لم تُدخل نسبة المنتج الوطني/الخليجي في العطاء بعد.' };
    }
    computation = computePricePreferenceKw(inputs.kwTenderLawPricePreference);
  } else if (resolvedProgram === 'bh-takamul-local-value') {
    if (!inputs.bhTakamul) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(BAHRAIN_TAKAMUL_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Takamul Local Value Certificate status supplied yet.', reasonAr: 'لم تُدخل حالة شهادة القيمة المحلية (تكامل) بعد.' };
    }
    computation = computePricePreferenceBhTakamul(inputs.bhTakamul);
  } else if (resolvedProgram === 'bh-gulf-made-preference') {
    if (!inputs.bhGulfMade) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(BAHRAIN_GULF_MADE_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Gulf-origin bid share supplied yet.', reasonAr: 'لم تُدخل نسبة المنشأ الخليجي في العطاء بعد.' };
    }
    computation = computePricePreferenceBhGulfMade(inputs.bhGulfMade);
  } else if (resolvedProgram === 'bh-bahrainisation-tender-workforce') {
    if (!inputs.bhBahrainisation) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'percentage-threshold-gate', actualPct: null, thresholdPct: BAHRAIN_TENDER_BAHRAINISATION_THRESHOLD_PCT, meetsThreshold: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Bahraini-workforce share input supplied yet.', reasonAr: 'لم تُدخل نسبة القوى العاملة البحرينية بعد.' };
    }
    computation = computeBhBahrainisationGate(inputs.bhBahrainisation);
  } else if (resolvedProgram === 'kw-nationality-price-preference') {
    if (!inputs.kwNationality) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(KUWAIT_NATIONALITY_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Kuwaiti-nationality company status supplied yet.', reasonAr: 'لم تُدخل حالة صفة الشركة الكويتية الجنسية بعد.' };
    }
    computation = computePricePreferenceKwNationality(inputs.kwNationality);
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
  } else if (resolvedProgram === 'eg-auto-local-content') {
    if (!inputs.egAuto) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'production-incentive-eligibility-gate', vehicleCategory: null, localContentPct: null, localContentThresholdPct: null, meetsLocalContentThreshold: null, meetsPriceAndEngineCriteria: null, meetsProductionVolumeCriteria: null, eligibleForIncentive: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Egyptian AIDP vehicle-category/local-content inputs supplied yet.', reasonAr: 'لم تُدخل بيانات فئة المركبة أو المحتوى المحلي الخاصة ببرنامج تنمية صناعة السيارات المصري بعد.' };
    }
    computation = computeEgAutoProductionIncentiveGate(inputs.egAuto);
  } else if (resolvedProgram === 'tr-price-preference') {
    if (!inputs.tr) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(TURKEY_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Turkish domestic-goods-certified bid share supplied yet.', reasonAr: 'لم تُدخل نسبة السلع المحلية المعتمدة في العطاء بعد.' };
    }
    computation = computePricePreferenceTr(inputs.tr);
  } else if (resolvedProgram === 'tr-defense-offset') {
    if (!inputs.trDefenseOffset) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'industrialization-liability-gate', contractValueTRY: null, ysSmeWorkSharePct: null, ysSmeThresholdPct: TR_YS_SME_WORK_SHARE_THRESHOLD_PCT, meetsYsSmeThreshold: null, eydepWorkSharePct: null, eydepThresholdPct: TR_EYDEP_WORK_SHARE_THRESHOLD_PCT, meetsEydepThreshold: null, techAcquisitionValueTRY: null, techAcquisitionThresholdPct: TR_TECH_ACQUISITION_THRESHOLD_PCT, requiredTechAcquisitionValueTRY: null, meetsTechAcquisitionThreshold: null, meetsAllLiabilities: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No SSB Industrialization Guideline contract-value/liability inputs supplied yet.', reasonAr: 'لم تُدخل بيانات قيمة العقد أو الالتزامات بموجب دليل التصنيع لدى رئاسة الصناعات الدفاعية (SSB) بعد.' };
    }
    computation = computeTrIndustrializationLiabilityGate(inputs.trDefenseOffset);
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
  } else if (resolvedProgram === 'usa-berry-amendment-dod') {
    if (!inputs.usaBerry) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Berry Amendment coverage/domestic-sourcing inputs supplied yet.', reasonAr: 'لم تُدخل بيانات شمول تعديل بيري أو اختبار المصدر المحلي بعد.' };
    }
    computation = computeCategoryEligibilityGate({ inMandatoryListCategory: inputs.usaBerry.isBerryCoveredDodPurchase, certifiedForCategory: inputs.usaBerry.meetsBerryDomesticSourcingTest });
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
  } else if (resolvedProgram === 'in-make-in-india-price-preference') {
    if (!inputs.inMakeInIndia) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: computePricePreferenceMargin(INDIA_MAKE_IN_INDIA_PRICE_PREFERENCE_MARGIN_PCT, null), certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Indian local-content bid share supplied yet.', reasonAr: 'لم تُدخل نسبة المحتوى المحلي الهندي في العطاء بعد.' };
    }
    computation = computePricePreferenceInMakeInIndia(inputs.inMakeInIndia);
  } else if (resolvedProgram === 'jp-kankoju-sme-target-ratio') {
    if (!inputs.jp || inputs.jp.policyYearTargetRatioPct === null || inputs.jp.policyYearTargetRatioPct === undefined) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'spend-set-aside-target', targetSharePct: 0, qualifiesForSetAside: null, eligibleForReservedShare: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: "No current fiscal-year Kankouju target ratio supplied yet -- Japan's target is not fixed by statute; it is set fresh each fiscal year by Cabinet Basic Policy decision, so the caller must supply the currently published figure (see the program's sourceNoteEn for the disclosed FY2013 reference example and citation).", reasonAr: 'لم تُدخل نسبة استهداف كانكوجو للسنة المالية الحالية بعد — فهدف اليابان غير ثابت بنص قانوني؛ بل يُحدَّد من جديد كل سنة مالية بقرار من مجلس الوزراء ضمن السياسة الأساسية، لذا يجب على المستدعي تقديم الرقم المنشور حالياً (انظر ملاحظة المصدر للبرنامج للاطلاع على مثال مرجعي مفصح عنه للسنة المالية 2013 ومصدره).' };
    }
    computation = computeSpendSetAsideJp(inputs.jp);
  } else if (resolvedProgram === 'kr-sme-purchase-target-ratio') {
    if (!inputs.krSmeTarget) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'spend-set-aside-target', targetSharePct: KOREA_SME_OVERALL_PURCHASE_TARGET_PCT, qualifiesForSetAside: null, eligibleForReservedShare: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Korean SME product-category/qualification inputs supplied yet.', reasonAr: 'لم تُدخل بيانات فئة المنتج أو التأهل الكوري للمنشآت الصغيرة والمتوسطة بعد.' };
    }
    computation = computeSpendSetAsideKr(inputs.krSmeTarget);
  } else if (resolvedProgram === 'kr-sme-competitive-products-gate') {
    if (!inputs.krCompetitiveProducts) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'category-eligibility-gate', inMandatoryListCategory: null, certifiedForCategory: null, eligibleToBid: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Korean designated-competitive-product-category/direct-production inputs supplied yet.', reasonAr: 'لم تُدخل بيانات فئة المنتج التنافسي المُصنَّف أو الإنتاج المباشر الكوري بعد.' };
    }
    computation = computeCategoryEligibilityGate({ inMandatoryListCategory: inputs.krCompetitiveProducts.inDesignatedCompetitiveProductCategory, certifiedForCategory: inputs.krCompetitiveProducts.directProductionCertified });
  } else if (resolvedProgram === 'kw-local-content') {
    if (!inputs.kwLocalContent) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'dual-local-sourcing-gate', localMaterialsSharePct: null, localWorksSharePct: null, materialsThresholdPct: KUWAIT_ART87_LOCAL_MATERIALS_THRESHOLD_PCT, worksThresholdPct: KUWAIT_ART87_LOCAL_WORKS_THRESHOLD_PCT, meetsMaterialsThreshold: null, meetsWorksThreshold: null, meetsLocalSourcingRequirement: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No Kuwait Public Tenders Law Art. 87 local-materials/local-works share inputs supplied yet.', reasonAr: 'لم تُدخل بيانات حصة المواد أو الأعمال المحلية بموجب المادة ٨٧ من قانون المناقصات العامة الكويتي بعد.' };
    }
    computation = computeKwLocalSourcingGate(inputs.kwLocalContent);
  } else if (resolvedProgram === 'in-dap-2020-defense-offset') {
    if (!inputs.inDap) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'offset-multiplier-credit-gate', contractValueINR: null, obligationTriggerThresholdINR: INDIA_DAP_OFFSET_TRIGGER_THRESHOLD_INR_CRORE * 1e7, triggersObligation: null, requiredOffsetValueINR: null, offsetAvenue: null, avenueMultiplier: null, rawDischargedAmountINR: null, creditedOffsetValueINR: null, shortfallINR: null, meetsOffsetObligation: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No India DAP 2020 Buy (Global) contract-value/offset-avenue inputs supplied yet.', reasonAr: 'لم تُدخل بيانات قيمة العقد أو قناة المقاصة بموجب إجراء اقتناء الدفاع الهندي DAP 2020 (فئة الشراء العالمي) بعد.' };
    }
    computation = computeInDapOffsetGate(inputs.inDap);
  } else if (resolvedProgram === 'de-edip-defense-local-content') {
    if (!inputs.deEdip) {
      return { country, program: resolvedProgram, procurementContext, applicability: 'applicable', framework, computation: { mechanismType: 'eu-content-threshold-gate', euOrAssociatedContentPct: null, euContentThresholdPct: EDIP_EU_CONTENT_THRESHOLD_PCT, nonEuContentCapPct: EDIP_NON_EU_CONTENT_CAP_PCT, meetsEuContentThreshold: null }, certificationCaveatEn: NOT_CERTIFIED_EN, certificationCaveatAr: NOT_CERTIFIED_AR, reasonEn: 'No EU/associated-country content-share input supplied yet for EDIP eligibility.', reasonAr: 'لم تُدخل نسبة المحتوى الأوروبي أو المنتسب اللازمة لأهلية برنامج EDIP بعد.' };
    }
    computation = computeDeEdipContentGate(inputs.deEdip);
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
              : computation.mechanismType === 'commitment-deviation-gate'
                ? (computation.withinTolerance === null ? 'incomplete inputs' : computation.withinTolerance ? `within the ${computation.toleranceThresholdPct}-point tolerance (deviation ${computation.deviationPct?.toFixed(1)} points)` : `breach: deviation ${computation.deviationPct?.toFixed(1)} points exceeds the ${computation.toleranceThresholdPct}-point tolerance`)
                : computation.mechanismType === 'gcc-origin-national-treatment-gate'
                  ? (computation.qualifiesAsGccNationalProduct === null ? 'incomplete inputs' : computation.qualifiesAsGccNationalProduct ? 'qualifies as a GCC national manufactured product (Article 3)' : 'does not qualify as a GCC national manufactured product (Article 3)')
                  // (1 Oct 2026 resolution pass) Egypt AIDP incentive-
                  // eligibility gate -- found and fixed alongside this same
                  // gap: gcc-origin-national-treatment-gate (a 20 Sep 2026
                  // addition) had never been wired into this reasonEn
                  // chain either, silently falling to 'not sourced' despite
                  // being a fully sourced, resolved mechanism -- fixed here
                  // too, not left for a future pass to rediscover.
                  : computation.mechanismType === 'production-incentive-eligibility-gate'
                    ? (computation.eligibleForIncentive === null ? 'incomplete inputs' : computation.eligibleForIncentive ? 'eligible for an AIDP incentive (exact amount not computed -- see sourceNoteEn)' : 'gated out of AIDP incentive eligibility')
                    // (1 Oct 2026, Module 08 twelve-gap closure pass) three
                    // genuinely new mechanisms resolved this pass -- wired
                    // into this reasonEn chain from the start, not left for
                    // a later pass to rediscover the way gcc-origin and
                    // production-incentive both had to be fixed above.
                    : computation.mechanismType === 'dual-local-sourcing-gate'
                      ? (computation.meetsLocalSourcingRequirement === null ? 'incomplete inputs' : computation.meetsLocalSourcingRequirement ? `meets Art. 87's ${computation.materialsThresholdPct}% local-materials and ${computation.worksThresholdPct}% local-works thresholds` : 'does not meet Art. 87\'s local-sourcing thresholds')
                      : computation.mechanismType === 'offset-multiplier-credit-gate'
                        ? (computation.triggersObligation === null ? 'incomplete inputs' : computation.triggersObligation === false ? 'below the INR 2000-crore trigger, no offset obligation' : (computation.meetsOffsetObligation === null ? 'offset obligation triggered, avenue/discharge amount not yet supplied' : computation.meetsOffsetObligation ? `offset obligation met via credited value INR ${computation.creditedOffsetValueINR?.toLocaleString()}` : `shortfall INR ${computation.shortfallINR?.toLocaleString()} against the required offset`))
                        : computation.mechanismType === 'eu-content-threshold-gate'
                          ? (computation.meetsEuContentThreshold === null ? 'incomplete inputs' : computation.meetsEuContentThreshold ? `meets EDIP's ${computation.euContentThresholdPct}% EU/associated-content threshold` : `below EDIP's ${computation.euContentThresholdPct}% EU/associated-content threshold`)
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
              : computation.mechanismType === 'commitment-deviation-gate'
                ? (computation.withinTolerance === null ? 'بيانات غير مكتملة' : computation.withinTolerance ? `ضمن هامش التسامح البالغ ٥ نقاط (الانحراف ${computation.deviationPct?.toFixed(1)} نقطة)` : `تجاوز: الانحراف ${computation.deviationPct?.toFixed(1)} نقطة يتجاوز هامش التسامح البالغ ٥ نقاط`)
                : computation.mechanismType === 'gcc-origin-national-treatment-gate'
                  ? (computation.qualifiesAsGccNationalProduct === null ? 'بيانات غير مكتملة' : computation.qualifiesAsGccNationalProduct ? 'مؤهل كمنتج وطني خليجي (المادة ٣)' : 'غير مؤهل كمنتج وطني خليجي (المادة ٣)')
                  : computation.mechanismType === 'production-incentive-eligibility-gate'
                    ? (computation.eligibleForIncentive === null ? 'بيانات غير مكتملة' : computation.eligibleForIncentive ? 'مؤهل لحافز برنامج تنمية صناعة السيارات (القيمة الدقيقة غير محسوبة — انظر ملاحظة المصدر)' : 'مستبعد من أهلية حافز برنامج تنمية صناعة السيارات')
                    : computation.mechanismType === 'dual-local-sourcing-gate'
                      ? (computation.meetsLocalSourcingRequirement === null ? 'بيانات غير مكتملة' : computation.meetsLocalSourcingRequirement ? `يستوفي حدّي المادة ٨٧ (${computation.materialsThresholdPct}٪ مواد محلية و${computation.worksThresholdPct}٪ أعمال محلية)` : 'لا يستوفي حدود التوريد المحلي بموجب المادة ٨٧')
                      : computation.mechanismType === 'offset-multiplier-credit-gate'
                        ? (computation.triggersObligation === null ? 'بيانات غير مكتملة' : computation.triggersObligation === false ? 'أقل من حد التفعيل البالغ ٢٠٠٠ كرور روبية، لا يوجد التزام مقاصة' : (computation.meetsOffsetObligation === null ? 'تم تفعيل التزام المقاصة، ولم تُدخل بيانات القناة/مبلغ الاستيفاء بعد' : computation.meetsOffsetObligation ? `تم استيفاء التزام المقاصة بقيمة ائتمان ${computation.creditedOffsetValueINR?.toLocaleString()} روبية` : `عجز قدره ${computation.shortfallINR?.toLocaleString()} روبية عن التزام المقاصة المطلوب`))
                        : computation.mechanismType === 'eu-content-threshold-gate'
                          ? (computation.meetsEuContentThreshold === null ? 'بيانات غير مكتملة' : computation.meetsEuContentThreshold ? `يستوفي حد EDIP للمحتوى الأوروبي/المنتسب البالغ ${computation.euContentThresholdPct}٪` : `دون حد EDIP للمحتوى الأوروبي/المنتسب البالغ ${computation.euContentThresholdPct}٪`)
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
      primaryAr: `أغلق الفجوة البالغة ${gap.toFixed(1)} نقطة مباشرة: زد الإنفاق في الركن (المكوّن) ذي النسبة المؤهلة الأدنى أولاً (انظر التفصيل أعلاه) — هذا يرفع الدرجة المعتمدة/التوجيهية نفسها، وهو الحل الدائم.`,
      alternativeEn: 'If the gap cannot close before this tender\'s deadline: partner or subcontract the shortfall portion of scope with an already-certified local entity, or target a different tender/procuring entity whose threshold this supplier already clears.',
      alternativeAr: 'إذا تعذّر إغلاق الفجوة قبل موعد هذه المناقصة: أشرك جهة محلية معتمدة مسبقاً كشريك أو مقاول من الباطن للجزء الناقص من النطاق، أو استهدف مناقصة/جهة شراء أخرى يفي هذا المورّد بحدّها الأدنى بالفعل.',
    };
  }
  if (c.mechanismType === 'modified-icv-score') {
    if (c.finalScorePct === null || targetThresholdPct === null || c.finalScorePct >= targetThresholdPct) return null;
    const gap = targetThresholdPct - c.finalScorePct;
    const manufacturerHint = c.isEligibleManufacturer ? '' : ' Confirming eligible-manufacturer status (if applicable) would apply icv.qa\'s own ICV+ 50% score boost on top of the base ratio -- check eligibility before assuming this gap requires new spend.';
    const manufacturerHintAr = c.isEligibleManufacturer ? '' : ' تأكد من استيفاء شروط صفة "المصنّع المؤهل" (إن انطبقت)، إذ تطبّق icv.qa مكافأة ICV+ بنسبة ٥٠٪ على الدرجة الأساسية — تحقق من الأهلية قبل افتراض أن سد هذه الفجوة يتطلب إنفاقاً جديداً.';
    return {
      primaryEn: `Close the ${gap.toFixed(1)}-point gap directly: increase eligible Qatar spend (local goods/materials, local services, Qatari-national/resident training, supplier training/certification, or Qatar-based asset depreciation) against total Qatar revenue excluding exports -- this raises the base ratio the whole score is built on.${manufacturerHint}`,
      primaryAr: `أغلق الفجوة البالغة ${gap.toFixed(1)} نقطة مباشرة: زد الإنفاق القطري المؤهل (سلع/مواد محلية، خدمات محلية، تدريب مواطنين/مقيمين قطريين، تدريب/اعتماد الموردين، أو إهلاك أصول مقيمة في قطر) مقابل إجمالي إيرادات قطر باستثناء الصادرات — هذا يرفع النسبة الأساسية التي تُبنى عليها الدرجة كاملة.${manufacturerHintAr}`,
      alternativeEn: 'If the gap cannot close before this tender\'s deadline: confirm micro/small-supplier status for icv.qa\'s blanket 30% score floor if genuinely eligible, or partner/subcontract the shortfall portion of scope with an already-ICV-certified local entity.',
      alternativeAr: 'إذا تعذّر إغلاق الفجوة قبل موعد هذه المناقصة: تحقق من استيفاء شروط صفة المورّد متناهي الصغر أو الصغير للاستفادة من الحد الأدنى الشامل لدرجة icv.qa البالغ ٣٠٪ إن كانت الأهلية حقيقية، أو أشرك جهة محلية معتمدة من icv.qa كشريك أو مقاول من الباطن للجزء الناقص من النطاق.',
    };
  }
  if (c.mechanismType === 'price-preference-margin') {
    if (c.locallyManufacturedSharePct === null || c.locallyManufacturedSharePct >= 100) return null;
    return {
      primaryEn: `Increasing the locally-manufactured share of this bid raises the effective price-preference discount directly (currently ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} of a possible ${c.preferenceMarginPct} points) -- source more of the bid's content from local manufacturing where the specification allows it.`,
      primaryAr: `زيادة الحصة المصنّعة محلياً في هذا العطاء ترفع الخصم السعري الفعلي مباشرة (حالياً ${c.effectiveBidDiscountPct?.toFixed(1) ?? '0'} من أصل ${c.preferenceMarginPct} نقطة ممكنة) — استمد جزءاً أكبر من محتوى العطاء من التصنيع المحلي حيثما تسمح المواصفة.`,
      alternativeEn: 'If the specification genuinely cannot be met locally, the bid still competes on its own technical/commercial merits without the preference -- confirm whether the gap is decisive before investing in re-sourcing.',
      alternativeAr: 'إذا تعذّر فعلياً استيفاء المواصفة محلياً، يظل العطاء قادراً على المنافسة بمزاياه الفنية والتجارية دون التفضيل — تأكد من أن الفجوة حاسمة قبل الاستثمار في إعادة التوريد.',
    };
  }
  if (c.mechanismType === 'category-eligibility-gate') {
    if (c.eligibleToBid !== false) return null; // only recommend when genuinely gated out
    const programNameEn = assessment.framework.programNameEn;
    const programNameAr = assessment.framework.programNameAr;
    return {
      primaryEn: `This category is on ${programNameEn}'s Mandatory List and this supplier is not yet certified for it: pursue certification for this specific category before the next bid cycle -- this is the only way to remove the gate itself.`,
      primaryAr: `هذه الفئة مدرجة في القائمة الإلزامية لـ${programNameAr}، وهذا المورّد غير معتمد لها بعد: تابع الحصول على الاعتماد لهذه الفئة تحديداً قبل دورة العطاءات القادمة — هذا هو السبيل الوحيد لإزالة البوابة نفسها.`,
      alternativeEn: 'If certification cannot complete in time: bid jointly with, or subcontract to, an already-certified local entity for the mandatory-list portion of scope, or target a lot/category that is not on the Mandatory List.',
      alternativeAr: 'إذا تعذّر إتمام الاعتماد في الوقت المناسب: قدّم عطاءً مشتركاً مع جهة محلية معتمدة مسبقاً أو أسند لها كمقاول من الباطن الجزء المشمول بالقائمة الإلزامية من النطاق، أو استهدف حزمة/فئة غير مدرجة في القائمة الإلزامية.',
    };
  }
  if (c.mechanismType === 'production-incentive-eligibility-gate') {
    if (c.eligibleForIncentive !== false) return null; // only recommend when genuinely gated out
    const failedLocalContent = c.meetsLocalContentThreshold === false;
    const failedVolume = c.meetsProductionVolumeCriteria === false;
    const failedPriceEngine = c.meetsPriceAndEngineCriteria === false;
    return {
      primaryEn: `This vehicle does not yet meet the National Automotive Industry Development Program's incentive-eligibility gate${c.vehicleCategory ? ` for ${c.vehicleCategory === 'ice' ? 'fossil-fuel' : 'electric'} vehicles` : ''}: ${failedLocalContent ? `raise local content to at least ${c.localContentThresholdPct}%` : ''}${failedLocalContent && (failedVolume || failedPriceEngine) ? ', and ' : ''}${failedVolume ? 'meet the sourced production-volume minimum' : ''}${failedVolume && failedPriceEngine ? ', and ' : ''}${failedPriceEngine ? 'bring the ex-factory price/engine size within the program\'s eligible range' : ''} -- closing every failed gate is required before any incentive (amount not computed by this engine -- see the program's sourceNoteEn) becomes available.`,
      primaryAr: `لا تستوفي هذه المركبة بعد بوابة أهلية الحوافز الخاصة بالبرنامج الوطني لتنمية صناعة السيارات${c.vehicleCategory ? ` للمركبات ${c.vehicleCategory === 'ice' ? 'التقليدية' : 'الكهربائية'}` : ''}: ${failedLocalContent ? `رفع المحتوى المحلي إلى ${c.localContentThresholdPct}٪ على الأقل` : ''}${failedLocalContent && (failedVolume || failedPriceEngine) ? '، و' : ''}${failedVolume ? 'استيفاء الحد الأدنى الموثّق لحجم الإنتاج' : ''}${failedVolume && failedPriceEngine ? '، و' : ''}${failedPriceEngine ? 'إعادة سعر التصنيع/سعة المحرك ضمن النطاق المؤهل للبرنامج' : ''} — إغلاق كل بوابة فاشلة مطلوب قبل توفر أي حافز (القيمة الدقيقة غير محسوبة في هذا المحرك — انظر ملاحظة مصدر البرنامج).`,
      alternativeEn: 'If these thresholds cannot be met for this model/volume: the vehicle can still be sold in the general market without AIDP incentive support -- confirm whether the incentive value is decisive to the business case before re-engineering toward compliance.',
      alternativeAr: 'إذا تعذّر استيفاء هذه العتبات لهذا الطراز/الحجم: يمكن بيع المركبة في السوق العام دون دعم حافز البرنامج — تأكد من أن قيمة الحافز حاسمة لجدوى الأعمال قبل إعادة التصميم لتحقيق الامتثال.',
    };
  }
  if (c.mechanismType === 'spend-set-aside-target') {
    if (c.qualifiesForSetAside !== false) return null; // only recommend when genuinely not qualifying
    const programNameEn = assessment.framework.programNameEn;
    const programNameAr = assessment.framework.programNameAr;
    return {
      primaryEn: `This supplier does not currently qualify for ${programNameEn}'s reserved ${c.targetSharePct}% share: pursue the underlying qualification (registration/classification with the sourced authority) before the next bid cycle -- this is the only way to compete within the reserved pool itself, not just around it.`,
      primaryAr: `لا يستوفي هذا المورّد حالياً شروط التأهل للحصة المخصصة البالغة ${c.targetSharePct}٪ ضمن ${programNameAr}: تابع استيفاء شرط التأهل الأساسي (التسجيل/التصنيف لدى الجهة الموثّقة) قبل دورة العطاءات القادمة — هذا هو السبيل الوحيد للمنافسة ضمن الحصة المخصصة نفسها، وليس الالتفاف حولها فقط.`,
      alternativeEn: 'If qualification cannot complete in time: this supplier still competes for the open (non-reserved) portion of spend on its own technical/commercial merits -- confirm whether the reserved-share advantage is decisive before investing in the qualification process.',
      alternativeAr: 'إذا تعذّر استيفاء شرط التأهل في الوقت المناسب: يظل هذا المورّد قادراً على المنافسة على الجزء المفتوح (غير المخصص) من الإنفاق بمزاياه الفنية والتجارية — تأكد من أن ميزة الحصة المخصصة حاسمة قبل الاستثمار في عملية التأهل.',
    };
  }
  if (c.mechanismType === 'offset-obligation-gate') {
    if (c.triggersObligation !== true || c.shortfallAED === null || c.shortfallAED <= 0) return null;
    return {
      primaryEn: `Bank real offset credits toward the AED ${c.shortfallAED.toLocaleString()} shortfall before the performance period closes (local investment, JV, or technology-transfer activity that Tawazun recognizes as credit) -- this is the only path that both closes the gap and avoids the cash/guarantee cost below.`,
      primaryAr: `اكتسب ائتمانات مقاصة حقيقية لسد النقص البالغ ${c.shortfallAED.toLocaleString()} درهم قبل إغلاق فترة الأداء (استثمار محلي، مشروع مشترك، أو نشاط نقل تقني يعترف به توازن كائتمان) — هذا هو المسار الوحيد الذي يغلق الفجوة ويتجنب تكلفة النقد/الضمان أدناه معاً.`,
      alternativeEn: `If new offset activity cannot be arranged in time: settle the shortfall in cash at 8.5% (AED ${c.shortfallPenaltyAED?.toLocaleString() ?? '—'}) or negotiate rolling the remaining obligation into a future project with Tawazun -- both are the program's own disclosed fallback options, not a compliance failure.`,
      alternativeAr: `إذا تعذّر ترتيب نشاط مقاصة جديد في الوقت المناسب: سوِّ النقص نقداً بنسبة ٨.٥٪ (${c.shortfallPenaltyAED?.toLocaleString() ?? '—'} درهم) أو تفاوض مع توازن لترحيل الالتزام المتبقي إلى مشروع مستقبلي — كلا الخيارين من البدائل المُفصَح عنها رسمياً في البرنامج نفسه، وليسا إخفاقاً في الامتثال.`,
    };
  }
  if (c.mechanismType === 'commitment-deviation-gate') {
    if (c.withinTolerance !== false || c.deviationPct === null || c.proposedTargetPct === null || c.actualAuditedPct === null) return null;
    return {
      primaryEn: `Close the ${c.deviationPct.toFixed(1)}-point shortfall directly before the next audit cycle: increase delivered local content toward this contract's own committed target of ${c.proposedTargetPct.toFixed(1)}% (currently audited at ${c.actualAuditedPct.toFixed(1)}%) -- this is the only path that removes the breach itself, not just its consequence.`,
      primaryAr: `أغلق النقص البالغ ${c.deviationPct.toFixed(1)} نقطة مباشرة قبل دورة التدقيق القادمة: ارفع المحتوى المحلي المُسلَّم نحو الهدف الملتزم به في هذا العقد والبالغ ${c.proposedTargetPct.toFixed(1)}٪ (المدقَّق حالياً عند ${c.actualAuditedPct.toFixed(1)}٪) — هذا هو المسار الوحيد الذي يزيل المخالفة نفسها، لا نتيجتها فقط.`,
      alternativeEn: `If the gap cannot close before the next audit: this contract's own terms allow settling with a penalty of up to ${SABIC_LC_PENALTY_MAX_PCT_OF_CONTRACT_VALUE}% of contract value, or renegotiating the committed target itself with SABIC if the shortfall reflects a genuine change in scope -- both are real options, not a compliance failure to hide.`,
      alternativeAr: `إذا تعذّر إغلاق الفجوة قبل التدقيق القادم: تتيح شروط هذا العقد نفسها التسوية بغرامة تصل إلى ١٪ من قيمة العقد، أو إعادة التفاوض على الهدف الملتزم به نفسه مع سابك إذا كان النقص يعكس تغيراً فعلياً في النطاق — كلا الخيارين حقيقي، وليسا إخفاقاً في الامتثال يجب إخفاؤه.`,
    };
  }
  if (c.mechanismType === 'gcc-origin-national-treatment-gate') {
    if (c.qualifiesAsGccNationalProduct !== false) return null; // only recommend when genuinely not qualifying
    const vaText = c.gccValueAddedPct !== null ? `${c.gccValueAddedPct.toFixed(1)}%` : 'not yet entered';
    const ownText = c.gccCitizenOwnershipPct !== null ? `${c.gccCitizenOwnershipPct.toFixed(1)}%` : 'not yet entered';
    const vaTextAr = c.gccValueAddedPct !== null ? `${c.gccValueAddedPct.toFixed(1)}%` : 'لم تُدخَل بعد';
    const ownTextAr = c.gccCitizenOwnershipPct !== null ? `${c.gccCitizenOwnershipPct.toFixed(1)}%` : 'لم تُدخَل بعد';
    return {
      primaryEn: `Increase this supplier's GCC-sourced value-added and/or GCC-citizen ownership share toward the GCC Unified Economic Agreement's own Article 3(1) thresholds (currently ${vaText} value-added vs. a required ${GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT}%, ${ownText} GCC-citizen ownership vs. a required ${GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT}%) -- this is the only path that qualifies the product for national treatment under the treaty right itself.`,
      primaryAr: `ارفع نسبة القيمة المضافة الخليجية المصدر و/أو نسبة ملكية مواطني دول مجلس التعاون لهذا المورّد نحو حدود المادة ٣(١) من الاتفاقية الاقتصادية الموحدة لدول مجلس التعاون نفسها (حالياً ${vaTextAr} قيمة مضافة مقابل الحد المطلوب ${GCC_ORIGIN_VALUE_ADDED_THRESHOLD_PCT}%، و${ownTextAr} ملكية لمواطني الخليج مقابل الحد المطلوب ${GCC_ORIGIN_OWNERSHIP_THRESHOLD_PCT}%) — هذا هو المسار الوحيد الذي يؤهل المنتج للمعاملة الوطنية بموجب الحق التعاهدي نفسه.`,
      alternativeEn: `If GCC-origin status cannot be established in time, pursue the standard MoIAT ICV certification path instead (this supplier's ae-icv-general assessment, if run) -- a separate legal basis this supplier may still qualify for on its own domestic-content merits, without relying on the treaty claim this program's own sourcing disclosure flags as not yet confirmed operationalized in MoIAT's published methodology.`,
      alternativeAr: `إذا تعذّر إثبات المنشأ الخليجي في الوقت المناسب، تابع مسار اعتماد المحتوى المحلي القياسي (ICV) لدى وزارة الصناعة والتكنولوجيا المتقدمة بدلاً من ذلك (تقييم ae-icv-general لهذا المورّد، إن أُجري) — وهو أساس قانوني منفصل قد يظل هذا المورّد مؤهلاً له بناءً على محتواه المحلي الفعلي، دون الاعتماد على المطالبة التعاهدية التي يُشير إفصاح المصدر في هذا البرنامج نفسه إلى أنها لم تُؤكَّد كمفعّلة رسمياً في منهجية الوزارة المنشورة.`,
    };
  }
  // Module 08 twelve-gap closure pass (1 Oct 2026) -- three new mechanisms;
  // wired into recommendLocalContentAction from the start so a gated-out
  // supplier under any of these three gets the same two-card recommendation
  // every other resolved mechanism already gets, rather than silently
  // falling through to `return null` below.
  if (c.mechanismType === 'dual-local-sourcing-gate') {
    if (c.meetsLocalSourcingRequirement !== false) return null; // only recommend when genuinely gated out
    const failedMaterials = c.meetsMaterialsThreshold === false;
    const failedWorks = c.meetsWorksThreshold === false;
    return {
      primaryEn: `This bid does not yet meet Kuwait Public Tenders Law No. 49/2016 Article 87's local-sourcing gate: ${failedMaterials ? `raise local materials share to at least ${c.materialsThresholdPct}%` : ''}${failedMaterials && failedWorks ? ', and ' : ''}${failedWorks ? `raise local works share to at least ${c.worksThresholdPct}%` : ''} -- both thresholds are independently required, so closing only one does not clear the gate.`,
      primaryAr: `لا يستوفي هذا العطاء بعد بوابة التوريد المحلي بموجب المادة ٨٧ من قانون المناقصات العامة الكويتي رقم ٤٩ لسنة ٢٠١٦: ${failedMaterials ? `رفع نسبة المواد المحلية إلى ${c.materialsThresholdPct}٪ على الأقل` : ''}${failedMaterials && failedWorks ? '، و' : ''}${failedWorks ? `رفع نسبة الأعمال المحلية إلى ${c.worksThresholdPct}٪ على الأقل` : ''} — كلا الحدّين مطلوب بشكل مستقل، فإغلاق أحدهما فقط لا يفتح البوابة.`,
      alternativeEn: 'If neither share can close before submission: partner with, or subcontract the materials/works shortfall portion to, an already-qualifying local entity -- the gate is evaluated at the bid level, not the individual supplier level alone.',
      alternativeAr: 'إذا تعذّر إغلاق أي من النسبتين قبل التقديم: أشرك جهة محلية مستوفية للشرط كشريك أو مقاول من الباطن للجزء الناقص من المواد أو الأعمال — تُقيَّم البوابة على مستوى العطاء ككل، لا على مستوى المورّد الفردي وحده.',
    };
  }
  if (c.mechanismType === 'offset-multiplier-credit-gate') {
    if (c.meetsOffsetObligation !== false || c.shortfallINR === null || c.shortfallINR <= 0) return null;
    return {
      primaryEn: `Close the INR ${c.shortfallINR.toLocaleString()} offset shortfall before the contractual discharge period ends by directing more of the discharge toward a higher-multiplier avenue (DRDO critical-technology acquisition carries the highest disclosed multiplier at 4.0x) -- this reduces the raw amount that needs to be discharged to meet the same credited value.`,
      primaryAr: `أغلق النقص في المقاصة البالغ ${c.shortfallINR.toLocaleString()} روبية هندية قبل انتهاء فترة الإيفاء التعاقدية بتوجيه جزء أكبر من الإيفاء نحو مسار ذي معامل أعلى (اكتساب التكنولوجيا الحرجة من منظمة دي آر دي أو يحمل أعلى معامل مُفصَح عنه عند ٤.٠×) — هذا يقلل المبلغ الخام المطلوب إيفاؤه للوصول إلى نفس القيمة المُعتمَدة.`,
      alternativeEn: "If the shortfall cannot close through a higher-multiplier avenue in time: DAP 2020 Para 3.1 does not permit clubbing avenues within a single discharge, but a fresh, separate discharge against a different eligible avenue before the period closes is a real option -- confirm with the Ministry of Defence's offset management wing before assuming the obligation is unmet.",
      alternativeAr: "إذا تعذّر إغلاق النقص عبر مسار ذي معامل أعلى في الوقت المناسب: لا تسمح الفقرة ٣.١ من إجراءات اقتناء الدفاع ٢٠٢٠ بدمج المسارات ضمن إيفاء واحد، لكن إيفاءً جديداً منفصلاً عبر مسار مؤهل آخر قبل إغلاق الفترة يظل خياراً حقيقياً — تأكد مع جهاز إدارة المقاصة بوزارة الدفاع الهندية قبل افتراض أن الالتزام غير مستوفى.",
    };
  }
  if (c.mechanismType === 'eu-content-threshold-gate') {
    if (c.meetsEuContentThreshold !== false) return null; // only recommend when genuinely gated out
    const pctText = c.euOrAssociatedContentPct !== null ? `${c.euOrAssociatedContentPct.toFixed(1)}%` : 'not yet entered';
    const pctTextAr = c.euOrAssociatedContentPct !== null ? `${c.euOrAssociatedContentPct.toFixed(1)}%` : 'لم تُدخَل بعد';
    return {
      primaryEn: `Raise the EU-or-associated-country content share toward EDIP's own disclosed ${c.euContentThresholdPct}% minimum (currently ${pctText}) -- this is the only path that clears the gate itself under Regulation (EU) 2025/2643.`,
      primaryAr: `رفع نسبة المحتوى من الاتحاد الأوروبي أو الدول المنتسبة نحو الحد الأدنى المُفصَح عنه في برنامج تنمية الصناعة الدفاعية الأوروبية والبالغ ${c.euContentThresholdPct}٪ (حالياً ${pctTextAr}) — هذا هو المسار الوحيد الذي يفتح البوابة نفسها بموجب اللائحة (الاتحاد الأوروبي) ٢٠٢٥/٢٦٤٣.`,
      alternativeEn: `If the EU-content share cannot be raised before this programme's submission window: the non-EU/non-associated share must stay within the disclosed ${c.nonEuContentCapPct}% cap even on a re-submission, so re-sourcing the shortfall portion from an EU or associated country is the only route that reopens eligibility, not a one-time waiver.`,
      alternativeAr: `إذا تعذّر رفع نسبة المحتوى الأوروبي قبل نافذة التقديم لهذا البرنامج: يجب أن تبقى نسبة المحتوى من خارج الاتحاد الأوروبي والدول المنتسبة ضمن الحد الأقصى المُفصَح عنه والبالغ ${c.nonEuContentCapPct}٪ حتى في إعادة التقديم، فإعادة توريد الجزء الناقص من دولة في الاتحاد الأوروبي أو دولة منتسبة هو المسار الوحيد الذي يعيد فتح الأهلية، وليس استثناءً لمرة واحدة.`,
    };
  }
  if (c.mechanismType === 'gami-valuation-factor-credit-gate') {
    if (c.meetsCommitment !== false || c.liquidationSAR === null || c.liquidationSAR <= 0) return null;
    return {
      primaryEn: `Raise this line item's credited Industrial Participation value above the SAR ${c.requiredCommitmentSAR?.toLocaleString() ?? ''} commitment before the contract's own IP deadline -- directing additional base activity value toward a higher-Valuation-Factor category (B.1 FDI or B.5 R&T programs carry the policy's own highest disclosed range, 2.0-5.0x) closes the gap fastest per riyal of underlying activity.`,
      primaryAr: `رفع القيمة المُعتمَدة للمشاركة الصناعية لهذا البند فوق الالتزام البالغ ${c.requiredCommitmentSAR?.toLocaleString() ?? ''} ريال سعودي قبل الموعد النهائي للمشاركة الصناعية في العقد — توجيه قيمة نشاط أساسية إضافية نحو فئة ذات عامل تقييم أعلى (الاستثمار الأجنبي المباشر B.1 أو برامج البحث والتقنية B.5 تحملان أعلى نطاق مُفصَح عنه في السياسة، ٢.٠-٥.٠×) يُغلق الفجوة بأسرع وتيرة لكل ريال من النشاط الأساسي.`,
      alternativeEn: "If the credited value cannot close in time: the policy's own Bonus Credit (an additional 10% of the commitment once >=30% Localization is achieved) and its 5-year Excess Credit banking system (from a DIFFERENT contract, capped at 25% of this commitment) are both real, disclosed levers -- but neither is modeled in this single-line-item assessment, so confirm their availability directly with GAMI's own Industrial Participation case team rather than assuming this engine's figure is the final word.",
      alternativeAr: "إذا تعذّر إغلاق القيمة المُعتمَدة في الوقت المناسب: يوفر الائتمان التحفيزي الخاص بالسياسة نفسها (١٠٪ إضافية من الالتزام عند تحقيق ٣٠٪ توطين على الأقل) ونظام ترحيل الائتمانات الفائضة لمدة ٥ سنوات (من عقد آخر، بحد أقصى ٢٥٪ من هذا الالتزام) أداتين حقيقيتين ومُفصَح عنهما — لكن لا تُحتسب أي منهما في هذا التقييم أحادي البند، فتأكد من توفرهما مباشرة مع فريق قضايا المشاركة الصناعية في الهيئة العامة للصناعات العسكرية بدلاً من افتراض أن رقم هذا المحرك هو القول الأخير.",
    };
  }
  if (c.mechanismType === 'import-value-participation-gate') {
    if (c.meetsCommitment !== false) return null;
    return {
      primaryEn: `Raise this line item's credited Economic Participation value above the SAR ${c.requiredCommitmentSAR?.toLocaleString() ?? ''} commitment before the contract's own EP deadline -- directing additional base activity value toward a higher-Valuation-Factor category (Research & Development carries the policy's own highest disclosed factor, a fixed 3.0x) closes the gap fastest per riyal of underlying activity.`,
      primaryAr: `رفع القيمة المُعتمَدة للمشاركة الاقتصادية لهذا البند فوق الالتزام البالغ ${c.requiredCommitmentSAR?.toLocaleString() ?? ''} ريال سعودي قبل الموعد النهائي للمشاركة الاقتصادية في العقد — توجيه قيمة نشاط أساسية إضافية نحو فئة ذات عامل تقييم أعلى (البحث والتطوير يحمل أعلى عامل ثابت مُفصَح عنه في السياسة، ٣.٠×) يُغلق الفجوة بأسرع وتيرة لكل ريال من النشاط الأساسي.`,
      alternativeEn: "If the credited value cannot close in time: LCGPA's own pending reform (a lower, tiered 25% requirement, per DGA Group's public-consultation-draft coverage) may change this commitment's size in a future contract cycle, but is not yet confirmed in force -- confirm the applicable version and any available extension directly with LCGPA's own Economic Participation case team rather than assuming this engine's currently-in-force 35% figure will still apply unchanged.",
      alternativeAr: "إذا تعذّر إغلاق القيمة المُعتمَدة في الوقت المناسب: قد يغيّر إصلاح الهيئة المرتقب (متطلب أدنى متدرّج بنسبة ٢٥٪، وفق تغطية مشروع التشاور العام لمجموعة DGA) حجم هذا الالتزام في دورة تعاقد مستقبلية، لكنه لم يُؤكَّد نفاذه بعد — تأكد من النسخة النافذة وأي تمديد متاح مباشرة مع فريق قضايا المشاركة الاقتصادية في الهيئة بدلاً من افتراض أن نسبة ٣٥٪ النافذة حالياً في هذا المحرك ستظل كما هي دون تغيير.",
    };
  }
  if (c.mechanismType === 'industrialization-liability-gate') {
    if (c.meetsAllLiabilities !== false) return null;
    const failedParts: string[] = [];
    if (c.meetsYsSmeThreshold === false) failedParts.push(`YS/SME work share (${c.ysSmeWorkSharePct?.toFixed(1)}% vs ${c.ysSmeThresholdPct}% required)`);
    if (c.meetsEydepThreshold === false) failedParts.push(`EYDEP-accredited work share (${c.eydepWorkSharePct?.toFixed(1)}% vs ${c.eydepThresholdPct}% required)`);
    if (c.meetsTechAcquisitionThreshold === false) failedParts.push(`TUK technology-acquisition value (vs ${c.techAcquisitionThresholdPct}% of bid value required)`);
    return {
      primaryEn: `Close the shortfall on the failing liabilit${failedParts.length === 1 ? 'y' : 'ies'} before SSB's own contractual deadline: ${failedParts.join('; ')}. Each of the three liabilities is independently binding -- raising one does not offset a shortfall on another.`,
      primaryAr: `أغلق النقص في الالتزام (أو الالتزامات) المتعثرة قبل الموعد النهائي التعاقدي لدى رئاسة الصناعات الدفاعية: ${failedParts.join('؛ ')}. كل التزام من الثلاثة مُلزِم بشكل مستقل — ورفع أحدها لا يعوّض نقصاً في آخر.`,
      alternativeEn: "If a sub-liability cannot close in time: SSB's own Offset Credit Transfer and Advance Credit mechanisms allow credit earned on a different qualifying project to be applied here, subject to SSB's own conversion rates and prior written approval -- confirm directly with SSB's Industrialization directorate rather than assuming an unapproved transfer counts.",
      alternativeAr: "إذا تعذّر إغلاق التزام فرعي في الوقت المناسب: تسمح آليتا تحويل ائتمان المقاصة والائتمان المسبق لدى رئاسة الصناعات الدفاعية بتطبيق ائتمان مكتسب من مشروع مؤهل آخر هنا، بشرط معدلات التحويل الخاصة بالرئاسة وموافقتها الخطية المسبقة — تأكد مباشرة مع إدارة التصنيع في الرئاسة بدلاً من افتراض أن تحويلاً غير معتمد يُحسَب.",
    };
  }
  if (c.mechanismType === 'percentage-threshold-gate') {
    if (c.meetsThreshold !== false) return null;
    const pctText = c.actualPct !== null ? `${c.actualPct.toFixed(1)}%` : 'not yet entered';
    const pctTextAr = c.actualPct !== null ? `${c.actualPct.toFixed(1)}%` : 'لم تُدخَل بعد';
    return {
      primaryEn: `Raise the workforce share toward the Parliament-approved ${c.thresholdPct}% Bahrainisation minimum (currently ${pctText}) before certifying -- the Ministry of Labour issues the actual Bahrainisation Certificate the Tender Board requires, so confirm the certified figure with them directly rather than relying on a self-reported share alone.`,
      primaryAr: `رفع نسبة القوى العاملة نحو الحد الأدنى للبحرنة الذي وافق عليه مجلس النواب والبالغ ${c.thresholdPct}٪ (حالياً ${pctTextAr}) قبل التصديق — تُصدر وزارة العمل شهادة البحرنة الفعلية التي يطلبها مجلس المناقصات والمزايدات، فتأكد من الرقم المعتمَد معها مباشرة بدلاً من الاعتماد على نسبة ذاتية التصريح فقط.`,
      alternativeEn: 'If the workforce share cannot be raised before submission: this gate applies to general government tenders specifically -- a separately-sourced, higher 50% Bahraini-workforce figure applies only to privatised state-service contracts, a different scope entirely, so do not assume meeting or missing one figure says anything about the other.',
      alternativeAr: 'إذا تعذّر رفع نسبة القوى العاملة قبل التقديم: تنطبق هذه البوابة على المناقصات الحكومية العامة تحديداً — وينطبق رقم أعلى موثّق بشكل منفصل بنسبة ٥٠٪ من القوى العاملة البحرينية فقط على عقود خدمات الدولة المخصخصة، وهو نطاق مختلف تماماً، فلا تفترض أن استيفاء أو عدم استيفاء أحد الرقمين يقول شيئاً عن الآخر.',
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
    } else if (first.framework.mechanismType === 'production-incentive-eligibility-gate') {
      // (1 Oct 2026 resolution pass) Egypt AIDP gate -- reuses the SAME
      // gateEligibleSharePct field as category-eligibility-gate above
      // (both represent "spend-share-weighted % eligible/gated-in"), not
      // a new portfolio field, since the shape is genuinely identical.
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'production-incentive-eligibility-gate' && c.eligibleForIncentive !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as ProductionIncentiveEligibilityGateResult;
          return s + (c.eligibleForIncentive ? 100 : 0) * (i.spendShare / scorableSpend);
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
    } else if (first.framework.mechanismType === 'dual-local-sourcing-gate') {
      // Module 08 twelve-gap closure pass (1 Oct 2026) -- Kuwait Art. 87.
      // Reuses gateEligibleSharePct exactly as production-incentive-
      // eligibility-gate above does: a spend-share-weighted % of entries
      // whose known meetsLocalSourcingRequirement is true, not a new field,
      // since the shape (spend-weighted % passing a decisive boolean gate)
      // is genuinely identical.
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'dual-local-sourcing-gate' && c.meetsLocalSourcingRequirement !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as DualLocalSourcingGateResult;
          return s + (c.meetsLocalSourcingRequirement ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'offset-multiplier-credit-gate') {
      // India DAP 2020 -- same gateEligibleSharePct reuse; shortfallINR is
      // not rolled up as a currency total (unlike offset-obligation-gate's
      // totalShortfallPenaltyAED) because that field is AED-denominated by
      // design and mixing currencies into one "total" would misrepresent
      // real exposure, not merely omit a nicety -- a new INR-specific field
      // was considered and deliberately not added this pass since no UI
      // consumer needs it yet; the pass/fail share is the honest minimum.
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'offset-multiplier-credit-gate' && c.meetsOffsetObligation !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as OffsetMultiplierCreditGateResult;
          return s + (c.meetsOffsetObligation ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'eu-content-threshold-gate') {
      // Germany/EU EDIP -- same gateEligibleSharePct reuse.
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'eu-content-threshold-gate' && c.meetsEuContentThreshold !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as EuContentThresholdGateResult;
          return s + (c.meetsEuContentThreshold ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'gami-valuation-factor-credit-gate') {
      // Saudi GAMI -- same gateEligibleSharePct reuse; liquidationSAR is
      // not rolled up as a currency total for the same reason
      // offset-multiplier-credit-gate's shortfallINR above is not -- each
      // line item is a single-category model, not a portfolio-complete
      // figure, so summing it across suppliers would overstate precision.
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'gami-valuation-factor-credit-gate' && c.meetsCommitment !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as GamiValuationFactorCreditGateResult;
          return s + (c.meetsCommitment ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'import-value-participation-gate') {
      // LCGPA Economic Participation Policy -- same gateEligibleSharePct
      // reuse as GAMI above, for the same reason (single-line-item model,
      // not a portfolio-complete figure).
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'import-value-participation-gate' && c.meetsCommitment !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as ImportValueParticipationGateResult;
          return s + (c.meetsCommitment ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'industrialization-liability-gate') {
      // Turkey SSB -- same gateEligibleSharePct reuse across all three
      // independently-required sub-liabilities.
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'industrialization-liability-gate' && c.meetsAllLiabilities !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as TrIndustrializationLiabilityGateResult;
          return s + (c.meetsAllLiabilities ? 100 : 0) * (i.spendShare / scorableSpend);
        }, 0);
      }
    } else if (first.framework.mechanismType === 'percentage-threshold-gate') {
      // Bahrain Bahrainisation workforce gate -- the first fully generic
      // mechanism to reuse gateEligibleSharePct; the reuse works exactly
      // the same way regardless of which program the generic gate serves.
      const scorable = applicableItems.filter(i => {
        const c = i.assessment.computation;
        return c && c.mechanismType === 'percentage-threshold-gate' && c.meetsThreshold !== null;
      });
      const scorableSpend = scorable.reduce((s, i) => s + i.spendShare, 0);
      if (scorableSpend > 0) {
        gateEligibleSharePct = scorable.reduce((s, i) => {
          const c = i.assessment.computation as PercentageThresholdGateResult;
          return s + (c.meetsThreshold ? 100 : 0) * (i.spendShare / scorableSpend);
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

// ---------------------------------------------------------------------------
// Section 10 — multi-mechanism stacking (new, 18 Sep 2026): a single
// country/context can have MORE THAN ONE applicable program at once (e.g.
// Saudi semi-government-soe: LCGPA general, Aramco IKTVA, stc Rawafed, and
// the SABIC commitment gate can all genuinely apply to the same supplier
// simultaneously). `assessSupplierLocalContent` still returns exactly one
// program's assessment (the caller picks which); this is the complementary
// "show me everything that could apply" view for the UI's routing screen --
// never averaged into one score (Decision Record 8.7), each program kept
// fully separate.
// ---------------------------------------------------------------------------

export interface StackedLocalContentAssessment {
  program: LocalContentProgram;
  assessment: LocalContentAssessment;
  /** Only populated for the SABIC commitment gate when it is in breach;
   * null for every other program and for a gate that is within tolerance
   * or has incomplete inputs. Surfaced separately so the UI can show a
   * breach warning inline wherever it applies, independent of which
   * program is currently the "active" one. */
  actionableNextStep: { en: string; ar: string } | null;
}

/** Every program for `country` that is genuinely applicable to
 * `procurementContext` (excludes `not-applicable`; keeps
 * `insufficient-data` so the caller can still show "not yet sourced"
 * entries rather than silently hiding them). */
export function assessAllApplicableLocalContentPrograms(
  country: LocalContentCountry,
  procurementContext: ProcurementContext,
  inputs: SupplierLocalContentInputs,
): StackedLocalContentAssessment[] {
  const result: StackedLocalContentAssessment[] = [];
  for (const program of PROGRAMS_BY_COUNTRY[country]) {
    const assessment = assessSupplierLocalContent(country, procurementContext, inputs, program);
    if (assessment.applicability === 'not-applicable') continue;
    const actionableNextStep = assessment.computation && assessment.computation.mechanismType === 'commitment-deviation-gate'
      ? actionableNextStepForSabicLcGate(assessment.computation)
      : assessment.computation && assessment.computation.mechanismType === 'gcc-origin-national-treatment-gate'
      ? actionableNextStepForGccOriginTreatment(assessment.computation)
      : null;
    result.push({ program, assessment, actionableNextStep });
  }
  return result;
}

