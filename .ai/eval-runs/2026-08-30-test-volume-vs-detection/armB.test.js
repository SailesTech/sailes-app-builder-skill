'use strict';

/*
 * TEST PLAN — normalizeOwner (Arm B)
 *
 * Derived from SPEC.md's six required behaviours and its named error list. The implementation
 * was read (explicitly permitted for this task), so a small "implementation-revealed edges"
 * block is marked separately at the end of each relevant section — those cases encode something
 * the spec prose does not settle, never something that overrides it.
 *
 * Risk tier: B — ordinary business logic; no money, auth, tenancy, idempotency, or outbound
 * write. Tier B asks for one case per equivalence partition (invalid partitions included) plus
 * every boundary the spec actually names, walked in full — not a cross-product, not one test per
 * example that comes to mind.
 *
 * No human was available to freeze this list (per task instructions). It is recorded here, as
 * the frozen artifact, instead of `.ai/test-plans/<spec>.md`, and the suite below is written
 * from it rather than composed after the fact.
 *
 * SKIP: the tier-B per-behaviour mutation proof (break the behaviour -> that ID's test goes red
 * -> revert -> suite green again) is not run against the repo copy of normalize.js, because the
 * task explicitly forbids modifying that file. It was instead verified by hand against a private
 * scratch copy (outside the repo) for all 8 documented single-line faults, and each is killed by
 * a specific case named next to it below. Recorded as an explicit skip, not a silent omission.
 *
 * ── Shape selection & priority (behaviours 1, 2, 5 — decision table on key presence) ───────────
 * B1  legacy owner_email present alone, valid -> ok, primary = that address, coOwnerCount 0
 * B2  owner_emails present alone, one valid element (boundary: array length 1) -> ok,
 *     primary = it, coOwnerCount 0                                    [kills M4-count-off-by-1]
 * B3  owner_emails present alone, several distinct valid elements -> primary = FIRST element,
 *     coOwnerCount = count - 1                                        [kills M3-last-not-first]
 * B4  both owner_email and owner_emails keys present, EVEN WITH otherwise-invalid values ->
 *     both_shapes_present; proves this check runs before any value validation
 *                                                                       [kills M6-allows-both]
 * B5  neither key present -> owner_missing
 * B6  owner_emails present but not an array (string value) -> owner_emails_not_array, proving
 *     the type check runs before the string is ever inspected for email shape
 * B7  owner_emails present as an empty array (boundary: array length 0) -> owner_empty
 *                                                                       [kills M8-empty-ok]
 *
 * ── Payload type validity (behaviour 5) ─────────────────────────────────────────────────────────
 * B8  payload is null -> payload_not_object
 * B9  payload is a non-object primitive (string) -> payload_not_object
 * B10 payload is an array -> implementation-revealed edge: typeof [] === 'object' so the
 *     null/typeof check does not reject it; with neither owner key present it falls through to
 *     owner_missing. Recorded because a reader of "payload is not an object" would reasonably
 *     expect an array to be rejected outright, and it is not.
 *
 * ── Candidate type/format validity (behaviour 5) ────────────────────────────────────────────────
 * B11 a candidate is not a string (number) -> owner_not_string
 * B12 a candidate string does not look like an email (no "@") -> owner_invalid_email
 * B13 implementation-revealed edge: a candidate string does not look like an email (has "@" but
 *     no "." after it) -> owner_invalid_email — same spec partition ("does not look like an
 *     email"), a second shape of it
 * B14 error short-circuits at the FIRST bad candidate: not-string before invalid-email in the
 *     array -> owner_not_string wins, proving the loop stops rather than scanning to the "worse"
 *     error
 * B15 error short-circuits the other order: invalid-email before not-string -> owner_invalid_email
 *     wins
 *
 * ── Normalisation (behaviour 3) ─────────────────────────────────────────────────────────────────
 * B16 surrounding whitespace trimmed from a legacy owner_email; normalised form is what is
 *     returned as primary                                              [kills M1-no-trim]
 * B17 uppercase address is lowercased in the output                    [kills M2-no-lowercase]
 * B18 whitespace AND case normalised together in one value (combination, not two separate rules)
 * B19 internal (non-surrounding) whitespace is NOT stripped -> the address still fails the email
 *     shape -> owner_invalid_email; pins down that "surrounding" is the boundary, not "all"
 *
 * ── Duplicate collapsing (behaviour 4) ──────────────────────────────────────────────────────────
 * B20 an exact duplicate in owner_emails collapses to one; coOwnerCount reflects the distinct
 *     count, not the raw length                                        [kills M5-no-dedup]
 * B21 a case-only duplicate (A@X.COM vs a@x.com) collapses because dedup happens AFTER
 *     normalisation
 * B22 a whitespace-only duplicate collapses after normalisation
 * B23 primary stays the FIRST-seen address even when that same address reappears later in the
 *     array (order is preserved, not just "a" match)
 * B24 non-duplicate look-alikes with a different local part are NOT collapsed
 * B25 non-duplicate look-alikes with a different domain are NOT collapsed
 *
 * ── Presence vs truthiness (behaviour 6) ────────────────────────────────────────────────────────
 * B26 owner_email: "" — key present, value falsy -> owner_invalid_email, NOT owner_missing
 *                                                                       [kills M7-truthy-presence]
 * B27 owner_email: undefined — key present via explicit assignment, value falsy ->
 *     owner_not_string, NOT owner_missing                              [kills M7-truthy-presence]
 * B28 owner_emails: undefined — key present, value falsy -> owner_emails_not_array,
 *     NOT owner_missing
 * B29 owner_emails: null — key present, value falsy, and typeof null === 'object' (the case JSON
 *     actually produces) -> owner_emails_not_array, NOT owner_missing
 *
 * Return-shape discipline: every case asserts the FULL returned object with
 * assert.deepStrictEqual (never per-field checks), so a leaked field or a wrong key name cannot
 * pass silently — {ok:true, primary, coOwnerCount} on success, {ok:false, error} on failure.
 */

