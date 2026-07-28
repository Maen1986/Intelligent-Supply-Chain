/**
 * PrepareDownloadModal — n8n URL field visibility + 404 download error
 *
 * Confirms:
 *   E. Make.com template → n8n Instance URL input is NOT rendered
 *   F. Zapier template   → n8n Instance URL input is NOT rendered
 *   G. n8n template      → n8n Instance URL input IS rendered
 *   K. Arabic mode, 404  → Arabic unavailability string appears in error panel
 *   L. English mode, 404 → English unavailability string appears in error panel
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { PrepareDownloadModal } from './AdminAutomations';

/* ── Module mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/lib/apiBase', () => ({
  API_BASE: 'http://localhost/api',
}));

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Minimal TemplateManifestItem — only fields PrepareDownloadModal reads.
 */
function makeTemplate(platform: string) {
  return {
    id: `test-${platform}`,
    platform,
    filename: `test-${platform}.json`,
    downloadPath: `automation-templates/${platform}/test.json`,
    name: `Test ${platform} Template`,
    nameAr: `قالب ${platform} للاختبار`,
    description: 'Test template',
    descriptionAr: 'قالب للاختبار',
    triggerEvent: 'kpi.threshold_breach',
    category: 'Alerts',
    setupTimeMinutes: 5,
    nodes: ['HTTP Request'],
  };
}

/* ── Setup ────────────────────────────────────────────────────────────────── */

beforeEach(() => {
  /* Stub fetch so the useEffect key-loading call resolves immediately */
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, keys: [] }),
    }),
  );
});

afterEach(() => {
  cleanup();
});

