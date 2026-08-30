'use strict';

/*
 * TEST PLAN — normalizeOwner (derived from SPEC.md's six required behaviours only; the
 * implementation was read per task instructions, but no case below encodes an assumption that
 * the spec text did not already state, except the block marked "implementation-revealed edges").
 *
 * Risk tier: B — ordinary business logic; no money, auth, tenancy, idempotency, or outbound write.
 * No human was available to freeze this list (per task instructions); it is recorded here as the
 * frozen artifact instead of `.ai/test-plans/<spec>.md`.
 *
 * SKIP: the tier-B per-ID mutation proof (break the behavior -> test goes red -> revert -> green)
 * is NOT performed here. It requires editing normalize.js, which this task explicitly forbids.
 * Recorded as an explicit skip rather than a silent omission.
 *
 * ── Required behaviour 1-2 (shape collapse) ────────────────────────────────────────────────────
 * B1  legacy owner_email string -> primary = that address, coOwnerCount 0
 * B2  owner_emails array, one element -> primary = it, coOwnerCount 0
 * B3  owner_emails array, first element is primary regardless of the other elements
 * B4  owner_emails array, 2 distinct addresses -> coOwnerCount 1
 * B5  owner_emails array, several distinct addresses -> coOwnerCount = count - 1
 *
 * ── Required behaviour 3 (normalisation) ───────────────────────────────────────────────────────
 * B6  leading/trailing whitespace trimmed from legacy owner_email; normalised form returned
 * B7  legacy owner_email uppercase -> lowercased in output
 * B8  owner_emails candidate with both whitespace and mixed case normalised together
 * B9  internal whitespace (not surrounding) is NOT stripped and still fails the email shape
 *
 * ── Required behaviour 4 (dedup, first-seen order, case/whitespace-insensitive) ────────────────
 * B10 owner_emails with an exact duplicate collapses to one, coOwnerCount reflects distinct count
 * B11 owner_emails with a case-only duplicate (A@X.COM vs a@x.com) collapses after normalisation
 * B12 owner_emails with a whitespace-only duplicate collapses after normalisation
 * B13 primary stays the FIRST-seen address even when it reappears later in the array
 * B14 non-duplicate look-alikes (different local part / different domain) are NOT collapsed
 *
 * ── Required behaviour 5 (error codes) — one behaviour, one failure path each ──────────────────
 * B15 payload === null -> payload_not_object
 * B16 payload is a primitive (string/number/boolean) -> payload_not_object
 * B17 both owner_email and owner_emails keys present -> both_shapes_present (short-circuits
 *     before either value is otherwise validated)
 * B18 owner_emails present but not an array (string) -> owner_emails_not_array
 * B19 owner_emails present but not an array (plain object) -> owner_emails_not_array
 * B20 neither owner_email nor owner_emails present -> owner_missing
 * B21 owner_emails candidate is not a string (number) -> owner_not_string
 * B22 legacy owner_email is not a string (number) -> owner_not_string
 * B23 owner_emails candidate does not look like an email after normalisation -> owner_invalid_email
 * B24 owner_emails is an empty array -> owner_empty
 * B25 error short-circuits on the FIRST bad candidate: an earlier owner_not_string wins over a
 *     later owner_invalid_email in the same array (proves the loop stops, not just "detects")
 * B26 error short-circuits the other order too: an earlier owner_invalid_email wins over a later
 *     owner_not_string
 *
 * ── Required behaviour 6 (presence vs truthiness) ──────────────────────────────────────────────
 * B27 owner_email: "" (present, falsy) -> owner_invalid_email, NOT owner_missing
 * B28 owner_email: undefined (key present via explicit assignment, value falsy) -> treated as
 *     present -> owner_not_string, NOT owner_missing
 * B29 owner_emails: undefined (key present, value falsy) -> treated as present ->
 *     owner_emails_not_array, NOT owner_missing
 *
 * ── Implementation-revealed edges added at step 4 (spec prose did not settle these) ────────────
 * B30 payload is an array ([]) -> typeof [] === 'object' in JS, so it is NOT rejected by
 *     payload_not_object; with no owner_email/owner_emails property it falls through to
 *     owner_missing. Recorded because a reader of "payload is not an object" would reasonably
 *     expect an array to be rejected outright.
 * B31 a multi-@ string ("a@b@c.com") fails the email shape -> owner_invalid_email
 * B32 a string with no "@" fails the email shape -> owner_invalid_email
 * B33 a string with no "." after the "@" fails the email shape -> owner_invalid_email
 *
 * Return-shape discipline: every success case asserts the FULL object
 * {ok:true, primary, coOwnerCount} (no extra/missing keys); every error case asserts the FULL
 * object {ok:false, error} (no leaked primary/coOwnerCount). Done via assert.deepStrictEqual
 * throughout rather than per-field checks, so a structural bug (leaked field, wrong key name)
 * cannot pass silently.
 */

const test = require('node:test');
const assert = require('node:assert');
const { normalizeOwner } = require('./normalize.js');

// ── Required behaviour 1-2 (shape collapse) ─────────────────────────────────────────────────

test('B1 — legacy owner_email string yields that address as primary, coOwnerCount 0', () => {
  const result = normalizeOwner({ owner_email: 'a@x.com' });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B2 — owner_emails array with one element yields it as primary, coOwnerCount 0', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com'] });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B3 — owner_emails first element is primary regardless of the other elements', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', 'z@x.com', 'm@x.com'] });
  assert.strictEqual(result.primary, 'a@x.com');
});

test('B4 — owner_emails with 2 distinct addresses yields coOwnerCount 1', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', 'b@x.com'] });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 1 });
});

