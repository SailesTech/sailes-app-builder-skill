'use strict';

/**
 * Test plan — validateProfile(input)  [SPEC: partner profile form validation]
 *
 * No human was available to freeze this list (per task constraints), so it is recorded
 * here as a comment block instead of `.ai/test-plans/<spec>.md`, and the suite is written
 * straight from it. Derived from SPEC.md's rules table + Behaviour section 1-5, using
 * equivalence partitioning, boundary values (min-1/min/min+1, max-1/max/max+1), and a
 * failure path for every field. A handful of cases (marked "impl:") were added after
 * reading validate.js, per step 4 of sailes-test — additive only, nothing here weakens
 * a spec-derived case.
 *
 * Tier: B (ordinary business logic, no money/auth/tenancy/idempotency/outbound write).
 *
 * B1 — companyName (required, trim, 3-80 inclusive)
 *   B1a  missing key                         -> required
 *   B1b  empty string                        -> required (never too_short)
 *   B1c  whitespace-only string               -> required (trims to empty)
 *   B1d  length 2 (min-1)                     -> too_short
 *   B1e  length 3 (min)                       -> ok, value trimmed
 *   B1f  length 80 (max)                      -> ok
 *   B1g  length 81 (max+1)                    -> too_long
 *   B1h  surrounding whitespace, core len 3    -> ok, value is trimmed form
 *   B1i  impl: non-string type (number)        -> required
 *
 * B2 — email (required, trim+lowercase, must look like an email)
 *   B2a  missing key                          -> required
 *   B2b  empty string                         -> required (never invalid)
 *   B2c  whitespace-only string                -> required
 *   B2d  no "@"                                -> invalid
 *   B2e  no "." after "@"                      -> invalid
 *   B2f  "@" immediately followed by "@"        -> invalid
 *   B2g  valid, mixed case + surrounding space -> ok, value lowercased+trimmed
 *   B2h  impl: non-string type (number)        -> required
 *
 * B3 — nip (required, strip spaces/hyphens, exactly 10 digits)
 *   B3a  missing key                          -> required
 *   B3b  empty string                          -> required
 *   B3c  spaces/hyphens only (strips to '')     -> required (never invalid)
 *   B3d  9 digits (min-1)                       -> invalid
 *   B3e  10 digits (min=max)                    -> ok, value is the 10 digits
 *   B3f  11 digits (max+1)                      -> invalid
 *   B3g  10 digits with embedded spaces/hyphens -> ok, value has them stripped
 *   B3h  10 chars but contains a letter          -> invalid
 *   B3i  impl: contains a dot (not stripped)     -> invalid
 *   B3j  impl: non-string type (number)          -> required
 *
 * B4 — seats (required, integer 1-500 inclusive)
 *   B4a  missing key                          -> required
 *   B4b  null                                  -> required
 *   B4c  empty string                          -> required
 *   B4d  non-integer number (5.5)               -> invalid
 *   B4e  NaN                                    -> invalid
 *   B4f  string "5" (wrong type, not a number)  -> invalid
 *   B4g  boolean true (wrong type)               -> invalid
 *   B4h  0 (min-1)                              -> too_low
 *   B4i  1 (min)                                -> ok
 *   B4j  500 (max)                              -> ok
 *   B4k  501 (max+1)                            -> too_high
 *   B4l  negative number                        -> too_low
 *
 * B5 — website (optional; when present+non-empty must be an https:// URL)
 *   B5a  missing key                          -> not required, not validated, value.website = null
 *   B5b  null                                  -> same as B5a
 *   B5c  empty string                          -> same as B5a
 *   B5d  valid https URL                       -> ok, no error, value carries it
 *   B5e  http:// (wrong scheme)                -> invalid
 *   B5f  no scheme at all ("example.com")      -> invalid
 *   B5g  "https://" with nothing after it       -> invalid
 *   B5h  impl: uppercase scheme "HTTPS://..."   -> invalid (case-sensitive)
 *   B5i  impl: internal space after scheme      -> invalid
 *   B5j  impl: whitespace-only string ("   ")   -> invalid (not treated as absent)
 *   B5k  impl: non-string type (number)         -> invalid (not required)
 *
 * B6 — cross-field / structural behaviour
 *   B6a  non-object input (null)               -> every required field reports 'required',
 *                                                  website absent from errors
 *   B6b  non-object input (a bare string)      -> same as B6a
 *   B6c  undefined input (no args)              -> same as B6a
 *   B6d  multiple fields invalid at once        -> errors object carries all of them together,
 *                                                  not just the first
 *   B6e  full valid submission                  -> ok:true, value has all 5 normalised fields
 *   B6f  failure result shape                    -> {ok:false, errors} carries no `value` key
 *   B6g  success result shape                    -> {ok:true, value} carries no `errors` key
 *   B6h  valid submission without website        -> ok:true, value.website === null
 */

const test = require('node:test');
const assert = require('node:assert');
const { validateProfile } = require('./validate.js');

