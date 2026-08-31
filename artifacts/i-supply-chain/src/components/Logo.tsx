import React from 'react';
import { Link } from 'wouter';

// heightPx lets call sites that have a fixed-height container (e.g. the
// header's h-16 bar) request a smaller render than the 100px default used
// by Footer/Csr/ReportOutput, so the logo (plus any padding around it)
// never overflows past its container's edge.
export function Logo({ heightPx = 100 }: { heightPx?: number }) {
  return (
    <Link href="/" className="flex items-center shrink-0">
      <img
        src="/brand/logo.png?v=3"
        alt="I Supply Chain"
        className="w-auto object-contain"
        style={{ height: `${heightPx}px`, maxWidth: '380px' }}
      />
    </Link>
  );
}
