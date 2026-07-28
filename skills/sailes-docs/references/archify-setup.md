# Archify Setup — machine prerequisite for the Sailes docs layer

Archify is a self-contained agent skill (Node CLI + schemas + renderers, no API keys, MIT)
installed **per machine**, never vendored into a repo. Validated floor: **>= 2.12** —
`compare --receipt`, quality profiles, and the delivery snapshot behavior this framework
depends on are verified against 2.12.

## The procedure

```bash
# 0) Present and recent enough? (the floor check reads the installed skill's own metadata)
ARCHIFY_HOME="$HOME/.claude/skills/archify"
[ -f "$ARCHIFY_HOME/SKILL.md" ] && grep -m1 'version:' "$ARCHIFY_HOME/SKILL.md" \
  || echo "MISSING archify — see 'If archify is missing or too old'"

# 1) Install / upgrade (same command for both)
npx skills add tt-a1i/archify -g

# 2) Sanity: the CLI answers
node "$ARCHIFY_HOME/bin/archify.mjs" doctor
```

Version floor rule: read `metadata.version` from `$ARCHIFY_HOME/SKILL.md`; anything below
2.12 is treated **exactly like a missing install** — the remedy is the same one-liner.

All framework invocations go through the absolute home, never a bare command:
`node "$HOME/.claude/skills/archify/bin/archify.mjs" <validate|deliver|compare|guide> …`

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

```bash
# .claudeignore — generated HTML is large and derivable; JSON stays readable to agents
for l in 'docs/architecture/*.html' 'docs/architecture/client-package/' '.ai/docs-deltas/*.html'; do
  grep -qxF "$l" .claudeignore 2>/dev/null || echo "$l" >> .claudeignore
done
```

Everything under `docs/architecture/` and `.ai/docs-deltas/` is **committed** — HTML included:
it is the client-facing artifact and must survive a machine that lacks archify.
