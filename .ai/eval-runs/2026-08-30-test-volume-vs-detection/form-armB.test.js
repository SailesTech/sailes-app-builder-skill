'use strict';

/**
 * Case list — derived from SPEC.md only, frozen here as a comment block in place of a human
 * sign-off (none available for this run). Tier: B — standard (ordinary business logic; no money,
 * auth, tenancy, idempotency, or outbound write). Per SKILL.md's tier table, tier B calls for one
 * case per equivalence partition (invalid partitions included) plus every boundary the spec names,
 * walked in full; a cross-product collapses to one case per distinct outcome.
 *
 * Equivalence partitions per field (spec table + Behaviour section):
 *
 *   companyName (required, trimmed, 3-80 inclusive):
 *     B1  non-object input as a whole -> every required field reports `required`
 *     B2  absent / empty / whitespace-only -> required
 *     B3  boundary walk of trimmed length: 2(too_short) 3(ok) 4(ok) 79(ok) 80(ok) 81(too_long)
 *     B4  raw value has surrounding whitespace -> trimmed before length check AND before storing
 *     B5  non-string type (e.g. a number) -> spec is silent; SPEC Behaviour #1 treats a non-object
 *         *submission* as producing `required` for every required field, so a non-string *field*
 *         is treated the same way here (ASSUMPTION, matches the shipped implementation) -> required
 *
 *   email (required, trimmed+lowercased, must look like an email):
 *     B6  absent / empty / whitespace-only -> required
 *     B7  malformed strings (no @, no dot, empty local/domain part) -> invalid
 *     B8  valid email, mixed case and surrounding whitespace -> ok, value trimmed+lowercased
 *
 *   nip (required, spaces/hyphens stripped, then exactly 10 digits):
 *     B9  absent / empty -> required
 *     B10 boundary walk of stripped digit count: 9(invalid) 10(ok) 11(invalid)
 *     B11 formatted with spaces and/or hyphens that strip to exactly 10 digits -> ok, normalized
 *     B12 stripped value contains a non-digit character -> invalid
 *     B13 input is non-empty but strips entirely to "" (only spaces/hyphens) -> spec's "empty
 *         string counts as absent" (Behaviour #3) is stated for the raw field, not post-strip;
 *         this is a genuine spec ambiguity (ASSUMPTION, matches the shipped implementation) ->
 *         required, not invalid
 *
 *   seats (required, integer, 1-500 inclusive):
 *     B14 absent / empty string -> required; null -> spec doesn't name null explicitly
 *         (ASSUMPTION, matches the shipped implementation) -> required
 *     B15 wrong type / non-integer (string "5", boolean, float, NaN, Infinity) -> invalid
 *     B16 boundary walk: 0(too_low) 1(ok) 2(ok) 499(ok) 500(ok) 501(too_high)
 *     B17 decision case: a non-integer value that is ALSO outside 1-500 (e.g. 0.5, 600.5) reports
 *         `invalid`, not `too_low`/`too_high` — SPEC Behaviour #5 ("codes checked in the table's
 *         order") makes `invalid` win over the range checks
 *
 *   website (optional, https:// URL when present):
 *     B18 absent / null / empty string -> skipped entirely (never required), value becomes null
 *     B19 whitespace-only string -> NOT literally empty, so it is NOT skipped (Behaviour #4 says
 *         "absent, empty or null" only) -> invalid
 *     B20 non-https scheme, missing scheme, or non-string value -> invalid
 *     B21 "https://" followed by an internal space (e.g. "https://a b") -> invalid, single-token
 *         URL required
 *     B22 valid https URL -> ok; spec only promises normalization ("null when omitted") for this
 *         field, so a valid value with surrounding whitespace is asserted to round-trip verbatim
 *         in `value.website` (documents current behavior; flagged, not a spec mandate)
 *
 *   Cross-field / aggregate behaviour:
 *     B23 every field fails at once -> `errors` carries all of them together, not just the first
 *         (Behaviour: "all failing fields are reported together")
 *     B24 a mix of valid and invalid fields -> `errors` contains ONLY the failing keys
 *     B25 fully valid submission including website -> ok:true, `value` carries every field in its
 *         normalized form
 *     B26 fully valid submission with website omitted -> ok:true, `value.website === null`
 *
 * Failure paths are the majority of the list by design (required/invalid/too_short/too_long/
 * too_low/too_high all through required-field misses and malformed input) rather than only the
 * two ok:true cases (B25, B26).
 *
 * Detection proxy (tier B, no Stryker in scope for this run): each B-ID above maps to assertions
 * that fail if that specific rule is broken — e.g. flipping a comparison operator, swapping an
 * error code, or reordering a check changes exactly the relevant test's outcome. Spot-checked by
 * hand against a scratch copy of validate.js during authoring (mutating the >= to >, swapping
 * 'too_low'/'too_high', and removing the trim() call each turned exactly the case(s) that own that
 * rule red without affecting the others); the shipped validate.js is untouched.
 */

