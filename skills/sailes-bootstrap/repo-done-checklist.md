# Repo Definition of Done — VERIFY ON DISK, don't assume

The single biggest failure of bootstrap is *claiming* the repo is set up while artifacts are silently missing (real case: a "finished" project had a spec but no `AGENTS.md`, no `.ai/skills/`, and git was never initialized). **A phase is not done because you intended to create the files. It is done when `find`/`ls`/`git log` prove they exist.**

Run the verification block below **before** you tell the user bootstrap is complete or hand off to spec-writing. Show the user the actual command output — evidence, not assertion (this is the `verifiable-done` discipline applied to scaffolding itself).

## Case B (new/empty repo) — required artifacts

Every item MUST exist on disk. The manifest decides *optional packages*, never these.

| Artifact | Why it's mandatory |
|---|---|
| `AGENTS.md` (root) | The agent contract. Without it every future agent guesses conventions. |
| `CLAUDE.md` → `@AGENTS.md` | Claude entry point. |
| `README.md` | Human entry point. |
| `.ai/skills/spec-writing/SKILL.md` | Phase 3 (spec) depends on it existing, tuned to the locked stack. |
| `.ai/checklists/` (≥ security.md, testing.md, deployment.md) | Working discipline made concrete. |
| `.ai/adr/template.md` + `ADR-001-*` (stack decision) | First architectural decision recorded. |
| `apps/web/` + `apps/worker/` | Worker is mandatory from day one. |
| `package.json` + `pnpm-workspace.yaml` | The monorepo actually resolves. |
| `.gitignore` | Before the first commit. |
| **git initialized + first commit** | A repo with 0 commits is not a working repo. |
| **design artifact** (`design-system/MASTER.md` OR `.ai/specs/ui-spec.md`) | The design phase ran (see `sailes-design`). Missing = the "no frontend project" failure. |
| `.claude/settings.json` (+ hooks) | Harness guardrails: verify-commands allowlist, protected-path denies, SessionStart STATE.md injection. Structural discipline beats agent goodwill. |
| `.codex/config.toml` (Codex twin) | Same guardrails for Codex CLI (sandbox/approval + `[hooks]` reusing `.claude/hooks/*.sh`). A Sailes app must run *guarded*, not just *readable*, under Codex. See `codex-config-template.md`. |
| `.github/copilot-instructions.md` | One-line pointer to `AGENTS.md` — third harness reads the same source of truth. |
| `graphify-out/graph.json` (committed) + `.claudeignore` covering `graphify-out/` | The code map every agent queries before grepping (Step 4.9). `.claudeignore` guard: without it each rebuild invalidates the Claude Code prompt cache. If the binary was unavailable, an explicit SKIP recorded in `.ai/STATE.md` replaces this row — silence is the failure. |
| graphify git hooks installed (proof: marker-delimited post-commit hook in `.git/hooks`; human check `graphify hook status`) | Freshness: post-commit AST rebuild + `graph.json` merge driver. A stale map that agents trust is worse than no map. |
| `STATUS.md` (root, header-only) | Client-readable progress view exists from day one (filled at phase gates). |

**Generate the full `.ai/` structure** — including `specs/` (+ `implemented/`, `archived/`), `backlog.md`, `lessons.md` (header-only; filled on the first real lesson), and `STATE.md` (header-only session memory: Verified facts / General rules / Open failures / Lessons learned / Last session). Present from day one so the convention is visible. **Idempotent:** if any `.ai/` artifact already exists in the repo, do NOT overwrite it — add only what is missing, follow the repo's existing convention.

## Verification block (run it, paste the output)

```bash
ROOT="$(pwd)"   # the project root
echo "== mandatory files =="
for f in AGENTS.md CLAUDE.md README.md .gitignore package.json pnpm-workspace.yaml \
         .ai/skills/spec-writing/SKILL.md .ai/adr/template.md; do
  [ -e "$ROOT/$f" ] && echo "OK   $f" || echo "MISS $f"
done
echo "== mandatory dirs =="
for d in apps/web apps/worker .ai/checklists .ai/adr; do
  [ -d "$ROOT/$d" ] && echo "OK   $d/" || echo "MISS $d/"
done
echo "== design artifact (one of) =="
{ [ -e "$ROOT/design-system/MASTER.md" ] || [ -e "$ROOT/.ai/specs/ui-spec.md" ]; } \
  && echo "OK   design artifact present" || echo "MISS design artifact (run sailes-design)"
echo "== CLAUDE.md points to AGENTS.md =="
grep -q "@AGENTS.md" "$ROOT/CLAUDE.md" 2>/dev/null && echo "OK   CLAUDE.md → @AGENTS.md" || echo "MISS @AGENTS.md reference"
echo "== git =="
git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 && echo "OK   git initialized" || echo "MISS git init"
echo "first commit: $(git -C "$ROOT" rev-list --all --count 2>/dev/null || echo 0) commit(s)"
echo "== full .ai/ structure (idempotent: pre-existing files are fine, never overwritten) =="
for f in .ai/specs .ai/specs/implemented .ai/specs/archived .ai/backlog.md .ai/lessons.md .ai/STATE.md; do
  [ -e "$ROOT/$f" ] && echo "OK   $f" || echo "MISS $f (scaffold it; do not overwrite if it appears later)"
done
echo "== harness guardrails + client status =="
for f in .claude/settings.json STATUS.md; do
  [ -e "$ROOT/$f" ] && echo "OK   $f" || echo "MISS $f"
done
echo "== Codex twin + multi-harness interop =="
for f in .codex/config.toml .github/copilot-instructions.md; do
  [ -e "$ROOT/$f" ] && echo "OK   $f" || echo "MISS $f (Codex/Copilot parity — see codex-config-template.md)"
done
# .codex/config.toml must reference hook scripts that actually exist (no drift)
if [ -e "$ROOT/.codex/config.toml" ]; then
  grep -oE '\.claude/hooks/[A-Za-z0-9_.-]+\.sh' "$ROOT/.codex/config.toml" | sort -u | while read -r s; do
    [ -e "$ROOT/$s" ] && echo "OK   .codex refs $s" || echo "DRIFT .codex/config.toml references missing $s"
  done
fi
echo "== code map (graphify — Step 4.9) =="
if command -v graphify >/dev/null 2>&1; then
  [ -e "$ROOT/graphify-out/graph.json" ] && echo "OK   graphify-out/graph.json" || echo "MISS graphify-out/graph.json (run graphify-setup.md procedure)"
  grep -q "graphify-out" "$ROOT/.claudeignore" 2>/dev/null && echo "OK   .claudeignore covers graphify-out/" || echo "MISS .claudeignore entry"
  { [ -f "$ROOT/.git/hooks/post-commit" ] && grep -q graphify "$ROOT/.git/hooks/post-commit"; } && echo "OK   freshness hooks (post-commit)" || echo "MISS graphify hook install"
else
  echo "SKIP graphify (binary missing — uv tool install graphifyy; record in .ai/STATE.md)"
fi
```

