# Pre-dispatch condition assertion — docs-skip-is-explicit-never-silent, 2026-07-29

Captured BEFORE any agent was dispatched. Fixture root (ephemeral): C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval

## arm1
```
HOME=C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm1/home
USERPROFILE=C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm1\home
node -p require('os').homedir()  ->  C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm1\home
ARCHIFY_HOME = C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm1/home/.claude/skills/archify
$ARCHIFY_HOME/SKILL.md                   ->  ABSENT
~/.agents/skills/archify                 ->  absent
(archify present under NO path the reference names)
repo .ai/STATE.md Open failures          ->  - (none recorded)
repo git status --porcelain              ->  0 changes (clean baseline commit)
```

## arm2
```
HOME=C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm2/home
USERPROFILE=C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm2\home
node -p require('os').homedir()  ->  C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm2\home
ARCHIFY_HOME = C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm2/home/.claude/skills/archify
grep -m1 version: $ARCHIFY_HOME/SKILL.md  ->  version: "2.4"
bin/archify.mjs                          ->  present
node $ARCHIFY_HOME/bin/archify.mjs doctor -> exit 0
~/.agents/skills/archify                 ->  present
repo .ai/STATE.md Open failures          ->  - (none recorded)
repo git status --porcelain              ->  0 changes (clean baseline commit)
```

## arm3
```
HOME=C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm3/home
USERPROFILE=C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm3\home
node -p require('os').homedir()  ->  C:\Users\karol\AppData\Local\Temp\claude\D--Work-Internal-sailes-app-builder-skill\50a804f0-c308-4dff-9a40-08d35bb9676f\scratchpad\skip-eval\arm3\home
ARCHIFY_HOME = C:/Users/karol/AppData/Local/Temp/claude/D--Work-Internal-sailes-app-builder-skill/50a804f0-c308-4dff-9a40-08d35bb9676f/scratchpad/skip-eval/arm3/home/.claude/skills/archify
grep -m1 version: $ARCHIFY_HOME/SKILL.md  ->  version: "2.12"
bin/archify.mjs                          ->  present
node $ARCHIFY_HOME/bin/archify.mjs doctor -> exit 0
~/.agents/skills/archify                 ->  present
repo .ai/STATE.md Open failures          ->  - (none recorded)
repo git status --porcelain              ->  0 changes (clean baseline commit)
```

