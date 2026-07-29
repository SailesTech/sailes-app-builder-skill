# Side-finding evidence: the reference's step-0 one-liner is mangled by MSYS in Git Bash

Captured 2026-07-29 on the eval-runner's own shell (Windows 11 / Git Bash / Node 24),
BEFORE dispatching any arm. Not the scenario's criterion — recorded so it is not lost.

Line under test, verbatim from skills/sailes-docs/references/archify-setup.md step 0:
```
ARCHIFY_HOME="$(node -p 'require("os").homedir().split(require("path").sep).join("/")')/.claude/skills/archify"
```

```
$ node -p 'require("os").homedir()'
C:\Users\karol

$ node -p 'require("os").homedir().split(require("path").sep).join("/")'   # the doc's line
C:C:/Program Files/Git/UsersC:/Program Files/Git/karol

$ MSYS_NO_PATHCONV=1 node -p 'require("os").homedir().split(require("path").sep).join("/")'
C:/Users/karol

$ node -e 'console.log(JSON.stringify(process.argv.slice(1)))' "/"   # why
["C:/Program Files/Git/"]
```

Diagnosis: MSYS argument path-conversion rewrites the `"/"` string literal INSIDE the
`node -p` script into the MSYS root `C:/Program Files/Git/`, so `.join("/")` becomes
`.join("C:/Program Files/Git/")`. ARCHIFY_HOME resolves to a nonexistent path, `[ -f ... ]`
fails, and a healthy install reads as MISSING. `MSYS_NO_PATHCONV=1` (or building the
separator without a literal slash) avoids it.
