import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, within } from '@testing-library/react';

afterEach(cleanup);
import { FrameworkBadge, FRAMEWORK_NAMES } from './FrameworkBadge';

describe('FrameworkBadge', () => {
  it('renders nothing when frameworks is undefined', () => {
    const { container } = render(<FrameworkBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when frameworks is an empty array', () => {
    const { container } = render(<FrameworkBadge frameworks={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a badge for each framework', () => {
    render(<FrameworkBadge frameworks={['CIPS', 'ISO 9001', 'APICS']} />);
    expect(screen.getByTestId('framework-badge-CIPS')).toBeInTheDocument();
    expect(screen.getByTestId('framework-badge-ISO-9001')).toBeInTheDocument();
    expect(screen.getByTestId('framework-badge-APICS')).toBeInTheDocument();
  });

  it('shows the abbreviation text inside each badge', () => {
    render(<FrameworkBadge frameworks={['CIPS', 'ISO 9001']} />);
    expect(screen.getByText('CIPS')).toBeInTheDocument();
    expect(screen.getByText('ISO 9001')).toBeInTheDocument();
  });

  it('renders the wrapper list container', () => {
    render(<FrameworkBadge frameworks={['CIPS']} />);
    expect(screen.getByTestId('framework-badge-list')).toBeInTheDocument();
  });

  it('applies flex-row-reverse when lang is ar', () => {
    render(<FrameworkBadge frameworks={['CIPS']} lang="ar" />);
    const list = screen.getByTestId('framework-badge-list');
    expect(list.className).toContain('flex-row-reverse');
  });

  it('does NOT apply flex-row-reverse when lang is en', () => {
    render(<FrameworkBadge frameworks={['CIPS']} lang="en" />);
    const list = screen.getByTestId('framework-badge-list');
    expect(list.className).not.toContain('flex-row-reverse');
  });

  it('forwards extra className to the wrapper', () => {
    render(<FrameworkBadge frameworks={['CIPS']} className="my-custom-class" />);
    const list = screen.getByTestId('framework-badge-list');
    expect(list.className).toContain('my-custom-class');
  });

  it('FRAMEWORK_NAMES contains entries for all common frameworks', () => {
    const expected = [
      'CIPS', 'ISO 9001', 'ISO 31000', 'ASCM/SCOR', 'APICS',
      'GRI', 'Nitaqat', 'IKTVA', 'Saudi Vision 2030',
    ];
    expected.forEach((fw) => {
      expect(FRAMEWORK_NAMES[fw]).toBeTruthy();
    });
  });

  it('falls back to the raw key when a framework is not in FRAMEWORK_NAMES', () => {
    render(<FrameworkBadge frameworks={['UNKNOWN-FW']} />);
    expect(screen.getByTestId('framework-badge-UNKNOWN-FW')).toBeInTheDocument();
    expect(screen.getByText('UNKNOWN-FW')).toBeInTheDocument();
  });
});
