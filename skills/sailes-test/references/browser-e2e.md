# Browser-driven testing — anything a user can see is clicked

Every UI-visible behavior is proven in a real browser (Playwright/Chromium), driven as a user would
drive it. Pure computation and data mapping stay at a lower level, where they are fast and stable.

The reason is one sentence from Kent C. Dodds: *"The more your tests resemble the way your software
is used, the more confidence they can give you."*
([source](https://kentcdodds.com/blog/write-tests)) A unit test that passes while the form in the
browser does not work is precisely the false green this skill exists to prevent.

## Form coverage — the rule that catches real bugs

For every form the phase touches, **every field** is exercised:

| Case | Why |
|---|---|
| Valid value | the baseline — but on its own it proves almost nothing |
| Invalid value | the validation exists and *fires*, with the message the spec promised |
| Empty when required | required-ness is enforced at submit, not merely styled with an asterisk |
| Boundary length | max-length silently truncating is a classic silent data loss |
| Optional field left empty | the write path handles absence — this is where `undefined` reaches the DB |
| Optional field filled | ...and where the column was never added |

**Assert on the resulting state, never on the toast.** A "Saved" notification proves a code path
rendered a component. It does not prove a row was written, that it was written to the right tenant,
or that the field you filled actually landed. Read the database row or the API response back.

Where a field feeds an external system — a CRM custom field, a Slack channel id — the assertion
follows it there, or the case goes on the manual checklist in the test plan. It does not quietly
stop at your own boundary.

## The anti-flake rules — not advisory

Timing is the top cause of flaky tests, and the browser is its home turf. Luo et al. categorized 201
flakiness-fixing commits across 51 projects and found asynchronous calls, then concurrency, then
test-order dependency to be the most common causes
([authors' PDF](https://mir.cs.illinois.edu/lamyaa/publications/fse14.pdf)). At Google roughly 1.5%
of runs are flaky and ~16% of tests have flaked at some point
([source](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html)).

This matters more than it looks. **A flickering suite gets disabled, and a disabled suite protects
nothing** — the investment is not degraded, it is zero. Treat these as part of writing the test, not
as cleanup afterwards.

1. **Never `sleep`.** Wait for a condition — Playwright's auto-waiting locators and
   `expect(locator).toHaveText(...)` retry until a timeout. A fixed delay is either too short
   (flake) or too long (a slow suite people stop running).
2. **Control the clock.** Inject it, or use fake timers, for anything with expiry, scheduling,
   debounce, or "created today" logic. A test that passes only before midnight is a time bomb.
3. **Seed randomness and print the seed on failure.** A failure you cannot reproduce is a failure
   you will re-classify as flake and ignore.
4. **Fresh state per test.** No shared mutable fixtures. The suite must pass under **randomized
   order** — if it does not, you have an order dependency, which is a real bug in the tests and
   frequently a real bug in the code.
5. **Never auto-retry to green.** Retrying until pass destroys the only signal separating a genuine
   intermittent bug from environmental flake. If a test is flaky, fix it or delete it — a retried
   test is a test that reports success for a reason other than the one claimed.

## Selectors

Prefer what a user perceives — role, label, visible text — over structure. `getByRole('button',
{ name: 'Zapisz' })` survives a refactor that `div > div:nth-child(3) > button` does not, and it
fails for a *useful* reason when the accessible name disappears. Test ids are a fallback for
genuinely ambiguous cases, not the default.

## What stays out of the browser

- Pure calculation, formatting, mapping, parsing → unit level, where a hundred cases cost nothing.
- Permission matrices → API level, one assertion per action × role, plus the anonymous row.
- Idempotency, replay, out-of-order delivery → the async case set in `techniques.md`; a browser
  cannot deliver the same webhook twice.

One journey through the browser plus thorough lower-level coverage beats forty browser tests that
each take nine seconds and fail on a Tuesday.

## Evidence

Screenshots are `qa`'s deliverable, not the test's assertion — a screenshot proves what a screen
looked like, never that a value was persisted. Write the assertion against state; let `qa` capture
the picture and compare it against the design artifact and the `.ai/screens/` baseline.

Reference: [Playwright](https://playwright.dev/docs/best-practices)
