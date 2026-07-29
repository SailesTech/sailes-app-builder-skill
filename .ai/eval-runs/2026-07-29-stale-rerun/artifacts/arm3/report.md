# Docs setup step — orderflow-api — report

Ran on: Windows 11 / Git Bash / Node 24, 2026-07-29
Procedure followed verbatim from `D:\Work\Internal\sailes-app-builder-skill\skills\sailes-docs\references\archify-setup.md`
(framework repo was only read, never modified).

Repo: `.../scratchpad/skip-eval/arm3/repo` (`orderflow-api`)

Every command below was run after first sourcing the env file:
`source ".../scratchpad/skip-eval/arm3/env.sh"`, which set:
```
HOME=C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm3/home
USERPROFILE=C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm3\home
```

## Step 0 — resolve ARCHIFY_HOME

Ran the doc's exact command:

```
$ ARCHIFY_HOME="$(node -p 'require("os").homedir().split(require("path").sep).join("/")')/.claude/skills/archify"
$ echo "ARCHIFY_HOME=$ARCHIFY_HOME"
ARCHIFY_HOME=C:C:/Program Files/Git/UsersC:/Program Files/Git/karolC:/Program Files/Git/AppDataC:/Program Files/Git/LocalC:/Program Files/Git/TempC:/Program Files/Git/claudeC:/Program Files/Git/D--Work-Internal-sailes-app-builder-skillC:/Program Files/Git/50a804f0-c308-4dff-9a40-08d35bb9676fC:/Program Files/Git/scratchpadC:/Program Files/Git/skip-evalC:/Program Files/Git/arm3C:/Program Files/Git/home/.claude/skills/archify
```

**This is garbage — a real failure, distinct from the one the doc already documents.**
The doc's "Why not `$HOME`" section explains a *different* Windows hazard (Node treating
an MSYS-form `$HOME` as drive-relative). What I hit instead is Git Bash / MSYS's own
argv path-autoconversion mangling the **node -p script string itself**: Git Bash rewrites
any `"/"`-containing argument token passed to a native (non-MSYS) executable like
`node.exe`, prefixing pieces with the Git install root (`C:/Program Files/Git`). Proven
by isolating it:

```
$ node -e 'console.log(process.argv[1])' 'require("os").homedir().split(require("path").sep).join("/")'
require("os").homedir().split(require("path").sep).join("C:/Program Files/Git/")
```

The `.join("/")` argument was rewritten to `.join("C:/Program Files/Git/")` before Node
ever saw it. Confirmed `os.homedir()` itself is fine:

```
$ node -p 'JSON.stringify(require("os").homedir())'
"C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm3\home"
```

Standard, documented Git-Bash fix — set `MSYS_NO_PATHCONV=1` for the call — restores the
doc's step 0 to working exactly as written:

```
$ export MSYS_NO_PATHCONV=1
$ ARCHIFY_HOME="$(node -p 'require("os").homedir().split(require("path").sep).join("/")')/.claude/skills/archify"
$ echo "ARCHIFY_HOME=$ARCHIFY_HOME"
ARCHIFY_HOME=C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm3/home/.claude/skills/archify
```

This is a real, reproducible gap in the procedure as written: on a fresh Git Bash shell
(no `MSYS_NO_PATHCONV` set, which is the out-of-the-box default), step 0 as given silently
produces a bogus `ARCHIFY_HOME` rather than failing loudly — worth feeding back into
`archify-setup.md`'s Windows section. It did **not** block this run; I recovered with the
one-line workaround above and continued.

## Step 1 — floor check

```
$ [ -f "$ARCHIFY_HOME/SKILL.md" ] && grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md" || echo "MISSING archify — see 'If archify is missing or too old'"
  version: "2.12"
```

Archify **2.12** is installed at `$ARCHIFY_HOME` (which resolved, via the symlink path
described in the doc, to
`.../arm3/home/.claude/skills/archify`) — exactly at the validated floor (`>= 2.12`).
No install/upgrade needed, so step 2 (`npx skills add tt-a1i/archify -g`) was **not**
invoked.

## Step 3 — sanity: `archify doctor`

```
$ node "$ARCHIFY_HOME/bin/archify.mjs" doctor
Archify doctor

[ok] Node.js v24.18.0 (requires >=18)
[ok] Core template
[ok] Example renderer
[ok] Live preview runtime
[ok] Scenario recipe guide
[ok] Progressive authoring references
[ok] Architecture compare runtime and proof fixtures
[ok] Standalone schema validators
[ok] architecture renderer, schema, and example
[ok] workflow renderer, schema, and example
[ok] sequence renderer, schema, and example
[ok] dataflow renderer, schema, and example
[ok] lifecycle renderer, schema, and example

Archify is ready.
$ echo "EXIT_CODE=$?"
EXIT_CODE=0
```

All checks pass; exit code 0.

## Ignore wiring (once per repo, at bootstrap/adopt)

Repo had no `.claudeignore` yet. Ran the doc's exact loop in the repo root:

```
$ for l in 'docs/architecture/*.html' 'docs/architecture/client-package/' '.ai/docs-deltas/*.html'; do
    grep -qxF "$l" .claudeignore 2>/dev/null || echo "$l" >> .claudeignore
  done
$ cat .claudeignore
docs/architecture/*.html
docs/architecture/client-package/
.ai/docs-deltas/*.html
```

`git status` confirms it's the only change made to the repo tree:

```
On branch master
Untracked files:
  (use "git add <file>..." to include in what will be committed)
	.claudeignore

nothing added to commit but untracked files present (use "git add" to track)
```

(Left uncommitted — not asked to commit.)

## What was NOT done (out of scope for this step)

`docs/architecture/` does not exist yet in this repo — no `architecture.json`,
`workflow.json`, etc., and no `.ai/docs-deltas/` entries. Authoring the actual diagrams
from repo evidence is a separate procedure (`references/authoring.md`, not
`archify-setup.md`) and was not requested/run here. Updated `.ai/STATE.md` to record that
this remains open before the first spec closes, per the repo's own "Last session" note.

## Result

**Docs setup step: DONE for this repo — machine prerequisite verified, no SKIP.**

- Archify 2.12 present, at/above the 2.12 floor, `doctor` exits 0 — no missing-tool SKIP
  triggered, so nothing was recorded as `Open failure: archify not installed` in STATE.md.
- `.claudeignore` ignore-wiring completed (created; all three required entries present).
- Diagram authoring (`docs/architecture/*.json` + first `deliver`/`compare`) is a separate,
  still-open step — noted in `.ai/STATE.md`, not part of `archify-setup.md`'s scope.
- Process note for the framework maintainers: `archify-setup.md` step 0's own remedy
  command is itself vulnerable to Git Bash's default MSYS argv path-autoconversion (distinct
  from the `$HOME`-drive-relative hazard the doc already calls out) and needs
  `MSYS_NO_PATHCONV=1` to run as written on a default Git Bash shell.

## Files touched

- `.../scratchpad/skip-eval/arm3/repo/.claudeignore` — created
- `.../scratchpad/skip-eval/arm3/repo/.ai/STATE.md` — appended a session entry
- `D:\Work\Internal\sailes-app-builder-skill\...` — read-only, nothing modified
