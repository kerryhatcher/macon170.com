export const TURNSTILE_FAILURE_DELAY_MS = 12_000;

export type TurnstileState = 'waiting' | 'verified' | 'retrying' | 'expired' | 'unavailable';
export type TurnstileEvent = 'success' | 'error' | 'expired' | 'failure-timeout';

export type TurnstileView = {
  submitEnabled: boolean;
  statusMessage: string | null;
  showUnavailableNotice: boolean;
};

export function reduceTurnstileState(state: TurnstileState, event: TurnstileEvent): TurnstileState {
  switch (event) {
    case 'success':
      return 'verified';
    case 'error':
      return 'retrying';
    case 'expired':
      return 'expired';
    case 'failure-timeout':
      return state === 'retrying' ? 'unavailable' : state;
  }
}

export function turnstileView(state: TurnstileState): TurnstileView {
  switch (state) {
    case 'verified':
      return { submitEnabled: true, statusMessage: null, showUnavailableNotice: false };
    case 'retrying':
      return {
        submitEnabled: false,
        statusMessage: 'The security check hit a temporary problem and is retrying automatically.',
        showUnavailableNotice: false,
      };
    case 'expired':
      return {
        submitEnabled: false,
        statusMessage: 'The security check expired and is refreshing automatically.',
        showUnavailableNotice: false,
      };
    case 'unavailable':
      return { submitEnabled: false, statusMessage: null, showUnavailableNotice: true };
    case 'waiting':
      return { submitEnabled: false, statusMessage: null, showUnavailableNotice: false };
  }
}

type TimeoutHandle = ReturnType<typeof setTimeout>;

export type TurnstileControllerOptions = {
  failureDelayMs?: number;
  schedule?: (callback: () => void, delayMs: number) => TimeoutHandle;
  cancel?: (handle: TimeoutHandle) => void;
};

export type TurnstileController = {
  success: () => void;
  error: () => false;
  expired: () => void;
  destroy: () => void;
};

export function createTurnstileController(
  render: (view: TurnstileView) => void,
  { failureDelayMs = TURNSTILE_FAILURE_DELAY_MS, schedule = setTimeout, cancel = clearTimeout }: TurnstileControllerOptions = {},
): TurnstileController {
  let state: TurnstileState = 'waiting';
  let failureTimer: TimeoutHandle | null = null;

  const clearFailureTimer = () => {
    if (failureTimer !== null) {
      cancel(failureTimer);
      failureTimer = null;
    }
  };

  const transition = (event: TurnstileEvent) => {
    state = reduceTurnstileState(state, event);
    render(turnstileView(state));
  };

  render(turnstileView(state));

  return {
    success() {
      clearFailureTimer();
      transition('success');
    },
    error() {
      clearFailureTimer();
      transition('error');
      failureTimer = schedule(() => {
        failureTimer = null;
        transition('failure-timeout');
      }, failureDelayMs);
      // A falsy return tells Turnstile to retain its default automatic retry behavior.
      return false;
    },
    expired() {
      clearFailureTimer();
      transition('expired');
    },
    destroy() {
      clearFailureTimer();
    },
  };
}
