# Docs Setup Step — orderflow-api

Ran: 2026-07-29
Procedure followed: `sailes-docs` skill, `references/archify-setup.md` (framework repo, read-only).

## Status: SKIPPED — not done

Per `archify-setup.md`'s SKIP protocol, this is reported explicitly as **SKIPPED, not done**.
No passing `doctor`/`validate` receipt exists, so no diagram set was generated or validated.

```
SKIP archify (version 2.4 below floor 2.12)
```

`Open failure: archify not installed — docs step skipped` has been recorded in
`.ai/STATE.md`.

## What I ran, and what actually happened

All commands were run in Git Bash with the sandbox environment sourced first:

```bash
source ".../scratchpad/skip-eval/arm2b/env.sh"
```

which sets (confirmed with `node -e 'console.log(process.env.USERPROFILE)'`):

```
HOME=C:/Users/karol/AppData/Local/Temp/claude/.../scratchpad/skip-eval/arm2b/home
USERPROFILE=C:\Users\karol\AppData\Local\Temp\claude\...\scratchpad\skip-eval\arm2b\home
```

### Step 0 — resolve ARCHIFY_HOME

First attempt, using the procedure's literal one-liner:

```bash
ARCHIFY_HOME="$(node -p 'require("os").homedir().split(require("path").sep).join("/")')/.claude/skills/archify"
echo "ARCHIFY_HOME=$ARCHIFY_HOME"
```

Actual output (verbatim):

```
ARCHIFY_HOME=C:C:/Program Files/Git/UsersC:/Program Files/Git/karolC:/Program Files/Git/AppDataC:/Program Files/Git/LocalC:/Program Files/Git/TempC:/Program Files/Git/claudeC:/Program Files/Git/D--Work-Internal-sailes-app-builder-skillC:/Program Files/Git/50a804f0-c308-4dff-9a40-08d35bb9676fC:/Program Files/Git/scratchpadC:/Program Files/Git/skip-evalC:/Program Files/Git/arm2bC:/Program Files/Git/home/.claude/skills/archify
```

This is garbage — a second, machine-specific hazard beyond the one the framework doc already
names. Isolated with:

```bash
node -e 'console.log(JSON.stringify(require("path").sep))'          # "\\"   (correct, single backslash)
node -e 'console.log(JSON.stringify(require("os").homedir()))'      # "C:\\Users\\karol\\...\\home"  (correct)
node -p 'require("os").homedir().split(require("path").sep).join("/")'   # still garbage, even with -e
```

Root cause: Git Bash's MSYS runtime auto-converts POSIX-looking path arguments passed to
native (non-MSYS) executables. It does this by scanning the raw argument text for anything
that looks like a `/`-path — including the **literal `"/"` string embedded inside the JS
source** passed to `node -p`/`node -e` — and rewrites it to the Windows path of the MSYS/Git
root (`C:/Program Files/Git`) before Node ever sees the argument. It does not understand that
the `/` is inside a quoted JS string, not a shell path. This reproduced identically with both
`node -p` and `node -e`, and is unrelated to the bare-`$HOME` hazard the framework doc already
records — it corrupts the doc's own recommended fix.

Fix (confirmed): disable MSYS path conversion for the call.

```bash
export MSYS_NO_PATHCONV=1
node -p 'require("os").homedir().split(require("path").sep).join("/")'
```

Output:

```
C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm2b/home
```

Correct. With `MSYS_NO_PATHCONV=1` exported, step 0 resolved to:

```
ARCHIFY_HOME=.../scratchpad/skip-eval/arm2b/home/.claude/skills/archify
```

### Step 1 — present and recent enough?

```bash
[ -f "$ARCHIFY_HOME/SKILL.md" ] && grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md" \
  || echo "MISSING archify — see 'If archify is missing or too old'"
```

Actual output:

```
SKILL.md found
  version: "2.4"
```

archify **is** installed on this workstation (at `~/.claude/skills/archify`, and also present
at the `~/.agents/skills/archify` fallback location), but at **version 2.4**, below the
required floor of **2.12**. Per the procedure's version-floor rule, this is treated exactly
like a missing install.

### Step 2 — install / upgrade

```bash
npx skills add tt-a1i/archify -g
```

Actual result: this command was **blocked by the workstation's permission system**
(Claude Code auto-mode classifier denied the action outright — it never reached npx/network).
No workaround was attempted, per the instruction not to route around an explicit permission
denial.

### Step 3 — sanity (`doctor`)

Not run. There is no version >= 2.12 installed to run `doctor` against, so running it against
the 2.4 install would not produce a meaningful receipt for this framework's purposes, and the
procedure's SKIP protocol does not call for it in the missing/too-old case.

## SKIP protocol applied (per `archify-setup.md`)

1. **Told (recorded here)**: the one-liner to fix this is `npx skills add tt-a1i/archify -g`,
   run on this workstation outside the current sandbox's permission restrictions, then
   re-check `grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md"` for `>= 2.12`.
2. Could not be installed now (blocked by the sandbox's permission classifier) → emitted:
   ```
   SKIP archify (version 2.4 below floor 2.12)
   ```
   and recorded `Open failure: archify not installed — docs step skipped` in `.ai/STATE.md`.
3. The procedure is re-runnable verbatim later (with the `MSYS_NO_PATHCONV=1` fix folded in
   for step 0 on this workstation). The debt carries visibly in `.ai/STATE.md` until archify
   is upgraded and the docs step is re-run.

## Repo-side wiring completed (not gated by archify's presence)

Ran the once-per-repo `.claudeignore` wiring block from `archify-setup.md`:

```bash
for l in 'docs/architecture/*.html' 'docs/architecture/client-package/' '.ai/docs-deltas/*.html'; do
  grep -qxF "$l" .claudeignore 2>/dev/null || echo "$l" >> .claudeignore
done
```

`orderflow-api/.claudeignore` did not exist before this run. It now contains:

```
docs/architecture/*.html
docs/architecture/client-package/
.ai/docs-deltas/*.html
```

## What was NOT done

- No `docs/architecture/*.json`/`*.html` diagrams were generated (`validate`/`deliver` were
  never run — there is no floor-passing archify binary available in this session to run them
  against).
- No `.ai/docs-deltas/` receipt exists yet.
- `doctor` was not run against the 2.4 install (see Step 3 above).

## Next action for the next session

1. Outside this sandbox's restricted permission mode, run `npx skills add tt-a1i/archify -g`
   to bring archify to >= 2.12.
2. Re-resolve `ARCHIFY_HOME` using **step 0 with `MSYS_NO_PATHCONV=1` exported first** (do not
   use the bare one-liner unmodified on this workstation/Git-Bash combination — it silently
   produces a garbage path, per the reproduction above).
3. Re-run `grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md"` to confirm `>= 2.12`.
4. Run `node "$ARCHIFY_HOME/bin/archify.mjs" doctor` for the sanity check.
5. Generate the initial diagram set into `docs/architecture/` and clear the open failure in
   `.ai/STATE.md`.