const test = require('node:test');
const assert = require('node:assert');
const { validateProfile } = require('./validate.js');

const VALID = {
  companyName: 'Acme Sp. z o.o.',
  email: 'test@example.com',
  nip: '1234567890',
  seats: 50,
  website: 'https://example.com',
};

function withField(overrides) {
  return { ...VALID, ...overrides };
}

// ---- B1: non-object input as a whole -----------------------------------------------------

const nonObjectInputs = [
  ['null', null],
  ['undefined', undefined],
  ['a string', 'not a form'],
  ['a number', 42],
  ['a boolean', true],
  ['an empty array', []],
];

for (const [label, input] of nonObjectInputs) {
  test(`B1 — non-object input (${label}) reports required for every required field`, () => {
    const result = validateProfile(input);
    assert.strictEqual(result.ok, false);
    assert.deepStrictEqual(result.errors, {
      companyName: 'required',
      email: 'required',
      nip: 'required',
      seats: 'required',
    });
    assert.ok(!('website' in result.errors));
  });
}

// ---- B2: companyName required partition ---------------------------------------------------

const companyNameRequiredCases = [
  ['absent', withField({ companyName: undefined })],
  ['empty string', withField({ companyName: '' })],
  ['whitespace only', withField({ companyName: '   ' })],
];

for (const [label, input] of companyNameRequiredCases) {
  test(`B2 — companyName (${label}) is treated as absent -> required`, () => {
    const result = validateProfile(input);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.companyName, 'required');
  });
}

// ---- B3: companyName length boundary walk (2,3,4,79,80,81) ---------------------------------

const companyNameBoundaries = [
  [2, 'too_short'],
  [3, null],
  [4, null],
  [79, null],
  [80, null],
  [81, 'too_long'],
];

for (const [len, expectedCode] of companyNameBoundaries) {
  test(`B3 — companyName length ${len} -> ${expectedCode ?? 'ok'}`, () => {
    const result = validateProfile(withField({ companyName: 'a'.repeat(len) }));
    if (expectedCode === null) {
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.value.companyName, 'a'.repeat(len));
    } else {
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errors.companyName, expectedCode);
    }
  });
}

// ---- B4: companyName trimmed before length check and before storage -----------------------

test('B4 — companyName is trimmed before the length check (trims below minimum)', () => {
  const result = validateProfile(withField({ companyName: '  ab  ' }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.companyName, 'too_short');
});

test('B4 — companyName is trimmed before storage when valid', () => {
  const result = validateProfile(withField({ companyName: '   Acme Corp   ' }));
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.companyName, 'Acme Corp');
});

// ---- B5: companyName non-string type -------------------------------------------------------

test('B5 — companyName as a non-string value is treated as absent -> required', () => {
  const result = validateProfile(withField({ companyName: 12345 }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.companyName, 'required');
});

// ---- B6: email required partition ----------------------------------------------------------

const emailRequiredCases = [
  ['absent', withField({ email: undefined })],
  ['empty string', withField({ email: '' })],
  ['whitespace only', withField({ email: '   ' })],
];

for (const [label, input] of emailRequiredCases) {
  test(`B6 — email (${label}) is treated as absent -> required`, () => {
    const result = validateProfile(input);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.email, 'required');
  });
}

// ---- B7: email invalid format partition ----------------------------------------------------

