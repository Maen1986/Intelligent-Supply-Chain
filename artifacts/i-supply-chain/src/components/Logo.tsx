import React from 'react';
import { Link } from 'wouter';

export function Logo() {
  return (
    <Link href="/" className="flex items-center">
      <img
        src="/brand/logo.png"
        alt="I Supply Chain"
        className="h-10 w-auto object-contain"
        style={{ maxWidth: '200px' }}
      />
    </Link>
  );
}
