import type { PublicSignupForm, PublicSignupSlot, SignupResponseDetail } from './signup-client';

export type ClaimRow = {
  slotId: string;
  label: string;
  notes: string | null;
  needed: number;
  /** What other families hold. The CMS reports the total claimed, so this family's own claim comes out. */
  claimedByOthers: number;
  /** The largest quantity this family may hold: everything nobody else has taken. */
  max: number;
  quantity: number;
  summary: string;
};

export function buildClaimRows(form: PublicSignupForm, existing?: SignupResponseDetail | null): ClaimRow[] {
  if (form.formType !== 'items') return [];
  const mine = new Map((existing?.claims ?? []).map((claim) => [claim.slotId, claim.quantity]));
  return form.slots.map((slot) => row(slot, mine.get(slot.id) ?? 0));
}

export function setClaimQuantity(rows: ClaimRow[], slotId: string, quantity: number): ClaimRow[] {
  return rows.map((current) => (current.slotId === slotId ? { ...current, quantity: clamp(quantity, current.max) } : current));
}

/**
 * Rebuilds the rows from a refreshed form, keeping each family choice only as far as the new
 * remaining counts allow. Used after a 409 slot_full, where the server's counts are authoritative
 * and the family's half-finished selection should survive wherever it still fits.
 *
 * Pass `existing` on the edit page. That family's claim is already counted inside the refreshed
 * form's `quantityClaimed`, so omitting it would treat the family's own quantity as another
 * family's and refuse to let them keep what they already hold.
 */
export function reconcileClaimRows(rows: ClaimRow[], form: PublicSignupForm, existing?: SignupResponseDetail | null): ClaimRow[] {
  const chosen = new Map(rows.map((current) => [current.slotId, current.quantity]));
  return buildClaimRows(form, existing).map((current) => ({
    ...current,
    quantity: clamp(chosen.get(current.slotId) ?? 0, current.max),
  }));
}

export function toClaimPayload(rows: ClaimRow[]): Array<{ slotId: string; quantity: number }> {
  return rows.filter((current) => current.quantity > 0).map((current) => ({ slotId: current.slotId, quantity: current.quantity }));
}

function row(slot: PublicSignupSlot, ownQuantity: number): ClaimRow {
  const claimedByOthers = Math.max(0, slot.quantityClaimed - ownQuantity);
  const max = Math.max(0, slot.quantityNeeded - claimedByOthers);
  const remaining = Math.max(0, slot.quantityNeeded - slot.quantityClaimed);
  return {
    slotId: slot.id,
    label: slot.label,
    notes: slot.notes,
    needed: slot.quantityNeeded,
    claimedByOthers,
    max,
    quantity: clamp(ownQuantity, max),
    summary:
      remaining === 0
        ? `All ${slot.quantityNeeded} claimed`
        : `${slot.quantityClaimed} of ${slot.quantityNeeded} claimed, ${remaining} still needed`,
  };
}

function clamp(quantity: number, max: number): number {
  if (!Number.isInteger(quantity) || quantity < 0) return 0;
  return Math.min(quantity, max);
}
