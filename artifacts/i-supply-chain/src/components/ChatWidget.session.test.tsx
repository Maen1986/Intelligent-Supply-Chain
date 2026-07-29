/**
 * Task 731 — Confirm the AI chat session clears correctly when a user signs
 * out so the next visitor cannot see the previous user's conversations.
 *
 * Covers:
 *  - After sign-out the chat shows no user messages (only the welcome bubble
 *    and quick suggestions are visible).
 *  - After a *different* user signs in on the same browser tab the previous
 *    user's messages are not shown.
 *  - The chat is NOT cleared when the same user id is re-set (e.g. a profile
 *    update) — only an identity change triggers the wipe.
 *
 * Implementation note: ChatWidget stores messages in component state (not
 * sessionStorage).  The fix adds a useEffect that watches user?.id and calls
 * resetChat() whenever the authenticated identity changes, preventing stale
 * DOM from leaking to the next visitor.
 */

import React, { useState } from 'react';
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup, fireEvent } from '@testing-library/react';
import * as AuthContextModule from '@/lib/AuthContext';
import type { UserProfile } from '@/lib/AuthContext';

/* ── jsdom stubs ─────────────────────────────────────────────────────────── */

// speechSynthesis is not implemented in jsdom
const speechSynthesisMock = {
  cancel: vi.fn(),
  speak: vi.fn(),
  resume: vi.fn(),
  getVoices: () => [],
  paused: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: speechSynthesisMock,
});

// scrollIntoView is not implemented in jsdom
Element.prototype.scrollIntoView = () => {};

/* ── Module mocks ────────────────────────────────────────────────────────── */

vi.mock('@/lib/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'en', setLang: vi.fn() }),
}));

/**
 * Replace framer-motion's animation primitives with transparent wrappers so
 * AnimatePresence mounts/unmounts children instantly (no timer dependency).
 */
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: React.forwardRef(
        ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) =>
          <div ref={ref} {...rest}>{children}</div>,
      ),
      button: React.forwardRef(
        ({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>, ref: React.Ref<HTMLButtonElement>) =>
          <button ref={ref} {...rest}>{children}</button>,
      ),
    },
  };
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */

import { ChatWidget } from './ChatWidget';

function makeUser(id: number, name = `User ${id}`): UserProfile {
  return {
    id,
    fullName: name,
    email: `user${id}@example.com`,
    mobile: null,
    designation: null,
    company: null,
    role: 'user',
  };
}

/**
 * Harness that renders ChatWidget with a controllable authenticated user.
 * Exposes `onSetUserRef` so tests can swap the user at runtime — the same
 * way AuthContext.logout()/login() does in production.
 */
function ChatWidgetHarness({
  initialUser,
  onSetUserRef,
}: {
  initialUser: UserProfile | null;
  onSetUserRef: React.MutableRefObject<((u: UserProfile | null) => void) | null>;
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser);
  onSetUserRef.current = setUser;

  vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    user,
    isAuthenticated: user !== null,
    loading: false,
    register: async () => {},
    login: async () => {},
    logout: vi.fn(async () => setUser(null)),
    changePassword: async () => {},
    updateProfile: async () => {},
  });

  return <ChatWidget />;
}

/** Opens the chat panel by clicking the floating trigger button. */
function openChat() {
  const trigger = screen.getByLabelText('Open chat with Maen, AI Consultant');
  act(() => { fireEvent.click(trigger); });
}

/**
 * Types a message into the input field and submits it with Enter.
 *
 * Use a message text that does NOT match any quick-suggestion label so we
 * can distinguish a user-message bubble from the suggestion buttons that
 * reappear once the chat is cleared (messages.length === 0).
 */
