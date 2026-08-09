export type SignupFormType = 'rsvp' | 'items';
export type SignupResponseStatus = 'unconfirmed' | 'confirmed';

export type PublicSignupSlot = {
  id: string;
  label: string;
  notes: string | null;
  quantityNeeded: number;
  quantityClaimed: number;
  quantityRemaining: number;
};

export type PublicSignupForm = {
  slug: string;
  formType: SignupFormType;
  title: string;
  instructions: string;
  closed: boolean;
  closesAt: string | null;
  event: { slug: string; title: string; startsAt: string };
  slots: PublicSignupSlot[];
};

export type SignupResponseDetail = {
  id: string;
  formSlug: string;
  formTitle: string;
  formType: SignupFormType;
  email: string;
  familyName: string;
  attending: boolean;
  adults: number;
  children: number;
  dietaryNotes: string | null;
  status: SignupResponseStatus;
  claims: Array<{ slotId: string; label: string; quantity: number }>;
};

/**
 * What a family changes about its own response. The edit page sends exactly this and nothing more:
 * the CMS overwrites any `email` in a PATCH body with the row's own address, and the token is the
 * credential there, so neither an address nor a Turnstile token belongs in an update.
 */
export type SignupResponseUpdate = {
  familyName: string;
  attending: boolean;
  adults: number;
  children: number;
  dietaryNotes: string | null;
  claims: Array<{ slotId: string; quantity: number }>;
};

/** A first submission: an update plus the identity and the anti-abuse fields. */
export type SignupSubmission = SignupResponseUpdate & {
  email: string;
  website?: string;
  'cf-turnstile-response'?: string;
};

const PRODUCTION_SIGNUP_API = 'https://cms.macon170.com/api/signups/v1';
// Unlike the contact form - a native form POST, which CORS does not touch - every signup call is a
// JSON fetch, so it preflights and the CMS requires Origin to equal its PUBLIC_SITE_ORIGIN for any
// write. The prod CMS allowlists only https://www.macon170.com, so a browser on `bun run dev` is
// blocked. Point PUBLIC_CMS_ORIGIN at a local CMS (port 41772) whose .dev.vars sets CORS_ORIGINS
// and PUBLIC_SITE_ORIGIN to your dev origin.
const DEVELOPMENT_SIGNUP_API = import.meta.env.PUBLIC_CMS_ORIGIN
  ? `${import.meta.env.PUBLIC_CMS_ORIGIN.replace(/\/$/, '')}/api/signups/v1`
  : PRODUCTION_SIGNUP_API;
const isLocalPage = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

export const SIGNUP_API_BASE = import.meta.env.DEV || isLocalPage ? DEVELOPMENT_SIGNUP_API : PRODUCTION_SIGNUP_API;

export class SignupClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    /** A 409 slot_full carries a refreshed form so the page can re-render real remaining counts. */
    public readonly form?: PublicSignupForm,
  ) {
    super(message);
  }
}

const formTypes = new Set<SignupFormType>(['rsvp', 'items']);
const statuses = new Set<SignupResponseStatus>(['unconfirmed', 'confirmed']);

// The magic-link token travels in the URL path, so nothing here may quote the request URL: not an
// error message, not a thrown value, not a log line.
async function signupRequest(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 12_000);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
      signal: controller.signal,
    });
  } catch (error) {
    globalThis.clearTimeout(timeout);
    throw new SignupClientError(
      error instanceof DOMException && error.name === 'AbortError'
        ? 'The signup service took too long to answer.'
        : 'The signup service is unavailable.',
    );
  }

  // The timeout has to outlive the header round trip. `fetch` resolves as soon as the headers
  // arrive, so clearing it here rather than in a `finally` above is what keeps a server that
  // stalls part-way through the body from leaving the page pending forever.
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  } finally {
    globalThis.clearTimeout(timeout);
  }
  if (!isRecord(body) || body.version !== 'v1') {
    throw new SignupClientError('The signup service returned an unexpected answer.', response.status);
  }
  if (!response.ok) {
    const error = isRecord(body.error) ? body.error : {};
    throw new SignupClientError(
      typeof error.message === 'string' ? error.message : 'That signup could not be saved.',
      response.status,
      typeof error.code === 'string' ? error.code : undefined,
      isRecord(body.form) ? validateForm(body.form) : undefined,
    );
  }
  return body;
}

export async function getSignupForm(slug: string): Promise<PublicSignupForm> {
  const body = await signupRequest(`${SIGNUP_API_BASE}/forms/${encodeURIComponent(slug)}`);
  return validateForm(body.form);
}

