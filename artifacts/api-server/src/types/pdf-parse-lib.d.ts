/**
 * Ambient declaration for pdf-parse's internal lib entry point.
 *
 * clmReviewExtraction.ts imports from 'pdf-parse/lib/pdf-parse.js' directly
 * rather than the package root ('pdf-parse') -- the package root's
 * index.js has a debug-mode branch (`isDebugMode = !module.parent`) that
 * incorrectly evaluates true whenever a CommonJS module is loaded through
 * Node's ESM interop layer (this package is "type": "module"), causing it
 * to try reading a bundled test fixture file that does not exist in this
 * project and crash. Verified locally against real PDF/DOCX fixtures
 * before wiring this deep-import workaround into the route (see Module 09
 * doc, Review v2 build section). @types/pdf-parse only covers the package
 * root, not this internal path, hence this small ambient module.
 */
declare module 'pdf-parse/lib/pdf-parse.js' {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
    text: string;
  }
  type PdfParseFn = (dataBuffer: Buffer, options?: Record<string, unknown>) => Promise<PdfParseResult>;
  const pdfParse: PdfParseFn;
  export default pdfParse;
}
