# Graphify Default Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make [Graphify](https://github.com/Graphify-Labs/graphify) (deterministic tree-sitter knowledge graph of the repo) a **default, always-on component of every Sailes project** — built at bootstrap, kept fresh by git hooks, queried first by agents (explorer, pre-implement, diagnose, adopt) instead of grep.

**Architecture:** The framework **owns the prose and the gates** (AGENTS.md router row, done-checklist rows, agent-role rules); Graphify's **own idempotent installers own the mechanical parts** (`graphify claude install` merges marker-delimited PreToolUse hooks into `.claude/settings.json`; `graphify codex install` writes `.codex/hooks.json` — a separate file from our `.codex/config.toml`, no conflict; `graphify hook install` adds a non-blocking post-commit AST rebuild + a `graph.json` merge driver). Bootstrap gains one new step (4.9 "Code map") that runs them in the right order and degrades gracefully when the binary is missing. Per the framework's TDD-for-skills discipline, every protected behavior gets an `evals/` scenario FIRST (RED), then the edit (GREEN).

**Tech Stack:** graphifyy (PyPI, installed via `uv tool install graphifyy`, CLI command `graphify`), Claude Code + Codex hooks, markdown skills.

## Global Constraints

- Framework repo: `/Users/marcinjablonski/Documents/sailes-app-builder-skill` (git; current `VERSION` = `1.10.1` → this change ships as `1.11.0`).
- Prose language of skills: English (match existing files).
- **Eval-first**: no skill edit without its `evals/` scenario written first (RED baseline recorded), per `evals/README.md`.
- **Idempotent + additive**: never overwrite an existing artifact in generated repos; bootstrap only adds what's missing (invariant #5).
- **Graceful degradation**: a missing `graphify` binary must NEVER block bootstrap or any phase. It prints the one-line install command, records the exception, and continues.
- Bootstrap runs the **code-only** extraction (`graphify extract . --code-only`) — deterministic, free, no API key, works headless. The semantic docs pass is a documented *optional* command, not a bootstrap step.
- Nudge mode, not strict: `graphify claude install` default (soft PreToolUse nudge). `--strict` / `GRAPHIFY_HOOK_STRICT=1` is documented as a per-repo toggle only.
- Known-good version pin: document `graphifyy >= 0.9.24` (the version this integration was validated against) in `graphify-setup.md`; bump deliberately, not implicitly.
- Commit style: `feat:` / `docs:` / `fix:` one-liners, matching `git log` in this repo.
- After all tasks: `./install.sh --force` to refresh `~/.claude/skills/` copies.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `evals/bootstrap-generates-code-map.md` | Create | Protects: bootstrap produces the graph + hooks on disk |
| `evals/explorer-prefers-graph-over-grep.md` | Create | Protects: explorer queries the graph before grepping |
| `evals/adopt-builds-graph-before-convention-audit.md` | Create | Protects: Route C builds the map before reverse-engineering |
| `skills/sailes-bootstrap/graphify-setup.md` | Create | The single reference for the whole Graphify procedure (commands, order, fallbacks, freshness rules) |
| `skills/sailes-bootstrap/SKILL.md` | Modify | New Step 4.9 + reference-file list + Common Mistakes row |
| `skills/sailes-bootstrap/repo-done-checklist.md` | Modify | New mandatory artifact rows + verification-block lines |
| `skills/sailes-bootstrap/agents-md-template.md` | Modify | Task Router row + Key Commands line for generated repos |
| `skills/sailes-bootstrap/skeleton.md` | Modify | `.gitignore` / `.claudeignore` additions in the skeleton |
| `skills/sailes-bootstrap/adopt-existing-repo.md` | Modify | Route C: graph build precedes the convention audit |
| `agents/explorer.md` | Modify | Graph-first recon; `Bash` added to tools (graph CLI only) |
| `skills/sailes-pre-implement/SKILL.md` | Modify | Mechanical BC probe via `graphify path` / `explain` |
| `skills/sailes-diagnose/probe-patterns.md` | Modify | Graph probes as a diagnosis pattern |
| `README.md` (repo root) | Modify | Machine prerequisite: `uv tool install graphifyy` |
| `skills/README.md` | Modify | Bootstrap key-files line + one pipeline note |
| `CHANGELOG.md`, `VERSION`, `package.json` | Modify | `1.11.0` |