const invalidEmails = [
  'plainaddress',
  'missing-at-sign.example.com',
  'user@',
  '@example.com',
  'user@example',
  'user@@example.com',
];

for (const email of invalidEmails) {
  test(`B7 — malformed email "${email}" -> invalid`, () => {
    const result = validateProfile(withField({ email }));
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.email, 'invalid');
  });
}

// ---- B8: email valid, normalized (trim + lowercase) ----------------------------------------

test('B8 — valid email is trimmed and lowercased in the returned value', () => {
  const result = validateProfile(withField({ email: '  Test.User@Example.COM  ' }));
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.email, 'test.user@example.com');
});

// ---- B9: nip required partition ------------------------------------------------------------

const nipRequiredCases = [
  ['absent', withField({ nip: undefined })],
  ['empty string', withField({ nip: '' })],
];

for (const [label, input] of nipRequiredCases) {
  test(`B9 — nip (${label}) is treated as absent -> required`, () => {
    const result = validateProfile(input);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.nip, 'required');
  });
}

// ---- B10: nip stripped-digit-count boundary walk (9,10,11) ---------------------------------

test('B10 — nip with 9 digits after stripping -> invalid', () => {
  const result = validateProfile(withField({ nip: '123456789' }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.nip, 'invalid');
});

test('B10 — nip with 10 digits after stripping -> ok', () => {
  const result = validateProfile(withField({ nip: '1234567890' }));
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.nip, '1234567890');
});

test('B10 — nip with 11 digits after stripping -> invalid', () => {
  const result = validateProfile(withField({ nip: '12345678901' }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.nip, 'invalid');
});

// ---- B11: nip formatted with spaces/hyphens that strip to exactly 10 digits ----------------

const formattedValidNips = ['123-456-7890', '123 456 7890', '12-34 56 78-90'];

for (const nip of formattedValidNips) {
  test(`B11 — formatted nip "${nip}" strips to 10 digits -> ok, normalized`, () => {
    const result = validateProfile(withField({ nip }));
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.value.nip, '1234567890');
  });
}

// ---- B12: nip with a non-digit character remaining after stripping ------------------------

test('B12 — nip with a letter remaining after stripping -> invalid', () => {
  const result = validateProfile(withField({ nip: '12345678AB' }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.nip, 'invalid');
});

// ---- B13: nip that strips entirely to empty -------------------------------------------------

const stripsToEmptyNips = ['   ', '--------', ' - - - - - '];

for (const nip of stripsToEmptyNips) {
  test(`B13 — nip "${nip}" strips to empty -> required, not invalid`, () => {
    const result = validateProfile(withField({ nip }));
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.nip, 'required');
  });
}

// ---- B14: seats required partition (absent, empty string, null) ---------------------------

const seatsRequiredCases = [
  ['absent', withField({ seats: undefined })],
  ['empty string', withField({ seats: '' })],
  ['null', withField({ seats: null })],
];

for (const [label, input] of seatsRequiredCases) {
  test(`B14 — seats (${label}) is treated as absent -> required`, () => {
    const result = validateProfile(input);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.seats, 'required');
  });
}

// ---- B15: seats wrong type / non-integer partition -----------------------------------------

const invalidSeatsValues = [
  ['a numeric string', '5'],
  ['a boolean', true],
  ['a float', 3.5],
  ['NaN', NaN],
  ['Infinity', Infinity],
];

for (const [label, seats] of invalidSeatsValues) {
  test(`B15 — seats as ${label} -> invalid`, () => {
    const result = validateProfile(withField({ seats }));
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.seats, 'invalid');
  });
}

// ---- B16: seats range boundary walk (0,1,2,499,500,501) ------------------------------------

const seatsBoundaries = [
  [0, 'too_low'],
  [1, null],
  [2, null],
  [499, null],
  [500, null],
  [501, 'too_high'],
];

for (const [seats, expectedCode] of seatsBoundaries) {
  test(`B16 — seats value ${seats} -> ${expectedCode ?? 'ok'}`, () => {
    const result = validateProfile(withField({ seats }));
    if (expectedCode === null) {
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.value.seats, seats);
    } else {
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.errors.seats, expectedCode);
    }
  });
}

