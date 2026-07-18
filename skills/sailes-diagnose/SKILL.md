---
name: sailes-diagnose
description: Use when something is BROKEN in a running system and the cause is not yet known — production errors, a failed run, a customer-visible defect, an alert storm, a silent data gap. Triggers — "sprawdź błędy prod", "coś się wysypało", "nie doszedł deal / nie przyszedł e-mail", "alert ze Slacka", "czemu to nie zadziałało", "debug", "incydent", "logi", "root cause", "to działało wczoraj", "klient zgłosił". Runs INSTEAD of the discovery→spec→implement pipeline, which builds features and cannot diagnose them. Read-only against production by default. Produces an incident record with a hypothesis ledger — evidence, refutations kept, and an explicit list of what was NOT established.
---

# Sailes Diagnose — finding out what actually broke

## Overview

**The track for when something is already built and is now failing.** The build pipeline
(`discovery → spec → implement`) turns intent into working software. It is the wrong instrument
for a broken system: there is nothing to elicit, the requirement is already written, and the only
question is *what is actually happening*. This skill is that track.

It separates two kinds of work, as every Sailes skill does:
- **🔒 Hard rules** — read-only on production, live case before audit, three hypotheses before any
  deep dive, every causal claim cited, refutations kept. Breaking one produces a confident wrong
  answer, which is worse than no answer because it gets acted on.
- **🔀 Decisions** — the human owns them: whether to mitigate before understanding, whether to run
  any write at all, when to stop and escalate. You recommend; they choose.

**Core principle:** *Run the real case first, then audit.* Not because auditing is bad, but because
this was learned the expensive way in this company's own code, and written down as a reversal:

> *"on the 'loads 2008' bug I spent a long time on read-only audit + a written plan built on
> hypotheses (stale bundle, localStorage precedence). The actual cause — real supplier ids are
> string codes `S0002556` that `Number()` turns into NaN — only surfaced the moment I ran a REAL
> browser login and clicked the real link. **Most of the prior reasoning was wrong, and the
> audit-first order wasted effort.**"* — Partner Portal `.ai/lessons.md:136-146`

That bug is the skill's founding text because it was wrong three times over: the hypotheses were
wrong, the **first fix** was wrong (stripping digits off `S0002556` produced a *different
supplier*), and the **lesson drawn from it** was wrong too, corrected a month later. Treat your own
confident narrative as the least reliable instrument you are holding.

## When to Use / When NOT to

**Use when:** production is throwing errors; a run failed or silently produced nothing; a customer
reports something that "should work"; an alert fired; data is missing or wrong; behavior changed
without a deploy that explains it; "it worked yesterday".

**Do NOT use when:**
- You know exactly what is wrong and it is a one-line fix — just fix it, with a test that pins it.
- The feature does not exist yet. "It doesn't do X" is not a defect; that is `sailes-discovery`.
- The system is fine and you want to make it faster — that is `sailes-async`.
- The task is "add error handling" — that is a feature; it needs a spec.

## Where this sits

```
                          ┌─ something is BROKEN ─→  sailes-diagnose  ← here
   a request arrives ─────┤                              ↓
                          └─ something is MISSING → discovery → spec → implement
                                                        ↑
                              a confirmed root cause with a mechanism re-enters here,
                              as a fix spec — diagnosis never flows straight into code
```

**The boundary that matters:** this skill ends at a *proven mechanism*, not at a merged fix. A
confirmed root cause becomes a fix — a one-liner if it truly is one, a spec if it is not. Skipping
that seam is how a wrong fix ships fast: on "loads 2008" the diagnosis was right and the first fix
still corrupted the supplier id.

---

## 🔒 Hard rules

### 1. Read-only on production. Always.

Every tool you reach for during diagnosis reads. Nothing writes, restarts, scales, flushes,
redeploys, or replays. When a write would help, you **write the exact command out and stop**, and
the human runs it.

This is stricter than the industry default, and it is set that way for a specific local reason:

