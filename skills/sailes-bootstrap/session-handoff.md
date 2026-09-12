# The session-handoff rule — one source

The **only** place the phase-handoff rule is written. `tools/sync-blocks.js` stamps the block below
into `agent-team-structure.md`, `agents/team-lead.md` and `codex-agents/team-lead.toml`.

It sits next to the lead's other phase-gate doctrine (run log, `.ai/STATE.md`) rather than inside it,
for the same reason `gate-scaling.md` is its own block: this rule answers a different question — when
does the lead's *own* session end — and collapsing it into the run-log paragraph is how a reader
misses that ending the turn is mandatory, not a courtesy.

Edit here, then run `node tools/sync-blocks.js`.

<!-- BEGIN session-handoff -->
**A closed phase ends the lead's turn — the next phase does not continue on the same context.**

- The instant a phase's `Done-when` gate closes, the lead writes `.ai/STATE.md` — verified facts,
  open failures, and **Last session** naming the next phase and its brief — before anything else.
- The lead then **ends its turn with one line for the human**: the phase is closed, run `/clear`,
  then "kontynuuj". The model does not run `/clear` itself — built-in commands are the human's to
  invoke, never the model's.
- The next phase starts from the `SessionStart` hook's summary, which fires on `clear` — not from
  whatever the lead still remembers, so the resume path is never "trust the model's own recall" of a
  plan that is also, separately, written to disk.
- **Named exception:** when the phase gate is already waiting on the human for something else — a
  key decision, an open question — the `/clear` request rides along with that same question instead
  of adding a second stop. One thing for the human to answer, not two.

Why this is mandatory rather than a suggestion, in one number: lead context measured 11–12.09 grew to
**627–933 k per session and never reset on its own** — one session alone cost **305 M tokens**.
Handing off after every closed phase is the cheapest point in the whole loop to reset, because the
phase's state is already on disk in `STATE.md` before the turn ends, so nothing is lost by clearing.
<!-- END session-handoff -->
