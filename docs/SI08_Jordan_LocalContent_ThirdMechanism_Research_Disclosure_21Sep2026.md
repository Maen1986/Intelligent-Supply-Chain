# SI Module 08 — Jordan Local-Content Deepening: Third-Mechanism Research Disclosure

**Date:** 21 September 2026
**Scope:** SI Module 08 (Local Content / ICV Eligibility), country = Jordan (JO)
**Standard applied:** identical to the Kuwait deepening pass earlier the same day — real, live-sourced research (not training-data recall), full disclosure of what was investigated and rejected, no fabricated mechanism to hit a target count (Decision Record 8.7).

---

## 1. Starting state

Before this pass, Jordan had two real, sourced, distinct local-content/procurement mechanisms modeled in `supplierLocalContentEligibility.ts`:

- **`jo-price-preference`** — a bid-evaluation price-preference margin (currently 20%, Cabinet-set, `government` context only).
- **`jo-contractor-quota`** — a 35% minimum quota for Jordanian contractors in international tenders (2018 Cabinet decision, `government` + `semi-government-soe` contexts).

The assignment mirrored Kuwait's: find a genuine, independently-verifiable third mechanism if one exists, or disclose honestly if it doesn't.

## 2. Research methodology and sources checked

This pass ran roughly a dozen live web searches and page fetches across English and Arabic sources, covering every plausible category a third mechanism could fall into, matching the mechanism types already used elsewhere in this module (price-preference margin, spend set-aside, category-eligibility gate, anchor-buyer score, offset-obligation gate):

