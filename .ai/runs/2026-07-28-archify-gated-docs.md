# Run log — archify-gated-docs (spec 2026-07-28, branch feat/archify-docs)

Session 2026-07-28. Lead: main session (Fable 5). Discovery → spec (approved by the human)
→ pre-implement READY-WITH-FIXES (5 fixes applied) → Phases 1–5 implemented, Phase 6 pending.

## Stand-in record (required by 1.16.1 doctrine)

The five diagram-authoring workers ran as `general-purpose` **stand-ins** with the
`docs-author` role text read from the working tree, model set to Sonnet on the invocation.
Reason: the plugin serves roles from `main`; `docs-author` exists only on this branch, so the
named type resolves nowhere. Consequence, stated so the result is not over-read: these runs
exercised the role's TEXT, not its runtime pins or tool allow-list — the runtime half is graded
only after merge, the same caveat as every stand-in eval.

All five honored the lane in observable behavior: writes landed only under `docs/architecture/`,
nothing was committed, and each report carried a non-empty could-not-establish list.

## Phase 5 deliver receipts (verbatim digests; full JSON in the workers' reports)

| Type | Spec sha256 (bytes) | Artifact sha256 (bytes) | Validation |
|---|---|---|---|
| architecture | 2b12af2e…df28ca (5741) | f9cb4ce0…b248fe (617858) | 9/9 · showcase pass · 0/0 |
| workflow | 5f891087…3ffbbc (7726) | a535d32f…901098 (621602) | 9/9 · showcase pass · 0/0 |
| sequence | a79b1009…421724 (5762) | f1d756e4…20b13e1 (615377) | 9/9 · showcase pass · 0/0 |
| dataflow | 367181d4…a663ad (7272) | 0f8a7931…6df32a (622959) | 9/9 · showcase pass · 0/0 |
| lifecycle | 56c332a2…7bb186 (4301) | 5dd31dc6…8b38e9 (608724) | 9/9 · showcase pass · 0/0 |

Each artifact independently re-checked by the lead: `archify check <html>` → ok, zero issues
(grade the artifact, not the report). Repair rounds: architecture 2, workflow 4, sequence 1,
dataflow 4, lifecycle 2 — every round improving, none stalled.

## Findings reported upward by workers (not fixed — out of their lane and this spec's scope)

1. **`.ai/specs/2026-07-18-prompt-anchor.md` sits in the live root with `Status: RETIRED`** —
   a status outside the canonical five, in the folder that means "live". The retirement record
   is human-authored; whether it moves to `archived/` (and under which canonical status) is the
   human's call. Flagged by the lifecycle worker.
2. **Deliberate simplifications in workflow.json**, named not silent: the three per-phase gates
   are one composite node (col budget 0–5), database|async merged into one node, several edge
   labels dropped in favor of node tags. No factual claim dropped.
3. Label language for the framework's own set: **EN** — the framework's working language; its
   "client" is the Sailes team and all doctrine is EN. Client repos decide per Q22.

## Environment facts

archify 2.12 installed 2026-07-28 via `npx skills add tt-a1i/archify -g` → symlink
`~/.claude/skills/archify` → `~/.agents/skills/archify`; `doctor` → ready. One installer
target (PromptScript) failed global install — irrelevant to Claude Code/Codex use.
