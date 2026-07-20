import React from 'react';
import { Link } from 'wouter';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shadow-sm">
        <span className="text-white font-extrabold text-sm tracking-widest leading-none">SC</span>
      </div>
      <div className="font-bold text-primary tracking-[0.15em] uppercase text-sm sm:text-base leading-none">
        I Supply Chain
      </div>
    </Link>
  );
}
