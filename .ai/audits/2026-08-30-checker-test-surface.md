# Checker verdict -- 2026-08-30-test-surface-not-test-count

Verdict: CHANGES-REQUIRED

## What the diff does NOT do that the spec requires

1. The staged diff is missing Phase 5's .ai/lessons.md entry. Phase 5 says: "Five version
   stamps + CHANGELOG.md entry + .ai/lessons.md entry recording the escaped defect as a gate
   autopsy." git diff --cached touches VERSION, package.json, both .claude-plugin/*.json
   files and CHANGELOG.md, but .ai/lessons.md carries no staged change at all -- the two
   2026-08-30 lesson entries exist only in the working tree (git diff -- .ai/lessons.md shows
   them as unstaged). If this diff is committed as-is, the release ships without the lessons entry
   its own spec requires.

2. skills/sailes-bootstrap/spec-writing-template.md is missing two of its three required
   landing sites. Phase 1 states the landing sites are "the same three, kept in step with"
   sailes-spec/SKILL.md: workflow step 6 (Phasing), checklist, Red Flags. Only the checklist
   item landed (line 114). Workflow step 6 (line 31) is untouched -- no Deployed-probe/wire-property
   sentence, unlike sailes-spec/SKILL.md's step 6 which got one. And the template has no
   Red-Flags-equivalent section at all (a grep of "^## " headings returns Workflow / Spec lifecycle /
   How much spec the change earns / Required sections / Stack conventions / Review checklist /
   Output -- no Red Flags, no Common Mistakes). Two of the three explicitly-required landing sites
   for the client-repo template are absent.

3. The staged eval file carries a live, demonstrated harness bug that the working tree already
   fixed but did not stage -- see finding 1 below.

## Findings, most severe first

### 1. [CHANGES-REQUIRED] Staged "Last run:" text makes a never-run eval report as FRESH

evals/mock-of-an-external-boundary-carries-a-pair.md (the staged blob, via
git show :evals/mock-of-an-external-boundary-carries-a-pair.md) reads:

  Last run:  NEVER-RUN -- written 2026-08-30 alongside the rule it grades; ...

evals/harness/eval-status.js's parseRunDate extracts the FIRST ISO date found anywhere in the
"Last run:" field via /(\d{4})-(\d{2})-(\d{2})/, with no awareness that the literal string
NEVER-RUN precedes it. Running evaluateOne() directly against the staged text returns:

  { name: 'staged-eval', verdict: 'FRESH', runDate: '2026-08-30', precision: 'day', ... }

An eval the author explicitly states has never run is reported FRESH by the tool Phase 5's
Done-when depends on (node evals/harness/eval-status.js -> new scenarios present, no NO-FILES
among them). This is the "asserted, not verified" failure this framework's own doctrine forbids,
on the exact surface a new-scenario check exists to protect.

The bug is already fixed -- but only in the UNSTAGED working tree version of the same file, which
rewords the field to "Last run: never -- ... Deliberately carries no date: the harness reads
NEVER-RUN from the absence of one, and a date here would make an unrun scenario report as
covered." That fix is not part of git diff --cached. Whoever stages this diff for commit needs to
re-add the working-tree version of this file (and .ai/lessons.md) before it ships.

### 2. [CHANGES-REQUIRED] deployed-surface-check.js's claimsStatus fires on ordinary "returns N"
prose that has nothing to do with HTTP

tools/deployed-surface-check.js:83 triggers on any line containing returns? / zwraca /
respond(?:s|ing)? within 24 characters of a 1xx-5xx-shaped number -- with no requirement that the
context be about HTTP at all. Demonstrated directly against the shipped module:

  claimsStatus("This query returns 404 matching rows.")                                -> true
  claimsStatus("The migration returns 201 records updated in this batch.")             -> true
  claimsStatus("zwraca 500 wierszy z tabeli klientow")                                  -> true
  claimsStatus("The service responds well within our 200 millisecond latency budget.") -> true