function typeAndSubmit(text: string) {
  const input = screen.getByPlaceholderText('Ask about supply chain...');
  act(() => {
    fireEvent.change(input, { target: { value: text } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  });
}

/* ── Test suite ──────────────────────────────────────────────────────────── */

beforeEach(() => {
  // fetch must be mocked to a never-resolving promise so createConversation
  // and the SSE stream don't advance state beyond the initial user message.
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    () => new Promise<Response>(() => {}), // never resolves
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ChatWidget — session isolation on sign-out / user switch', () => {

  // ── Sign-out clears messages ─────────────────────────────────────────────

  it('clears the conversation when the user signs out', async () => {
    const setUserRef: React.MutableRefObject<((u: UserProfile | null) => void) | null> =
      { current: null };

    render(
      <ChatWidgetHarness
        initialUser={makeUser(1, 'Alice')}
        onSetUserRef={setUserRef}
      />,
    );

    openChat();

    // Use a unique text that cannot match any quick-suggestion button label
    const aliceMsg = 'Alice unique vendor-analysis question 7491';
    typeAndSubmit(aliceMsg);

    // User message bubble appears immediately (before fetch resolves)
    expect(screen.getByText(aliceMsg)).toBeTruthy();

    // Sign out: user becomes null
    await act(async () => { setUserRef.current!(null); });

    // Alice's message must be gone
    expect(screen.queryByText(aliceMsg)).toBeNull();

    // Chat is in clean empty state: quick-suggestion buttons are visible
    expect(screen.getByRole('button', { name: 'What services do you offer?' })).toBeTruthy();
  });

  // ── Different user signing in clears messages ────────────────────────────

  it('clears the conversation when a different user signs in on the same tab', async () => {
    const setUserRef: React.MutableRefObject<((u: UserProfile | null) => void) | null> =
      { current: null };

    render(
      <ChatWidgetHarness
        initialUser={makeUser(1, 'Alice')}
        onSetUserRef={setUserRef}
      />,
    );

    openChat();

    const aliceMsg = 'Alice procurement question id-8823';
    typeAndSubmit(aliceMsg);
    expect(screen.getByText(aliceMsg)).toBeTruthy();

    // User A signs out
    await act(async () => { setUserRef.current!(null); });

    // User B signs in on the same tab (no page reload)
    await act(async () => { setUserRef.current!(makeUser(2, 'Bob')); });

    // Alice's message must not be visible to Bob
    expect(screen.queryByText(aliceMsg)).toBeNull();

    // Chat is in clean empty state for Bob
    expect(screen.getByRole('button', { name: 'What services do you offer?' })).toBeTruthy();
  });

  // ── Direct user switch (no explicit sign-out step) ───────────────────────

  it('clears the conversation when the authenticated identity changes directly', async () => {
    const setUserRef: React.MutableRefObject<((u: UserProfile | null) => void) | null> =
      { current: null };

    render(
      <ChatWidgetHarness
        initialUser={makeUser(1, 'Alice')}
        onSetUserRef={setUserRef}
      />,
    );

    openChat();

    const aliceMsg = 'Alice risk-assessment question id-9910';
    typeAndSubmit(aliceMsg);
    expect(screen.getByText(aliceMsg)).toBeTruthy();

    // Skip explicit logout — a different user id arrives directly
    await act(async () => { setUserRef.current!(makeUser(99, 'Carol')); });

    expect(screen.queryByText(aliceMsg)).toBeNull();
    expect(screen.getByRole('button', { name: 'What services do you offer?' })).toBeTruthy();
  });

  // ── Profile update does NOT clear messages ───────────────────────────────

  it('does NOT clear the conversation when the same user updates their profile', async () => {
    const setUserRef: React.MutableRefObject<((u: UserProfile | null) => void) | null> =
      { current: null };

    render(
      <ChatWidgetHarness
        initialUser={makeUser(1, 'Alice')}
        onSetUserRef={setUserRef}
      />,
    );

    openChat();

    const msg = 'Alice diagnostic question id-5512';
    typeAndSubmit(msg);
    expect(screen.getByText(msg)).toBeTruthy();

    // Profile update: same id, different display name — must NOT reset the chat
    await act(async () => {
      setUserRef.current!(makeUser(1, 'Alice Updated'));
    });

    // Message must still be present
    expect(screen.getByText(msg)).toBeTruthy();
  });

  // ── Unauthenticated from the start ──────────────────────────────────────

  it('shows quick suggestions and no extra messages when no user is logged in', () => {
    const setUserRef: React.MutableRefObject<((u: UserProfile | null) => void) | null> =
      { current: null };

    render(
      <ChatWidgetHarness initialUser={null} onSetUserRef={setUserRef} />,
    );

    openChat();

    // Quick suggestions must be present (messages.length === 0)
    expect(screen.getByRole('button', { name: 'What services do you offer?' })).toBeTruthy();
  });

  // ── In-flight stream is silently aborted on sign-out ────────────────────

  it('aborts the in-flight stream silently when the user signs out mid-conversation', async () => {
    const setUserRef: React.MutableRefObject<((u: UserProfile | null) => void) | null> =
      { current: null };

    // Override fetch to give us manual control over the abort
    let rejectFetch!: (reason?: unknown) => void;
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise<Response>((_resolve, reject) => { rejectFetch = reject; }),
    );

    render(
      <ChatWidgetHarness
        initialUser={makeUser(1, 'Alice')}
        onSetUserRef={setUserRef}
      />,
    );

    openChat();

    const aliceMsg = 'Alice in-flight message id-3301';
    typeAndSubmit(aliceMsg);

    // Sign out while the in-flight fetch is still pending
    await act(async () => { setUserRef.current!(null); });

    // Simulate an AbortError arriving after the sign-out
    await act(async () => {
      rejectFetch(new DOMException('Aborted', 'AbortError'));
    });

    // Previous user's message must be gone
    expect(screen.queryByText(aliceMsg)).toBeNull();

    // No error bubble must be visible for the aborted request
    expect(screen.queryByText(/sorry, something went wrong/i)).toBeNull();
  });
});
