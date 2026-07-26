# Spec: two roles the framework has been doing without — `eval-runner` and `researcher`

Status: draft
Date: 2026-07-26
Related: `.ai/lessons.md` 2026-07-26 entries, `agents/`, `evals/README.md`,
`skills/sailes-bootstrap/agent-team-structure.md`

## TLDR & Context

The human asked for both after watching a session where the lead did both jobs by hand and made
avoidable mistakes doing them. This is a **graduation-rule** proposal, not a wishlist: each role is
justified by work that actually recurred, with the failures it would have prevented named.

The framework ships eight roles. Two recurring jobs have no owner:

1. **Dispatching and grading evals.** ~25 times on 2026-07-26 alone. It has a written method
   (`evals/README.md` + the A/B protocol) that the lead executed inconsistently — see §2.
2. **Verifying external claims.** Package names, tool schemas, vendor guidance, forwarded
   recommendations. `explorer` exists but is repo-scoped, pinned to Haiku, and its instructions are
   about `file:line` recon.

**Cost is not zero and belongs in the decision.** The installed plugin adds ~5,444 tokens to *every*
session. Each role's description rides along whether or not it is used.

---

## Decisions so far, and what is still open

**Answered 2026-07-26 by the human — Q5: (b), and it reframes the whole spec.** `researcher` is not
a new role. It is `explorer`, widened from repo-only recon to general reconnaissance including the
outside world. The reason given matters more than the answer: **the audience is people other than
the person who wrote this.** A roster of ten roles with subtle distinctions is harder to use than
eight with obvious lanes, and "which of these two do I reach for" is a tax paid by every newcomer,
forever, so that the author can avoid one merge.

That principle now cuts against the *other* half of this spec, and it would be dishonest not to say
so — see Q1 below.

### Still open

**Q1 — Given the audience, should `eval-runner` ship as a role at all?** Running `evals/` is
**framework-maintenance work**. The people this framework is for are building client apps; most of
them will never dispatch an eval. Shipping a ninth role puts its description in every session on
every machine, forever, to serve a job almost none of those sessions will do.
- (a) **A skill, not a role** — `sailes-eval`, loaded by whoever is maintaining the framework.
  Costs nothing when unused. Loses the isolation argument: the author could still grade their own
  doctrine, which is exactly what went wrong today. *(recommended on the audience argument)*
- (b) **A role, but repo-local** — lives in this repo's `.claude/agents/`, not in the shipped
  plugin. Keeps the isolation, costs client repos nothing. Costs: it is then not a Sailes role,
  and nothing keeps it in step with the eight that are.
- (c) **A shipped role**, accepting the always-on cost for everyone so the framework's own net
  stays honest.

**Q2 — How far does `explorer` widen, and does it stay on Haiku?** Today it is pinned
`claude-haiku-4-5` (no `effort` — unsupported there) and already carries `WebFetch`. General recon
adds judging whether a source is trustworthy, which is not obviously a Haiku job.
- (a) **Widen the lane and the tools** (add `WebSearch`), keep the Haiku pin; when research needs
  judgment the lead escalates that one task with `model: "opus"`, which is exactly the mechanism
  1.16.2 just settled. *(recommended — keeps the cheap common case cheap)*
- (b) Widen and move it to `claude-sonnet-5`, accepting a higher floor on every recon.

**Q3 — What is the role called after widening?** `explorer` describes the repo job. A newcomer
reading "explorer" will not guess it also checks vendor docs and package registries.
- (a) Keep `explorer`, fix the description *(no migration, no drift)*
- (b) Rename to `scout` / `recon`, and carry the rename through `codex-agents/`, three role tables,
  and every eval that names it — a real cost for a clearer word

**Q4 — Codex parity for the widened `explorer`?** `codex-agents/explorer.toml` mirrors it today.
The widened lane transfers (Codex can read the web); the model pin does not, as ever.

~~Q5 — separate role vs. widening~~ **answered: widening.**

## §1 What each role is, in one paragraph

**`eval-runner`** — dispatches an `evals/` scenario faithfully to a fresh context, grades the result
against the scenario's own recorded binary criterion, and records the verdict with its caveats. It
never edits the doctrine under test, never grades from an agent's summary message, and never marks a
scenario run when the fixture could not create the condition. Its verdict must state which vehicle it
used (named role vs. stand-in) because that decides what the result covers.

**`researcher`** — establishes external facts and reports them with their provenance and confidence.
Reads documentation, probes tool and API schemas, checks package registries. Distrusts forwarded
claims by default: a recommendation, a package name or a version in a message is a claim with a
location, and the location is what it reports.

---

## §2 The failures these roles are drawn from (2026-07-26, all mine)

Not hypothetical. Each is a case where a defined lane would have caught the lead in the act:

| What happened | What the role's lane would have caught |
|---|---|
| Graded two evals from the agent's summary message before catching myself and re-reading the files | "grade the artifact, not the report" is the first line of the method |
| Dispatched 8 eval arms as `general-purpose` **without recording them as stand-ins**, hours after writing the rule that requires it | The verdict template forces the vehicle field |
| Wrote an arm-2 fixture asserting an environment claim that was checkably false on this machine | "assert the fixture creates the condition **before** reading the verdict" |
| Marked 12 evals re-run while 4 stayed blocked — correct, but only because I remembered | Blocked-vs-run is a required distinction in the verdict, not a judgment call |
| Took a forwarded package name (`graphifyy`) at face value initially | `researcher` reports provenance; I did verify, but by reflex rather than by rule |
| Asserted the Agent tool's `effort` parameter worked, from documentation | `researcher` probes the schema; two evals caught this before I did |

---

## §3 Non-goals

- **No release role.** Version bumps, CHANGELOG and merge are coordination — the lead's job, and
  splitting them dilutes the single point of contact.
- **No prose/doctrine role.** Doctrine is the lead's authority; a role that writes it would review its
  own authority.
- **Not a replacement for `checker`.** `eval-runner` grades *scenarios about the framework*;
  `checker` grades *diffs against specs*. Different artifacts, different isolation.

## §4 Risks

- **Roster inflation.** Ten roles is where a table stops being read. The role/model table already
  lives in three places (`.ai/backlog.md`, unblocked but not done).
- **Q3 is a safety question, not a convenience one.** Granting `Agent` to a second role weakens an
  invariant that was verified by runtime audit today.
- **`main` is production.** Both roles ship to every machine on merge; both need their own eval
  before that.
