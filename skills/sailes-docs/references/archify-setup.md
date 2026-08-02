# Archify Setup — machine prerequisite for the Sailes docs layer

Archify is a self-contained agent skill (Node CLI + schemas + renderers, no API keys, MIT)
installed **per machine**, never vendored into a repo. Validated floor: **>= 2.12** —
`compare --receipt`, quality profiles, and the delivery snapshot behavior this framework
depends on are verified against 2.12.

## The procedure

```bash
# 0) Resolve the home in a form BOTH the shell and Node accept — see "Why not $HOME" below.
#    Note there is no literal "/" anywhere in the node argument; that is deliberate, not style.
ARCHIFY_HOME="$(node -p "const p=require('path');p.join(require('os').homedir(),'.claude','skills','archify').split(p.sep).join(p.posix.sep)")"

# 1) Present and recent enough? (the floor check reads the installed skill's own metadata)
[ -f "$ARCHIFY_HOME/SKILL.md" ] && grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md" \
  || echo "MISSING archify — see 'If archify is missing or too old'"

# 2) Install / upgrade (same command for both)
npx skills add tt-a1i/archify -g

# 3) Sanity: the CLI answers
node "$ARCHIFY_HOME/bin/archify.mjs" doctor
```

Version floor rule: read `metadata.version` from `$ARCHIFY_HOME/SKILL.md`; anything below
2.12 is treated **exactly like a missing install** — the remedy is the same one-liner.

All framework invocations go through `$ARCHIFY_HOME` as resolved in step 0, never a bare
command and **never a bare `$HOME`**:
`node "$ARCHIFY_HOME/bin/archify.mjs" <validate|deliver|compare|guide> …`

### Why not `$HOME` — the Windows failure, measured

In Git Bash, `$HOME` is an MSYS path (`/c/Users/you`). The shell resolves it, so `[ -f … ]`
and `grep` work and the check looks healthy — but **Node does not**: it reads `/c/Users/…`
as drive-relative and resolves it against the current drive, so
`node "$HOME/.claude/skills/archify/bin/archify.mjs" doctor` dies with
`Cannot find module 'D:\c\Users\…'`. Every CLI call fails on a machine where archify is
installed and passing its own floor check — a failure that reads like a broken tool rather
than a broken path. Measured 2026-07-29 on Windows 11 / Git Bash / Node 24 against a working
archify 2.12; the same MSYS hazard `AGENTS.md` records for hook fixtures. Step 0 resolves the
native path through Node itself and normalizes the separator, so one string serves the shell
and Node on Windows, macOS and Linux alike (on POSIX the split/join is a no-op).

**MSYS breaks it a second, different way — this is why step 0 contains no `/` literal.** Git Bash
rewrites *arguments that look like paths* before the program sees them, and a bare `/` looks like
the MSYS root. The first attempt at this fix read
`node -p '…split(require("path").sep).join("/")'`, and Node received
`.join("C:/Program Files/Git/")`, resolving `ARCHIFY_HOME` to
`C:C:/Program Files/Git/UsersC:/Program Files/Git/karol/…`. **A healthy archify install then reads
as MISSING** — the floor check fails, the SKIP protocol fires, and the docs step is skipped for a
reason that is not true. That is the silent-misdiagnosis failure this whole section exists to
prevent, reintroduced by the fix for it.

Measured 2026-07-29 on Windows 11 / Git Bash / Node 24, and independently rediscovered by four
subagents in the `docs-skip-is-explicit-never-silent` eval run the same day, each of which had to
work around it. It was missed on first authoring because the author had `MSYS_NO_PATHCONV=1`
exported in their own shell — a convenience setting that disables exactly this conversion. **A fix
verified under an environment variable the reader does not have is not verified.**

`p.posix.sep` is the separator with no literal in the argument, which is why step 0 is written the
way it is. Do not "simplify" it back to `.join("/")`.

The install may land outside `~/.claude/skills` — `npx skills add -g` writes to
`~/.agents/skills/archify` and symlinks it into `~/.claude/skills/archify`. The symlink is
what the floor check follows; verified working on Windows 11. If it is absent (symlink
creation is privileged on some Windows setups), point `ARCHIFY_HOME` at
`…/.agents/skills/archify` directly rather than declaring archify missing.

## If archify is missing or too old — the SKIP protocol

NEVER block the phase, and NEVER pass it silently. In order:

1. Tell the user the one-liner: `npx skills add tt-a1i/archify -g`. If they run it,
   re-check the floor and continue.
2. If it cannot be installed now (offline, no npx, CI image): emit the explicit line —
   `SKIP archify (binary missing)` or `SKIP archify (version <found> below floor 2.12)` —
   and record `Open failure: archify not installed — docs step skipped` in `.ai/STATE.md`.
   The docs step is reported **SKIPPED, not done**: no receipt means the diagrams were not
   validated, and saying otherwise is the silent-degradation failure this framework already
   paid for once (the Stryker case, fixed 1.17.1).
3. The procedure is re-runnable any time later, verbatim. A spec closed under SKIP carries
   the debt visibly in STATE.md until someone re-runs the docs step.

## Ignore wiring (once per repo, at bootstrap/adopt)

This block is `docs-author`'s single sanctioned write outside its lane — `agents/docs-author.md`
(and its Codex twin `codex-agents/docs-author.toml`) name `.claudeignore` as one explicit, bounded
exception to "writes land under `docs/architecture/` and `.ai/docs-deltas/` only": one block,
written once per repo, at bootstrap/adopt, never elsewhere.

```bash
# .claudeignore — generated HTML is large and derivable; JSON stays readable to agents
for l in 'docs/architecture/*.html' 'docs/architecture/client-package/' '.ai/docs-deltas/*.html'; do
  grep -qxF "$l" .claudeignore 2>/dev/null || echo "$l" >> .claudeignore
done
```

**What is committed, and what is not — the two directories differ:**

- `docs/architecture/` — **everything, HTML included.** It is the client-facing artifact and must
  survive a machine that lacks archify.
- `.ai/docs-deltas/` — **the `.json` receipt only.** `.gitignore` covers the HTML there. The
  receipt carries the whole proof (both sha256 values and every counter) in ~2 kB; the rendering
  is ~1.8 MB and is produced even when the delta is empty. See `delta-at-gate.md` step 3 for the
  measurement.

`.claudeignore` is a separate mechanism from `.gitignore` and does not overlap with either rule
above: it keeps large derivable files out of the prompt cache, not out of the commit.