// ---- B17: decision case — non-integer AND out of range reports `invalid`, not the range code -

test('B17 — seats below range and non-integer (0.5) -> invalid, not too_low', () => {
  const result = validateProfile(withField({ seats: 0.5 }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.seats, 'invalid');
});

test('B17 — seats above range and non-integer (600.5) -> invalid, not too_high', () => {
  const result = validateProfile(withField({ seats: 600.5 }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.seats, 'invalid');
});

// ---- B18: website absent / null / empty -> skipped, value becomes null --------------------

const websiteSkippedCases = [
  ['absent', undefined],
  ['null', null],
  ['empty string', ''],
];

for (const [label, website] of websiteSkippedCases) {
  test(`B18 — website (${label}) is skipped entirely -> no error, value null`, () => {
    const result = validateProfile(withField({ website }));
    assert.strictEqual(result.ok, true);
    assert.strictEqual(result.errors, undefined);
    assert.strictEqual(result.value.website, null);
  });
}

// ---- B19: website whitespace-only is NOT skipped (not literally empty) --------------------

test('B19 — website of only whitespace is not skipped -> invalid', () => {
  const result = validateProfile(withField({ website: '   ' }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.website, 'invalid');
});

// ---- B20: website wrong scheme / missing scheme / wrong type -------------------------------

const invalidWebsites = [
  ['http scheme', 'http://example.com'],
  ['no scheme', 'example.com'],
  ['ftp scheme', 'ftp://example.com'],
  ['a number', 12345],
];

for (const [label, website] of invalidWebsites) {
  test(`B20 — website as ${label} -> invalid`, () => {
    const result = validateProfile(withField({ website }));
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.errors.website, 'invalid');
  });
}

// ---- B21: website with an internal space is not a single token ----------------------------

test('B21 — website "https://a b" (internal space) -> invalid', () => {
  const result = validateProfile(withField({ website: 'https://a b' }));
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.errors.website, 'invalid');
});

// ---- B22: valid website round-trips verbatim (current behavior, not a spec mandate) -------

test('B22 — valid https website with surrounding whitespace round-trips as-is', () => {
  const raw = '  https://example.com  ';
  const result = validateProfile(withField({ website: raw }));
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.website, raw);
});

// ---- B23: every field fails at once -> all reported together ------------------------------

test('B23 — every field failing is reported together, not just the first', () => {
  const result = validateProfile({
    companyName: '',
    email: '',
    nip: '',
    seats: '',
    website: 'not-a-url',
  });
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.errors, {
    companyName: 'required',
    email: 'required',
    nip: 'required',
    seats: 'required',
    website: 'invalid',
  });
});

// ---- B24: a mix of valid and invalid fields -> errors contains ONLY the failing keys -------

test('B24 — errors object contains only the fields that actually failed', () => {
  const result = validateProfile(
    withField({
      companyName: 'Valid Co',
      email: 'not-an-email',
      nip: '1234567890',
      seats: 600,
      website: 'https://example.com',
    })
  );
  assert.strictEqual(result.ok, false);
  assert.deepStrictEqual(result.errors, { email: 'invalid', seats: 'too_high' });
});

// ---- B25: fully valid submission (with website) -> ok:true, full normalized value ---------

test('B25 — fully valid submission returns ok:true with every field normalized', () => {
  const result = validateProfile({
    companyName: '  Acme Sp. z o.o.  ',
    email: '  Test@Example.COM  ',
    nip: '123-456-7890',
    seats: 50,
    website: 'https://example.com',
  });
  assert.strictEqual(result.ok, true);
  assert.deepStrictEqual(result.value, {
    companyName: 'Acme Sp. z o.o.',
    email: 'test@example.com',
    nip: '1234567890',
    seats: 50,
    website: 'https://example.com',
  });
});

// ---- B26: fully valid submission without website -> ok:true, value.website === null -------

test('B26 — fully valid submission with website omitted returns value.website null', () => {
  const result = validateProfile({
    companyName: 'Acme Sp. z o.o.',
    email: 'test@example.com',
    nip: '1234567890',
    seats: 50,
  });
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.value.website, null);
});
