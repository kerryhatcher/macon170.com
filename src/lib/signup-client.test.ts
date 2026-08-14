import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  SignupClientError,
  getSignupForm,
  getSignupResponse,
  submitSignupResponse,
  updateSignupResponse,
  withdrawSignupResponse,
  type SignupResponseUpdate,
  type SignupSubmission,
} from './signup-client';

const form = {
  slug: 'lego-derby-food',
  formType: 'items',
  title: 'Lego Derby snacks',
  instructions: 'Claim what you can bring.',
  closed: false,
  closesAt: null,
  event: { slug: 'lego-derby', title: 'Lego Derby', startsAt: '2026-09-12T22:00:00.000Z' },
  slots: [{ id: 'slot-1', label: 'Hot dogs', notes: null, quantityNeeded: 3, quantityClaimed: 1, quantityRemaining: 2 }],
};

const detail = {
  id: 'r1',
  formSlug: 'lego-derby-food',
  formTitle: 'Lego Derby snacks',
  formType: 'items',
  email: 'parent@example.com',
  familyName: 'Hatcher',
  phone: '478-555-0123',
  attending: true,
  adults: 2,
  children: 1,
  dietaryNotes: null,
  status: 'confirmed',
  claims: [{ slotId: 'slot-1', label: 'Hot dogs', quantity: 1 }],
};

// Exactly what a PATCH accepts: no email, no honeypot, no Turnstile token.
const update: SignupResponseUpdate = {
  familyName: 'Hatcher',
  phone: '478-555-0123',
  attending: true,
  adults: 2,
  children: 1,
  dietaryNotes: null,
  claims: [{ slotId: 'slot-1', quantity: 1 }],
};

const submission: SignupSubmission = {
  email: 'parent@example.com',
  familyName: 'Hatcher',
  phone: '478-555-0123',
  attending: true,
  adults: 2,
  children: 1,
  dietaryNotes: null,
  claims: [{ slotId: 'slot-1', quantity: 1 }],
  website: '',
  'cf-turnstile-response': 'tok',
};

// The mock's parameters are declared so `mock.calls[0][0]` and `[0][1]` stay typed; an argless
// `vi.fn(async () => …)` gives calls the type `[]` and every assertion on the request fails to
// compile.
const stub = (body: unknown, status = 200) =>
  vi.fn(
    async (_url: string, _init?: RequestInit) =>
      new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }),
  );

afterEach(() => vi.unstubAllGlobals());

describe('getSignupForm', () => {
  it('returns a validated form', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', form }));
    await expect(getSignupForm('lego-derby-food')).resolves.toMatchObject({ slug: 'lego-derby-food', formType: 'items' });
  });

  it('rejects a body without version v1', async () => {
    vi.stubGlobal('fetch', stub({ form }));
    await expect(getSignupForm('lego-derby-food')).rejects.toBeInstanceOf(SignupClientError);
  });

  it('rejects a form whose slot counts are not integers', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', form: { ...form, slots: [{ ...form.slots[0], quantityRemaining: 'two' }] } }));
    await expect(getSignupForm('lego-derby-food')).rejects.toBeInstanceOf(SignupClientError);
  });

  it('rejects an unknown form type rather than passing it through', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', form: { ...form, formType: 'raffle' } }));
    await expect(getSignupForm('lego-derby-food')).rejects.toBeInstanceOf(SignupClientError);
  });

  it('surfaces a 404 with status and code so the page can say not found', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', error: { code: 'not_found', message: 'Not found.' } }, 404));
    await expect(getSignupForm('nope')).rejects.toMatchObject({ status: 404, code: 'not_found' });
  });

  it('encodes the slug into the path', async () => {
    const fetchStub = stub({ version: 'v1', form });
    vi.stubGlobal('fetch', fetchStub);
    await getSignupForm('a b');
    expect(String(fetchStub.mock.calls[0][0])).toContain('/forms/a%20b');
  });

  it('reads a closed form without treating it as an error', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', form: { ...form, closed: true, closesAt: '2026-09-01T00:00:00.000Z' } }));
    await expect(getSignupForm('lego-derby-food')).resolves.toMatchObject({ closed: true });
  });
});