test('B5 — owner_emails with several distinct addresses yields coOwnerCount = count - 1', () => {
  const result = normalizeOwner({
    owner_emails: ['a@x.com', 'b@x.com', 'c@x.com', 'd@x.com'],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 3 });
});

// ── Required behaviour 3 (normalisation) ────────────────────────────────────────────────────

test('B6 — leading/trailing whitespace trimmed from legacy owner_email', () => {
  const result = normalizeOwner({ owner_email: '  a@x.com  ' });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B7 — legacy owner_email uppercase is lowercased in output', () => {
  const result = normalizeOwner({ owner_email: 'A@X.COM' });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B8 — owner_emails candidate with whitespace AND mixed case normalised together', () => {
  const result = normalizeOwner({ owner_emails: ['  A@X.COM  '] });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B9 — internal whitespace is not stripped and still fails the email shape', () => {
  const result = normalizeOwner({ owner_email: 'a @x.com' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

// ── Required behaviour 4 (dedup, first-seen order, normalisation-sensitive) ─────────────────

test('B10 — exact duplicate in owner_emails collapses to one distinct owner', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', 'a@x.com'] });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B11 — case-only duplicate (A@X.COM vs a@x.com) collapses after normalisation', () => {
  const result = normalizeOwner({ owner_emails: ['A@X.COM', 'a@x.com'] });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B12 — whitespace-only duplicate collapses after normalisation', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', '  a@x.com  '] });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B13 — primary stays the first-seen address even when it reappears later', () => {
  const result = normalizeOwner({ owner_emails: ['b@x.com', 'a@x.com', 'b@x.com'] });
  assert.deepStrictEqual(result, { ok: true, primary: 'b@x.com', coOwnerCount: 1 });
});

test('B14 — non-duplicate look-alikes (different local part / domain) are not collapsed', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', 'a@x.co', 'b@x.com'] });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 2 });
});

// ── Required behaviour 5 (error codes) ──────────────────────────────────────────────────────

test('B15 — payload === null yields payload_not_object', () => {
  const result = normalizeOwner(null);
  assert.deepStrictEqual(result, { ok: false, error: 'payload_not_object' });
});

test('B16 — payload is a primitive (string/number/boolean) yields payload_not_object', () => {
  assert.deepStrictEqual(normalizeOwner('not-a-payload'), {
    ok: false,
    error: 'payload_not_object',
  });
  assert.deepStrictEqual(normalizeOwner(42), { ok: false, error: 'payload_not_object' });
  assert.deepStrictEqual(normalizeOwner(true), { ok: false, error: 'payload_not_object' });
});

test('B17 — both owner_email and owner_emails present yields both_shapes_present, short-circuiting further validation', () => {
  const result = normalizeOwner({
    owner_email: 'not-even-an-email',
    owner_emails: 'not-even-an-array',
  });
  assert.deepStrictEqual(result, { ok: false, error: 'both_shapes_present' });
});

test('B18 — owner_emails present but a string (not an array) yields owner_emails_not_array', () => {
  const result = normalizeOwner({ owner_emails: 'a@x.com' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_emails_not_array' });
});

test('B19 — owner_emails present but a plain object (not an array) yields owner_emails_not_array', () => {
  const result = normalizeOwner({ owner_emails: { 0: 'a@x.com' } });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_emails_not_array' });
});

test('B20 — neither owner_email nor owner_emails present yields owner_missing', () => {
  const result = normalizeOwner({ some_other_field: 1 });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_missing' });
});

test('B21 — owner_emails candidate that is not a string yields owner_not_string', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', 42] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_not_string' });
});

test('B22 — legacy owner_email that is not a string yields owner_not_string', () => {
  const result = normalizeOwner({ owner_email: 42 });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_not_string' });
});

test('B23 — owner_emails candidate that does not look like an email yields owner_invalid_email', () => {
  const result = normalizeOwner({ owner_emails: ['not-an-email'] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

test('B24 — owner_emails as an empty array yields owner_empty', () => {
  const result = normalizeOwner({ owner_emails: [] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_empty' });
});

test('B25 — first-bad-candidate short-circuit: owner_not_string wins over a later owner_invalid_email', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', 42, 'not-an-email'] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_not_string' });
});

test('B26 — first-bad-candidate short-circuit: owner_invalid_email wins over a later owner_not_string', () => {
  const result = normalizeOwner({ owner_emails: ['a@x.com', 'not-an-email', 42] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

// ── Required behaviour 6 (presence vs truthiness) ───────────────────────────────────────────

test('B27 — owner_email: "" is a present (falsy) key and fails validation, not owner_missing', () => {
  const result = normalizeOwner({ owner_email: '' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

test('B28 — owner_email: undefined is a present (falsy) key and fails validation, not owner_missing', () => {
  const result = normalizeOwner({ owner_email: undefined });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_not_string' });
});

test('B29 — owner_emails: undefined is a present (falsy) key and fails validation, not owner_missing', () => {
  const result = normalizeOwner({ owner_emails: undefined });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_emails_not_array' });
});

// ── Implementation-revealed edges (step 4: added after reading the diff, spec prose silent) ──

test('B30 — an array payload is not rejected by payload_not_object; it falls through to owner_missing', () => {
  const result = normalizeOwner([]);
  assert.deepStrictEqual(result, { ok: false, error: 'owner_missing' });
});

test('B31 — a multi-@ string fails the email shape', () => {
  const result = normalizeOwner({ owner_email: 'a@b@c.com' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

test('B32 — a string with no "@" fails the email shape', () => {
  const result = normalizeOwner({ owner_email: 'a-x-com' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

test('B33 — a string with no "." after the "@" fails the email shape', () => {
  const result = normalizeOwner({ owner_email: 'a@xcom' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});