function validBase() {
  return {
    companyName: 'Acme Sp. z o.o.',
    email: 'contact@acme.example',
    nip: '1234567890',
    seats: 10,
  };
}

// ---- B1 companyName ----------------------------------------------------

test('B1a - companyName missing reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), companyName: undefined });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.companyName, 'required');
});

test('B1b - companyName empty string reports required, not too_short', () => {
  const { ok, errors } = validateProfile({ ...validBase(), companyName: '' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.companyName, 'required');
});

test('B1c - companyName whitespace-only reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), companyName: '   ' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.companyName, 'required');
});

test('B1d - companyName length 2 (min-1) reports too_short', () => {
  const { ok, errors } = validateProfile({ ...validBase(), companyName: 'ab' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.companyName, 'too_short');
});

test('B1e - companyName length 3 (min) is accepted and trimmed', () => {
  const { ok, value } = validateProfile({ ...validBase(), companyName: 'abc' });
  assert.strictEqual(ok, true);
  assert.strictEqual(value.companyName, 'abc');
});

test('B1f - companyName length 80 (max) is accepted', () => {
  const name = 'a'.repeat(80);
  const { ok, errors } = validateProfile({ ...validBase(), companyName: name });
  assert.strictEqual(ok, true, JSON.stringify(errors));
});

test('B1g - companyName length 81 (max+1) reports too_long', () => {
  const name = 'a'.repeat(81);
  const { ok, errors } = validateProfile({ ...validBase(), companyName: name });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.companyName, 'too_long');
});

test('B1h - companyName surrounding whitespace is trimmed in value', () => {
  const { ok, value } = validateProfile({ ...validBase(), companyName: '  abc  ' });
  assert.strictEqual(ok, true);
  assert.strictEqual(value.companyName, 'abc');
});

test('B1i (impl) - companyName non-string type reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), companyName: 12345 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.companyName, 'required');
});

// ---- B2 email ------------------------------------------------------------

test('B2a - email missing reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), email: undefined });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.email, 'required');
});

test('B2b - email empty string reports required, not invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), email: '' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.email, 'required');
});

test('B2c - email whitespace-only reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), email: '   ' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.email, 'required');
});

test('B2d - email with no @ reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), email: 'not-an-email' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.email, 'invalid');
});

test('B2e - email with no dot after @ reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), email: 'user@domain' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.email, 'invalid');
});

test('B2f - email with @@ reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), email: 'double@@at.com' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.email, 'invalid');
});

test('B2g - email is trimmed and lowercased in value', () => {
  const { ok, value } = validateProfile({ ...validBase(), email: '  USER@Example.COM  ' });
  assert.strictEqual(ok, true);
  assert.strictEqual(value.email, 'user@example.com');
});

test('B2h (impl) - email non-string type reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), email: 42 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.email, 'required');
});

// ---- B3 nip ----------------------------------------------------------------

test('B3a - nip missing reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: undefined });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'required');
});

test('B3b - nip empty string reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: '' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'required');
});

test('B3c - nip of only spaces/hyphens strips to empty and reports required, not invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: ' - - ' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'required');
});

test('B3d - nip with 9 digits (min-1) reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: '123456789' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'invalid');
});

test('B3e - nip with exactly 10 digits is accepted', () => {
  const { ok, value } = validateProfile({ ...validBase(), nip: '1234567890' });
  assert.strictEqual(ok, true);
  assert.strictEqual(value.nip, '1234567890');
});

test('B3f - nip with 11 digits (max+1) reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: '12345678901' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'invalid');
});

test('B3g - nip with embedded spaces/hyphens is stripped and accepted', () => {
  const { ok, value } = validateProfile({ ...validBase(), nip: '123-456 78-90' });
  assert.strictEqual(ok, true);
  assert.strictEqual(value.nip, '1234567890');
});

test('B3h - nip with a letter among 10 chars reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: '12345a7890' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'invalid');
});

test('B3i (impl) - nip containing a dot (not stripped) reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: '123.456.789' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'invalid');
});

test('B3j (impl) - nip non-string type reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), nip: 1234567890 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.nip, 'required');
});

// ---- B4 seats ----------------------------------------------------------------

test('B4a - seats missing reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: undefined });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'required');
});

test('B4b - seats null reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: null });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'required');
});

test('B4c - seats empty string reports required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: '' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'required');
});

test('B4d - seats non-integer number reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: 5.5 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'invalid');
});

test('B4e - seats NaN reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: NaN });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'invalid');
});

test('B4f - seats as a numeric string reports invalid (wrong type)', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: '5' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'invalid');
});

test('B4g - seats as boolean reports invalid (wrong type)', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: true });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'invalid');
});

test('B4h - seats 0 (min-1) reports too_low', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: 0 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'too_low');
});

test('B4i - seats 1 (min) is accepted', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: 1 });
  assert.strictEqual(ok, true, JSON.stringify(errors));
});

