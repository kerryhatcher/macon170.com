import { describe, expect, it } from 'vitest';
import { buildClaimRows, reconcileClaimRows, setClaimQuantity, toClaimPayload } from './signup-claims';
import type { PublicSignupForm, SignupResponseDetail } from './signup-client';

const form: PublicSignupForm = {
  slug: 'lego-derby-food',
  formType: 'items',
  title: 'Lego Derby snacks',
  instructions: '',
  closed: false,
  closesAt: null,
  event: { slug: 'lego-derby', title: 'Lego Derby', startsAt: '2026-09-12T22:00:00.000Z' },
  slots: [
    { id: 'buns', label: 'Buns', notes: '8-packs', quantityNeeded: 3, quantityClaimed: 1, quantityRemaining: 2 },
    { id: 'drinks', label: 'Drinks', notes: null, quantityNeeded: 2, quantityClaimed: 2, quantityRemaining: 0 },
  ],
};

const existing = {
  formType: 'items',
  claims: [{ slotId: 'buns', label: 'Buns', quantity: 1 }],
} as SignupResponseDetail;

describe('buildClaimRows', () => {
  it('starts every row at zero for a first-time family', () => {
    expect(buildClaimRows(form).map((row) => row.quantity)).toEqual([0, 0]);
  });

  it('caps max at what is left', () => {
    expect(buildClaimRows(form).map((row) => row.max)).toEqual([2, 0]);
  });

  it('gives a family back the capacity its own existing claim is holding', () => {
    // The family already holds 1 of the 3 buns, so it may raise its claim to 3, not 2.
    const rows = buildClaimRows(form, existing);
    expect(rows[0]).toMatchObject({ quantity: 1, max: 3, claimedByOthers: 0 });
  });

  it('summarises progress in the words a parent reads', () => {
    expect(buildClaimRows(form)[0].summary).toBe('1 of 3 claimed, 2 still needed');
    expect(buildClaimRows(form)[1].summary).toBe('All 2 claimed');
  });

  it('returns no rows for an rsvp form', () => {
    expect(buildClaimRows({ ...form, formType: 'rsvp', slots: [] })).toEqual([]);
  });

  it('carries the label and notes through for rendering', () => {
    expect(buildClaimRows(form)[0]).toMatchObject({ slotId: 'buns', label: 'Buns', notes: '8-packs', needed: 3 });
  });

  it('survives a slot the CMS over-claimed beyond what it needs', () => {
    const over: PublicSignupForm = {
      ...form,
      slots: [{ ...form.slots[0], quantityClaimed: 5, quantityRemaining: 0 }],
    };
    expect(buildClaimRows(over)[0]).toMatchObject({ max: 0, quantity: 0, summary: 'All 3 claimed' });
  });
});

describe('setClaimQuantity', () => {
  it('clamps above max and below zero', () => {
    const rows = buildClaimRows(form);
    expect(setClaimQuantity(rows, 'buns', 99)[0].quantity).toBe(2);
    expect(setClaimQuantity(rows, 'buns', -4)[0].quantity).toBe(0);
  });

  it('rejects a non-integer without throwing', () => {
    expect(setClaimQuantity(buildClaimRows(form), 'buns', Number.NaN)[0].quantity).toBe(0);
    expect(setClaimQuantity(buildClaimRows(form), 'buns', 1.5)[0].quantity).toBe(0);
  });

  it('leaves other rows untouched and does not mutate the input', () => {
    const rows = buildClaimRows(form);
    const next = setClaimQuantity(rows, 'buns', 2);
    expect(rows[0].quantity).toBe(0);
    expect(next[1]).toEqual(rows[1]);
  });

  it('ignores an unknown slot id', () => {
    const rows = buildClaimRows(form);
    expect(setClaimQuantity(rows, 'nope', 2)).toEqual(rows);
  });
});

describe('reconcileClaimRows', () => {
  it('keeps what still fits after someone else claimed the rest', () => {
    const chosen = setClaimQuantity(buildClaimRows(form), 'buns', 2);
    const refreshed: PublicSignupForm = {
      ...form,
      slots: [{ ...form.slots[0], quantityClaimed: 2, quantityRemaining: 1 }, form.slots[1]],
    };
    const rows = reconcileClaimRows(chosen, refreshed);
    expect(rows[0]).toMatchObject({ quantity: 1, max: 1, summary: '2 of 3 claimed, 1 still needed' });
  });

  it('drops a choice that is now impossible', () => {
    const chosen = setClaimQuantity(buildClaimRows(form), 'buns', 2);
    const refreshed: PublicSignupForm = {
      ...form,
      slots: [{ ...form.slots[0], quantityClaimed: 3, quantityRemaining: 0 }, form.slots[1]],
    };
    expect(reconcileClaimRows(chosen, refreshed)[0].quantity).toBe(0);
  });

  it('drops a row whose slot disappeared and adds a row that appeared', () => {
    const chosen = setClaimQuantity(buildClaimRows(form), 'buns', 2);
    const refreshed: PublicSignupForm = {
      ...form,
      slots: [{ id: 'chips', label: 'Chips', notes: null, quantityNeeded: 1, quantityClaimed: 0, quantityRemaining: 1 }],
    };
    expect(reconcileClaimRows(chosen, refreshed).map((row) => row.slotId)).toEqual(['chips']);
  });

  it('still credits the family its own server-side claim when given the existing response', () => {
    // The edit page's family already holds 1 of the 3 buns, and the CMS counts that inside
    // quantityClaimed. Reconciling without the response would treat all 3 as other families' and
    // forbid the family from keeping what it already has.
    const chosen = setClaimQuantity(buildClaimRows(form, existing), 'buns', 3);
    const refreshed: PublicSignupForm = {
      ...form,
      slots: [{ ...form.slots[0], quantityClaimed: 2, quantityRemaining: 1 }, form.slots[1]],
    };
    const rows = reconcileClaimRows(chosen, refreshed, existing);
    expect(rows[0]).toMatchObject({ claimedByOthers: 1, max: 2, quantity: 2 });
  });

  it('treats every claim as another family when no response is given', () => {
    const chosen = setClaimQuantity(buildClaimRows(form), 'buns', 2);
    const rows = reconcileClaimRows(chosen, form);
    expect(rows[0]).toMatchObject({ claimedByOthers: 1, max: 2 });
  });

  it('does not mutate the rows it was given', () => {
    const chosen = setClaimQuantity(buildClaimRows(form), 'buns', 2);
    const refreshed: PublicSignupForm = {
      ...form,
      slots: [{ ...form.slots[0], quantityClaimed: 3, quantityRemaining: 0 }, form.slots[1]],
    };
    reconcileClaimRows(chosen, refreshed);
    expect(chosen[0].quantity).toBe(2);
  });
});

describe('toClaimPayload', () => {
  it('sends only the rows a family actually chose', () => {
    const rows = setClaimQuantity(buildClaimRows(form), 'buns', 2);
    expect(toClaimPayload(rows)).toEqual([{ slotId: 'buns', quantity: 2 }]);
  });

  it('sends an empty list when nothing is chosen', () => {
    expect(toClaimPayload(buildClaimRows(form))).toEqual([]);
  });

  it('never sends a quantity the server would reject', () => {
    const rows = setClaimQuantity(buildClaimRows(form), 'drinks', 5);
    expect(toClaimPayload(rows)).toEqual([]);
  });
});
