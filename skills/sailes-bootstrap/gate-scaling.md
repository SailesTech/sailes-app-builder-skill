# The gate rule — one source

The **only** place the gate rule is written. `tools/sync-blocks.js` stamps the block below into
`agent-team-structure.md`, `agents/team-lead.md` and `codex-agents/team-lead.toml`.

It is a separate block from `delegation-threshold.md` on purpose: the two rules answer different
questions — who writes, and who grades — and collapsing them is the exact defect that produced this
whole mechanism. Two blocks keeps them stated together and edited apart.

Edit here, then run `node tools/sync-blocks.js`.

<!-- BEGIN gate-scaling -->
**The gate scales with what can break, never with who wrote it.**

- **`checker` on any diff that can change behavior — including one you wrote yourself.** Authorship
  is the reason the gate applies, not a waiver: a lead grading its own diff is the maker reviewing
  the maker, which is the failure gate isolation exists to prevent. Going solo does not make you
  the reviewer.
- **`qa` wherever there is behavior to observe.** Where nothing a running system can be driven
  through has changed, there is no proof to produce — record **`qa: n/a` with its reason**, the
  convention the spec status line already uses. Stated, never silently dropped.
- **Neither for a change that cannot alter behavior** — prose, comments, docs, a README typo — and
  you record making that call.

The test is **can this alter behavior**, not *does it feel small*: config values, defaults,
dependency ranges and product copy all can, and none of them are prose.

"No gate is optional" means you never drop a gate to save time or because you wrote the code
yourself. It does not mean driving `qa` through a change with no observable behavior — a skip
leaves a hole nobody can see, a stated `n/a` is a claim someone can argue with.

**Lane scales the pipeline a phase runs, not only which gates fire.** Every phase carries
`Lane: full | middle — tier <A|B|C>: <trigger>`, set at spec time from the tier `sailes-test` Step 5
computes from triggers, never from judgment. Tier A always gets `full`; tier B/C get `middle`; a tier
is raised, never lowered.

- **`full`** — today's pipeline, unchanged: implementer → `tester` (derives, human freezes to
  `FROZEN`, hard STOP until then) → `checker` → `qa` (screenshots, vision-verify against the design
  artifact and `.ai/screens/` baseline).
- **`middle`** — implementer → `tester` with a `DERIVED` plan (writes the suite immediately, the
  implementation still UNREAD, no human-freeze STOP) → `checker` → `qa` with a **live run on the
  stack, output pasted** — no screenshots, no vision-verify, no `.ai/screens/` update. `designer`
  joins `middle` ONLY when the phase creates a screen with no existing design artifact
  (`.ai/specs/ui-spec.md` / `design-system/MASTER.md`) — a touched screen that already has one skips
  `designer` even in `middle`, and `fe-dev` builds from that artifact instead. `qa`'s environment
  exclusivity is unchanged in either lane, and so is the UI integrity probe (`sailes-design`
  `browser-inspect.md` §1): `middle` drops screenshots, never that measurement.
<!-- END gate-scaling -->