const test = require('node:test');
const assert = require('node:assert');
const { normalizeOwner } = require('./normalize.js');

// ── Shape selection & priority ──────────────────────────────────────────────────────────────────

test('B1 — legacy owner_email alone yields that address as primary, coOwnerCount 0', () => {
  const result = normalizeOwner({ owner_email: 'owner@example.com' });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 0 });
});

test('B2 — owner_emails with one valid element yields it as primary, coOwnerCount 0', () => {
  const result = normalizeOwner({ owner_emails: ['owner@example.com'] });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 0 });
});

test('B3 — owner_emails with several distinct elements: primary is the FIRST, coOwnerCount = count - 1', () => {
  const result = normalizeOwner({
    owner_emails: ['first@example.com', 'second@example.com', 'third@example.com'],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'first@example.com', coOwnerCount: 2 });
});

test('B4 — both owner_email and owner_emails present -> both_shapes_present, even with invalid values', () => {
  const result = normalizeOwner({ owner_email: 123, owner_emails: 'not-an-array' });
  assert.deepStrictEqual(result, { ok: false, error: 'both_shapes_present' });
});

test('B5 — neither owner_email nor owner_emails present -> owner_missing', () => {
  const result = normalizeOwner({ some_other_field: true });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_missing' });
});

test('B6 — owner_emails present but not an array -> owner_emails_not_array', () => {
  const result = normalizeOwner({ owner_emails: 'owner@example.com' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_emails_not_array' });
});

test('B7 — owner_emails is an empty array -> owner_empty', () => {
  const result = normalizeOwner({ owner_emails: [] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_empty' });
});

// ── Payload type validity ───────────────────────────────────────────────────────────────────────

test('B8 — payload is null -> payload_not_object', () => {
  const result = normalizeOwner(null);
  assert.deepStrictEqual(result, { ok: false, error: 'payload_not_object' });
});

test('B9 — payload is a non-object primitive (string) -> payload_not_object', () => {
  const result = normalizeOwner('owner@example.com');
  assert.deepStrictEqual(result, { ok: false, error: 'payload_not_object' });
});

test('B10 — payload is an array: not caught by the object check, falls through to owner_missing', () => {
  const result = normalizeOwner([]);
  assert.deepStrictEqual(result, { ok: false, error: 'owner_missing' });
});

// ── Candidate type/format validity ──────────────────────────────────────────────────────────────

test('B11 — a candidate that is not a string -> owner_not_string', () => {
  const result = normalizeOwner({ owner_emails: [123] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_not_string' });
});

test('B12 — a candidate string with no "@" does not look like an email -> owner_invalid_email', () => {
  const result = normalizeOwner({ owner_emails: ['not-an-email'] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

test('B13 — a candidate string with "@" but no "." after it -> owner_invalid_email', () => {
  const result = normalizeOwner({ owner_emails: ['foo@bar'] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

test('B14 — short-circuits on the FIRST bad candidate: not-string before invalid-email', () => {
  const result = normalizeOwner({ owner_emails: [123, 'not-an-email'] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_not_string' });
});

test('B15 — short-circuits on the FIRST bad candidate: invalid-email before not-string', () => {
  const result = normalizeOwner({ owner_emails: ['not-an-email', 123] });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

// ── Normalisation ────────────────────────────────────────────────────────────────────────────────

test('B16 — surrounding whitespace is trimmed; normalised form is returned as primary', () => {
  const result = normalizeOwner({ owner_email: '  owner@example.com  ' });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 0 });
});

test('B17 — an uppercase address is lowercased in the output', () => {
  const result = normalizeOwner({ owner_email: 'OWNER@EXAMPLE.COM' });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 0 });
});

test('B18 — whitespace and case are normalised together on one value', () => {
  const result = normalizeOwner({ owner_email: '  OwNeR@ExAmPlE.CoM  ' });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 0 });
});

test('B19 — internal whitespace is NOT stripped and still fails the email shape', () => {
  const result = normalizeOwner({ owner_email: 'own er@example.com' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

// ── Duplicate collapsing ────────────────────────────────────────────────────────────────────────

test('B20 — an exact duplicate in owner_emails collapses to one distinct owner', () => {
  const result = normalizeOwner({
    owner_emails: ['owner@example.com', 'owner@example.com'],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 0 });
});

test('B21 — a case-only duplicate collapses because dedup runs after normalisation', () => {
  const result = normalizeOwner({
    owner_emails: ['A@X.COM', 'a@x.com'],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'a@x.com', coOwnerCount: 0 });
});

test('B22 — a whitespace-only duplicate collapses after normalisation', () => {
  const result = normalizeOwner({
    owner_emails: ['owner@example.com', '  owner@example.com  '],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 0 });
});

test('B23 — primary stays the FIRST-seen address even when it reappears later', () => {
  const result = normalizeOwner({
    owner_emails: ['first@example.com', 'second@example.com', 'first@example.com'],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'first@example.com', coOwnerCount: 1 });
});

test('B24 — look-alikes with a different local part are NOT collapsed', () => {
  const result = normalizeOwner({
    owner_emails: ['owner@example.com', 'owners@example.com'],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 1 });
});

test('B25 — look-alikes with a different domain are NOT collapsed', () => {
  const result = normalizeOwner({
    owner_emails: ['owner@example.com', 'owner@example.org'],
  });
  assert.deepStrictEqual(result, { ok: true, primary: 'owner@example.com', coOwnerCount: 1 });
});

// ── Presence vs truthiness ──────────────────────────────────────────────────────────────────────

test('B26 — owner_email: "" is a present key (falsy value) -> owner_invalid_email, not owner_missing', () => {
  const result = normalizeOwner({ owner_email: '' });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_invalid_email' });
});

test('B27 — owner_email: undefined is a present key (falsy value) -> owner_not_string, not owner_missing', () => {
  const result = normalizeOwner({ owner_email: undefined });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_not_string' });
});

test('B28 — owner_emails: undefined is a present key -> owner_emails_not_array, not owner_missing', () => {
  const result = normalizeOwner({ owner_emails: undefined });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_emails_not_array' });
});

test('B29 — owner_emails: null is a present key -> owner_emails_not_array, not owner_missing', () => {
  const result = normalizeOwner({ owner_emails: null });
  assert.deepStrictEqual(result, { ok: false, error: 'owner_emails_not_array' });
});
