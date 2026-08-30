'use strict';

/*
 * Test plan — validateProfile (partner profile form validation)
 * Tier: B — standard (ordinary business logic, no money/auth/tenancy/idempotency/
 * irreversible outbound write). No human is available to freeze this list; it is
 * recorded here as the frozen-in-lieu-of-human case list, derived from SPEC.md,
 * and the suite below is written from it.
 *
 * Per tier B: one case per equivalence partition (invalid partitions included),
 * plus the straddle pair (last accepted / first rejected) at every edge the spec
 * names. Boundaries are named only for companyName (3-80) and seats (1-500); nip
 * is an exact-length match ("exactly 10 digits"), not a range, so its invalid
 * length variants are ordinary invalid-partition cases, not a straddle pair.
 *
 * companyName (required, trimmed, 3-80 chars inclusive)
 *   B1  missing                              -> required
 *   B2  empty string                         -> required
 *   B3  whitespace-only (trims to empty)     -> required
 *   B4  length 2 (too short)                 -> too_short          } straddle @ min=3
 *   B5  length 3 (min boundary, valid)       -> ok                 }
 *   B6  length 80 (max boundary, valid)      -> ok                 } straddle @ max=80
 *   B7  length 81 (too long)                 -> too_long           }
 *   B8  non-string (number)                  -> required (coerced to '')
 *   B9  value normalization (leading/trailing spaces trimmed in output)
 *
 * email (required, trimmed+lowercased, must look like an email)
 *   B10 missing                              -> required
 *   B11 empty string                         -> required
 *   B12 whitespace-only                      -> required
 *   B13 invalid: no "@"                      -> invalid
 *   B14 invalid: no dot after "@"             -> invalid
 *   B15 valid email                          -> ok
 *   B16 value normalization (mixed case + surrounding whitespace -> trimmed+lowercased)
 *
 * nip (required; strip spaces/hyphens; then exactly 10 digits)
 *   B17 missing                              -> required
 *   B18 empty string                         -> required
 *   B19 invalid: non-digit characters        -> invalid
 *   B20 invalid: 9 digits (too few)          -> invalid
 *   B21 invalid: 11 digits (too many)        -> invalid
 *   B22 valid: 10 digits with spaces/hyphens -> ok, value stripped to digits only
 *   B23 valid: 10 plain digits               -> ok
 *
 * seats (required; integer, 1-500 inclusive)
 *   B24 missing (undefined)                  -> required
 *   B25 null                                 -> required
 *   B26 empty string                         -> required
 *   B27 invalid: non-integer number (3.5)    -> invalid
 *   B28 invalid: wrong type (string "5")     -> invalid
 *   B29 too_low: 0                           -> too_low            } straddle @ min=1
 *   B30 valid: 1 (min boundary)              -> ok                 }
 *   B31 valid: 500 (max boundary)            -> ok                 } straddle @ max=500
 *   B32 too_high: 501                        -> too_high           }
 *
 * website (optional; when present and non-empty: https:// URL)
 *   B33 absent (undefined)                   -> skipped, no error, value.website = null
 *   B34 null                                 -> skipped, value.website = null
 *   B35 empty string                         -> skipped, value.website = null
 *   B36 valid https URL                      -> ok
 *   B37 invalid: not https (http://)         -> invalid
 *   B38 invalid: non-string (number)         -> invalid
 *
 * Cross-field / structural behaviour
 *   B39 non-object input (null, number, string, array) treated as empty submission:
 *       every required field reports "required"
 *   B40 multiple invalid fields are ALL reported together, not just the first
 *   B41 fully valid submission -> ok:true, value carries every normalised field
 *   B42 a field reports exactly one error code (required does not co-occur with
 *       too_short/invalid on the same field)
 */

const test = require('node:test');
const assert = require('node:assert');
const { validateProfile } = require('./validate.js');

function validPayload(overrides = {}) {
  return Object.assign(
    {
      companyName: 'Acme Sp. z o.o.',
      email: 'contact@acme.example',
      nip: '1234567890',
      seats: 10,
      website: 'https://acme.example',
    },
    overrides
  );
}

// --- companyName ---------------------------------------------------------

