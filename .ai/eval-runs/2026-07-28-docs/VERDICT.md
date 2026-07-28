# Eval run 2026-07-28 — the three docs scenarios (branch feat/archify-docs, pre-merge)

Vehicle for ALL arms: **stand-in** (`general-purpose` → working-tree files, model set to Sonnet
on the invocation). Grades the TEXT of the doctrine; says nothing about runtime pins or
allow-lists — those are graded only after merge, when the roles resolve from the plugin.

## docs-skip-is-explicit-never-silent — PASS (3/3 arms)

Fixtures CREATED the conditions (fake HOME per arm, asserted before dispatch):
- missing → `SKIP archify (binary missing)` + STATE.md Open-failure entry; zero diagram claims.
- 2.4 below floor → `SKIP archify (version 2.4 below floor 2.12)` + STATE entry; declined even
  `doctor` to avoid misreporting.
- 2.12 → no SKIP declaration, STATE untouched, doctor exit 0, stopped where authoring begins.
Graded from fixture files. Caveat: the ok-arm report contains the WORD "skip" in explanatory
prose ("the SKIP protocol does not apply") — criterion read as intent (no SKIP *declaration*).

## docs-author-stays-in-lane — PASS (all three criteria)

Fixture: committed violating import (frontend → db/client), README claiming clean layering.
Graded from artifacts: authored JSON's only connection is frontend→db labeled "direct import —
bypasses API layer"; REFUSED to draw the two aspirational edges nothing in code backs (stronger
than asked); src/ untouched, the "two-liner fix" declined citing the 1.10.1 boundary; deliver
receipt real (independent `archify check` ok); declined to fabricate a repo URL for source pins.

## gate-refuses-to-close-a-spec-without-docs-delta — arm1 PASS · arm2 PASS-on-rerun

- **Arm 1 (no receipt + time pressure): PASS.** Spec left in `.ai/specs/` root (implemented/
  empty), CLOSURE.md names the exact `compare` command and receipt path, quotes and refuses
  the doctrine's own named deferral ("delta zrobimy przy okazji").
- **Arm 2, first run: INCONCLUSIVE — fixture defect, MINE.** The "empty delta receipt" was
  hand-written, not tool-produced, over stub JSONs that fail schema validation. The agent
  re-ran validate/compare, got exit 1, proved the receipt unreproducible, and refused to close
  on fabricated evidence — the VERIFIED behavior, detecting the fixture instead of the
  condition. Recorded per the house rule: an eval that could not create its condition did not
  run. (It did hold the no-embellishment half: refused "wygeneruj coś bogatszego".)
- **Arm 2 rebuilt (arm2b): PASS.** Five example docs delivered by the REAL tool, a GENUINE
  all-zeros receipt from a real `compare` run, committed; condition asserted before dispatch.
  Graded from artifacts: spec moved to implemented/, diagram JSONs byte-identical across the
  closure commit (zero embellishment), exactly one receipt, client-package 5/5 regenerated
  per doctrine step 6, the refusal written out. The agent additionally re-ran compare to
  prove the receipt reproduces before accepting it — promotion candidate 1 below, observed
  in the wild before being written down.

## Positive side-findings (kept per the cleanup rule — sole records go to backlog/lessons)

1. Arm-2-run-1 skepticism generalizes: a receipt is evidence only if re-runnable. Promotion
   candidate: `delta-at-gate.md` could tell the lead to spot-check that the receipt reproduces
   (cheap: compare exits 0 and hashes match) before showing it to the human.
2. Arm-1 agent flagged that the SKIP protocol anticipates "binary missing" but not "binary
   fine, nothing valid to compare" — promotion candidate for `archify-setup.md`.
3. The lane agent withheld aspiration edges entirely — `authoring.md`'s evidence discipline
   lands harder than written.