export async function submitSignupResponse(slug: string, body: SignupSubmission): Promise<void> {
  await signupRequest(`${SIGNUP_API_BASE}/forms/${encodeURIComponent(slug)}/responses`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getSignupResponse(token: string): Promise<SignupResponseDetail> {
  const body = await signupRequest(`${SIGNUP_API_BASE}/responses/${encodeURIComponent(token)}`);
  return validateResponse(body.response);
}

export async function updateSignupResponse(token: string, body: SignupResponseUpdate): Promise<SignupResponseDetail> {
  const result = await signupRequest(`${SIGNUP_API_BASE}/responses/${encodeURIComponent(token)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
  return validateResponse(result.response);
}

export async function withdrawSignupResponse(token: string): Promise<void> {
  await signupRequest(`${SIGNUP_API_BASE}/responses/${encodeURIComponent(token)}`, { method: 'DELETE' });
}

function validateForm(value: unknown): PublicSignupForm {
  if (!isRecord(value)) throw new SignupClientError('The signup service returned an invalid form.');
  const formType = requiredString(value, 'formType');
  if (!formTypes.has(formType as SignupFormType)) throw new SignupClientError('The signup service returned an invalid form type.');
  const event = value.event;
  if (!isRecord(event)) throw new SignupClientError('The signup service returned an invalid event.');
  if (!Array.isArray(value.slots)) throw new SignupClientError('The signup service returned an invalid slot list.');
  if (typeof value.closed !== 'boolean') throw new SignupClientError('The signup service returned an invalid form state.');

  return {
    slug: requiredString(value, 'slug'),
    formType: formType as SignupFormType,
    title: requiredString(value, 'title'),
    instructions: typeof value.instructions === 'string' ? value.instructions : '',
    closed: value.closed,
    closesAt: nullableString(value, 'closesAt'),
    event: {
      slug: requiredString(event, 'slug'),
      title: requiredString(event, 'title'),
      startsAt: requiredString(event, 'startsAt'),
    },
    slots: value.slots.map(validateSlot),
  };
}

function validateSlot(value: unknown): PublicSignupSlot {
  if (!isRecord(value)) throw new SignupClientError('The signup service returned an invalid item.');
  return {
    id: requiredString(value, 'id'),
    label: requiredString(value, 'label'),
    notes: nullableString(value, 'notes'),
    quantityNeeded: count(value, 'quantityNeeded'),
    quantityClaimed: count(value, 'quantityClaimed'),
    quantityRemaining: count(value, 'quantityRemaining'),
  };
}

function validateResponse(value: unknown): SignupResponseDetail {
  if (!isRecord(value)) throw new SignupClientError('The signup service returned an invalid response.');
  const formType = requiredString(value, 'formType');
  const status = requiredString(value, 'status');
  if (!formTypes.has(formType as SignupFormType) || !statuses.has(status as SignupResponseStatus)) {
    throw new SignupClientError('The signup service returned an invalid response state.');
  }
  if (!Array.isArray(value.claims)) throw new SignupClientError('The signup service returned an invalid claim list.');

  return {
    id: requiredString(value, 'id'),
    formSlug: requiredString(value, 'formSlug'),
    formTitle: requiredString(value, 'formTitle'),
    formType: formType as SignupFormType,
    email: requiredString(value, 'email'),
    familyName: requiredString(value, 'familyName'),
    attending: value.attending === true,
    adults: count(value, 'adults'),
    children: count(value, 'children'),
    dietaryNotes: nullableString(value, 'dietaryNotes'),
    status: status as SignupResponseStatus,
    claims: value.claims.map((claim) => {
      if (!isRecord(claim)) throw new SignupClientError('The signup service returned an invalid claim.');
      return { slotId: requiredString(claim, 'slotId'), label: requiredString(claim, 'label'), quantity: count(claim, 'quantity') };
    }),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requiredString(value: Record<string, unknown>, key: string): string {
  const item = value[key];
  if (typeof item !== 'string' || item.length === 0) throw new SignupClientError(`The signup service returned an invalid ${key}.`);
  return item;
}

function nullableString(value: Record<string, unknown>, key: string): string | null {
  const item = value[key];
  if (item === null || item === undefined) return null;
  return requiredString(value, key);
}

function count(value: Record<string, unknown>, key: string): number {
  const item = value[key];
  if (!Number.isInteger(item) || (item as number) < 0) throw new SignupClientError(`The signup service returned an invalid ${key}.`);
  return item as number;
}