test('B1 — companyName missing reports required', () => {
  const r = validateProfile(validPayload({ companyName: undefined }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.companyName, 'required');
});

test('B2 — companyName empty string reports required', () => {
  const r = validateProfile(validPayload({ companyName: '' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.companyName, 'required');
});

test('B3 — companyName whitespace-only reports required', () => {
  const r = validateProfile(validPayload({ companyName: '   ' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.companyName, 'required');
});

test('B4 — companyName length 2 (first rejected below min) reports too_short', () => {
  const r = validateProfile(validPayload({ companyName: 'ab' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.companyName, 'too_short');
});

test('B5 — companyName length 3 (last accepted at min) is valid', () => {
  const r = validateProfile(validPayload({ companyName: 'abc' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.companyName, 'abc');
});

test('B6 — companyName length 80 (last accepted at max) is valid', () => {
  const name = 'a'.repeat(80);
  const r = validateProfile(validPayload({ companyName: name }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.companyName, name);
});

test('B7 — companyName length 81 (first rejected above max) reports too_long', () => {
  const name = 'a'.repeat(81);
  const r = validateProfile(validPayload({ companyName: name }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.companyName, 'too_long');
});

test('B8 — companyName non-string (number) reports required', () => {
  const r = validateProfile(validPayload({ companyName: 12345 }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.companyName, 'required');
});

test('B9 — companyName value is trimmed in the normalised output', () => {
  const r = validateProfile(validPayload({ companyName: '  Acme Sp.  ' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.companyName, 'Acme Sp.');
});

// --- email -----------------------------------------------------------------

test('B10 — email missing reports required', () => {
  const r = validateProfile(validPayload({ email: undefined }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.email, 'required');
});

test('B11 — email empty string reports required', () => {
  const r = validateProfile(validPayload({ email: '' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.email, 'required');
});

test('B12 — email whitespace-only reports required', () => {
  const r = validateProfile(validPayload({ email: '   ' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.email, 'required');
});

test('B13 — email without "@" reports invalid', () => {
  const r = validateProfile(validPayload({ email: 'not-an-email' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.email, 'invalid');
});

test('B14 — email without a dot after "@" reports invalid', () => {
  const r = validateProfile(validPayload({ email: 'user@localhost' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.email, 'invalid');
});

test('B15 — a well-formed email is valid', () => {
  const r = validateProfile(validPayload({ email: 'jane.doe@example.com' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.email, 'jane.doe@example.com');
});

test('B16 — email value is trimmed and lowercased in the normalised output', () => {
  const r = validateProfile(validPayload({ email: '  Jane.Doe@EXAMPLE.com  ' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.email, 'jane.doe@example.com');
});

// --- nip ---------------------------------------------------------------

test('B17 — nip missing reports required', () => {
  const r = validateProfile(validPayload({ nip: undefined }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.nip, 'required');
});

test('B18 — nip empty string reports required', () => {
  const r = validateProfile(validPayload({ nip: '' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.nip, 'required');
});

test('B19 — nip with non-digit characters reports invalid', () => {
  const r = validateProfile(validPayload({ nip: '12345abcde' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.nip, 'invalid');
});

test('B20 — nip with 9 digits reports invalid', () => {
  const r = validateProfile(validPayload({ nip: '123456789' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.nip, 'invalid');
});

test('B21 — nip with 11 digits reports invalid', () => {
  const r = validateProfile(validPayload({ nip: '12345678901' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.nip, 'invalid');
});

test('B22 — nip with spaces and hyphens is stripped and accepted', () => {
  const r = validateProfile(validPayload({ nip: '123-456-78 90' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.nip, '1234567890');
});

test('B23 — nip with 10 plain digits is valid', () => {
  const r = validateProfile(validPayload({ nip: '1234567890' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.nip, '1234567890');
});

// --- seats ---------------------------------------------------------------

test('B24 — seats missing (undefined) reports required', () => {
  const r = validateProfile(validPayload({ seats: undefined }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.seats, 'required');
});

test('B25 — seats null reports required', () => {
  const r = validateProfile(validPayload({ seats: null }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.seats, 'required');
});

test('B26 — seats empty string reports required', () => {
  const r = validateProfile(validPayload({ seats: '' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.seats, 'required');
});

test('B27 — seats non-integer number (3.5) reports invalid', () => {
  const r = validateProfile(validPayload({ seats: 3.5 }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.seats, 'invalid');
});

test('B28 — seats wrong type (string "5") reports invalid', () => {
  const r = validateProfile(validPayload({ seats: '5' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.seats, 'invalid');
});

test('B29 — seats 0 (first rejected below min) reports too_low', () => {
  const r = validateProfile(validPayload({ seats: 0 }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.seats, 'too_low');
});

test('B30 — seats 1 (last accepted at min) is valid', () => {
  const r = validateProfile(validPayload({ seats: 1 }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.seats, 1);
});

test('B31 — seats 500 (last accepted at max) is valid', () => {
  const r = validateProfile(validPayload({ seats: 500 }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.seats, 500);
});

test('B32 — seats 501 (first rejected above max) reports too_high', () => {
  const r = validateProfile(validPayload({ seats: 501 }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.seats, 'too_high');
});

// --- website (optional) ---------------------------------------------------

test('B33 — website absent is skipped and normalises to null', () => {
  const r = validateProfile(validPayload({ website: undefined }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.errors, undefined);
  assert.strictEqual(r.value.website, null);
});

test('B34 — website null is skipped and normalises to null', () => {
  const r = validateProfile(validPayload({ website: null }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.website, null);
});

test('B35 — website empty string is skipped and normalises to null', () => {
  const r = validateProfile(validPayload({ website: '' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.website, null);
});

test('B36 — a valid https website is accepted', () => {
  const r = validateProfile(validPayload({ website: 'https://acme.example/about' }));
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.value.website, 'https://acme.example/about');
});

test('B37 — a non-https website (http://) reports invalid', () => {
  const r = validateProfile(validPayload({ website: 'http://acme.example' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.website, 'invalid');
});

test('B38 — a non-string website (number) reports invalid', () => {
  const r = validateProfile(validPayload({ website: 12345 }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.errors.website, 'invalid');
});

// --- cross-field / structural behaviour ------------------------------------

test('B39 — a non-object input is treated as an empty submission (all required fields fire)', () => {
  for (const input of [null, undefined, 42, 'a string', ['array']]) {
    const r = validateProfile(input);
    assert.strictEqual(r.ok, false, `expected ok:false for input ${JSON.stringify(input)}`);
    assert.strictEqual(r.errors.companyName, 'required');
    assert.strictEqual(r.errors.email, 'required');
    assert.strictEqual(r.errors.nip, 'required');
    assert.strictEqual(r.errors.seats, 'required');
    assert.strictEqual(r.errors.website, undefined, 'website is optional and never required');
  }
});

test('B40 — multiple invalid fields are all reported together, not just the first', () => {
  const r = validateProfile({
    companyName: 'ab', // too_short
    email: 'not-an-email', // invalid
    nip: '123', // invalid
    seats: 0, // too_low
    website: 'ftp://acme.example', // invalid
  });
  assert.strictEqual(r.ok, false);
  assert.deepStrictEqual(r.errors, {
    companyName: 'too_short',
    email: 'invalid',
    nip: 'invalid',
    seats: 'too_low',
    website: 'invalid',
  });
});

test('B41 — a fully valid submission returns ok:true with every field normalised', () => {
  const r = validateProfile({
    companyName: '  Acme Sp. z o.o.  ',
    email: '  Contact@ACME.example  ',
    nip: '123-456-78 90',
    seats: 25,
    website: 'https://acme.example',
  });
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.value, {
    companyName: 'Acme Sp. z o.o.',
    email: 'contact@acme.example',
    nip: '1234567890',
    seats: 25,
    website: 'https://acme.example',
  });
});

test('B42 — a field reports exactly one error code (required never co-occurs with another code)', () => {
  const r = validateProfile(validPayload({ companyName: '', seats: '' }));
  assert.strictEqual(r.ok, false);
  assert.strictEqual(Object.keys(r.errors).length, 2);
  assert.strictEqual(r.errors.companyName, 'required');
  assert.strictEqual(r.errors.seats, 'required');
});