/* ══════════════════════════════════════════════════════════════════════════════
   Tests
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — n8n URL field visibility', () => {

  /* ── E. Make.com template ──────────────────────────────────────────────── */

  it('E — Make.com template: n8n Instance URL input is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('make')}
        ar={false}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('n8n Instance URL (optional)'),
    ).toBeNull();
  });

  /* ── F. Zapier template ────────────────────────────────────────────────── */

  it('F — Zapier template: n8n Instance URL input is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('zapier')}
        ar={false}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('n8n Instance URL (optional)'),
    ).toBeNull();
  });

  /* ── G. n8n template ───────────────────────────────────────────────────── */

  it('G — n8n template: n8n Instance URL input IS present', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={false}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByPlaceholderText('https://your-n8n.example.com'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('n8n Instance URL (optional)'),
    ).toBeInTheDocument();
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Arabic mode (ar=true) — n8n URL field visibility
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — n8n URL field visibility (Arabic mode)', () => {

  /* ── H. Make.com template ──────────────────────────────────────────────── */

  it('H — Make.com template (ar=true): Arabic n8n label is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('make')}
        ar={true}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('عنوان n8n (اختياري)'),
    ).toBeNull();
  });

  /* ── I. Zapier template ────────────────────────────────────────────────── */

  it('I — Zapier template (ar=true): Arabic n8n label is absent', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('zapier')}
        ar={true}
        onClose={() => {}}
      />,
    );

    expect(
      screen.queryByPlaceholderText('https://your-n8n.example.com'),
    ).toBeNull();

    expect(
      screen.queryByText('عنوان n8n (اختياري)'),
    ).toBeNull();
  });

  /* ── J. n8n template ───────────────────────────────────────────────────── */

  it('J — n8n template (ar=true): Arabic n8n label IS present', () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={true}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByPlaceholderText('https://your-n8n.example.com'),
    ).toBeInTheDocument();

    expect(
      screen.getByText('عنوان n8n (اختياري)'),
    ).toBeInTheDocument();
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   404 download error — Arabic (ar=true)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — 404 download error (Arabic mode)', () => {

  /**
   * K — Arabic: server returns 404 → Arabic unavailability string is shown
   *
   * fetch is called twice:
   *   1st call  → keys endpoint  → resolves with { ok: true, keys: [] }
   *   2nd call  → download endpoint → resolves with a 404 Response
   */
  it('K — ar=true, server 404: shows Arabic unavailability message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint */
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={true}
        onClose={() => {}}
      />,
    );

    /* Fill in the required API key field */
    const apiKeyInput = screen.getByPlaceholderText('الصق قيمة المفتاح هنا…');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-value' } });

    /* Click the Download button */
    const downloadBtn = screen.getByRole('button', { name: /تنزيل القالب/i });
    fireEvent.click(downloadBtn);

    /* Arabic unavailability message must appear in the error panel */
    await waitFor(() => {
      expect(
        screen.getByText('ملف القالب غير متوفر حالياً — ربما تم حذفه. يُرجى التواصل مع المسؤول.'),
      ).toBeInTheDocument();
    });
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   404 download error — English (ar=false)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — 404 download error (English mode)', () => {

  /**
   * L — English: server returns 404 → English unavailability string is shown
   */
  it('L — ar=false, server 404: shows English unavailability message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint */
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={false}
        onClose={() => {}}
      />,
    );

    /* Fill in the required API key field */
    const apiKeyInput = screen.getByPlaceholderText('Paste the raw key value here…');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-value' } });

    /* Click the Download button */
    const downloadBtn = screen.getByRole('button', { name: /download template/i });
    fireEvent.click(downloadBtn);

    /* English unavailability message must appear in the error panel */
    await waitFor(() => {
      expect(
        screen.getByText(
          'Template file is currently unavailable — it may have been removed. Please contact your administrator.',
        ),
      ).toBeInTheDocument();
    });
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Missing API key validation — Arabic (ar=true)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — missing API key validation (Arabic mode)', () => {

  /**
   * M — Arabic: clicking Download with a blank API key field shows the
   * Arabic validation error immediately and does NOT make a download fetch.
   *
   * The beforeEach stub resolves one fetch call for the keys endpoint on mount.
   * After the click, fetch must still have been called exactly once —
   * no additional network call for the download.
   */
  it('M — ar=true, blank key: shows Arabic validation error without fetching', async () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={true}
        onClose={() => {}}
      />,
    );

    /* Click Download without entering an API key */
    const downloadBtn = screen.getByRole('button', { name: /تنزيل القالب/i });
    fireEvent.click(downloadBtn);

    /* Arabic validation error must appear immediately */
    expect(
      screen.getByText('أدخل قيمة مفتاح API'),
    ).toBeInTheDocument();

    /* fetch was only called once — for the keys endpoint on mount, not for download */
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Missing API key validation — English (ar=false)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — missing API key validation (English mode)', () => {

  /**
   * N — English: clicking Download with a blank API key field shows the
   * English validation error immediately and does NOT make a download fetch.
   */
  it('N — ar=false, blank key: shows English validation error without fetching', async () => {
    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={false}
        onClose={() => {}}
      />,
    );

    /* Click Download without entering an API key */
    const downloadBtn = screen.getByRole('button', { name: /download template/i });
    fireEvent.click(downloadBtn);

    /* English validation error must appear immediately */
    expect(
      screen.getByText('Please enter an API key value'),
    ).toBeInTheDocument();

    /* fetch was only called once — for the keys endpoint on mount, not for download */
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Blank-key error clears after user fills in the key and retries — Arabic
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — blank-key error clears on retry (Arabic mode)', () => {

  /**
   * O — Arabic: error shown when key is blank, then cleared once the user
   * fills in the key and clicks Download again (download succeeds on retry).
   *
   * fetch sequence:
   *   1st call → keys endpoint (mount)       → { ok: true, keys: [] }
   *   2nd call → download endpoint (retry)   → 200 OK with template text
   */
  it('O — ar=true: blank-key error disappears after user fills key and retries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint — succeeds on retry */
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '{"name":"test"}',
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={true}
        onClose={() => {}}
      />,
    );

    /* Click Download without entering an API key → error appears */
    const downloadBtn = screen.getByRole('button', { name: /تنزيل القالب/i });
    fireEvent.click(downloadBtn);

    expect(
      screen.getByText('أدخل قيمة مفتاح API'),
    ).toBeInTheDocument();

    /* Now fill in the API key field */
    const apiKeyInput = screen.getByPlaceholderText('الصق قيمة المفتاح هنا…');
    fireEvent.change(apiKeyInput, { target: { value: 'valid-api-key' } });

    /* Click Download again */
    fireEvent.click(downloadBtn);

    /* Validation error must no longer be visible */
    await waitFor(() => {
      expect(
        screen.queryByText('أدخل قيمة مفتاح API'),
      ).toBeNull();
    });
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Blank-key error clears after user fills in the key and retries — English
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — blank-key error clears on retry (English mode)', () => {

  /**
   * P — English: error shown when key is blank, then cleared once the user
   * fills in the key and clicks Download again (download succeeds on retry).
   *
   * fetch sequence:
   *   1st call → keys endpoint (mount)       → { ok: true, keys: [] }
   *   2nd call → download endpoint (retry)   → 200 OK with template text
   */
  it('P — ar=false: blank-key error disappears after user fills key and retries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint — succeeds on retry */
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '{"name":"test"}',
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={false}
        onClose={() => {}}
      />,
    );

    /* Click Download without entering an API key → error appears */
    const downloadBtn = screen.getByRole('button', { name: /download template/i });
    fireEvent.click(downloadBtn);

    expect(
      screen.getByText('Please enter an API key value'),
    ).toBeInTheDocument();

    /* Now fill in the API key field */
    const apiKeyInput = screen.getByPlaceholderText('Paste the raw key value here…');
    fireEvent.change(apiKeyInput, { target: { value: 'valid-api-key' } });

    /* Click Download again */
    fireEvent.click(downloadBtn);

    /* Validation error must no longer be visible */
    await waitFor(() => {
      expect(
        screen.queryByText('Please enter an API key value'),
      ).toBeNull();
    });
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Non-404 server error — Arabic (ar=true)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — non-404 server error (Arabic mode)', () => {

  /**
   * Q — Arabic: server returns 500 → Arabic generic-failure string is shown
   *
   * fetch is called twice:
   *   1st call  → keys endpoint  → resolves with { ok: true, keys: [] }
   *   2nd call  → download endpoint → resolves with a 500 Response
   */
  it('Q — ar=true, server 500: shows Arabic generic-failure message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint */
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={true}
        onClose={() => {}}
      />,
    );

    /* Fill in the required API key field */
    const apiKeyInput = screen.getByPlaceholderText('الصق قيمة المفتاح هنا…');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-value' } });

    /* Click the Download button */
    const downloadBtn = screen.getByRole('button', { name: /تنزيل القالب/i });
    fireEvent.click(downloadBtn);

    /* Arabic generic-failure message must appear in the error panel */
    await waitFor(() => {
      expect(
        screen.getByText('تعذّر تنزيل القالب'),
      ).toBeInTheDocument();
    });
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Non-404 server error — English (ar=false)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — non-404 server error (English mode)', () => {

  /**
   * R — English: server returns 500 → English generic-failure string is shown
   */
  it('R — ar=false, server 500: shows English generic-failure message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint */
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={false}
        onClose={() => {}}
      />,
    );

    /* Fill in the required API key field */
    const apiKeyInput = screen.getByPlaceholderText('Paste the raw key value here…');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-value' } });

    /* Click the Download button */
    const downloadBtn = screen.getByRole('button', { name: /download template/i });
    fireEvent.click(downloadBtn);

    /* English generic-failure message must appear in the error panel */
    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch template — please try again'),
      ).toBeInTheDocument();
    });
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Network-throw error clears after recovery + retry — Arabic (ar=true)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — network-throw error clears on retry (Arabic mode)', () => {

  /**
   * S — Arabic: fetch throws (simulating a network drop) → Arabic generic-failure
   * message appears; a follow-up click with a succeeding fetch mock clears it.
   *
   * fetch sequence:
   *   1st call → keys endpoint (mount)           → { ok: true, keys: [] }
   *   2nd call → download endpoint (network drop) → throws Error('Network failure')
   *   3rd call → download endpoint (recovered)    → 200 OK with template text
   */
  it('S — ar=true: network-throw shows Arabic error; retry success clears it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint — network drop */
        .mockRejectedValueOnce(new Error('Network failure'))
        /* download endpoint — recovered */
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '{"name":"test"}',
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={true}
        onClose={() => {}}
      />,
    );

    /* Fill in the required API key field */
    const apiKeyInput = screen.getByPlaceholderText('الصق قيمة المفتاح هنا…');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-value' } });

    /* First click — network throws → Arabic error appears */
    const downloadBtn = screen.getByRole('button', { name: /تنزيل القالب/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(
        screen.getByText('تعذّر تنزيل القالب'),
      ).toBeInTheDocument();
    });

    /* Second click — fetch succeeds → error is gone */
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(
        screen.queryByText('تعذّر تنزيل القالب'),
      ).toBeNull();
    });
  });

});