test('B4j - seats 500 (max) is accepted', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: 500 });
  assert.strictEqual(ok, true, JSON.stringify(errors));
});

test('B4k - seats 501 (max+1) reports too_high', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: 501 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'too_high');
});

test('B4l - seats negative reports too_low', () => {
  const { ok, errors } = validateProfile({ ...validBase(), seats: -3 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.seats, 'too_low');
});

// ---- B5 website (optional) ----------------------------------------------------

test('B5a - website missing is not required and normalises to null', () => {
  const { ok, value, errors } = validateProfile({ ...validBase(), website: undefined });
  assert.strictEqual(ok, true, JSON.stringify(errors));
  assert.strictEqual(value.website, null);
});

test('B5b - website null is not required and normalises to null', () => {
  const { ok, value, errors } = validateProfile({ ...validBase(), website: null });
  assert.strictEqual(ok, true, JSON.stringify(errors));
  assert.strictEqual(value.website, null);
});

test('B5c - website empty string is not required and normalises to null', () => {
  const { ok, value, errors } = validateProfile({ ...validBase(), website: '' });
  assert.strictEqual(ok, true, JSON.stringify(errors));
  assert.strictEqual(value.website, null);
});

test('B5d - website valid https URL is accepted', () => {
  const { ok, value, errors } = validateProfile({ ...validBase(), website: 'https://acme.example' });
  assert.strictEqual(ok, true, JSON.stringify(errors));
  assert.strictEqual(value.website, 'https://acme.example');
});

test('B5e - website with http:// scheme reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), website: 'http://acme.example' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.website, 'invalid');
});

test('B5f - website with no scheme reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), website: 'acme.example' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.website, 'invalid');
});

test('B5g - website "https://" with nothing after it reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), website: 'https://' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.website, 'invalid');
});

test('B5h (impl) - website with uppercase scheme reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), website: 'HTTPS://acme.example' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.website, 'invalid');
});

test('B5i (impl) - website with an internal space reports invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), website: 'https://acme example.com' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.website, 'invalid');
});

test('B5j (impl) - website whitespace-only string is treated as present and invalid', () => {
  const { ok, errors } = validateProfile({ ...validBase(), website: '   ' });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.website, 'invalid');
});

test('B5k (impl) - website non-string type reports invalid, not required', () => {
  const { ok, errors } = validateProfile({ ...validBase(), website: 12345 });
  assert.strictEqual(ok, false);
  assert.strictEqual(errors.website, 'invalid');
});

// ---- B6 cross-field / structural behaviour -------------------------------------

test('B6a - null input reports required for every required field, none for website', () => {
  const { ok, errors } = validateProfile(null);
  assert.strictEqual(ok, false);
  assert.deepStrictEqual(errors, {
    companyName: 'required',
    email: 'required',
    nip: 'required',
    seats: 'required',
  });
});

test('B6b - a bare string input reports required for every required field', () => {
  const { ok, errors } = validateProfile('not a form');
  assert.strictEqual(ok, false);
  assert.deepStrictEqual(errors, {
    companyName: 'required',
    email: 'required',
    nip: 'required',
    seats: 'required',
  });
});

test('B6c - undefined input (no args) reports required for every required field', () => {
  const { ok, errors } = validateProfile(undefined);
  assert.strictEqual(ok, false);
  assert.deepStrictEqual(errors, {
    companyName: 'required',
    email: 'required',
    nip: 'required',
    seats: 'required',
  });
});

test('B6d - multiple invalid fields are all reported together, not just the first', () => {
  const { ok, errors } = validateProfile({
    companyName: 'ab',
    email: 'bad',
    nip: '123',
    seats: -1,
  });
  assert.strictEqual(ok, false);
  assert.deepStrictEqual(errors, {
    companyName: 'too_short',
    email: 'invalid',
    nip: 'invalid',
    seats: 'too_low',
  });
});

test('B6e - a fully valid submission normalises every field in value', () => {
  const { ok, value } = validateProfile({
    companyName: '  Acme Sp. z o.o.  ',
    email: '  Contact@ACME.example  ',
    nip: '123-456-7890',
    seats: 42,
    website: 'https://acme.example',
  });
  assert.strictEqual(ok, true);
  assert.deepStrictEqual(value, {
    companyName: 'Acme Sp. z o.o.',
    email: 'contact@acme.example',
    nip: '1234567890',
    seats: 42,
    website: 'https://acme.example',
  });
});

test('B6f - a failure result carries no `value` key', () => {
  const result = validateProfile({});
  assert.strictEqual(result.ok, false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'value'), false);
});

test('B6g - a success result carries no `errors` key', () => {
  const result = validateProfile(validBase());
  assert.strictEqual(result.ok, true);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'errors'), false);
});

test('B6h - a valid submission without website normalises value.website to null', () => {
  const { ok, value } = validateProfile(validBase());
  assert.strictEqual(ok, true);
  assert.strictEqual(value.website, null);
});
