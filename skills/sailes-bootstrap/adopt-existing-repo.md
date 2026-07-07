# Case C — Adopt an Existing Repo into Agentic-First (adapt, don't rewrite)

**When:** the repo has real, working application code and a real stack, but NO agentic-first methodology (no `AGENTS.md`/`CLAUDE.md`/`.ai/`), and likely NOT the baseline stack. The user wants to adapt it to the agentic-first way of working.

**Core principle:** *Adapt, don't rewrite.* You overlay methodology (docs, guardrails, working discipline) onto what already works. You do NOT impose the baseline stack, and you do NOT touch running code. The existing code is the source of truth; methodology is **additive only**.
The current on-disk repo conventions are the source of truth for adoption. Do not force the repository to match the latest wording or layout of the global bootstrap docs if the repo has already evolved a little; document the drift instead of treating it as a failure.

This is distinct from:
- **Case A** — methodology already exists → just absorb it.
- **Case B** — empty repo → generate everything (incl. baseline stack).
- **Case C** — populated repo, no methodology → *reverse-engineer the existing conventions, document the existing stack, add the methodology layer additively.*

## Procedure

### 0. Full-compliance audit (run ALWAYS, especially on a re-entry)

The shallow trap: the repo *already* went through adoption once, so a quick glance says "AGENTS.md exists, looks fine" and you move on. But **the methodology itself (these skills) may have changed since that pass** — new guardrails, the agent-team structure, run-log discipline, updated checklists. A pass that only checks *presence* misses *drift*. Before anything else, run a **full** audit of every methodology element — not a glance.

For each element below, classify it **PRESENT** (exists and matches the current process), **DRIFTED** (exists but an older/partial shape), or **MISSING** (absent), and record the corrective action. Show the user the table — evidence, not assertion.

| # | Element | Check | If not PRESENT |
|---|---|---|---|
| 1 | `AGENTS.md` (root) | exists; sections match current `agents-md-template.md` (Critical Rules, Conventions, Key Commands, **Task Router**, Git/PR Workflow) | DRIFTED → add/realign the missing sections to their REAL stack; MISSING → generate |
| 2 | `CLAUDE.md` → `@AGENTS.md` | exists and references `@AGENTS.md` | add the reference |
| 3 | `.ai/` skeleton | `specs/` (+ `implemented/`, `archived/`), `checklists/`, `adr/`, `backlog.md`, `lessons.md` all present | scaffold only what's missing (idempotent — never overwrite) |
| 4 | local `spec-writing` skill | `.ai/skills/spec-writing/SKILL.md` exists, `## Stack conventions` tuned to THEIR stack | generate / re-tune to current template |
| 5 | checklists | `security.md`, `testing.md`, `deployment.md` present and match current versions | add missing; flag drifted ones as upgrade candidates |
| 6 | stack ADR | an ADR records the existing stack + known gaps vs. baseline | write it if absent |
| 7 | **agent-team structure** | working discipline reflects the current team model — see [`agent-team-structure.md`](./agent-team-structure.md) (lead/worker roles, gates, run log) | document it; this is commonly MISSING on repos adopted before the team model existed |
| 8 | guardrails | verifiable-done via THEIR commands, RED-test-first, adversarial review, behavior-before-diff (`agentic-first-principles.md`) | add as a gap list, not a code rewrite |
| 9 | Git/PR workflow + lessons | `AGENTS.md` Git/PR sections + `.ai/lessons.md` present; CI/hooks aligned to REAL commands | align/add additively |
| 10 | **loop hygiene / session memory** | `.ai/STATE.md` present (five sections, read-at-start + write-before-walking-away in AGENTS.md); live specs' phases carry a binary `Done-when`; gate isolation known (checker sees diff+spec+checklist only, never the maker's narrative) | scaffold STATE.md header + AGENTS.md rules; flag live specs without `Done-when`; document gate isolation |
| 11 | **doc freshness** | every path & command referenced in AGENTS.md / Task Router exists / runs (`repo-done-checklist.md` Freshness check) | doc drift — fix the references (or the missing artifact); a doc that lies actively misleads every future agent |
| 12 | **Framework-Version stamp** | AGENTS.md header carries `Framework-Version:`; compare against the current framework `VERSION` | absent → stamp the current version; older → run **Upgrade mode** below |

```bash
ROOT="$(pwd)"
echo "== methodology elements (PRESENT / MISSING — DRIFTED needs a human read) =="
for f in AGENTS.md CLAUDE.md \
         .ai/backlog.md .ai/lessons.md .ai/STATE.md \
         .ai/skills/spec-writing/SKILL.md \
         .ai/checklists/security.md .ai/checklists/testing.md .ai/checklists/deployment.md; do
  [ -e "$ROOT/$f" ] && echo "PRESENT $f" || echo "MISSING $f"
done
for d in .ai/specs .ai/specs/implemented .ai/specs/archived .ai/adr; do
  [ -d "$ROOT/$d" ] && echo "PRESENT $d/" || echo "MISSING $d/"
done
grep -q "@AGENTS.md" "$ROOT/CLAUDE.md" 2>/dev/null && echo "PRESENT CLAUDE→AGENTS" || echo "MISSING CLAUDE→AGENTS"
grep -qi "Task Router" "$ROOT/AGENTS.md" 2>/dev/null && echo "PRESENT Task-Router section" || echo "DRIFTED/MISSING Task-Router section"
ls "$ROOT/.ai/adr/"*stack* "$ROOT/.ai/adr/"*ADR-001* 2>/dev/null | head -1 | grep -q . && echo "PRESENT stack ADR" || echo "MISSING stack ADR"
```

