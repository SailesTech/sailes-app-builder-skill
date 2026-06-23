# Case C — Adopt an Existing Repo into Agentic-First (adapt, don't rewrite)

**When:** the repo has real, working application code and a real stack, but NO agentic-first methodology (no `AGENTS.md`/`CLAUDE.md`/`.ai/`), and likely NOT the baseline stack. The user wants to adapt it to the agentic-first way of working.

**Core principle:** *Adapt, don't rewrite.* You overlay methodology (docs, guardrails, working discipline) onto what already works. You do NOT impose the baseline stack, and you do NOT touch running code. The existing code is the source of truth; methodology is **additive only**.

This is distinct from:
- **Case A** — methodology already exists → just absorb it.
- **Case B** — empty repo → generate everything (incl. baseline stack).
- **Case C** — populated repo, no methodology → *reverse-engineer the existing conventions, document the existing stack, add the methodology layer additively.*

## Procedure

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
- **Flag gaps** against the baseline only as *optional future ADRs* — never as forced rewrites. (e.g. "no input-validation layer → consider Zod", "no async-webhook worker", "secrets handling".)
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
