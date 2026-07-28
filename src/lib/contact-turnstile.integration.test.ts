import { describe, expect, it, vi } from 'vitest';
import { createTurnstileController, type TurnstileView } from './contact-turnstile';

describe('Turnstile controller integration', () => {
  it('keeps transient errors recoverable and cancels the persistent failure notice after success', () => {
    vi.useFakeTimers();
    const views: TurnstileView[] = [];
    const controller = createTurnstileController((view) => views.push(view), { failureDelayMs: 1_000 });

    expect(controller.error()).toBe(false);
    expect(views.at(-1)).toMatchObject({
      submitEnabled: false,
      statusMessage: expect.stringContaining('retrying automatically'),
      showUnavailableNotice: false,
    });

    vi.advanceTimersByTime(500);
    controller.success();
    vi.advanceTimersByTime(1_000);

    expect(views.at(-1)).toEqual({
      submitEnabled: true,
      statusMessage: null,
      showUnavailableNotice: false,
    });
    expect(views.some((view) => view.showUnavailableNotice)).toBe(false);
    vi.useRealTimers();
  });

  it('shows the fallback only when automatic retry has not recovered in time', () => {
    vi.useFakeTimers();
    const views: TurnstileView[] = [];
    const controller = createTurnstileController((view) => views.push(view), { failureDelayMs: 1_000 });

    controller.error();
    vi.advanceTimersByTime(1_000);

    expect(views.at(-1)).toEqual({
      submitEnabled: false,
      statusMessage: null,
      showUnavailableNotice: true,
    });
    vi.useRealTimers();
  });

  it('reports expiry as an automatic refresh and enables submission after the refreshed token arrives', () => {
    const views: TurnstileView[] = [];
    const controller = createTurnstileController((view) => views.push(view));

    controller.success();
    controller.expired();
    expect(views.at(-1)).toMatchObject({
      submitEnabled: false,
      statusMessage: expect.stringContaining('refreshing automatically'),
      showUnavailableNotice: false,
    });

    controller.success();
    expect(views.at(-1)).toEqual({
      submitEnabled: true,
      statusMessage: null,
      showUnavailableNotice: false,
    });
  });
});