> *"Railway `dev` holds production credentials. A Tokyo→Kyoto smoke test created a real person
> (42255), a real deal (43001), and sent a real email."* — SRF `.ai/lessons.md:151-154`

In this company's setup, **there is no harmless environment to test against**. "I'll just try it"
writes to production. There is also a diagnostic reason, independent of blast radius: a mutation
destroys the state you are trying to explain. The SRE canon puts it plainly — stabilise, then
*preserve evidence*, then investigate; a restart that "fixes" it has deleted the incident.

**Two exceptions, both narrow:** a read-only probe that hits an external API with real credentials
is a read and is allowed (`geoprobe`, `vatprobe`). Mitigation of a live customer-visible outage is
not diagnosis — it is a separate, human-authorised track that may be crude, and it happens *after*
evidence is snapshotted.

### 2. Run the live case before you audit code

Reproduce the reported thing: the real login, the real click, the real submission, the real
payload. Capture request URL, response, console, and the audit rows **before** forming a theory.

> *"When debugging: reproduce the real-time case FIRST — real browser, real login, the exact
> reported flow — and capture live evidence (request URL + response + console) BEFORE auditing
> code or forming a hypothesis."* — Partner Portal `.ai/checklists/testing.md:10`

Code-reading answers "what should happen". Only the live run answers "what does happen", and every
expensive miss in both repos lives in that gap. Hypothesis-first audits are for *confirming what
the live run already showed*.

### 3. Three hypotheses before any deep dive

Never carry one. One hypothesis is not a diagnosis, it is a guess with a narrative attached — and
LLM agents are measurably bad here: representational commitment peaks around **reasoning step 4**,
after which the run mostly defends its early reading while staying superficially coherent
(arXiv 2606.22936). So the hypothesis set has to exist *before* step four, not after.

For each one, name **in advance** the observation that would kill it. A hypothesis with no
refuting observation is unfalsifiable — reformulate or drop it. Then prefer the test that
*discriminates between* hypotheses over the test that confirms your favourite. Models default to
confirming; deliberately constructing the opposite case measurably improves accuracy
(arXiv 2604.02485).

### 4. Every causal claim cites evidence

A log line, a trace id, a commit hash, an audit row, a metric query with its time range. No
citation means it is a hypothesis, and it must be labelled as one.

Two corollaries that have both bitten here:
- **A technology being mentioned is not evidence.** Salience in your context window is not an
  evidential path; agents attribute causes to whatever the thread happens to name.
- **Absence of an error is not evidence of health.** Logs show only what was instrumented — see
  the silent-instrument trap in `traps.md`.

### 5. Count, do not grep

Fire-and-forget instruments are silent on success, so grepping for their traces proves nothing:

> *"`alertSlack` never throws and logs nothing on success, so the storm was INVISIBLE in worker
> logs — a `grep` for 'slack/alert/failure' returned 0, **giving false confidence that nothing
> fired**."* — SRF `.ai/lessons.md:129`

Point the instrument at a sink you control and **count what arrives**. The alert-storm fix was
proven exactly this way: a local sink, one induced real failure, then `exactly 2 POSTs total = 1
per lane` and `3 error rows per lane in audit_logs`, with the before/after contrast recorded
(10 → 2).

### 6. A diagnosis is not done until the mechanism is shown

"The symptom stopped" is not a root cause. If you cannot state the mechanism — *this input took
this path and produced that output* — then the honest status is **"it stopped, cause unknown"**,
and monitoring continues. Never write "resolved".

Hold two things in tension deliberately: prefer the simple explanation, *and* keep looking after
you find one. A system can have several contributing factors at once, and the search for a single
tidy root cause reliably terminates on whatever is easiest to blame.

**Do not use "5 whys".** It has no evidence base, a substantial critical literature, and its
dominant failure mode — a fluent single-thread causal chain generated from insufficient knowledge
— is precisely what a language model produces natively. Record **contributing factors, plural**,
each with a mechanism and evidence. Ask *how* (what was visible, what was known, what made this
sensible at the time), not *why* (which invites hindsight and terminates on "human error").