/* ══════════════════════════════════════════════════════════════════════════════
   Network-throw error clears after recovery + retry — English (ar=false)
   ══════════════════════════════════════════════════════════════════════════════ */

describe('PrepareDownloadModal — network-throw error clears on retry (English mode)', () => {

  /**
   * T — English: fetch throws (simulating a network drop) → English generic-failure
   * message appears; a follow-up click with a succeeding fetch mock clears it.
   *
   * fetch sequence:
   *   1st call → keys endpoint (mount)           → { ok: true, keys: [] }
   *   2nd call → download endpoint (network drop) → throws Error('Network failure')
   *   3rd call → download endpoint (recovered)    → 200 OK with template text
   */
  it('T — ar=false: network-throw shows English error; retry success clears it', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        /* keys endpoint */
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ ok: true, keys: [] }),
        })
        /* download endpoint — network drop */
        .mockRejectedValueOnce(new Error('Network failure'))
        /* download endpoint — recovered */
        .mockResolvedValueOnce({
          ok: true,
          text: async () => '{"name":"test"}',
        }),
    );

    render(
      <PrepareDownloadModal
        template={makeTemplate('n8n')}
        ar={false}
        onClose={() => {}}
      />,
    );

    /* Fill in the required API key field */
    const apiKeyInput = screen.getByPlaceholderText('Paste the raw key value here…');
    fireEvent.change(apiKeyInput, { target: { value: 'test-api-key-value' } });

    /* First click — network throws → English error appears */
    const downloadBtn = screen.getByRole('button', { name: /download template/i });
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to fetch template — please try again'),
      ).toBeInTheDocument();
    });

    /* Second click — fetch succeeds → error is gone */
    fireEvent.click(downloadBtn);

    await waitFor(() => {
      expect(
        screen.queryByText('Failed to fetch template — please try again'),
      ).toBeNull();
    });
  });

});