describe('submitSignupResponse', () => {
  it('POSTs JSON and resolves on 201', async () => {
    const fetchStub = stub({ version: 'v1', status: 'emailed' }, 201);
    vi.stubGlobal('fetch', fetchStub);
    await expect(submitSignupResponse('lego-derby-food', submission)).resolves.toBeUndefined();
    const init = fetchStub.mock.calls[0][1]!;
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toMatchObject({
      email: 'parent@example.com',
      phone: '478-555-0123',
      claims: [{ slotId: 'slot-1', quantity: 1 }],
      website: '',
      'cf-turnstile-response': 'tok',
    });
  });

  it('attaches the refreshed form to a 409 slot_full error', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', error: { code: 'slot_full', message: 'Full.' }, form }, 409));
    await expect(submitSignupResponse('lego-derby-food', submission)).rejects.toMatchObject({
      status: 409,
      code: 'slot_full',
      form: { slug: 'lego-derby-food' },
    });
  });

  it('reports a 502 as an email failure that is safe to retry', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', error: { code: 'email_failed', message: 'No email.' } }, 502));
    await expect(submitSignupResponse('lego-derby-food', submission)).rejects.toMatchObject({ status: 502 });
  });

  it('turns a network failure into a SignupClientError, not a raw TypeError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    await expect(submitSignupResponse('lego-derby-food', submission)).rejects.toBeInstanceOf(SignupClientError);
  });

  it('turns a non-JSON error page into a SignupClientError carrying the status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>gateway</html>', { status: 502 })),
    );
    await expect(submitSignupResponse('lego-derby-food', submission)).rejects.toMatchObject({ status: 502 });
  });
});

describe('token routes', () => {
  it('loads a response by token and encodes the token', async () => {
    const fetchStub = stub({ version: 'v1', response: detail });
    vi.stubGlobal('fetch', fetchStub);
    await expect(getSignupResponse('a/b')).resolves.toMatchObject({ familyName: 'Hatcher' });
    expect(String(fetchStub.mock.calls[0][0])).toContain('/responses/a%2Fb');
  });

  it('accepts a legacy response whose private phone is null', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', response: { ...detail, phone: null } }));
    await expect(getSignupResponse('legacy')).resolves.toMatchObject({ phone: null });
  });

  it('returns the updated response from a PATCH, and sends no email or Turnstile token', async () => {
    const fetchStub = stub({ version: 'v1', response: { ...detail, adults: 3 } });
    vi.stubGlobal('fetch', fetchStub);
    await expect(updateSignupResponse('tok', update)).resolves.toMatchObject({ adults: 3 });

    // A PATCH carries only what a family may change. The CMS overwrites any email with the row's
    // own address, and the token in the path is the credential, so neither belongs in the body.
    const sent = JSON.parse(fetchStub.mock.calls[0][1]!.body as string);
    expect(sent).not.toHaveProperty('email');
    expect(sent).not.toHaveProperty('website');
    expect(sent).not.toHaveProperty('cf-turnstile-response');
  });

  it('resolves a withdrawal', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', status: 'withdrawn' }));
    await expect(withdrawSignupResponse('tok')).resolves.toBeUndefined();
  });

  it('never includes the token in the error message', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', error: { code: 'not_found', message: 'Not found.' } }, 404));
    const error = (await getSignupResponse('super-secret-token').catch((e) => e)) as SignupClientError;
    expect(error).toBeInstanceOf(SignupClientError);
    expect(error.message).not.toContain('super-secret-token');
  });

  it('never includes the token in a validation failure message either', async () => {
    vi.stubGlobal('fetch', stub({ version: 'v1', response: { ...detail, status: 'bogus' } }));
    const error = (await getSignupResponse('super-secret-token').catch((e) => e)) as SignupClientError;
    expect(error.message).not.toContain('super-secret-token');
  });
});
