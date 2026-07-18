# Incident record — template and rules

Every diagnosis leaves one file: `.ai/incidents/<YYYY-MM-DD>-<slug>.md`.

It exists so the finding is checkable by someone who was not there, and so the next investigator —
human or agent — does not re-walk paths already excluded. Three rules decide whether it is worth
anything:

1. **The ledger is written during the investigation, not after.** Reconstructed afterwards it
   records the tidy path you wish you had taken, with the wrong turns quietly removed — which is
   precisely the information the next reader needs.
2. **Refuted hypotheses are never deleted.** A refutation permanently excludes a region of the
   search space. It is the most reusable content in the file.
3. **It closes with what was NOT established.** No acknowledged uncertainty is a red flag for
   premature commitment, not a sign of rigor.

A record is also **correctable after the fact** — including its reasoning. When a rationale turns
out to be wrong but the decision still stands, correct the rationale in place and say so; a record
that preserves wrong reasoning teaches it to everyone who reads it next.

---

## Template

```markdown
# Incident: <one-line symptom, in observable terms>

Status:     INVESTIGATING | MECHANISM CONFIRMED | STOPPED, CAUSE UNKNOWN | FIXED & VERIFIED
Noticed:    <how — alert / customer / log / someone looking> at <UTC>
Impact:     <who, how many, what they lost — "unknown" is a valid answer, "none" needs evidence>
Owner:      <the human>

## Reported case

<What was reported, in the reporter's own words where possible. The paraphrase loses the detail
that solves it.>

## Timeline (UTC)

Machine-observed events and human/agent actions in separate columns — never reconstructed from
memory. If a time is inferred rather than observed, mark it.

| UTC | Observed (machine) | Action (human/agent) |
|---|---|---|
| 14:02 | deploy `abc1234` to prod | |
| 14:03 | error rate 0.1% → 12% | |
| 14:20 | | alert acknowledged, live case reproduced |

## Evidence log

Append-only. Every query exactly as run, with its time range and where it came from. This is what
makes the finding reproducible without re-running the investigation.

| # | Source | Query / command (verbatim) | Result |
|---|---|---|---|
| E1 | audit_logs | `select … where submission_id='…'` | 3 error rows, last step `price` |
| E2 | vatprobe | `node --import tsx apps/worker/vatprobe.ts VA` | HTTP 204, empty body |
| E3 | control | same probe, `PL` | HTTP 200, valid JSON |

## Hypothesis ledger

Opened before the deep dive, with at least three entries. Refuted rows stay.

| # | Statement | Mechanism | Predicted observable | Refuting observation | Test run | Verdict | Evidence |
|---|---|---|---|---|---|---|---|
| H1 | … | … | … | … | … | CONFIRMED | E2, E3 |
| H2 | … | … | … | … | … | REFUTED | E1 |
| H3 | … | … | … | … | not run | UNTESTED | — |

Verdicts: **CONFIRMED** (a discriminating test passed and cites evidence) · **REFUTED** (the
refuting observation was seen) · **UNTESTED** (never examined) · **UNTESTABLE** (no observation
could settle it — reformulate or drop).

## Mechanism

The causal chain, one link per line, each citing evidence. Contributing factors are a **set**, not
a single root cause — and never a person.

> `client-vats` returns 204 empty for microstates [E2] → `response.ok` is true →
> `response.json()` throws [E1] → misfiled as technical → 5 retries → `create-deal` never runs →
> no deal, no booking, no ack email.

**Contributing factors**
- <factor, with mechanism and evidence>
- <factor, with mechanism and evidence>

**Not established**
- <what remains unknown — and say plainly where the mechanism is unknown rather than guessing>
- <evidence that does not exist because it was never instrumented>

## Verification

How the fix was proven to address the **mechanism**, not the symptom. Criteria pre-committed
before implementing, and including a negative — silently getting nothing must read as a failure,
not a pass.

- [ ] the failing condition reproduces before the fix
- [ ] it does not reproduce after
- [ ] <the positive: the artifact that must now exist, by id>
- [ ] <the negative: what must NOT happen — zero alerts, no duplicate record>
- [ ] the metric that would show this regressing

Result: <the real run — ids, timings, what was observed>

## Detection gap

Why this was not caught earlier, and what instrumentation was missing. This is where an
unknown-unknown becomes a known dimension.

## Action items

| Action | Owner | Status |
|---|---|---|
| <the fix — one-liner with a pinning test, or a fix spec> | | |
| <the test that asserts the gate actually gates — a parenthetical is not a gate> | | |
| <the detection improvement> | | |
```

---

## Relationship to the rest of `.ai/`

- **`.ai/incidents/` is separate from `.ai/specs/`** on purpose. An incident is not work in flight;
  filing it as a spec inflates the in-flight count the session router reads at startup and makes a
  busy repo look stale.
- **A confirmed mechanism that needs more than a one-liner produces a fix spec** in `.ai/specs/`,
  carrying this record as its evidence section.
- **A generalisable trap graduates to `.ai/lessons.md`** — but only once it is more than this one
  incident, and remembering that a lesson is a hypothesis that survived once and can still be
  wrong.
