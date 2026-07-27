/**
 * Smoke tests for the ResponsiveContainer mock in test-setup.ts.
 *
 * The mock must handle two valid usage patterns:
 *   1. children as a React element   – the common case used throughout the app
 *   2. children as a render-prop function – used by some recharts patterns such as
 *      `<ResponsiveContainer>{({ width, height }) => <BarChart …/>}</ResponsiveContainer>`
 *
 * If the mock's function-child branch stops working, tests that rely on it will
 * pass vacuously (nothing renders) instead of failing loudly. These tests make
 * that breakage visible.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from 'recharts';

const SAMPLE_DATA = [
  { name: 'Jan', value: 40 },
  { name: 'Feb', value: 75 },
  { name: 'Mar', value: 55 },
];

describe('ResponsiveContainer mock – render patterns', () => {
  // Explicit cleanup ensures each test starts with a fresh DOM even when
  // vitest's auto-cleanup is not hooked up via the setupFiles.
  afterEach(cleanup);

  it('renders chart data when children is a React element (element pattern)', () => {
    render(
      <ResponsiveContainer width="100%" height={300}>
        {/*
         * When children is a React element the mock passes it through
         * unchanged — it does NOT inject width/height the way the real
         * ResponsiveContainer would. Provide explicit dimensions so recharts
         * actually renders axis tick text into the SVG.
         */}
        <BarChart width={800} height={300} data={SAMPLE_DATA}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="value" />
        </BarChart>
      </ResponsiveContainer>,
    );

    // Recharts renders axis tick labels as SVG <text> nodes; testing-library
    // finds them via getByText.
    expect(screen.getByText('Jan')).toBeDefined();
    expect(screen.getByText('Feb')).toBeDefined();
    expect(screen.getByText('Mar')).toBeDefined();
  });

  it('renders chart data when children is a render-prop function (function pattern)', () => {
    render(
      <ResponsiveContainer width="100%" height={300}>
        {({ width, height }: { width: number; height: number }) => (
          <BarChart
            width={width}
            height={height}
            data={SAMPLE_DATA}
          >
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" />
          </BarChart>
        )}
      </ResponsiveContainer>,
    );

    expect(screen.getByText('Jan')).toBeDefined();
    expect(screen.getByText('Feb')).toBeDefined();
    expect(screen.getByText('Mar')).toBeDefined();
  });

  it('passes non-zero dimensions to the render-prop function', () => {
    const spy = vi.fn(({ width, height }: { width: number; height: number }) => (
      <LineChart width={width} height={height} data={SAMPLE_DATA}>
        <Line type="monotone" dataKey="value" />
      </LineChart>
    ));

    render(
      <ResponsiveContainer width="100%" height={400}>
        {spy}
      </ResponsiveContainer>,
    );

    expect(spy).toHaveBeenCalled();
    const [dims] = spy.mock.calls[0];
    expect(dims.width).toBeGreaterThan(0);
    expect(dims.height).toBeGreaterThan(0);
  });

  it('produces no "width(0) height(0)" console warnings', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <ResponsiveContainer width="100%" height={300}>
        {({ width, height }: { width: number; height: number }) => (
          <BarChart width={width} height={height} data={SAMPLE_DATA}>
            <Bar dataKey="value" />
          </BarChart>
        )}
      </ResponsiveContainer>,
    );

    const dimensionWarnings = warnSpy.mock.calls.filter(
      (args) =>
        typeof args[0] === 'string' &&
        args[0].includes('width(0)') &&
        args[0].includes('height(0)'),
    );
    expect(dimensionWarnings).toHaveLength(0);

    warnSpy.mockRestore();
  });
});