- General procurement law / national-product preference — [Petra: Cabinet raises industrial preference to 20%](https://petra.gov.jo/en/news/cabinet-raises-industrial-preference-in-tenders-to-20-approves-wide-ranging-economic-educational-regulatory-reforms), [Petra: Higher Government Procurement Preference for Local Industry](https://petra.gov.jo/dotclear/index.php/en/news/higher-government-procurement-preference-for-local-industry-set-to-support-growth-and-employment), [jordannews.jo: Important Economic Decisions](https://www.jordannews.jo/Section-29/Analysis/Important-Economic-Decisions-51938), Arabic corroboration via [Petra Arabic](https://petra.gov.jo/ar/news/%D9%85%D8%AC%D9%84%D8%B3-%D8%A7%D9%84%D9%88%D8%B2%D8%B1%D8%A7%D8%A1-%D9%8A%D9%82%D8%B1%D8%B1-%D8%B1%D9%81%D8%B9-%D9%86%D8%B3%D8%A8%D8%A9-%D8%A7%D9%84%D8%A3%D9%81%D8%B6%D9%84%D9%8A%D8%A9-%D8%A7%D9%84%D8%B3%D8%B9%D8%B1%D9%8A%D8%A9-%D9%84%D9%84%D9%85%D9%86%D8%AA%D8%AC%D8%A7%D8%AA-%D8%A7%D9%84%D8%B5%D9%86%D8%A7%D8%B9%D9%8A%D8%A9-%D8%A7%D9%84%D9%88%D8%B7%D9%86%D9%8A%D8%A9-%D9%81%D9%8A-%D8%A7%D9%84%D8%B9%D8%B7%D8%A7%D8%A1%D8%A7%D8%AA-%D8%A7%D9%84%D8%AD%D9%83%D9%88%D9%85%D9%8A%D8%A9-%D9%84%D8%AA%D8%B5%D8%A8%D8%AD-20-%D8%A8%D8%AF%D9%84%D8%A7-%D9%85%D9%86-15-), alsaa.net, khaberni.com. **Result: same mechanism already modeled** (`jo-price-preference`, 20%). No new mechanism.
- The actual governing bylaw text — [Jordan Government Procurement Bylaw No. 8 of 2022 (PDF)](https://gbd.gov.jo/uploads/files/legislation/ar/Procurement-bylaw-08-2022.pdf), corroborated by mirrors at Government Tenders Directorate (gtd.gov.jo), Government Procurement Department (gpd.gov.jo), and multiple public-university procurement pages (AABU, JUST, GJU). **Result: found the statutory citation for the existing price-preference mechanism** (see §3) and confirmed no separate SME set-aside or nationality-based contractor classification exists in the bylaw.
- SME set-asides — general international literature only (World Bank, IGC, OECD); nothing Jordan-specific with a legal citation.
- Defense-sector offsets — [KADDB / King Abdullah Design and Development Bureau](https://en.wikipedia.org/wiki/King_Abdullah_Design_and_Development_Bureau) background sources describe Jordan's defense-industrial base but no quantified, sourced local-content or offset percentage tied to specific procurement.
- Ministry of Health / pharmaceutical local-manufacturing preference — [PMCG: Transforming Jordan's Pharmaceutical Landscape](https://pmcg-i.com/transforming-jordans-pharmaceutical-landscape/), [trade.gov: Jordan Healthcare](https://www.trade.gov/country-commercial-guides/jordan-healthcare). Both explicitly describe import-dominated supply (75% imported) and drug-safety/registration reform, not a manufacturing preference. No mechanism found.
- Renewable-energy tenders — [SolarQuarter: Jordan Unveils Major Energy Reforms](https://solarquarter.com/2026/07/03/jordan-unveils-major-energy-reforms-to-boost-renewables-and-achieve-energy-independence/), [ZAWYA: Jordan plans new solar, wind, storage tenders](https://www.zawya.com/en/projects/utilities/jordan-plans-new-solar-wind-storage-tenders-under-10-year-energy-strategy-udlpmm01). Both describe the new PPP pipeline (pumped storage, solar, wind, battery storage) with no local-content clause. No mechanism found.
- Mining/phosphate sector local content — general USGS/industry background only; no sourced procurement-specific requirement found.
- Reserved-category local-supplier lists — no sourced list found.

## 3. Finding — closing an existing disclosure gap (not a third mechanism)

`jo-price-preference`'s source note previously read: *"The precise governing bylaw/regulation number was not identified in available sourcing."* This pass located and read **Government Procurement Bylaw No. 8 of 2022** (issued under Constitution Articles 114 and 120):

- **Art. 8(a)(7)** authorizes the Council of Ministers to grant a price preference (or other facilitation) to local products.
- **Art. 15(b)(1)** governs applying that preference margin when evaluating tied bids.
- The bylaw itself does not fix the percentage — that is set by separate Cabinet decision, which is exactly why the applicable figure has changed over time (15% → 20%, per the Cabinet decision already modeled).

The bylaw's existence and number are corroborated by multiple independent official/university-hosted mirrors. The specific article wording was read via automated PDF text extraction that showed visible OCR artifacts, so it is cited here as a reliable pointer to the correct bylaw and articles, **not** reproduced as a pristine verbatim quote of the Arabic legal text.

This has been written into `jo-price-preference`'s `sourceNoteEn`/`sourceNoteAr` in commit `2d3510d`, with a new regression test asserting the citation text is present and bilingual (294/294 lib tests passing, up from 293).

## 4. Finding — investigated and explicitly excluded as out of scope

A real, sourced, quantified figure surfaced during this research: a June 2026 Cabinet decision requiring manufacturers in specific industrial estates (Madaba, Salt, Tafileh; Al Rawdah in Ma'an) to achieve **"at least 30% local value added"** to qualify for electricity-cost subsidies, discounted industrial land, export-cost assistance, and wage subsidies ([Petra: Cabinet decisions expanded scope of Industrial Incentives in governorates](https://petra.gov.jo/en/news/cabinet-decisions-expanded-scope-of-industrial-incentives-in-governorates-says%C2%A0investment-minister)).

This is a genuine, quantified, sourced figure — but it is a **tax/investment incentive eligibility gate administered by the Ministry of Investment**, not a public-tender supplier-eligibility mechanism. Every other program in this module (Jordan's own two included) governs whether/how a supplier is scored or preferred in a government procurement/tender process. Modeling this 30% figure as a Jordan procurement program would be a scope/category error, not an honest addition, so it was investigated and deliberately **not** modeled here — consistent with the same discipline that led Kuwait's pass to disclose, rather than model, its own two investigated-but-out-of-scope findings.

## 5. Conclusion

**Jordan stays at two real, distinct, sourced local-content mechanisms.** No third mechanism exists in the areas searched to the standard this platform requires (a real, independently-verifiable, procurement-specific legal basis). Padding a third entry to match Kuwait's count would violate Decision Record 8.7. This is the honest-disclosure outcome, exactly as authorized for this pass.

**What actually shipped:** one small, real improvement — the missing legal citation for the existing `jo-price-preference` mechanism, closing a disclosure gap that had been sitting in the code since it was first added. Committed locally as `2d3510d` (parent: `d766b25`, the Kuwait UI regression-test commit — so this patch should be applied after Kuwait's two patches, or after the auditor session's direct push of them, whichever lands first). Handed off as a patch file (`jo-citation.patch`) rather than attempted as a direct push, per the same repo-access boundary as Kuwait.

No UI changes were needed (no new program key exists to wire in). No new worked-example scenario was needed (nothing new to demonstrate end-to-end) — this disclosure document is the Rule 6 artifact for this pass instead.

---

# الملحق العربي — الأردن: الإفصاح البحثي حول آلية ثالثة محتملة للمحتوى المحلي

**التاريخ:** ٢١ أيلول (سبتمبر) ٢٠٢٦
**النطاق:** الوحدة الثامنة (أهلية المحتوى المحلي / ICV)، الأردن
**المعيار المطبَّق:** نفس معيار جولة الكويت في اليوم نفسه — بحث حي وموثَّق (وليس استرجاعاً من بيانات التدريب)، وإفصاح كامل عمّا تم البحث فيه ورُفض، دون اختلاق آلية ثالثة لمجرد الوصول إلى عدد مماثل لدول أخرى (سجل القرار ٨.٧).

## ١. الوضع قبل هذه الجولة

كانت لدى الأردن آليتان حقيقيتان وموثّقتان ومتمايزتان: **`jo-price-preference`** (أفضلية سعرية بنسبة ٢٠٪ في المناقصات الحكومية) و**`jo-contractor-quota`** (حصة لا تقل عن ٣٥٪ للمقاولين الأردنيين في المناقصات الدولية، بقرار مجلس الوزراء لعام ٢٠١٨).

## ٢. منهجية البحث

أُجري نحو اثنتي عشرة عملية بحث حي وجلب صفحات بالإنجليزية والعربية، غطّت: قانون المشتريات العام وتفضيل المنتج الوطني (تأكيد الآلية الحالية فقط، ٢٠٪)، نص نظام المشتريات الحكومية رقم (٨) لسنة ٢٠٢٢ نفسه (أدّى إلى الإيجاد الموصوف في الفقرة ٣ أدناه)، حصص المنشآت الصغيرة والمتوسطة (لا يوجد مصدر أردني محدد)، تعويضات القطاع الدفاعي (KADDB — لا نسبة موثّقة مرتبطة بمشتريات محددة)، تفضيل الصناعة الدوائية المحلية في وزارة الصحة (لا آلية موثّقة — الاستيراد يشكّل ٧٥٪ من السوق)، المحتوى المحلي في مناقصات الطاقة المتجددة لدى نيبكو (لا آلية موثّقة في خط أنابيب المشاريع الجديد)، والمحتوى المحلي في قطاع التعدين/الفوسفات (لا مصدر موثّق).

## ٣. الإيجاد: سدّ ثغرة إفصاح قائمة (وليس آلية ثالثة)

كانت ملاحظة المصدر الخاصة بـ`jo-price-preference` تنص سابقاً على أن "رقم النظام أو التشريع الدقيق لم يُحدَّد ضمن المصادر المتاحة". حدّدت هذه الجولة **نظام المشتريات الحكومية رقم (٨) لسنة ٢٠٢٢** (الصادر بمقتضى المادتين ١١٤ و١٢٠ من الدستور): **المادة ٨(أ)(٧)** تُخوّل مجلس الوزراء منح أفضلية سعرية للمنتجات المحلية، و**المادة ١٥(ب)(١)** تنظّم تطبيقها عند تقييم العروض المتعادلة؛ أما النسبة نفسها فتُحدَّد بقرار منفصل من مجلس الوزراء (ومن هنا التغيّر من ١٥٪ إلى ٢٠٪). النظام مؤكَّد عبر عدة مصادر رسمية/جامعية مستقلة؛ ونظراً لأن نص المادتين استُخرج آلياً من ملف PDF وظهرت فيه آثار أخطاء تعرّف ضوئي (OCR)، فهو يُعتمد كاستشهاد موثوق بالنظام والمادتين لا كنقل حرفي دقيق.

## ٤. إيجاد جرى استبعاده عمداً لعدم انطباق النطاق

وُجد رقم حقيقي وموثّق آخر: قرار مجلس الوزراء (حزيران ٢٠٢٦) الذي يشترط تحقيق **"ما لا يقل عن ٣٠٪ قيمة مضافة محلية"** على المصانع في مناطق صناعية محددة (مادبا، السلط، الطفيلة؛ الروضة في معان) للاستفادة من حوافز الكهرباء والأرض والتصدير. هذا شرط أهلية لحافز استثماري/ضريبي تديره وزارة الاستثمار، وليس آلية أهلية في مناقصة حكومية — وبالتالي لا يندرج ضمن نطاق هذه الوحدة، فتم استبعاده عمداً بدلاً من إقحامه كآلية أردنية ثالثة.

## ٥. الخلاصة

**تبقى الأردن عند آليتين حقيقيتين ومتمايزتين وموثّقتين.** لم تُعثر جولة البحث هذه على آلية ثالثة تفي بمعيار المنصة (أساس قانوني حقيقي وموثّق ومستقل خاص بالمشتريات). التغيير الفعلي الذي طرأ هو سدّ ثغرة الاستشهاد القانوني للآلية الأولى الحالية، ضمن الالتزام (`2d3510d`)، المُسلَّم كملف patch للتطبيق بعد التزامَي الكويت.