**Any `MISS` line means bootstrap is NOT done.** Fix it, re-run, then proceed. Do not hand off to spec-writing or implementation with outstanding `MISS` lines.

## Environment block — time-to-verdict (verify once the app skeleton runs)

Agent productivity is dominated by how fast and unambiguously the environment says "wrong".
Verify these with outputs pasted (at bootstrap completion for the skeleton; re-verify when the
first real feature lands):

```text
[ ] ONE-COMMAND BOOT: clean clone → running app WITH seeded data via a single documented
    command (e.g. `pnpm setup && pnpm dev`). Paste the command + proof it serves.
[ ] FIXTURE USERS: at least one seeded user PER RBAC ROLE (+ realistic minimal dataset) —
    qa can always log in and exercise real flows. `qa` blocked on creds = ENV-DEFECT, a
    bootstrap bug, never a skipped proof (see agent-team-structure.md).
[ ] FAST VERDICT: a single `check` command (typecheck+lint+unit) exists; record its measured
    wall time. Document how to run ONE test file / ONE test (targeted verdicts, not the world).
[ ] .env.example COMPLETE: every variable the app reads, with safe defaults or clear
    placeholders (no real values).
```

## Freshness check — docs that lie are worse than none

Every file path and command referenced in `AGENTS.md` (incl. the Task Router) must exist / run.
Scriptable pass — failures are **doc drift** and block "done":

```bash
# paths referenced in AGENTS.md exist
grep -oE '[A-Za-z0-9_./-]+\.(md|ts|tsx|json|yml)' AGENTS.md | sort -u | while read -r p; do
  [ -e "$p" ] || echo "DRIFT: AGENTS.md references missing path $p"
done
# commands referenced in Key Commands exist as package scripts
grep -oE 'pnpm [a-z:-]+' AGENTS.md | sort -u | sed 's/pnpm //' | while read -r s; do
  grep -q "\"$s\"" package.json || echo "DRIFT: AGENTS.md references missing script $s"
done
```

Run it at bootstrap handoff and again whenever closing a spec (it is also the payload of any
periodic maintenance pass). A `DRIFT` line means the doc is actively misleading future agents.

## Operations block — before PRODUCTION launch (with the release checklist)

Building it is half the deliverable; running it is the other half. Required for a production
client app (prototype: warn, like the security checklist). All verified with output pasted:

```text
[ ] ERROR TRACKING wired AND ALERTING A HUMAN CHANNEL (a silent Sentry is decoration).
    Default category: error tracking (Sentry); prove one test event reached the channel.
[ ] /health ENDPOINT covering app + DB + worker/queue; returns non-200 when a dependency is down.
[ ] BACKUPS scheduled AND ONE RESTORE ACTUALLY PERFORMED into a scratch environment — paste
    the restore output. An untested backup is a hope, not a backup.
[ ] UPTIME CHECK on the public URL (alerting the same human channel).
[ ] .ai/runbook.md one-pager filled: where it's deployed, how to see logs, restart, restore,
    who to call.
```

This block is also the standardized deliverable of a maintenance contract — "we run it for
you" as a product, not a favor.

## Case A / Case C (existing repo)

The list differs — you are *validating* or *adding additively*, not generating a monorepo. Required:
- methodology layer present (`AGENTS.md`/`CLAUDE.md`/`.ai/` — generated in Case C, pre-existing in Case A)
- harness guardrails present for both harnesses in scope: `.claude/settings.json` and (default) `.codex/config.toml` sharing `.claude/hooks/*.sh` — added additively in Case C, validated in Case A
- a local `spec-writing` skill (existing in A; generated, real-stack, in C)
- an ADR recording the existing stack + gaps (Case C)
- the existing test/build still green (you changed docs+config only)
- a design artifact for any UI work in scope (see `sailes-design`)
- The repo's current conventions are documented as they exist now; minor drift from the newest global process is acceptable if it is described in the docs/ADR instead of being treated as a mismatch.

Never force the baseline monorepo onto a populated repo. Verify the *additive* artifacts exist and that nothing running was modified.