The tool's own header comment (tools/deployed-surface-check.js:68-69) claims exactly this class is
guarded against: "A bare three-digit number is not a status code -- 200 rows is not an HTTP
claim... Measured, not hypothetical." It is guarded against ONLY in the past tense: the regression
test at tools/deployed-surface-check.test.js:128 uses "the sweep RETURNED 200 rows from the
ledger", and "returned" does not match the returns? alternation -- so the test passes while the
present-tense form ("returns"), the far more common way to phrase this in specs, still misfires.
This directly contradicts the design brief stated two lines above the trigger table in the same
file ("this check exists to make one cheap observation mandatory, NOT to add a tier of ceremony...
narrow on purpose") and is precisely the "rule that only ADDS obligation" the human asked to
eliminate: any spec phase describing a query result count, a batch size, or a latency budget in
ordinary present-tense prose will now be flagged and require a Deployed-probe: n/a -- reason
waiver line for something that was never an HTTP claim.

### 3. [CHANGES-REQUIRED] findImplicitProbe can be satisfied by an unrelated background-reading
link, silently passing a phase that never names a real deployed probe

tools/deployed-surface-check.js:281-294. Spec text written to scratch (not the repo):

  ## Phase 1 -- Proposal status endpoint

  The endpoint must return HTTP status 404 when the proposal id does not exist in the table.

  Background reading for the team: https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
  documents that 404 Not Found is a client error response code.

  Done-when: pnpm test proposal -> 0 failures

node tools/deployed-surface-check.js <file> reports "OK -- 1 phase(s) claim a wire property, each
answers where it is observed", exit 0. There is no deployed-host probe anywhere in this text --
findImplicitProbe accepts any non-local https:// URL sitting within three lines of something that
looks like a status/header expectation, regardless of whether that URL has anything to do with the
app being specified. This is the exact escaped-defect shape the whole change exists to close (a
spec claims a wire property, nothing actually names where it is observed on the deployed address)
and the checker reports success. This is not a contrived adversarial string -- a spec-writing model
citing an MDN or RFC link near a status-code discussion is an entirely ordinary thing to write.

### 4. [NITS] claimsRedirect misses plain redirect prose the spec explicitly lists as a trigger

Phase 1 lists "a redirect claim" as one of three trigger classes, but REDIRECT_PATTERN only fires
when an HTTP_HINT word is on the same line:

  claimsRedirect("After login, the user is redirected to /dashboard.")                -> false
  claimsRedirect("Successful checkout redirects the browser to /order/confirmation.") -> false

Both are ordinary ways to phrase a redirect (a real 302 + Location, a CDN-rewritable wire
property) and both evade the check entirely. claimsHeader also misses plural ambiguous headers
with no unambiguous header alongside them:

  claimsHeader("The proxy sets the Vary and Age headers on every response.") -> false

(header\b does not match inside "headers" -- the boundary sits between two word characters.)
Lower severity than findings 2-3 because these are false negatives rather than manufactured
obligation, but worth tightening given the check's whole reason for existing is to catch exactly
this class of claim.

### 5. [NIT] Ceremony: the escaped-defect narrative is retold in full 6-7 times across
model-facing files, once with an explicit "see X for the full version" pointer immediately
preceding a near-full repeat

skills/sailes-test/SKILL.md's added "Three rules that hold regardless" paragraph ends with "Full
rule and the internal/external test: references/external-systems.md rule 6." -- but the paragraph
immediately before that sentence already carries the entire story: "Measured 2026-08-29 -- a
feature shipped with unit tests, Playwright e2e and a green qa gate, and worked for zero
customers... proposal-states.spec.ts did route.fulfill({status: 404})... Forty-four more
assertions would not have caught it; one curl against the deployed host did."
skills/sailes-test/references/external-systems.md rule 6 then restates nearly the identical
sentence set (same facts, same order, same "forty-four more assertions... one curl" line, same
"trade... earns their deletion... suite... smaller" line). Given SKILL.md already defers to the
reference file for "the full rule," the SKILL.md copy could have been cut to one or two sentences
instead of repeating the full anecdote before deferring.

The same anecdote (CloudFront / 404 / 200 text/html / "zero customers" / "forty-four more
assertions") also appears in full or near-full form in agents/qa.md (twice), agents/tester.md,
agents/checker.md, skills/sailes-spec/SKILL.md, skills/sailes-pre-implement/SKILL.md, and
skills/sailes-test/test-plan-template.md -- 16 occurrences of the string "200 text/html" across
the diff in total. Some repetition across agent role files is defensible (each role's context does
not necessarily include another role's file), but the SKILL.md/reference-file pair is the clearest
case of the first file already carrying the story and the second one repeating it rather than
owning it exclusively -- exactly the "restates the same rule in a second file where the first
would have carried it" pattern this review was asked to catch. A real, if small, tax on every
future load of skills/sailes-test/SKILL.md.

## What is solid

- spec-weight (skills/sailes-bootstrap/spec-weight.md) is a real sync block (tools/blocks.json
  registers it, node tools/sync-blocks.js --check passes), so its triplication into
  sailes-spec/SKILL.md, spec-writing-template.md and sailes-pre-implement/SKILL.md is mechanical,
  not manual duplication -- no penalty there. Its content is genuinely actionable: three weights
  with concrete criteria (data model / auth model / module boundaries stay put = contract fix; new
  surface / data model / tenancy / auth / money / integration contract = feature), a five-section
  cap for the middle tier, and a one-line Weight: declaration to write down. An agent could apply
  it to a real change without asking, modulo the ordinary ambiguity of "does adding one field count
  as a contract fix or a new surface" -- a genuine but minor gray zone, not a defect.
- agents/tester.md's new "leave a mock ... without its pair" rule and the pre-existing "never
  delete a frozen assertion" rule do not actually contradict: the Report section is explicit that
  "a frozen ID is struck by the human, never quietly by you" -- tester NAMES redundant mocked
  assertions for the human to strike, it does not delete them itself. No contradiction found in
  skills/sailes-test/SKILL.md's existing mock rules either.
- npm test passes (all suites, including the new tools/deployed-surface-check.test.js, 22 cases)
  and node tools/sync-blocks.js --check reports all blocks in sync -- both confirmed by direct run,
  not assumed.
- .ai/eval-runs/2026-08-30-deployed-surface-probe/VERDICT.md is honest about what the A/B did and
  did not establish (explicitly: "This A/B does not test spec-weight at all... the speed half of
  this release is therefore unmeasured") -- no claims-vs-evidence problem there, and it correctly
  records that arm A was not a clean control rather than smoothing that over.
- No overstated N=1-as-fact language found in the inserted prose; every "Measured 2026-08-29"
  citation is attributed to the one session it came from, and the spec's own "What this spec does
  NOT claim" section is carried through consistently.

## Recommendation

CHANGES-REQUIRED on: (1) stage the working-tree fixes to .ai/lessons.md and the eval "Last run:"
field so the diff actually matches what Phase 5 requires and does not ship a demonstrated
false-FRESH harness bug; (2) close the two missing landing sites in
skills/sailes-bootstrap/spec-writing-template.md; (3) tighten claimsStatus's trigger-word pattern
so present-tense "returns/responds + number" outside an HTTP context does not fire, and close or
narrow the findImplicitProbe escape hatch so an unrelated URL cannot satisfy a real status/header
claim. Findings 4 and 5 are worth fixing in the same pass but are not blocking on their own.
