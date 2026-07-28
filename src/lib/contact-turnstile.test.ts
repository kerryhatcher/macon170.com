import { describe, expect, it } from 'vitest';
import { reduceTurnstileState, turnstileView } from './contact-turnstile';

describe('Turnstile state reducer', () => {
  it('distinguishes a normal expiry from a load failure', () => {
    const expired = reduceTurnstileState('verified', 'expired');

    expect(expired).toBe('expired');
    expect(turnstileView(expired)).toEqual({
      submitEnabled: false,
      statusMessage: 'The security check expired and is refreshing automatically.',
      showUnavailableNotice: false,
    });
  });

  it('recovers every non-success state when Turnstile returns a fresh token', () => {
    for (const state of ['waiting', 'retrying', 'expired', 'unavailable'] as const) {
      const verified = reduceTurnstileState(state, 'success');
      expect(verified).toBe('verified');
      expect(turnstileView(verified)).toEqual({
        submitEnabled: true,
        statusMessage: null,
        showUnavailableNotice: false,
      });
    }
  });

  it('only promotes an actively retrying challenge to unavailable', () => {
    expect(reduceTurnstileState('retrying', 'failure-timeout')).toBe('unavailable');
    expect(reduceTurnstileState('verified', 'failure-timeout')).toBe('verified');
    expect(reduceTurnstileState('expired', 'failure-timeout')).toBe('expired');
  });
});