A bare `PRESENT`/`MISSING` script can't see DRIFT — element 1, 5, 7, 8 need an actual read against the **current** template, not just an `ls`. So: run the script for presence, then **read** AGENTS.md / checklists / working-discipline against today's templates to catch shape drift. The output of Step 0 is a filled table + a short upgrade plan (the DRIFTED/MISSING rows). Then proceed to the steps below to execute it — additively, never rewriting running code.

### Upgrade mode — when the repo's stamped Framework-Version is older than current

The framework improves between projects; without an upgrade path, improvements only reach the
*next* greenfield and the existing portfolio never compounds. When row 12 finds an older stamp:

1. Read the framework `CHANGELOG.md` for every version between the repo's stamp and current —
   that is the **standard delta** (what the methodology added/changed since this repo was
   bootstrapped or last upgraded). `install.sh` ships `VERSION` + `CHANGELOG.md` next to the
   installed skills, so read `~/.claude/skills/CHANGELOG.md` and `~/.claude/skills/VERSION`
   (fall back to this framework repo's root copies if you're running from source).
2. Turn the delta into an upgrade plan: which template sections, checklists, guardrails, or
   `.ai/` artifacts this repo is missing or has in an older shape. Same idempotency rules as
   adoption — **additive only, never overwrite, never touch running code**.
3. **The human approves the delta** before it is applied (upgrades are a key decision — the
   repo may have deliberately diverged; documented drift wins over forced alignment).
4. Apply, re-run the Step 0 audit + the freshness check, update the `Framework-Version:` stamp,
   and record the upgrade in the repo's `.ai/lessons.md` (or an ADR if the delta was architectural).

### 1. Detect & refuse to overwrite
Confirm real app code (`package.json`, `src/`, migrations, tests) and absence of `AGENTS.md`/`.ai/`. Working code wins. Never scaffold over existing source. A methodology-adoption change is **docs + config only** — it must not modify application behavior.

### 2. Reverse-engineer the EXISTING conventions
Read the code to learn how *this* repo actually works — don't assume. Capture:
- Real stack: framework, language, **data layer** (ORM? raw SQL? query builder?), auth, tests, package manager, build.
- Real commands: dev / build / test / lint / typecheck / migrations (the actual scripts in `package.json`).
- Folder layout & routing conventions, how DB access is structured, test patterns, where business logic lives.
The generated `AGENTS.md` must reflect **their** patterns so agents extend the codebase consistently instead of fighting it.

### 3. Document the existing stack — validate mode, NOT recommend mode
`stack-baseline.md` is a recommendation for *empty* repos. Here, run Step 4 in **validate mode**: write the AGENTS.md `## Stack` section to describe **what's actually here** (e.g. Vite + React SPA, Express + TS, raw SQL, Jest), with the real commands.
- Validate against the repo's current conventions, not against a frozen snapshot of the methodology or a "latest" template.
- **Flag gaps** against the baseline only as *optional future ADRs* — never as forced rewrites. (e.g. "no input-validation layer → consider Zod", "no async-webhook worker", "secrets handling".)
- If the repo's workflow/methodology has already been edited since the last pass, capture that as a documented drift note or ADR candidate. Do not fail the adoption just because the repo is not byte-for-byte aligned with the newest global process.
- **Do NOT** propose migrating ORM/framework/auth as part of methodology onboarding. That's a separate, explicitly user-approved decision. The user chose "document existing, don't rewrite."

### 4. Add the methodology layer additively (trimmed Case B — methodology only, no stack generation)
Generate, after a quick confirm:
- `AGENTS.md` (concise, from `agents-md-template.md`) — with the **real** stack/commands/conventions filled in, not the baseline defaults. Adapt the Critical Rules / Conventions / Key Commands sections to what this repo does.
- `CLAUDE.md` → `@AGENTS.md`.
- `.ai/{specs,skills,checklists,adr}` scaffolding + the local `spec-writing` skill from `spec-writing-template.md`, with its `## Stack conventions` block **tuned to their actual stack** (raw SQL / Express / Jest, etc.), not the baseline.
- An **ADR** (`.ai/adr/`) recording: the existing stack as the accepted decision + the known gaps vs. baseline, so any future deviation is deliberate.
- Working discipline (the universal guardrails in `agentic-first-principles.md`): verifiable-done via **their** test/build commands, RED-test-first, security checklist applied as a *gap list*, adversarial review — adopted, not retrofitted by rewriting code.
- `.ai/lessons.md` (institutional memory) + the **Git Workflow** and **PR Workflow** sections in `AGENTS.md` — these apply to any repo. For **pre-commit hooks** and **CI workflow**: if the repo already has them (husky, `.github/workflows/`), *document and align* with what's there; only *add* them if absent, and wire them to the repo's REAL commands — never replace a working CI with the baseline's.

### 5. Verify nothing broke
Run **their** existing test/build after adding the docs (a docs-only change should be green by construction). Show the output. Then hand off to the (now local) `spec-writing` skill for the first real feature.

## The one hard line
**Never change the running stack as part of adoption.** Adapting to agentic-first here means *documenting and adding guardrails around* the existing app — not converting it to the baseline. Stack migration, if ever wanted, is a separate ADR-backed decision the user explicitly approves.

## Quick contrast

| | Case A | Case B | **Case C** |
|---|---|---|---|
| Repo | has methodology | empty | **populated, no methodology** |
| Code | exists | none | **exists — don't touch** |
| Methodology | absorb | generate | **add additively** |
| Stack | platform-fixed | recommend baseline | **document existing (validate mode)** |
| AGENTS.md | read it | from baseline template | **from template, filled with REAL stack/conventions** |
| spec-writing | already there | generate (baseline-tuned) | **generate (tuned to real stack)** |
| Gaps vs baseline | n/a | n/a | **optional future ADRs, never forced** |
