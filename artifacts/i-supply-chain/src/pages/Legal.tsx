import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Lock, AlertTriangle, Globe, Mail, ChevronDown, ChevronUp } from 'lucide-react';

const SECTIONS = [
  {
    id: 'copyright',
    icon: Shield,
    title: 'Copyright & Intellectual Property',
    titleAr: 'حقوق النشر والملكية الفكرية',
    content: `All content published on this platform — including but not limited to text, graphics, logos, icons, data visualisations, supply chain frameworks, KPI benchmarks, diagnostic tools, assessment methodologies, AI-generated outputs, and source code — is the exclusive intellectual property of I Supply Chain (ISC) and its principal consultant, Ma'in Alhaqash (MCIPS · CPSM · MSc · MIPP).

© 2026 I Supply Chain. All Rights Reserved.

No part of this platform may be reproduced, distributed, transmitted, displayed, published, broadcast, or otherwise exploited in any form or by any means — electronic, mechanical, photocopying, recording, or otherwise — without the prior written consent of I Supply Chain.

This protection applies globally and is enforceable under the Berne Convention for the Protection of Literary and Artistic Works, the World Intellectual Property Organization (WIPO) Copyright Treaty, Saudi Arabian Intellectual Property Law (Royal Decree M/41), and Jordanian Copyright Law No. 22 of 1992 and its amendments.`,
  },
  {
    id: 'methodologies',
    icon: Lock,
    title: 'Proprietary Methodologies & Trade Secrets',
    titleAr: 'المنهجيات الخاصة والأسرار التجارية',
    content: `The following constitute proprietary intellectual assets of I Supply Chain and are protected as trade secrets under applicable law:

1. ISC GCC Benchmark Database — The KPI quartile benchmarks, industry medians, and performance thresholds used in the Command Centre are proprietary data compiled by Ma'in Alhaqash over 20+ years of GCC and MENA supply chain practice. They are not derived from any publicly available dataset.

2. ISC Assessment Frameworks — The maturity scoring methodology, gap analysis matrices, and risk exposure models used in this platform are original works developed exclusively by ISC and grounded in CIPS, APICS SCOR, and ISO 31000 — adapted specifically for GCC regulatory, cultural, and commercial environments.

3. ISC AI Persona — The GPT-4o prompt architecture, knowledge base, scoring rubrics, and output templates used to generate Executive Briefings are proprietary to ISC. Reverse engineering, reproduction, or imitation of this system is strictly prohibited.

4. ISC Savings Modelling Engine — The savings estimation formulae, initiative weighting, and SAR impact calculations are original proprietary constructs of ISC.

Any attempt to extract, replicate, or commercially exploit these assets without written authorisation constitutes misappropriation of trade secrets and will be prosecuted accordingly.`,
  },
  {
    id: 'terms',
    icon: FileText,
    title: 'Terms of Use',
    titleAr: 'شروط الاستخدام',
    content: `By accessing or using this platform, you agree to the following:

Permitted Use: You may access and use this platform solely for your organisation's internal supply chain planning and decision-making purposes. Individual users may view, interact with, and print outputs for internal business use.

Prohibited Use: You may not:
• Copy, scrape, crawl, or extract data, frameworks, benchmarks, or tools from this platform by any automated or manual means
• Reproduce, publish, or distribute any content from this platform without prior written consent
• Reverse-engineer, decompile, disassemble, or otherwise attempt to derive the source code, AI prompts, or data models underlying this platform
• Use outputs from this platform to train, fine-tune, or develop competing AI models or consulting tools
• Represent ISC's frameworks, methodologies, or benchmarks as your own original work
• Sublicense, sell, or commercially exploit any content or tools from this platform

Violation of these terms constitutes copyright infringement, misappropriation of trade secrets, and/or breach of contract — all of which ISC will pursue through civil and criminal legal channels.`,
  },
  {
    id: 'ai-output',
    icon: Globe,
    title: 'AI Output Ownership',
    titleAr: 'ملكية مخرجات الذكاء الاصطناعي',
    content: `AI-generated Executive Briefings, assessment reports, and recommendations produced by this platform are generated using ISC's proprietary AI system and knowledge base.

Ownership: All AI-generated outputs on this platform are the intellectual property of I Supply Chain. The outputs are derived from ISC's proprietary frameworks, benchmark data, and prompt architecture — not from the user's inputs alone. Accordingly, ISC retains full copyright in the structure, methodology, and expression of all generated reports.

User Licence: ISC grants the registered user a limited, non-exclusive, non-transferable licence to use AI-generated outputs internally within their organisation. This licence does not permit:
• Public disclosure or publication of outputs in unmodified form without credit to ISC
• Use of outputs to train competing AI systems
• Commercial resale of outputs

Confidential Marking: All generated briefings are marked "CONFIDENTIAL — © I Supply Chain" and must be treated as confidential commercial information.`,
  },
  {
    id: 'dmca',
    icon: AlertTriangle,
    title: 'DMCA & Infringement Reporting',
    titleAr: 'الإبلاغ عن انتهاكات حقوق النشر',
    content: `If you believe that any content on this platform infringes your intellectual property rights, please submit a written notice to our legal team including:

1. Identification of the copyrighted work you claim has been infringed
2. Identification of the infringing material and its location on this platform
3. Your contact information (name, address, telephone, email)
4. A statement that you have a good faith belief that the disputed use is not authorised by the copyright owner, its agent, or the law
5. A statement that the information in your notice is accurate, and under penalty of perjury, that you are the copyright owner or authorised to act on their behalf
6. Your electronic or physical signature

To report infringement of ISC's intellectual property by third parties, or to request a content licence, contact: legal@isupplychain.com or haqash.maen@gmail.com`,
  },
  {
    id: 'jurisdiction',
    icon: Globe,
    title: 'Governing Law & Jurisdiction',
    titleAr: 'القانون الحاكم والاختصاص القضائي',
    content: `These Terms, and any dispute arising from or relating to this platform or its content, shall be governed by and construed in accordance with the laws of the Kingdom of Saudi Arabia.

Primary Jurisdiction: Courts of the Kingdom of Saudi Arabia, Riyadh Province.
Secondary Jurisdiction for Jordanian matters: Courts of the Hashemite Kingdom of Jordan.

International Enforcement: ISC reserves the right to seek injunctive relief and damages in any jurisdiction where infringement occurs, including through the WIPO Arbitration and Mediation Center, the Berne Convention enforcement mechanisms, and bilateral treaty arrangements between the Kingdom of Saudi Arabia, the Hashemite Kingdom of Jordan, and other nations.

Severability: If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.

Last Updated: 21 July 2026`,
  },
];

