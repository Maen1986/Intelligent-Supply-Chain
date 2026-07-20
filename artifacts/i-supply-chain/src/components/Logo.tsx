import React from 'react';
import { Link } from 'wouter';

export function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <img
        src="/brand/logo.png?v=3"
        alt="I Supply Chain"
        className="h-12 w-auto object-contain"
        style={{ maxWidth: '220px' }}
      />
    </Link>
  );
}