### 7. Diagnosis correct ≠ fix correct

They are separate claims and each needs its own proof. Published agent evaluations show root-cause
accuracy far above remediation validity (91–99% vs 37–60% in one Kubernetes study) — a gap this
company has hit twice, on "loads 2008" and on the qualify aggregator, where a correct diagnosis
produced a fix with a hole in it.

---

## The procedure

Detail lives in `diagnosis-loop.md`; this is the shape.

```
0. SCOPE      what is broken, for whom, since when, how noticed  →  the reported case
1. LIVE       reproduce it for real; capture evidence            →  evidence log (started)
2. HYPOTHESES ≥3, each with its refuting observation             →  hypothesis ledger
3. COLLECT    fan out read-only across data sources (if unclear) →  raw evidence, no verdicts
4. DISCRIMINATE run the test that separates hypotheses           →  CONFIRMED / REFUTED rows
5. MECHANISM  state the causal chain with citations              →  contributing factors
6. HAND OFF   one-line fix, or a fix spec                        →  back into the pipeline
```

**Step 3 is where agents help — and only when the cause is not obvious.** One alert with a clear
stack trace does not need a fleet; the lead reads it. When the cause is *not* obvious, fan out
**by data source** — logs, audit table, recent diffs and deploys, dependency/external-API status,
infra events — because those are genuinely independent directions and that is the case where
parallel agents measurably win.

Two rules on that fan-out, both load-bearing:
- **Fan out on sources, never on hypotheses-with-advocates.** Assigning an agent to defend a theory
  manufactures confirmation. Collectors gather; they do not conclude.
- **Every collector returns raw evidence** — the exact query it ran, the time range, and the
  result. Verdicts are the lead's. A summary passed between agents is a corrupted output waiting
  to propagate; a citation is checkable.

Synthesis, choosing the next discriminating test, and any decision are **serial, in the lead**.

## When to stop and escalate to the human

Stop and hand back when any of these is true. These are triggers, not judgment calls:
- 60 minutes of focused analysis with no confirmed mechanism.
- A write on production would be the next useful step.
- Two consecutive hypotheses refuted with no new evidence source left to read.
- The impact is customer-visible and growing, or involves data loss or a security implication.
- The evidence needed does not exist (not instrumented) — say so; that is itself a finding.

Never keep going to avoid returning empty-handed. A refuted hypothesis with evidence is a real
result: it permanently excludes a region of the search space, and the record makes sure the next
investigator does not re-walk it.

## The artifact

Every diagnosis leaves `.ai/incidents/<date>-<slug>.md` — timeline, evidence log, hypothesis
ledger, mechanism, verification, detection gap. The template and the rules for filling it in are in
`incident-template.md`. Three properties are non-negotiable:

- **The ledger is written during the investigation, not reconstructed after.** A post-hoc ledger is
  hindsight-biased fiction — it records the path you wish you had taken.
- **Refuted hypotheses are never deleted.** They are the most reusable thing in the document.
- **It closes with what was NOT established.** An investigation with no acknowledged uncertainty is
  a red flag for premature commitment, not a sign of thoroughness.

## Reference files

| File | What is in it |
|---|---|
| `diagnosis-loop.md` | The seven steps in detail, with the discriminating-test catalogue (bisection, injected known input, controls) and the escalation triggers. |
| `probe-patterns.md` | The four probe archetypes distilled from 59 real SRF probes — timeline, sweep, single-case deep dive, external-API probe — with the controls-in-the-probe habit and the replay guard. |
| `traps.md` | Documented traps, each paid for in a real incident: silent instruments, mocks that encode the bug, misleading audit arithmetic, writes that succeed and vanish, "an ADR exists ≠ handled". |
| `incident-template.md` | The incident record: timeline, evidence log, hypothesis ledger, contributing factors, verification, detection gap. |