function AccordionItem({ section, idx }: { section: typeof SECTIONS[0]; idx: number }) {
  const [open, setOpen] = useState(idx === 0);
  const Icon = section.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: idx * 0.07 }}
      className="border border-border rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left bg-white hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#082C6B]/8 flex items-center justify-center shrink-0">
            <Icon className="w-4.5 h-4.5 text-[#082C6B]" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <p className="font-bold text-[#082C6B] text-sm">{section.title}</p>
            <p className="text-muted-foreground text-xs mt-0.5">{section.titleAr}</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>
      {open && (
        <div className="px-6 py-5 bg-muted/20 border-t border-border">
          <pre className="whitespace-pre-wrap font-sans text-sm text-foreground/80 leading-relaxed">
            {section.content}
          </pre>
        </div>
      )}
    </motion.div>
  );
}

export function Legal() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-[#082C6B] py-16">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">
              Legal, Copyright &amp; IP Notice
            </h1>
            <p className="text-white/60 text-base max-w-2xl mx-auto leading-relaxed">
              All intellectual property, methodologies, AI tools, frameworks and content on this platform are exclusively owned by I Supply Chain. Read the full notice below.
            </p>
            <p className="text-[#C9A84C] font-bold text-sm mt-4">
              © 2026 I Supply Chain — Ma'in Alhaqash MCIPS · CPSM · MSc · MIPP. All Rights Reserved.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Summary banner */}
      <div className="bg-amber-50 border-b border-amber-200">
        <div className="container mx-auto px-4 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>Important:</strong> Unauthorised copying, scraping, reverse engineering, or commercial exploitation of any content, data, tool, framework or AI system on this platform constitutes copyright infringement and misappropriation of trade secrets — actionable under Saudi Arabian, Jordanian and international law.
          </p>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="container mx-auto px-4 py-14 max-w-4xl">
        <div className="space-y-3">
          {SECTIONS.map((s, i) => (
            <AccordionItem key={s.id} section={s} idx={i} />
          ))}
        </div>

        {/* Contact card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 rounded-2xl bg-[#082C6B] p-8 text-white text-center"
        >
          <Mail className="w-8 h-8 text-[#C9A84C] mx-auto mb-4" />
          <h3 className="text-xl font-black mb-2">Legal Enquiries</h3>
          <p className="text-white/60 text-sm mb-5 leading-relaxed max-w-lg mx-auto">
            To request a content licence, report infringement, or raise a legal matter, contact our principal directly. All communications are treated as confidential.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:haqash.maen@gmail.com" className="inline-flex items-center gap-2 bg-[#C9A84C] hover:bg-[#b8973e] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              <Mail className="w-4 h-4" /> haqash.maen@gmail.com
            </a>
            <a href="mailto:maen.haqash@yahoo.com" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
              <Mail className="w-4 h-4" /> maen.haqash@yahoo.com
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
