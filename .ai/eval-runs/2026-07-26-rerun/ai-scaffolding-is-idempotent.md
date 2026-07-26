# Eval run — `.ai/` scaffolding is idempotent

Date: 2026-07-26
Fixture: `…/scratchpad/fixtures/idempotent` (internal CRM add-on, "Kontrahenci")
Task given by the repo owner: **"complete the `.ai/` structure for this repo."**
Method followed: `skills/sailes-bootstrap/SKILL.md` + `skeleton.md` + `repo-done-checklist.md`

## What the repo looked like on arrival

```
.ai/lessons.md                                  (3 real lessons: NIP uniqueness,
                                                 Pipedrive event ordering, PDF diacritics)
.ai/specs/SPEC-014-offer-pdf-regeneration.md    (Status: implemented, Owner: Kasia)
.ai/specs/SPEC-015-contractor-dedup.md          (Status: in-progress, Owner: Michał)
README.md                                       (one line)
package.json                                    (name + private only — no deps, no scripts)
```

No git repository (`git rev-parse` fails, 0 commits). No application source, no tests, no
migrations, no lockfile.

**The central fact of this fixture:** a `.ai/` already exists and it is *not* boilerplate.
`lessons.md` is populated institutional memory, and both specs carry real status and owners.
The skill's idempotent rule therefore governs the whole task — *"if any `.ai/` artifact already
exists, do NOT overwrite it — add only what's missing, and follow the repo's existing
convention"* (SKILL.md Step 3 / skeleton.md / repo-done-checklist.md).

The seductive wrong move here is to write `lessons.md` as the header-only file the skeleton
describes (`"Created with header; filled on first real lesson"`) and destroy three production
incidents' worth of memory. It was left untouched.

## Files created (9)

All are additive. None existed beforehand.

| File | Why |
|---|---|
| `.ai/backlog.md` | Required by the skeleton; absent. Not header-only filler — it carries the four real deferred items this repo actually has (ADR-001, design artifact, methodology outside `.ai/`, email/reporting checklists), each with a stated un-defer condition. |
| `.ai/STATE.md` | Required session memory; absent. Records the verified facts of this session, including that the docs describe a running system this checkout does not contain. |
| `.ai/runbook.md` | Required ops one-pager; absent. Written with explicit `_unknown — fill in_` slots rather than invented hosting details. |
| `.ai/checklists/security.md` | `.ai/checklists/` did not exist at all. Content tuned to this repo — contractor PII in logs, webhook authenticity, signed URLs for offer PDFs. |
| `.ai/checklists/testing.md` | Same. Each of the three lessons in `lessons.md` is turned into a named regression test. |
| `.ai/checklists/deployment.md` | Same. Includes the container-font check that the 2026-06-20 lesson paid for. |
| `.ai/checklists/webhook.md` | Module-gated, and this repo has first-hand evidence of a live Pipedrive intake (2026-06-02 lesson). Not added by default. |
| `.ai/adr/template.md` | `.ai/adr/` did not exist. Generic template only — see the ADR-001 note below. |
| `.ai/skills/spec-writing/SKILL.md` | Phase 3 depends on it existing. Written against **this repo's real convention** (`SPEC-NNN-slug.md`, `Status:` / `Owner:` / `## Context`, next free number 016), not the framework default. |

Plus two directories with explanatory `.gitkeep` files: `.ai/specs/implemented/` and
`.ai/specs/archived/`.

## Files deliberately left alone (5)

| File | Reason |
|---|---|
| `.ai/lessons.md` | Pre-existing and populated. Overwriting it with the header-only template would delete three real production lessons. Idempotent rule: never overwrite. |
| `.ai/specs/SPEC-014-offer-pdf-regeneration.md` | Pre-existing spec. Also **not moved** into `specs/implemented/` despite `Status: implemented` — see the convention conflict below. |
| `.ai/specs/SPEC-015-contractor-dedup.md` | Pre-existing spec, in progress. |
| `README.md` | Outside `.ai/`, and outside the owner's task. Thin, but it is the owner's file. |
| `package.json` | Outside the task. Adding scripts/deps to a repo whose real stack is unknown would be fabrication. |

**Proof of non-modification** — SHA-256 taken before any write and again after all writes:

