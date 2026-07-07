# Run log — 2026-07-07 · agentic-first-next reconciliation (pre-merge)

Context: a 3-agent adversarial review of `feat/agentic-first-next` (v1.1.0) before merging to `main`.
The review found the branch's engineering ~93% sound but flagged: 2 RED Done-when gates (prose/pattern
drift), an unclosed versioning loop, a missing `.claude/settings.json` template, a terminology
collision on "harness", and a `package.json` version mismatch. This run records the fixes + evidence.

## Fixes applied
- **2 RED Done-when gates → green** (prose aligned to the specs' own binary patterns):
  - `agents-md-template.md`: "…is **replaced by a one-line pointer to the enforcement**…"
  - `agents-md-template.md`: "**Escaped-defect autopsy — the gate autopsy** … an **escaped defect**…"
- **Versioning loop closed at runtime:** `install.sh` now copies `VERSION` + `CHANGELOG.md` into
  `~/.claude/skills/`; `adopt-existing-repo.md` Upgrade mode reads them there (source-repo fallback).
- **Real settings.json template:** `skills/sailes-bootstrap/settings-template.json` (valid JSON after
  stripping `//` guidance comments); `skeleton.md` fixed the mis-nested `hooks` → `hooks` is a JSON
  key inside settings.json + a `.claude/hooks/` script dir.
- **Terminology:** README invariant #9 marks the Claude Code "harness guardrails" as distinct from a
  durable-workflow "hard harness" (`sailes-async`); bootstrap Jobs/queue line points to `sailes-async`.
- **Version alignment:** `package.json` 1.0.0 → 1.1.0. `sailes-wycena` marked "planned" where referenced.
- Parked as debt (already in `.ai/backlog.md`): behavioral GREEN re-runs + CI wiring for `evals/`.

## Evidence — all 40 binary Done-when checks (both 2026-07-05 specs)

```
PASS=40  FAIL=0
```

The two previously-RED gates, re-run individually:
```
grep -ci "pointer to the enforcement\|replaced by a.*pointer" skills/sailes-bootstrap/agents-md-template.md  # → 1 (was 0)
grep -ci "gate autopsy\|escaped defect" skills/sailes-bootstrap/agents-md-template.md                        # → 1 (was 0)
```
JSON template validity:
```
node -e "JSON.parse(fs.readFileSync('…/settings-template.json').replace(/^\s*\/\/.*$/gm,''))"  # → valid
```
install.sh ships the version marker:
```
./install.sh --dry-run  # → would install VERSION -> ~/.claude/skills/VERSION
                        #   would install CHANGELOG.md -> ~/.claude/skills/CHANGELOG.md
```

Verdict: the specs' "all Done-when green" claim is now honest — 40/40 gates pass with pasted evidence.
Behavioral GREEN (subagent-driven) re-runs remain tracked as tech debt, not asserted as done.
