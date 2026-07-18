# Lessons — framework-level institutional memory

> Format per entry: **Context / Problem / Rule / Applies-to**. Escaped defects additionally use
> `Escaped-defect:` entries (which gate missed it + what check that gate now gains). Review for
> promotion candidates when closing a spec — prefer promoting into an enforced check or an
> `evals/` scenario over more prose.

## Lessons

### 2026-07-18 — a silent return is a false negative, not a finding
- **Context:** three losses in one session while building the prompt-anchor. Two delegated
  agents (`general-purpose`, `claude-code-guide`) signalled idle carrying no report; the lead
  recovered both only by noticing the absence and chasing. Separately the lead destroyed an
  uncommitted backlog entry with `git checkout <branch> -- <path>` and committed the reverted
  file, with `|| true` swallowing the signal.
- **Problem:** all three failures *looked like success*. An empty return is indistinguishable
  from "the agent looked and found nothing", so accepting it records a false negative as a
  result — and delegation is the lead's default path, so this sits under the main road. The
  destroyed file is the same class on a different surface: a silent loss that reads as done.
- **Cause — corrected 2026-07-18 after measuring, and the first version of this entry had it
  wrong.** It read as "agents lose their reports", which is a plausible story nobody had tested.
  Measured across five background teammates: three formed a correct answer and delivered
  nothing, and one said outright it had *written the answer as plain text instead of calling
  `SendMessage`*. The clause "your final message IS the deliverable" was not being ignored — it
  is **true for a scoped subagent and quietly false for a background teammate**, which must send
  its report. The workers obeyed an instruction that did not apply to the mode they were in, and
  only the lead knows which mode it spawned.
- **Rule:** an empty return is chased once, explicitly, then escalated to the human — never
  accepted, never re-spawned on a guess, never absorbed by the lead doing the work itself.
  "The agent found no issues" may be stated only if an agent actually said so. **Every brief
  names the delivery mechanism**, because the worker cannot infer it. Treat the chase as
  standard procedure rather than exception handling — at the observed rate it is the norm.
  Correspondingly: never use a destructive git path-restore to move an uncommitted edit between
  branches, and never mask a recovery command with `|| true`.
- **Applies-to:** `agents/team-lead.md`; `agent-team-structure.md` (Worker brief + lifecycle);
  every delegation, whatever the agent type. **No mechanical check is possible** — no hook
  observes a subagent completing — so this stays prose, and prose is what decays.
- **Meta-lesson, which is the more expensive one:** the wrong cause shipped in 1.9.0 as the
  written justification for a real rule, and survived because the rule *worked* — chasing
  recovered the work every time, so nothing forced the diagnosis to be checked. A fix that
  succeeds for the wrong reason is the hardest kind of error to notice. It took deliberately
  running the eval, five times, to see it.

### 2026-07-05 — a framework must dogfood its own standard
- **Context:** the 2026-07-02 spec had all phases checked complete, `Status: in-progress`, and
  sat in `.ai/specs/` root; this repo had no STATE.md/backlog.md/lessons.md at all.
- **Problem:** the framework prescribed a lifecycle and memory files it didn't itself follow —
  invisible until someone audited it, and corrosive to credibility.
- **Rule:** every artifact the skills prescribe for generated repos must exist and be current in
  THIS repo; closing a framework spec includes the lifecycle move in the same change.
- **Applies-to:** every framework change-set; `sailes-implement` On-completion.