### Verified integration facts (do not re-derive)

- `graphify claude install` **merges** into `.claude/settings.json`: loads existing JSON, filters prior graphify entries (matchers `Bash|Grep`, `Read|Glob`), appends its own (`graphify/install.py:1669-1688`). It also appends a marker-delimited `## graphify` section to `CLAUDE.md`. It does NOT touch `permissions.*`.
- `graphify codex install` writes AGENTS.md section + merges `.codex/hooks.json` (`install.py:1363-1391`) — our Codex guardrails live in `.codex/config.toml`, so **no file collision**.
- `graphify hook install` installs marker-delimited `post-commit` + `post-checkout` git hooks (background, AST-only, `GRAPHIFY_SKIP_HOOK=1` opt-out) + a union-merge driver for `graph.json` (`graphify/hooks.py:634-657`).
- `graphify extract . --code-only` needs no API key and no LLM.
- `graphify-out/` is designed to be committed (team-shared map); `graphify-out/cost.json` is local-only; `graph.json`/`graphify-out/` must be in `.claudeignore` or every rebuild invalidates the Claude Code prompt cache.

---

### Task 1: Eval — bootstrap generates the code map (RED)

**Files:**
- Create: `evals/bootstrap-generates-code-map.md`

**Interfaces:**
- Produces: the persisted scenario Task 3 must turn GREEN.

- [ ] **Step 1: Write the eval scenario**

```markdown
# Eval: bootstrap generates the code map (graphify) and proves it on disk

Skill under test:   `sailes-bootstrap` (Step 4.9 + `graphify-setup.md` + `repo-done-checklist.md`)
Setup:              Give a fresh subagent the sailes-bootstrap skill and a Case B task ("bootstrap
                    this empty repo for a small B2B tool; stack already confirmed as the baseline").
                    The machine has `graphify` on PATH. Observe the steps it announces/runs and the
                    final checklist output.
Expected (binary):  Before handoff it (a) runs `graphify extract . --code-only`, (b) runs
                    `graphify hook install`, (c) runs `graphify claude install` AFTER
                    `.claude/settings.json` exists, and (d) the verification block reports
                    `graphify-out/graph.json` + the post-commit hook as OK (or an explicit SKIP
                    line naming the missing binary — never silence).
Failure looks like: Bootstrap finishes with no `graphify-out/`, no git hook, and the done-checklist
                    never mentions the code map (the pre-1.11.0 baseline: graphify was not part of
                    the framework at all).
Last run:           2026-07-22 · RED (baseline) · skill has no Step 4.9 yet.
```

- [ ] **Step 2: Record the RED baseline**

Dispatch the `Setup` prompt to a fresh subagent with the CURRENT (unedited) `sailes-bootstrap` skill. Confirm the output never mentions graphify. Keep the `Last run` line as RED.

- [ ] **Step 3: Commit**

```bash
git add evals/bootstrap-generates-code-map.md
git commit -m "test: RED eval — bootstrap must generate the graphify code map"
```

---

### Task 2: The `graphify-setup.md` reference file

**Files:**
- Create: `skills/sailes-bootstrap/graphify-setup.md`

**Interfaces:**
- Produces: the procedure Step 4.9 (Task 3), `repo-done-checklist.md` (Task 4), and `adopt-existing-repo.md` (Task 7) all point at. Section anchors used by later tasks: `## The procedure`, `## If graphify is missing`, `## Freshness rules`, `## Optional upgrades`.

- [ ] **Step 1: Write the file** (complete content):

````markdown
# Graphify Setup — the default code map of every Sailes repo

Every Sailes repo carries a queryable knowledge graph of its own code
(`graphify-out/graph.json`), built deterministically from tree-sitter AST — free, local,
no API key. Agents query it (`graphify query|path|explain`) instead of grepping; a git
post-commit hook keeps it fresh at zero cost. Validated against `graphifyy >= 0.9.24`
(PyPI package is `graphifyy`, double-y; the CLI command is `graphify`).

