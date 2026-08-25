/**
 * clmComplianceItem42.ts
 *
 * Item 42 (Contract Intelligence v10, Decision Record 8.8) -- three real,
 * sourced maturity questions for the `clm-compliance` sub-segment covering
 * Saudi Civil Transactions Law (CTL) applicability, GTPL/MOF-Etimad
 * standard-form usage, and riba (interest) restriction handling.
 *
 * Content drafted and reviewed in
 * contract-intelligence-v10-06-maturity-integration.md ("Item 42" section,
 * 25 Aug 2026) -- this file carries that same content into live code
 * unchanged, minus the per-question `frameworks`/`evidence` annotations
 * from the draft, which are not part of the real Question schema (see
 * SubSegmentData in maturitySubSegData1to5.ts -- only q/qAr/levels/levelsAr
 * exist per question; frameworks/evidence are sub-segment-level only).
 *
 * Why this lives in its own file instead of being inlined directly into
 * maturitySubSegData1to5.ts: that file is already ~1.1MB, past what can be
 * safely round-tripped as a single full-file commit. Keeping new
 * jurisdiction-specific content additions in their own small file and
 * applying them at bootstrap (see applyItem42ComplianceQuestions below,
 * called once from main.tsx) avoids ever needing to re-transmit the whole
 * data file for a 3-question addition. This is an explicit, idempotent,
 * unit-tested function -- not a silent import side effect.
 *
 * All Arabic is independently authored formal Gulf professional register
 * (فصحى), consistent with the "not machine-translated" standard set in
 * maturitySubSegData1to5.ts's own header.
 */

import { CLM_SUB_SEGMENTS, type SubSegmentData } from './maturitySubSegData1to5';

type Item42Question = SubSegmentData['questions'][number];

