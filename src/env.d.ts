/// <reference types="astro/client" />

interface Window {
  onTurnstileSuccess?: (token?: string) => void;
  onTurnstileError?: (errorCode?: string) => boolean;
  onTurnstileExpired?: () => void;
  onTurnstileTimeout?: () => boolean;
}
