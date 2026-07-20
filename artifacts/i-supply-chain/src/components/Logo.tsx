import React from 'react';
import { Link } from 'wouter';

export function Logo() {
  return (
    <Link href="/" className="flex items-center shrink-0">
      <img
        src="/brand/logo.png?v=3"
        alt="I Supply Chain"
        className="w-auto object-contain"
        style={{ height: '60px', maxWidth: '260px' }}
      />
    </Link>
  );
}