export const ITEM_42_QUESTIONS: Item42Question[] = [
  {
    q: 'How well does your contract drafting process account for Saudi Civil Transactions Law (CTL) as the governing substantive law, even when a contract nominally references CISG or a foreign framework?',
    qAr: 'إلى أي مدى تراعي عملية صياغة العقود لديكم نظام المعاملات المدنية السعودي بصفته القانون الموضوعي الحاكم، حتى عندما ينص العقد ظاهرياً على اتفاقية البيع الدولي للبضائع (CISG) أو إطار قانوني أجنبي؟',
    levels: [
      'No awareness that CTL (Royal Decree M/191) applies as substantive law to Saudi-touching contracts regardless of a CISG or foreign-law reference; contracts are drafted using foreign templates unchanged.',
      'Legal counsel is aware of the CTL/CISG Part III distinction but it is not systematically checked; awareness exists in one person\'s head, not in the drafting process.',
      'A standard clause or drafting note flags CTL applicability for Saudi-touching contracts, but it is applied inconsistently across contract types or business units.',
      'All Saudi-touching contract templates include a reviewed governing-law/CTL-applicability clause; legal reviews every contract with a foreign counterparty or foreign-law reference before signature.',
      'Templates and the contract-intake process automatically flag CTL applicability and riba/Article-78 exposure for any Saudi-touching contract; legal sign-off on the governing-law clause is a mandatory gate before signature, with the check logged for audit.',
    ],
    levelsAr: [
      'لا يوجد وعي بأن نظام المعاملات المدنية (الصادر بالمرسوم الملكي رقم م/191) يسري بصفته القانون الموضوعي على العقود ذات الصلة بالسعودية بصرف النظر عن الإشارة إلى اتفاقية CISG أو أي قانون أجنبي؛ وتُصاغ العقود باستخدام نماذج أجنبية دون أي تعديل.',
      'الإدارة القانونية على علم بالتمييز بين نظام المعاملات المدنية والجزء الثالث من اتفاقية CISG، إلا أن هذا الأمر لا يُراجَع بشكل منهجي؛ فالوعي به مقصور على فرد واحد ولم يُترجَم إلى خطوة ضمن عملية الصياغة.',
      'يتضمن العمل بند موحّد أو ملاحظة صياغة تنبّه إلى سريان نظام المعاملات المدنية على العقود ذات الصلة بالسعودية، إلا أن تطبيقه يتفاوت بين أنواع العقود ووحدات الأعمال.',
      'تتضمن جميع نماذج العقود ذات الصلة بالسعودية بنداً مُراجَعاً بشأن القانون الحاكم وسريان نظام المعاملات المدنية؛ وتراجع الإدارة القانونية كل عقد مع طرف أجنبي أو يتضمن إشارة إلى قانون أجنبي قبل التوقيع.',
      'تقوم النماذج وعملية استقبال العقود تلقائياً بتنبيه المعنيين إلى سريان نظام المعاملات المدنية ومخاطر الربا بموجب المادة 78 في أي عقد ذي صلة بالسعودية؛ ويُعدّ اعتماد الإدارة القانونية لبند القانون الحاكم بوابة إلزامية قبل التوقيع، مع توثيق هذا التحقق لأغراض التدقيق.',
    ],
  },
  {
    q: 'For government-counterparty contracts, how systematically does your organization apply Saudi GTPL and MOF/Etimad standard-form requirements?',
    qAr: 'بالنسبة للعقود مع الجهات الحكومية، إلى أي مدى تطبّق مؤسستكم بشكل منهجي متطلبات نظام المنافسات والمشتريات الحكومية والنماذج الموحدة الصادرة عن وزارة المالية عبر منصة اعتماد؟',
    levels: [
      'Government contracts are handled with the same process as private contracts; no distinct GTPL/Etimad awareness.',
      'Staff know GTPL/Etimad forms exist but sourcing/using the correct current form is ad hoc, often via informal channels.',
      'A designated person sources current MOF/Etimad standard forms per tender, but there is no controlled/versioned repository.',
      'A controlled, versioned repository of current GTPL/Etimad standard forms is maintained and used for all government contracts.',
      'The repository is integrated into the contract-drafting workflow itself, auto-populating the correct current standard form by contract type, with change alerts when MOF updates a form.',
    ],
    levelsAr: [
      'تُعامَل العقود الحكومية بنفس إجراءات العقود الخاصة؛ ولا يوجد وعي مستقل بمتطلبات نظام المنافسات والمشتريات الحكومية أو منصة اعتماد.',
      'يعلم الموظفون بوجود نماذج نظام المنافسات والمشتريات الحكومية ومنصة اعتماد، إلا أن الحصول على النموذج الساري واستخدامه يتم بشكل عشوائي، وغالباً عبر قنوات غير رسمية.',
      'يتولى شخص محدد الحصول على النماذج الموحدة الحالية الصادرة عن وزارة المالية/منصة اعتماد لكل منافسة، إلا أنه لا يوجد مستودع موثّق ومُصنَّف بالإصدارات لهذه النماذج.',
      'يُحتفَظ بمستودع موثّق ومُصنَّف بالإصدارات للنماذج الموحدة السارية بموجب نظام المنافسات والمشتريات الحكومية ومنصة اعتماد، ويُستخدم في جميع العقود الحكومية.',
      'يكون هذا المستودع مدمجاً في مسار عمل صياغة العقود ذاته، بحيث يُدرِج تلقائياً النموذج الموحد الساري وفق نوع العقد، مع إشعارات فورية عند تحديث وزارة المالية لأي نموذج.',
    ],
  },
  {
    q: 'How does your contract process handle riba (interest) restrictions across both government and private Saudi-touching contracts?',
    qAr: 'كيف تتعامل عملية التعاقد لديكم مع قيود الربا (الفائدة) في كل من العقود الحكومية والخاصة ذات الصلة بالسعودية؟',
    levels: [
      'No systematic check for riba-sensitive terms (interest, late-payment penalties structured as interest) in contract review.',
      'Legal knows riba restrictions apply but relies on manual, case-by-case judgment with no checklist.',
      'A checklist flags common riba-risk clause types (interest-bearing late fees, certain financing structures) for legal review.',
      'All financial/payment clauses are systematically screened for riba exposure before signature, with documented Sharia-compliant alternatives (e.g., fixed administrative fees) as the default template language.',
      'Riba screening is a mandatory automated gate in the contract workflow, with pre-approved Sharia-compliant fallback language maintained centrally and applied consistently across both government and private tracks.',
    ],
    levelsAr: [
      'لا توجد مراجعة منهجية للبنود ذات الحساسية من حيث الربا (كالفائدة أو غرامات التأخير في السداد المصاغة على هيئة فائدة) ضمن مراجعة العقود.',
      'تدرك الإدارة القانونية سريان قيود الربا، إلا أنها تعتمد على تقدير يدوي لكل حالة على حدة دون وجود قائمة تحقق موحدة.',
      'تتوفر قائمة تحقق تُنبّه إلى أنواع البنود الشائعة المحفوفة بمخاطر الربا (كغرامات التأخير التي تحمل صفة الفائدة وبعض هياكل التمويل) لإحالتها إلى المراجعة القانونية.',
      'تخضع جميع البنود المالية وبنود السداد لفحص منهجي للتحقق من خلوها من شبهة الربا قبل التوقيع، مع اعتماد صياغات بديلة موثقة ومتوافقة مع أحكام الشريعة الإسلامية (كالرسوم الإدارية الثابتة) كصياغة افتراضية في النماذج.',
      'يُعدّ فحص الربا بوابة إلزامية مؤتمتة ضمن مسار عمل التعاقد، مع الاحتفاظ مركزياً بصياغات بديلة معتمدة مسبقاً ومتوافقة مع أحكام الشريعة الإسلامية، وتطبيقها بشكل متسق في كل من المسارين الحكومي والخاص.',
    ],
  },
];

let applied = false;

/**
 * Appends the 3 item-42 questions to the live `clm-compliance` sub-segment's
 * `questions` array. Idempotent -- safe to call more than once (HMR, tests,
 * accidental double-invocation). Called once from main.tsx before render.
 */
export function applyItem42ComplianceQuestions(): void {
  if (applied) return;
  const target = CLM_SUB_SEGMENTS.find((s) => s.id === 'clm-compliance');
  if (!target) {
    applied = true; // defensive -- schema drift shouldn't crash the app
    return;
  }
  const alreadyPresent = target.questions.some((q) => q.q === ITEM_42_QUESTIONS[0].q);
  if (!alreadyPresent) {
    target.questions.push(...ITEM_42_QUESTIONS);
  }
  applied = true;
}
