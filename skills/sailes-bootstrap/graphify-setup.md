# Graphify Setup — the default code map of every Sailes repo

Every Sailes repo carries a queryable knowledge graph of its own code
(`graphify-out/graph.json`), built deterministically from tree-sitter AST — free, local,
no API key. Agents query it (`graphify query|path|explain`) instead of grepping; a git
post-commit hook keeps it fresh at zero cost. Validated against `graphifyy >= 0.9.23`
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

# 5) Portability — REQUIRED before committing: the installers write the ABSOLUTE
#    local binary path (e.g. C:/Users/you/.local/bin/graphify.EXE) into
#    .claude/settings.json and .codex/hooks.json. Both files are committed, so
#    that path would break the hooks on every other machine. Normalize to the
#    bare `graphify` command — it resolves from PATH (uv/pipx put it there).
#    `sed -i` with no backup-suffix argument is GNU-only: BSD/macOS `sed -i`
#    consumes the next argument as that suffix and either errors or silently
#    does the wrong thing, leaving the absolute path committed. Use a temp
#    file + `mv` instead — portable on both, no `uname` branch needed.
for f in .claude/settings.json .codex/hooks.json; do
  if [ -f "$f" ]; then
    sed -E 's#"[^"]*/graphify(\.EXE|\.exe)? #"graphify #g' "$f" > "$f.graphify-tmp" \
      && mv "$f.graphify-tmp" "$f"
  fi
done

# Verify the rewrite actually landed. This defect's failure shape is a silent
# no-op, not a syntax error, so a step with no check here cannot tell "fixed"
# from "did nothing". The pattern below MUST NOT match once the step ran
# correctly — if it still does, the substitution failed and the commit would
# ship an absolute path.
for f in .claude/settings.json .codex/hooks.json; do
  if [ -f "$f" ] && grep -q '"[^"]*/graphify' "$f"; then
    echo "graphify path normalization FAILED in $f — absolute path still present" >&2
    exit 1
  fi
done
```

Then wire the ignore files (add, don't overwrite):

```bash
# .gitignore — the map is committed, its local by-products are not
# The dated snapshot dir is a full duplicate of the map, written on every `graphify update .`.
# Uncommitted it is noise; committed it is a copy of the whole graph per update day.
for l in 'graphify-out/cost.json' 'graphify-out/cache/' 'graphify-out/20*/'; do grep -qxF "$l" .gitignore 2>/dev/null || echo "$l" >> .gitignore; done

# .claudeignore — REQUIRED: without this every rebuild invalidates the
# Claude Code prompt cache (full re-upload at cache-write rates)
for l in 'graphify-out/' 'graph.json'; do grep -qxF "$l" .claudeignore 2>/dev/null || echo "$l" >> .claudeignore; done
```

Finally commit the map with the bootstrap commit(s):

```bash
# .gitattributes carries the union-merge driver `graphify hook install` just registered.
# Omit it and the driver stays on this machine: everyone else still gets conflict markers
# in graph.json — the exact failure it exists to prevent. Found 2026-07-26 by running this.
git add graphify-out/ .gitattributes .gitignore .claudeignore .claude/settings.json CLAUDE.md AGENTS.md .codex/
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
- Agents treat the graph as CURRENT if `graphify-out/graph.json`'s mtime is not older than the
  previous commit's timestamp (`git log -2 --format=%ct | tail -1`) — i.e. at most one commit
  behind, since the post-commit hook rebuilds in the background. Otherwise run
  `graphify update .` first (seconds, free) or fall back to grep for that question.
- A refactor that DELETED files can leave ghost nodes: `graphify extract . --code-only --force`.

## What the map does NOT see — and the one question where that costs you

The graph is built from a tree-sitter AST pass over **application code**. It does not see raw SQL:
migrations, triggers, functions, `CREATE OR REPLACE` bodies. For most recon that is irrelevant.
For one question it is decisive.

> **"Does anything write to table X" searches THREE surfaces:** application code · `.sql` files
> (triggers, functions, `CREATE OR REPLACE`) · the graph. Searching the ORM identifier alone
> returns **"no writers" for a table a database trigger keeps filling**.

Measured 2026-07-30: a table was declared dead — and that claim written into the state file, the
spec, the lessons and the backlog — on the strength of a grep for its Drizzle identifier, while two
raw-SQL triggers were inserting into it. The state file being edited **already carried a warning
that the map cannot see migrations**; the author walked into it while writing the section about
invisible writes. Knowing the limitation is not the same as searching as if you knew it.

**Empirical proof beats grep.** A red test answers "does anything write here" **without assuming
anything about the search surface** — it asks the running system instead of asking your regex.
Where the answer is load-bearing (a table you are about to call dead, a capability you are about
to declare missing), get the red test rather than a better grep.

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
