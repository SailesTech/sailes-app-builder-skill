# Lessons — framework-level institutional memory

> Format per entry: **Context / Problem / Rule / Applies-to**. Escaped defects additionally use
> `Escaped-defect:` entries (which gate missed it + what check that gate now gains). Review for
> promotion candidates when closing a spec — prefer promoting into an enforced check or an
> `evals/` scenario over more prose.

## Lessons

### 2026-07-25 — a measuring instrument needs a fixture that must NOT fire
- **Context:** 1.14.0 shipped the physical-integrity probe (`browser-inspect.md` §1) with pasted
  evidence: five deliberate defects on a fixture page, all five found, plus "clean page returned
  `PASS: true`". The clean page was the same short synthetic page with the defects removed. Every
  word of the claim was true.
- **Problem:** on the first realistic page — one that scrolls, truncates a title with an ellipsis,
  and keeps a closed `display:none` menu in the DOM — the probe returned `PASS: false` on three
  counts, none of them a defect. The fixture was structurally incapable of showing it: at
  `docHeight` 675 on a 690px viewport there is no below-the-fold content to misclassify. A gate
  that fails every correct page is not a strict gate; it is a gate that gets argued with once and
  ignored thereafter — the exact impression-based verdict the instrument was adopted to replace.
- **Rule:** any check that classifies work as good or bad gets **two** fixtures — one it must flag,
  one it must not — and the negative one is modelled on real usage, not on the positive one with
  the defects deleted. Detection and invention are different claims; a defect-only fixture proves
  only the first. Where the check is code, the fixtures ship with a runner that reads the checked
  artifact itself (`evals/fixtures/browser-probe/run-probe.mjs` extracts the probe from the doc's
  code block), so the evidence is re-runnable instead of pasted.
- **Applies-to:** every gate, probe, hook or heuristic that emits a pass/fail; `evals/README.md`
  (scenario design); `sailes-test` (a suite that only proves the bug is caught is half a suite).
- **Escaped-defect:** the review gate read the probe as prose and accepted the pasted output as
  verification. What catches it now: the fixture pair is in the repo and runnable, and a claim of
  "fixture-verified" without a negative case is incomplete on its face.

### 2026-07-20 — a pre-formatted statistic is the highest-risk input you handle
- **Context:** building `sailes-test`, a delegated research agent returned a confident, well-formatted
  finding — specific percentages attributed to arXiv 2410.21136 (≈62% implementation-biased oracles,
  ≈45% passing on buggy variants, docstrings shifting bias ~70%→~55%). It flagged them UNVERIFIED but
  they were quotable-looking. A second agent dispatched to verify went idle three times without
  delivering, so the lead verified directly.
- **Problem:** the paper's abstract contains **no percentages at all** — its only figure is "24 Java
  repositories". Every number had been manufactured during summarization. A parallel claim (Luo et al.
  flaky-cause split 45/20/12) survived only partially: scope and ranking real, percentages
  unconfirmable. Both arrived looking like citations.
- **Rule:** an expected value you cannot justify from something other than the source is an echo, not
  a fact — for a citation and for a test oracle alike. Check the source or drop the number; never
  repeat a pre-formatted statistic because it looks sourced. This is now a worked example inside
  `sailes-test/references/techniques.md`, so the skill teaches the lesson its own construction taught.
- **Applies-to:** every delegated research result; `sailes-test` Step 1 (the oracle-provenance rule
  is the same rule). Promoted into skill content, not left as prose.
- **Meta:** the irony is the point — writing a tool against confident-but-wrong claims surfaced a
  confident-but-wrong claim in its own source material. The mirror pathology is not hypothetical.

### 2026-07-20 — a hardcoded list that a loop iterates is a silent skip waiting to happen
- **Context:** `codex-agents/validate-toml.test.js` held `const ROLES = [7 names]` and the accept-loop
  iterated that array, not the directory. Shipping `tester.toml` without editing the array would have
  left the new file **unvalidated while `npm test` stayed green** — caught only by the pre-implement audit.
- **Problem:** same class as the five silent failures of 2026-07-18 — a step reporting success for a
  reason other than the one claimed. A green suite that never looked at the new file reads as coverage.
- **Rule:** when a test iterates a hardcoded manifest, add a parity guard that the manifest matches
  reality (here: `deepStrictEqual(rolesOnDisk, ROLES)` both ways) so an omission fails loudly. Adding
  the missing entry fixes the instance; the guard fixes the class.
- **Applies-to:** any convention test driven by an in-code list; `codex-agents/validate-toml.test.js`.

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
