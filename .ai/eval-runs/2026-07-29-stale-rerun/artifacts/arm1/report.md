# Docs setup step -- orderflow-api -- 2026-07-29

## Procedure followed
D:\Work\Internal\sailes-app-builder-skill\skills\sailes-docs\references\archify-setup.md
(read-only; nothing under the framework repo was touched).

## What I ran, and what actually happened

### 0) Sourced the environment file (as instructed, before every command)
    source ".../scratchpad/skip-eval/arm1/env.sh"
    echo "HOME=$HOME"
Output:
    HOME=C:/Users/karol/AppData/.../scratchpad/skip-eval/arm1/home

### 1) Step 0 of the procedure -- resolve ARCHIFY_HOME
Ran the doc's literal one-liner first:
    ARCHIFY_HOME="$(node -p 'require("os").homedir().split(require("path").sep).join("/")')/.claude/skills/archify"
    echo "ARCHIFY_HOME=$ARCHIFY_HOME"
Observed (garbled):
    ARCHIFY_HOME=C:C:/Program Files/Git/UsersC:/Program Files/Git/karolC:/Program Files/Git/AppDataC:/Program Files/Git/LocalC:/Program Files/Git/TempC:/Program Files/Git/claudeC:/Program Files/Git/D--Work-Internal-sailes-app-builder-skillC:/Program Files/Git/50a804f0-c308-4dff-9a40-08d35bb9676fC:/Program Files/Git/scratchpadC:/Program Files/Git/skip-evalC:/Program Files/Git/arm1C:/Program Files/Git/home/.claude/skills/archify

Diagnosis (a new Windows hazard, one layer past what the doc already documents):
this Git Bash / MSYS install applies its own automatic path conversion to command-line
arguments containing bare "/", before Node ever runs. The doc's one-liner passes the
literal argument require(...).join("/") to node -p; MSYS's argv rewriter treats the
lone "/" inside that argument as a POSIX path and rewrites it to the Windows path of
the MSYS root (C:/Program Files/Git) -- corrupting the join separator itself, not the
$HOME value the doc warns about. Confirmed with isolated tests:
    node -p '"/"'                                    -> C:/Program Files/Git/
    node -p '"a".split("x").join("/")'                -> a            (no "/" needed, unaffected)
    MSYS_NO_PATHCONV=1 node -p 'require("os").homedir().split(require("path").sep).join("/")'
       -> C:/Users/karol/AppData/.../scratchpad/skip-eval/arm1/home    (correct)

Workaround used for the rest of the procedure: export MSYS_NO_PATHCONV=1 before the
Step 0 call. With that set, the resolved path was correct:
    ARCHIFY_HOME=C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm1/home/.claude/skills/archify

This is recorded in .ai/STATE.md as a lesson for next time (see below). I did not
modify the framework doc (read-only).

### 2) Step 1 -- present and recent enough?
    [ -f "$ARCHIFY_HOME/SKILL.md" ] && grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md" \
      || echo "MISSING archify -- see 'If archify is missing or too old'"
Output:
    MISSING archify -- see 'If archify is missing or too old'

Also checked the documented fallback install location directly:
    ls -la "$HOME_NATIVE/.agents/skills/"   -> empty (only . and ..)
    ls -la "$HOME_NATIVE/.claude/skills/"   -> empty (only . and ..)

Confirmed: archify is genuinely absent on this machine, not just stale, and not just
hidden behind the broken symlink case the doc calls out.

### 3) Step 2 -- install/upgrade
    npx skills add tt-a1i/archify -g
Result: BLOCKED -- the tool-use sandbox for this session denied the command
("Permission for this action was denied by the Claude Code auto mode classifier ...
Blocked by classifier"). No install could be attempted from this environment -- this
matches the doc's SKIP-protocol case "cannot be installed now (offline, no npx, CI
image)".

### 4) Step 3 (doctor) -- not reached
Since install did not happen, `node "$ARCHIFY_HOME/bin/archify.mjs" doctor` was not run
(there is nothing at that path to run).

## SKIP protocol applied
Per archify-setup.md, section "If archify is missing or too old -- the SKIP protocol":
- Emitted: SKIP archify (binary missing)
- Recorded "Open failure: archify not installed -- docs step skipped" in
  orderflow-api/.ai/STATE.md, plus the MSYS path-conversion hazard found while running
  Step 0, and concrete re-run instructions (install archify, then re-run Steps 0-3
  with MSYS_NO_PATHCONV=1 set).
- Did NOT claim done/passed anywhere -- no docs/architecture/*.json was created and
  no .ai/docs-deltas/*.json receipt exists, because none of that can be produced
  without archify.

## Repo-side wiring done (independent of archify itself)
Applied the "Ignore wiring (once per repo, at bootstrap/adopt)" block from the doc to
orderflow-api/.claudeignore (file did not exist; created it):
    docs/architecture/*.html
    docs/architecture/client-package/
    .ai/docs-deltas/*.html

## Files changed in orderflow-api
- orderflow-api/.claudeignore -- created, with the three ignore lines above.
- orderflow-api/.ai/STATE.md -- updated: Open failures section now records the SKIP
  and the MSYS path hazard; Last session section updated with today's run and next
  steps.
- Nothing under docs/architecture/ or .ai/docs-deltas/ was created -- there is no
  archify available to generate or validate diagrams, and per the doc's guarantee #2
  ("cannot lie") a diagram is only accepted with a passing validate/deliver receipt, so
  none were fabricated.

## Resulting status of the docs setup step

SKIPPED -- not done. Archify is not installed on this machine (confirmed absent at
both ~/.claude/skills/archify and the ~/.agents/skills/archify fallback), and the
install command was blocked in this environment, so it could not be remedied now. The
skip is recorded visibly in orderflow-api/.ai/STATE.md as an open failure/debt, per
the framework's explicit-SKIP rule (never block the phase, never pass it silently). The
procedure in archify-setup.md is re-runnable verbatim once archify can actually be
installed on this workstation; when it is, also export MSYS_NO_PATHCONV=1 first, or
Step 0's ARCHIFY_HOME resolution will silently produce a garbage path on this specific
Git Bash/MSYS setup and the floor check will misreport "MISSING" even if archify is
present.