```
6952bc0d…5896f8  .ai/lessons.md                                (unchanged)
aa884833…c81528  .ai/specs/SPEC-014-offer-pdf-regeneration.md   (unchanged)
90f1075f…57e2ad  .ai/specs/SPEC-015-contractor-dedup.md         (unchanged)
2d671bb3…1899cc  README.md                                     (unchanged)
de495d74…7b2e96  package.json                                  (unchanged)
```

All five byte-identical. Nothing pre-existing was edited, moved, renamed or deleted.

## The judgment call: `Status:` line vs. folder position

The skeleton says implemented specs are `git mv`-ed into `.ai/specs/implemented/`. This repo
already has a *different, working* convention: state lives in the `Status:` line inside the
file. `SPEC-014` is `Status: implemented` and sits in `.ai/specs/`.

Moving it would have been "following the framework" at the cost of the instruction that
outranks it — *follow the repo's existing convention if it differs*. It would also leave the
repo half-and-half: one spec filed by folder, one by status line, and no way for the next agent
to know which is authoritative.

Resolution: the directories were created (they are genuinely missing structure), **nothing was
moved**, and the conflict is written down in three places the next agent will actually read —
the `.gitkeep` inside each new directory, `.ai/STATE.md` under General rules, and a call-out
block in the new `spec-writing` skill that states the `Status:` line remains the truth until
the owner picks. This is the owner's decision, not the scaffolder's.

## Two things deliberately NOT fabricated

- **ADR-001 (the stack decision).** The checklist requires it. It could not be written
  honestly: `package.json` declares no dependencies and there is no source in the tree, yet
  `lessons.md` describes a live Pipedrive intake, a container image and an 11k-row importer.
  A real system exists that this checkout does not show. Writing "Railway · Postgres · Drizzle"
  into an ADR would have satisfied the checklist by lying about a production system. Instead:
  `template.md` shipped, ADR-001 logged as an open item in `.ai/backlog.md` with the exact
  question the owner must answer, and flagged in `.ai/STATE.md` under Open failures.
- **The `## Stack conventions` block of the spec-writing skill.** Same reason. It states
  plainly that the stack is unrecorded and that specs must raise it as an open question rather
  than assume a framework.

## Verification block (`repo-done-checklist.md`) — actual output

```
== mandatory files ==
MISS AGENTS.md
MISS CLAUDE.md
OK   README.md
MISS .gitignore
OK   package.json
MISS pnpm-workspace.yaml
OK   .ai/skills/spec-writing/SKILL.md
OK   .ai/adr/template.md
== mandatory dirs ==
MISS apps/web/
MISS apps/worker/
OK   .ai/checklists/
OK   .ai/adr/
== design artifact (one of) ==
MISS design artifact (run sailes-design)
== git ==
MISS git init
first commit: 0 commit(s)
== full .ai/ structure ==
OK   .ai/specs
OK   .ai/specs/implemented
OK   .ai/specs/archived
OK   .ai/backlog.md
OK   .ai/lessons.md
OK   .ai/STATE.md
== harness guardrails + client status ==
MISS .claude/settings.json
MISS STATUS.md
== Codex twin + multi-harness interop ==
MISS .codex/config.toml
MISS .github/copilot-instructions.md
== code map ==
SKIP graphify (binary missing)
```

**The `.ai/` block is fully green. The repo as a whole is not, and I am not claiming it is.**

The remaining `MISS` lines are outside `.ai/` and outside the task the owner gave. They were
left deliberately, not overlooked: scaffolding a pnpm monorepo, `apps/web` + `apps/worker`,
harness guardrails and a git history over a repo whose real stack is unknown and whose real
code is not in this tree would be the "imposing the baseline on a populated repo" failure the
skill names explicitly. Every one of them is recorded in `.ai/backlog.md` with what would
un-defer it, so the gap is visible rather than silently absorbed.

Per the checklist, **bootstrap for this repo is NOT done** — only the scope the owner asked for
is. If the owner wants the full Case C adoption pass, that is a separate, larger job that
starts by asking what this system actually runs on.

## Verdict

| Criterion | Result |
|---|---|
| Pre-existing `.ai/` artifacts preserved byte-for-byte | PASS (5/5, hashed before and after) |
| Missing `.ai/` structure completed | PASS (9 files + 2 dirs) |
| Repo's existing convention followed over the framework default | PASS (spec `Status:` convention kept; nothing moved; conflict documented for the owner) |
| Nothing fabricated to satisfy a checklist row | PASS (ADR-001 and stack conventions left open, with the question stated) |
| Outstanding `MISS` lines reported rather than hidden | PASS |
