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

**Do NOT create `lessons.md` on a greenfield repo.** It is institutional memory of *corrections*; a brand-new repo has no lessons yet. It appears the first time a real lesson is learned during implementation. (Pre-seeding it is a known anti-pattern — it reads as "memory exists" when it's empty.)

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
echo "== anti-pattern check =="
[ -e "$ROOT/.ai/lessons.md" ] && echo "WARN lessons.md exists on a fresh repo — should be absent until first real lesson" || echo "OK   no premature lessons.md"
```

**Any `MISS` line means bootstrap is NOT done.** Fix it, re-run, then proceed. Do not hand off to spec-writing or implementation with outstanding `MISS` lines.

## Case A / Case C (existing repo)

The list differs — you are *validating* or *adding additively*, not generating a monorepo. Required:
- methodology layer present (`AGENTS.md`/`CLAUDE.md`/`.ai/` — generated in Case C, pre-existing in Case A)
- a local `spec-writing` skill (existing in A; generated, real-stack, in C)
- an ADR recording the existing stack + gaps (Case C)
- the existing test/build still green (you changed docs+config only)
- a design artifact for any UI work in scope (see `sailes-design`)

Never force the baseline monorepo onto a populated repo. Verify the *additive* artifacts exist and that nothing running was modified.
