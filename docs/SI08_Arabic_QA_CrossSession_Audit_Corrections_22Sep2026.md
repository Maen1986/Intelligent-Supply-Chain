# SI Module 08 — Arabic QA: Cross-Session Audit Corrections (22 September 2026)

**Scope:** Two findings from the auditor session's independent review of the two pending local commits (Jordan citation, Arabic QA fixes) before a push handoff. Both resolved same-day.

---

## 1. Finding — one more hamza-defect instance, outside the audited files

The 21 September self-audit fixed the اكتفاء/إكتفاء orthographic defect (hamza-seat alif instead of the grammatically-correct plain alif for this Form VIII verbal noun) in 23 places across the five files that session had written: `supplierLocalContentEligibility.ts`, its worked-example doc, `LocalContentICVCheck.tsx`, `kraljicScoring.ts`, and `DataSources.tsx`.

The auditor session, working from a clean clone rather than this session's in-memory state, found one instance outside that scope: `artifacts/api-server/src/lib/migrate.ts`, line 145 — the `('ksa', 'iktva', ...)` seed row's `name_ar` value, `'إكتفاء والمحتوى المحلي'`. This file lives in a different module (the general regulatory-maturity API's startup seed data, not the SI-08 local-content engine) and was never in scope for the local-content audit.

**Fix applied:**
- The seed literal corrected to `'اكتفاء والمحتوى المحلي'`.
- A production-database implication was identified and handled, not just the source fixed: the `INSERT INTO regulatory_frameworks` statement this row belongs to is guarded by `WHERE NOT EXISTS (SELECT 1 FROM regulatory_frameworks LIMIT 1)` — it fires exactly once, on a completely empty table. This same file's own history already shows this exact failure mode: five earlier `UPDATE` statements (2026-08-13, 2026-08-16) exist specifically because the UAE/Qatar/Jordan/Oman/Bahrain rows had already been seeded into production before a later content fix, and editing the seed literal alone would have been a no-op against the live table. Following that established pattern, an idempotent, safe-on-every-boot `UPDATE regulatory_frameworks SET name_ar = 'اكتفاء والمحتوى المحلي' WHERE country_id = 'ksa' AND code = 'iktva' AND name_ar = 'إكتفاء والمحتوى المحلي'` was appended to `MIGRATIONS`, so the fix self-heals whether or not that seed already ran in production.
- This session has no live production database credentials and cannot directly query whether the `regulatory_frameworks` table already carries the misspelled row. Rather than guess "probably fine," the corrective `UPDATE` was added regardless — it is a harmless no-op if the row is already correct or not yet seeded, and a real fix if it is not.
- Re-ran a repo-wide grep for `إكتفاء` after the fix: zero remaining occurrences anywhere in the codebase except this fix's own explanatory comment and the `UPDATE`'s `WHERE`-clause literal, both of which must retain the old spelling to document/match it.

Committed separately as its own commit (small, single-purpose, per standing practice): `9bb8b6c`.

## 2. Finding — commit-message arithmetic was wrong

The Arabic QA fixes commit message (`531b444`, before amendment) said the hamza defect "recurred 12 more times," with an itemized breakdown that actually summed to 14 — an internal inconsistency in the message itself, independent of the auditor's count. The auditor's own direct count of the diff found 22 additional occurrences beyond the one originally flagged by the platform owner (23 total in that commit), with 13 in the worked-example doc (not 9) and more in the lib file than stated.

This session independently re-counted the same diff with a script rather than taking either number on faith. Result: **23 total occurrences fixed in that commit** — 1 originally-flagged (`sa-iktva-aramco` in `PROGRAM_LABELS`) + 22 found by the self-audit, broken down as 13 in the worked-example doc, 6 in `supplierLocalContentEligibility.ts`, 1 more in `LocalContentICVCheck.tsx` beyond the flagged entry (the "Directional Score (iktva)" results-panel label), 1 in `kraljicScoring.ts`, 1 in `DataSources.tsx`. This matches the auditor's count exactly; the original commit message's arithmetic did not.

Because the commit had not yet been pushed to `origin/main`, it was amended in place — `git commit --amend` — rather than leaving an inaccurate number in permanent history. Diff content is byte-identical to the original commit; only the message changed. New SHA: `5972666` (was `531b444`).

## 3. Verification

- `pnpm run typecheck` — full monorepo, clean, including `artifacts/api-server` (where `migrate.ts` lives).
- `supplierLocalContentEligibility.test.ts` (294/294) plus the three UI regression test files and four other lib test files with no unrelated import chain (251/251) — 545/545 total, unchanged from the prior pass since neither fix touches computation logic.
- No test file in this repo exercises `migrate.ts` directly (it is a startup-boot DDL/seed script, not application logic with unit coverage) — disclosed rather than silently skipped; typecheck confirms the file still parses and compiles as valid TypeScript.
- All three pending commits (`53c5449` Jordan citation, `5972666` Arabic QA fixes with corrected message, `9bb8b6c` migrate.ts fix) were regenerated as patches against the current live `origin/main`, applied via `git am` in a scratch worktree, and the resulting tree hash confirmed identical to local `main` — byte-exact, not just "looks right."

## 4. Status

Patches `0004`–`0006` delivered to chat and to `ISC handover\Claude outputs\`, ready for push by whichever session has direct repo access. This session's own push path remains limited to Composio's managed-credential relay (used successfully for the 14KB Jordan research-disclosure doc, now live as commit `f088b6e`) and is blocked for these three commits by a concrete, verified constraint: two of the three touch files (382KB, 462KB) larger than this session's own file-reading tooling will load as a single unit, making a lossless full-content relay through Composio's API unsafe to attempt.

---

# الملحق العربي — الوحدة الثامنة: تصحيحات مراجعة عبر الجلسات لجودة النصوص العربية (٢٢ أيلول/سبتمبر ٢٠٢٦)

**النطاق:** إيجادان من المراجعة المستقلة لجلسة التدقيق للالتزامين المحليين المعلَّقين (استشهاد الأردن، إصلاحات جودة العربية) قبل تسليم رمز للدفع. حُلّا كلاهما في اليوم نفسه.

## ١. الإيجاد الأول: حالة إضافية من خلل الهمزة، خارج الملفات المراجَعة

أصلحت جولة التدقيق الذاتي بتاريخ ٢١ أيلول خلل إكتفاء/اكتفاء الإملائي (ألف على كرسي همزة بدلاً من الألف المجردة الصحيحة نحوياً لهذا المصدر من الوزن الثامن) في ٢٣ موضعاً عبر الملفات الخمسة التي كتبتها تلك الجلسة: `supplierLocalContentEligibility.ts`، ووثيقة مثاله التطبيقي، و`LocalContentICVCheck.tsx`، و`kraljicScoring.ts`، و`DataSources.tsx`.

وجدت جلسة التدقيق، العاملة من نسخة نظيفة وليس من حالة هذه الجلسة في الذاكرة، حالة واحدة خارج هذا النطاق: `artifacts/api-server/src/lib/migrate.ts`، السطر ١٤٥ — قيمة `name_ar` لصف البذرة `('ksa', 'iktva', ...)`، وهي `'إكتفاء والمحتوى المحلي'`. يقع هذا الملف في وحدة مختلفة (بيانات بذرة بدء تشغيل واجهة برمجة التطبيقات العامة لنضج التنظيم، وليس محرك المحتوى المحلي للوحدة الثامنة)، ولم يكن قط ضمن نطاق تدقيق المحتوى المحلي.

**الإصلاح المُطبَّق:**
- صُحِّح حرف البذرة إلى `'اكتفاء والمحتوى المحلي'`.
- تم تحديد ومعالجة أثر محتمل على قاعدة البيانات الإنتاجية، وليس فقط إصلاح المصدر: عبارة `INSERT INTO regulatory_frameworks` التي ينتمي إليها هذا الصف محمية بشرط `WHERE NOT EXISTS (SELECT 1 FROM regulatory_frameworks LIMIT 1)` — تُنفَّذ مرة واحدة فقط، على جدول فارغ تماماً. يُظهر تاريخ هذا الملف نفسه هذا العطل بالضبط من قبل: خمس عبارات `UPDATE` سابقة (٢٠٢٦-٠٨-١٣، ٢٠٢٦-٠٨-١٦) موجودة تحديداً لأن صفوف الإمارات وقطر والأردن وعُمان والبحرين كانت قد بُذِرت بالفعل في الإنتاج قبل إصلاح لاحق للمحتوى، وكان تعديل حرف البذرة وحده سيصبح بلا أثر مقابل الجدول الحي. باتباع هذا النمط الراسخ، أُضيفت عبارة `UPDATE` تصحيحية، مُتكرِّرة الأثر (idempotent) وآمنة عند كل إقلاع، إلى نهاية `MIGRATIONS`، بحيث يُصلح الإصلاح نفسه تلقائياً سواء نُفِّذت تلك البذرة في الإنتاج أم لا.
- لا تملك هذه الجلسة بيانات اعتماد لقاعدة بيانات الإنتاج الحية ولا يمكنها الاستعلام مباشرة عمّا إذا كان جدول `regulatory_frameworks` يحمل بالفعل الصف بالإملاء الخاطئ. وبدلاً من افتراض "على الأرجح لا بأس"، أُضيفت عبارة `UPDATE` التصحيحية على أي حال — فهي بلا أثر ضار إذا كان الصف صحيحاً بالفعل أو لم يُبذَر بعد، وإصلاح حقيقي إذا لم يكن كذلك.
- أُعيد تشغيل بحث شامل للمستودع عن `إكتفاء` بعد الإصلاح: صفر حالات متبقية في أي مكان في قاعدة الشيفرة باستثناء تعليق هذا الإصلاح التوضيحي وحرف شرط `WHERE` الخاص بعبارة `UPDATE`، وكلاهما يجب أن يحتفظ بالإملاء القديم للمطابقة والتصحيح.

جرى الالتزام به بشكل منفصل (التزام صغير أحادي الغرض، وفق الممارسة المتبعة): `9bb8b6c`.

## ٢. الإيجاد الثاني: خطأ حسابي في نص رسالة الالتزام

ذكرت رسالة التزام إصلاحات جودة العربية (`531b444`، قبل التعديل) أن خلل الهمزة "تكرر ١٢ مرة إضافية"، بتفصيل بنود مجموعه الفعلي ١٤ — تناقض داخلي في الرسالة نفسها، بمعزل عن عدّ جلسة التدقيق. وجد عدّ جلسة التدقيق المباشر لنفس الفرق ٢٢ حالة إضافية بعد الحالة المُبلَّغ عنها أصلاً من مالك المنصة (٢٣ إجمالاً في ذلك الالتزام)، منها ١٣ في وثيقة المثال التطبيقي (وليس ٩) وحالات أكثر في ملف المكتبة مما ذُكر.

أعادت هذه الجلسة عدّ الفرق نفسه بشكل مستقل عبر سكربت بدلاً من التسليم بأي من الرقمين. النتيجة: **٢٣ حالة إجمالية أُصلحت في ذلك الالتزام** — حالة واحدة مُبلَّغ عنها أصلاً (`sa-iktva-aramco` في `PROGRAM_LABELS`) + ٢٢ وجدتها جولة التدقيق الذاتي، موزَّعة كالتالي: ١٣ في وثيقة المثال التطبيقي، و٦ في `supplierLocalContentEligibility.ts`، وحالة واحدة إضافية في `LocalContentICVCheck.tsx` بخلاف المُدخل المُبلَّغ عنه (تسمية لوحة النتائج "الدرجة التوجيهية (iktva)")، وحالة واحدة في `kraljicScoring.ts`، وحالة واحدة في `DataSources.tsx`. يطابق هذا عدّ جلسة التدقيق تماماً؛ ولم يكن حساب رسالة الالتزام الأصلية مطابقاً له.

ولأن الالتزام لم يُدفَع بعد إلى `origin/main`، عُدِّل في مكانه — `git commit --amend` — بدلاً من ترك رقم غير دقيق في السجل الدائم. محتوى الفرق مطابق تماماً للالتزام الأصلي؛ تغيّرت الرسالة فقط. المعرّف الجديد: `5972666` (كان `531b444`).

## ٣. التحقق

- `pnpm run typecheck` — للمستودع الكامل، نظيف، بما يشمل `artifacts/api-server` (حيث يقع `migrate.ts`).
- `supplierLocalContentEligibility.test.ts` (٢٩٤/٢٩٤) إضافة إلى ملفات اختبار الواجهة الثلاثة وأربعة ملفات اختبار مكتبة أخرى بلا سلسلة استيراد ذات صلة (٢٥١/٢٥١) — ٥٤٥/٥٤٥ إجمالاً، دون تغيير عن الجولة السابقة إذ لا يمسّ أي من الإصلاحين منطق الحساب.
- لا يوجد ملف اختبار في هذا المستودع يفحص `migrate.ts` مباشرة (سكربت DDL/بذرة يعمل عند بدء التشغيل، وليس منطق تطبيق له تغطية اختبار وحدوي) — يُفصَح عن ذلك بدلاً من تجاهله بصمت؛ يؤكد فحص الأنواع أن الملف لا يزال يُحلَّل ويُصرَّف كـ TypeScript صالح.
- أُعيد توليد الالتزامات المعلَّقة الثلاثة (`53c5449` استشهاد الأردن، `5972666` إصلاحات جودة العربية بالرسالة المصحَّحة، `9bb8b6c` إصلاح migrate.ts) كملفات patch على `origin/main` الحية الحالية، وطُبِّقت عبر `git am` في شجرة عمل مؤقتة، وتأكَّد تطابق بصمة الشجرة الناتجة (tree hash) تماماً مع `main` المحلي — تطابق حرفي، وليس مجرد "يبدو صحيحاً".

## ٤. الحالة

سُلِّمت ملفات patch من ٠٠٠٤ إلى ٠٠٠٦ عبر المحادثة وإلى مجلد `ISC handover\Claude outputs\`، جاهزة للدفع من أي جلسة تملك وصولاً مباشراً للمستودع. يبقى مسار الدفع الخاص بهذه الجلسة مقتصراً على وسيط GitHub المُدار عبر بيانات اعتماد Composio (استُخدم بنجاح لوثيقة الإفصاح البحثي الأردنية البالغة ١٤ كيلوبايت، وهي حية الآن كالتزام `f088b6e`)، ومحظور بالنسبة لهذه الالتزامات الثلاثة بقيد ملموس ومُتحقَّق منه: يمسّ اثنان من الثلاثة ملفات (٣٨٢ كيلوبايت، ٤٦٢ كيلوبايت) أكبر مما تُحمِّله أدوات قراءة الملفات الخاصة بهذه الجلسة نفسها كوحدة واحدة، ما يجعل نقل المحتوى الكامل بلا فقدان عبر واجهة Composio غير آمن للمحاولة.