## The procedure (bootstrap Step 4.9 — run in THIS order)

Order matters: (1) our `.claude/settings.json` must already exist so graphify MERGES
into it (it does — it filters+appends only its own marker-delimited hook entries and
never touches `permissions.*`); (2) the first extraction must precede `hook install`
so the hook has a graph to update; (3) the commit comes last so the team map ships.

```bash
# 0) Binary present? (machine prereq: uv tool install graphifyy)
command -v graphify >/dev/null || echo "MISSING graphify — see 'If graphify is missing'"

# 1) Build the map — deterministic AST pass, no LLM, no key
graphify extract . --code-only

# 2) Keep it fresh — post-commit + post-checkout hooks (background, AST-only)
#    + a union-merge driver so graph.json never gets conflict markers
graphify hook install

# 3) Claude Code always-on: CLAUDE.md section + PreToolUse nudge hooks
#    (merges into the existing .claude/settings.json; nudge mode, NOT --strict)
graphify claude install

# 4) Codex twin: AGENTS.md section + .codex/hooks.json
#    (separate file from our .codex/config.toml — no conflict)
graphify codex install
```

Then wire the ignore files (add, don't overwrite):

```bash
# .gitignore — the map is committed, its local by-products are not
printf '%s\n' 'graphify-out/cost.json' 'graphify-out/cache/' >> .gitignore

# .claudeignore — REQUIRED: without this every rebuild invalidates the
# Claude Code prompt cache (full re-upload at cache-write rates)
printf '%s\n' 'graphify-out/' 'graph.json' >> .claudeignore
```

Finally commit the map with the bootstrap commit(s):

```bash
git add graphify-out/ .gitignore .claudeignore .claude/settings.json CLAUDE.md AGENTS.md .codex/
git commit -m "chore: graphify code map + freshness hooks (Sailes default)"
```

## If graphify is missing

NEVER block the phase. In order:
1. Tell the user the one-liner: `uv tool install graphifyy` (fallback: `pipx install graphifyy`).
   If they run it, continue the procedure.
2. If it cannot be installed now (offline, no uv/pipx, CI image): record
   `Open failure: graphify not installed — code map skipped at bootstrap` in `.ai/STATE.md`,
   let the done-checklist print `SKIP graphify (binary missing)` — an explicit line, never
   silence — and move on. The procedure is re-runnable any time later, verbatim.

## Freshness rules (why agents may trust the graph)

- The post-commit hook rebuilds AST-only in the background — `sailes-implement`
  commits per step, so the graph tracks implementation automatically.
- Agents treat the graph as CURRENT if `git log -1 --format=%ct` is not newer than
  `graphify-out/graph.json`'s mtime by more than one commit; otherwise run
  `graphify update .` first (seconds, free) or fall back to grep for that question.
- A refactor that DELETED files can leave ghost nodes: `graphify extract . --code-only --force`.

## Optional upgrades (documented, not bootstrap steps)

- **Semantic docs pass** (links `.ai/` specs/ADRs ↔ code as rationale nodes; uses the IDE
  session's model): run `/graphify .` at a milestone — e.g. the release gate — not per-commit.
- **Strict mode** (block the first raw source read per session, then revert to nudge):
  `GRAPHIFY_HOOK_STRICT=1`, or reinstall with `graphify install --project --strict`. Per-repo
  choice; the Sailes default stays nudge.
- **PR impact**: `graphify prs --conflicts` (merge-order risk by shared graph communities)
  when the repo lives on GitHub.
- **Architecture doc**: `graphify export callflow-html` → commit under `docs/` if the client
  wants a browsable architecture page.

## Uninstall (for completeness)

`graphify claude uninstall && graphify codex uninstall && graphify hook uninstall` — all
marker-delimited, all reversible. `graphify uninstall --purge` also deletes `graphify-out/`.
````

- [ ] **Step 2: Commit**

```bash
git add skills/sailes-bootstrap/graphify-setup.md
git commit -m "feat(bootstrap): graphify-setup.md — default code-map procedure"
```

---

### Task 3: Bootstrap SKILL.md — Step 4.9 "Code map"

**Files:**
- Modify: `skills/sailes-bootstrap/SKILL.md` (insert new section between `## Step 4.5 — Design gate` (line ~76) and `## Step 5 — Handoff` (line ~84); extend the `Reference files:` paragraph (line ~102); add one `Common Mistakes` row (section at line ~104))

**Interfaces:**
- Consumes: `graphify-setup.md` anchors from Task 2.

- [ ] **Step 1: Insert the new step** (exact text, after the Step 4.5 section ends):

```markdown
## Step 4.9 — Code map (graphify) — DEFAULT for every repo

Every Sailes repo ships with a queryable knowledge graph of its own code. Follow
`graphify-setup.md` → “The procedure” **verbatim and in order** (extract → hook install →
claude install → codex install → ignore files → commit). Deterministic AST pass — free,
local, no API key.

- Runs AFTER `.claude/settings.json` exists (graphify merges its hooks into it).
- Binary missing? Follow “If graphify is missing” — one-line install hint, else an explicit
  `SKIP` recorded in `.ai/STATE.md` and in the done-checklist output. **Never block, never
  skip silently.**
- Case C (adopt): the same procedure runs even earlier — see `adopt-existing-repo.md` step 2,
  the graph is built BEFORE reverse-engineering conventions.
```

- [ ] **Step 2: Extend the reference-files paragraph** — in the `Reference files:` list (line ~102), append:

```
· `graphify-setup.md` (Step 4.9 — default code map: build, freshness hooks, Claude/Codex always-on, fallbacks)
```

- [ ] **Step 3: Add the Common Mistakes row** (table in `## Common Mistakes`):

```markdown
| Handing off with no code map (or silently skipping it) | Run Step 4.9 (`graphify-setup.md`); a missing binary yields an explicit SKIP in the checklist, never silence. |
```

- [ ] **Step 4: Re-run eval → GREEN**

Dispatch `evals/bootstrap-generates-code-map.md` Setup to a fresh subagent with the edited skill. Expect (a)–(d) to hold. Update its `Last run:` to `2026-07-22 · PASS · Step 4.9 added (1.11.0)`.

- [ ] **Step 5: Commit**

```bash
git add skills/sailes-bootstrap/SKILL.md evals/bootstrap-generates-code-map.md
git commit -m "feat(bootstrap): Step 4.9 — graphify code map is a default artifact"
```

---

### Task 4: Done-checklist — the map is a verified artifact

**Files:**
- Modify: `skills/sailes-bootstrap/repo-done-checklist.md` (Case B artifact table + verification block)

- [ ] **Step 1: Add two rows to the Case B artifact table** (after the `.github/copilot-instructions.md` row):

```markdown
| `graphify-out/graph.json` (committed) + `.claudeignore` covering `graphify-out/` | The code map every agent queries before grepping (Step 4.9). `.claudeignore` guard: without it each rebuild invalidates the Claude Code prompt cache. If the binary was unavailable, an explicit SKIP recorded in `.ai/STATE.md` replaces this row — silence is the failure. |
| graphify git hooks installed (`graphify hook status`) | Freshness: post-commit AST rebuild + `graph.json` merge driver. A stale map that agents trust is worse than no map. |
```

- [ ] **Step 2: Extend the verification block** — append inside the ```bash block, after the `== git ==` lines:

```bash
echo "== code map (graphify — Step 4.9) =="
if command -v graphify >/dev/null 2>&1; then
  [ -e "$ROOT/graphify-out/graph.json" ] && echo "OK   graphify-out/graph.json" || echo "MISS graphify-out/graph.json (run graphify-setup.md procedure)"
  grep -q "graphify-out" "$ROOT/.claudeignore" 2>/dev/null && echo "OK   .claudeignore covers graphify-out/" || echo "MISS .claudeignore entry"
  graphify hook status 2>/dev/null | grep -qi "installed" && echo "OK   freshness hooks" || echo "MISS graphify hook install"
else
  echo "SKIP graphify (binary missing — uv tool install graphifyy; record in .ai/STATE.md)"
fi
```

- [ ] **Step 3: Commit**

```bash
git add skills/sailes-bootstrap/repo-done-checklist.md
git commit -m "feat(bootstrap): done-checklist verifies the graphify code map on disk"
```

---

### Task 5: Generated-repo templates — router row, commands, ignores

**Files:**
- Modify: `skills/sailes-bootstrap/agents-md-template.md` (`## Task Router` table, line ~150; `## Key Commands`, line ~105)
- Modify: `skills/sailes-bootstrap/skeleton.md` (`## Key implementation rules`, line ~104)

- [ ] **Step 1: Task Router row** — add as the FIRST row of the router table (recon precedes every other task type):

```markdown
| Codebase question / recon ("where is X", "what connects A to B") | `graphify query "<question>"` · `graphify path A B` · `graphify explain X` (map at graphify-out/; check freshness per graphify-setup.md, fall back to grep when stale/missing) |
```

- [ ] **Step 2: Key Commands line** — add to the `## Key Commands` list:

```markdown
- `graphify update .` — refresh the code map after edits (post-commit hook does this automatically; run manually before querying mid-task)
```

- [ ] **Step 3: skeleton.md** — append to `## Key implementation rules`:

```markdown
- **Code map ignores:** `.gitignore` gets `graphify-out/cost.json` + `graphify-out/cache/`;
  `.claudeignore` gets `graphify-out/` + `graph.json` (prompt-cache guard). The map itself
  (`graphify-out/graph.json`, `GRAPH_REPORT.md`) IS committed — it is the team's shared map.
```

- [ ] **Step 4: Commit**

```bash
git add skills/sailes-bootstrap/agents-md-template.md skills/sailes-bootstrap/skeleton.md
git commit -m "feat(bootstrap): generated repos route recon through the graphify map"
```

---

### Task 6: Explorer goes graph-first (eval RED → edit → GREEN)

**Files:**
- Create: `evals/explorer-prefers-graph-over-grep.md`
- Modify: `agents/explorer.md`

- [ ] **Step 1: Write the eval (RED first)**

```markdown
# Eval: explorer queries the code map before grepping when a graph exists

Skill under test:   `agents/explorer.md`
Setup:              Give a fresh explorer subagent a recon task ("map everything the invoicing
                    module touches, file:line") in a repo that CONTAINS graphify-out/graph.json
                    (mention the file listing, not its meaning). Observe the first recon actions.
Expected (binary):  Its first recon action is `graphify query`/`path`/`explain` (Bash), and its
                    report cites graph results alongside file:line evidence; grep/glob appear only
                    as follow-up or fallback — not as the first move.
Failure looks like: Explorer greps from the start and never touches the map (pre-1.11.0 baseline:
                    explorer had no Bash tool and no graph rule).
Last run:           2026-07-22 · RED (baseline) · explorer.md has no graph rule yet.
```

- [ ] **Step 2: Record RED** — dispatch Setup against the current `agents/explorer.md`; confirm grep-first; keep RED line.

- [ ] **Step 3: Edit `agents/explorer.md`** — three exact changes:

(a) frontmatter tools line:
```yaml
tools: Glob, Grep, Read, WebFetch, Bash
```

(b) under `## You do`, add as the FIRST bullet:
```markdown
- **Graph first:** if `graphify-out/graph.json` exists and is fresh (see graphify-setup.md
  freshness rules), open recon with `graphify query "<question>"` / `graphify path A B` /
  `graphify explain X` and cite the results; grep/glob are the follow-up and the fallback,
  not the first move.
```

(c) under `## You never`, add:
```markdown
- Use Bash for anything other than read-only `graphify query|path|explain|update .` — you are
  strictly read-only; the graph CLI is the single Bash exception.
```

- [ ] **Step 4: Re-run eval → GREEN**, update `Last run:` to `2026-07-22 · PASS · graph-first rule added (1.11.0)`.

- [ ] **Step 5: Commit**

```bash
git add evals/explorer-prefers-graph-over-grep.md agents/explorer.md
git commit -m "feat(explorer): graph-first recon — query the code map before grepping"
```

---

### Task 7: Route C (adopt) builds the graph before the convention audit

**Files:**
- Create: `evals/adopt-builds-graph-before-convention-audit.md`
- Modify: `skills/sailes-bootstrap/adopt-existing-repo.md` (`### 2. Reverse-engineer the EXISTING conventions`, line ~81)

- [ ] **Step 1: Write the eval (RED first)**

```markdown
# Eval: adopting an existing repo builds the code map BEFORE reverse-engineering conventions

Skill under test:   `sailes-bootstrap` / `adopt-existing-repo.md`
Setup:              Give a fresh subagent the bootstrap skill and a Case C task ("adopt this
                    existing 40k-LOC repo into the Sailes standard"). graphify is on PATH.
                    Observe the announced order of step 2.
Expected (binary):  Step 2 starts with `graphify extract . --code-only` and uses
                    GRAPH_REPORT.md god nodes/communities (+ query/path) as the skeleton of the
                    convention audit — before any manual file-walk; and Step 4.9 still runs
                    (hooks, claude/codex install, ignores) so the adopted repo ends map-equipped.
Failure looks like: The subagent walks directories and greps for conventions with no map
                    (pre-1.11.0 baseline), spending the session budget on orientation.
Last run:           2026-07-22 · RED (baseline) · adopt has no graph step yet.
```

- [ ] **Step 2: Record RED** — dispatch Setup against the current file; keep RED line.

- [ ] **Step 3: Edit `adopt-existing-repo.md`** — at the TOP of `### 2. Reverse-engineer the EXISTING conventions`, insert:

```markdown
**2.0 Build the map first.** Run `graphify extract . --code-only` (deterministic AST, free —
this is where the graph pays the most: an unfamiliar codebase). Read
`graphify-out/GRAPH_REPORT.md`: god nodes = the load-bearing concepts, communities = the real
module boundaries (which may not match the directory layout). Use `graphify query`/`path` to
answer the audit questions below instead of walking directories. Then complete the standard
Step 4.9 wiring (`graphify-setup.md`: hook install → claude install → codex install → ignores →
commit) so the adopted repo ends up map-equipped like a greenfield one. Binary missing → the
same explicit-SKIP fallback as Step 4.9.
```

- [ ] **Step 4: Re-run eval → GREEN**, update `Last run:`.

- [ ] **Step 5: Commit**

```bash
git add evals/adopt-builds-graph-before-convention-audit.md skills/sailes-bootstrap/adopt-existing-repo.md
git commit -m "feat(adopt): build the graphify map before the convention audit (Route C)"
```

---

### Task 8: Pre-implement + diagnose gain mechanical graph probes

**Files:**
- Modify: `skills/sailes-pre-implement/SKILL.md` (the BC-impact analysis section — locate the section headed by BC/backward-compatibility impact)
- Modify: `skills/sailes-diagnose/probe-patterns.md` (append one pattern)

No new eval: these are additive probe options, not protected orderings — the existing diagnose eval (`diagnose-runs-live-case-before-audit.md`) still governs order-of-operations there. Re-run it after the edit since it names the skill.

- [ ] **Step 1: `sailes-pre-implement/SKILL.md`** — inside the BC-impact analysis instructions, add:

```markdown
**Mechanical BC probe (when `graphify-out/graph.json` exists):** for every surface the spec
touches, run `graphify explain "<symbol>"` (its full in/out edge list = the real blast radius)
and `graphify path "<changed thing>" "<suspected dependent>"` for each risky pair. Paste the
edge lists into the readiness report as evidence — cited edges, not prose claims. Freshness
check first (graphify-setup.md); a stale graph is not evidence.
```

- [ ] **Step 2: `sailes-diagnose/probe-patterns.md`** — append:

```markdown
## Graph probe (when the repo has graphify-out/graph.json)

Mechanism tracing without spelunking: `graphify path "<symptom site>" "<suspected cause>"`
returns the concrete hop chain (each edge tagged EXTRACTED/INFERRED — cite the tag; INFERRED
edges are hypotheses, not evidence). `graphify explain "<component>"` lists everything that
can reach it — a fast falsification source for "nothing else touches this" claims. Read-only,
local, safe on production incident work. Verify freshness first (`graphify update .` is
AST-only and free); never build evidence on a stale graph.
```

- [ ] **Step 3: Re-run `evals/diagnose-runs-live-case-before-audit.md`** (it names sailes-diagnose) — expect PASS unchanged; update its `Last run:` line.

- [ ] **Step 4: Commit**

```bash
git add skills/sailes-pre-implement/SKILL.md skills/sailes-diagnose/probe-patterns.md evals/diagnose-runs-live-case-before-audit.md
git commit -m "feat: graph probes in pre-implement BC analysis and diagnose patterns"
```

---

### Task 9: Framework docs + version + local install

**Files:**
- Modify: `README.md` (repo root — after the install methods, add a machine-prerequisites note)
- Modify: `skills/README.md` (bootstrap row key-files list + one line under the pipeline)
- Modify: `CHANGELOG.md`, `VERSION`, `package.json`

- [ ] **Step 1: Root `README.md`** — add after the Codex section:

```markdown
## Machine prerequisite — graphify (the default code map)

Sailes repos ship with a queryable knowledge graph (see
`skills/sailes-bootstrap/graphify-setup.md`). Each dev machine needs the CLI once:

```bash
uv tool install graphifyy   # package is graphifyy (double-y); the command is `graphify`
```

Bootstrap degrades gracefully when it's missing (explicit SKIP, one-line hint), but the
default expectation is: installed on every machine, like git.
```

- [ ] **Step 2: `skills/README.md`** — in the sailes-bootstrap table row, append `graphify-setup.md` to Key files; under the pipeline diagram add:

```markdown
Every repo the pipeline produces carries a graphify code map (built in bootstrap Step 4.9,
kept fresh by post-commit hooks) — explorer, pre-implement, diagnose, and Route C adoption
query it before grepping. See `skills/sailes-bootstrap/graphify-setup.md`.
```

- [ ] **Step 3: Version + changelog**

`VERSION` → `1.11.0`; `package.json` `"version"` → `"1.11.0"`; `CHANGELOG.md` new entry at top:

```markdown
## 1.11.0 — 2026-07-22

- **Graphify is now a default component of every Sailes repo.** Bootstrap Step 4.9 builds a
  deterministic tree-sitter code map (`graphify-out/`), installs freshness git hooks and the
  Claude/Codex always-on nudge, and the done-checklist verifies it on disk (explicit SKIP when
  the binary is missing — never silent). Explorer recons graph-first; pre-implement gains a
  mechanical BC probe; diagnose gains a graph probe pattern; Route C builds the map before the
  convention audit. New reference: `sailes-bootstrap/graphify-setup.md`. New evals:
  bootstrap-generates-code-map, explorer-prefers-graph-over-grep,
  adopt-builds-graph-before-convention-audit.
```

- [ ] **Step 4: Full eval sweep + local install**

Re-run the three new evals (all GREEN) + `discovery-chains-into-bootstrap.md` and `session-start-routes-from-repo-state.md` (they name bootstrap/start — confirm no regression). Update `Last run:` lines. Then:

```bash
./install.sh --force
```

- [ ] **Step 5: Commit**

```bash
git add README.md skills/README.md CHANGELOG.md VERSION package.json evals/
git commit -m "docs: graphify default integration — 1.11.0"
```

---

## Self-Review (done at plan time)

- **Coverage:** "always added" → bootstrap Step 4.9 (Case B) + adopt 2.0 (Case C) + done-checklist gate; "maximum value" → explorer graph-first, pre-implement BC probe, diagnose probe, router row, PR-impact/docs-pass documented as optional upgrades. Freshness, prompt-cache, merge-conflict, missing-binary, and Codex-twin risks each have a concrete mitigation in `graphify-setup.md`.
- **Placeholder scan:** all steps carry exact text/commands; no TBDs.
- **Consistency:** section anchors referenced across tasks (`The procedure`, `If graphify is missing`, freshness rules) are defined in Task 2; version `1.11.0` used consistently; eval filenames match between Tasks 1/6/7 and Task 9's sweep.
- **Deliberately NOT done (YAGNI):** no MCP server in generated repos (CLI via Bash suffices for agents), no `--strict` default, no semantic docs pass in bootstrap (cost/nondeterminism), no `graphify prs` wiring into gates (GitHub-only; documented as optional), no changes to checker/qa/tester (they gate artifacts, not recon).
