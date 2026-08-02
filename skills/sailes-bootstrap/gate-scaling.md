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
<!-- END gate-scaling -->
