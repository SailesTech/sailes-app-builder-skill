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
