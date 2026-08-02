# be-dev-7 silent for 40 minutes — what I do

Role: `team-lead` (control definition, `control/team-lead-pre-F5.md`). Task F3 — CSV export with date filter.

**Headline: I climb the metadata ladder before I decide anything, and I treat `.ai/status/be-dev-7.md` as a claim, not as evidence.** It records that a delegation was opened and which paths it locked. It records nothing about whether that delegation is alive, how far it got, or where its work is. Everything below follows from that one distinction.

---

## 0. What the file actually tells me, and what it cannot

Load-bearing:
- Two paths are **claimed**: `apps/api/src/routes/export.ts`, `apps/api/src/services/export.ts`. Until this claim is closed, nothing else of mine goes near them.
- The intended base is `4cd19ae`. That is the *declared* base, not a verified one — five of twelve workers got stale checkouts on 2026-08-01, so the base being written down is not the base being worked on.
- It opened at `2026-08-02T09:05:00Z`.

Not in the file, and each absence costs me a step:
- **No heartbeat, no `last_update`.** So `opened: 09:05Z` is equally consistent with "died at 09:06" and "still typing at 09:44". The file cannot discriminate the two states the whole question turns on. This is the finding to land in `.ai/lessons.md` regardless of how the rest goes.
- **No `worktreePath`, no `worktreeBranch`.** The two fields that would let anyone but the spawning context find the work are the two that are missing. I recover them myself (step 1b) — but a second lead after a context reset would be reading this file with no way to reach the tree it describes.
- **No terminal state and no owner for one.** Nothing in my role definition says who closes this file or when. That is a gap in the convention, not something I can look up; I decide it in §4 and record that I decided it.

One structural oddity worth naming now, because it changes where I look. Every writing worker carries `isolation: worktree`. If `be-dev-7` wrote this file inside its worktree, I should not be able to see it from the main tree — but I can. So either the status file was written to the **shared** main tree (a worker writing to shared disk, which is the exact collision class the worktree mandate exists to make impossible), or `.ai/status/` is served from outside the isolation. Either way the status protocol and the isolation mandate interact in a way nobody has written down. Noted, not resolved here.

First concrete act, before any of it: **confirm the actual clock.** "Forty minutes" is my estimate; `date -u` gives the number I will put in the record.

---

## 1. The observation ladder — metadata only, stop as soon as I know

Rule 2, "Observing a silent worker": I may look at everything except content, and I climb only as far as I need.

**1a. Which delegation mode am I in.** `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` — on or off. This decides whether rung 1 exists at all and whether release is an act I confirm or a return that already happened. "It does not answer messages" implies teams mode is on and rung 1 has already been spent. If it is off, `be-dev-7` was a scoped subagent that returns once and ends, "no answer" is not a symptom, and the only signal available is on disk.

**1b. Recover the tree.** The status file does not name it, so:
```
git worktree list
git branch --list '*be-dev-7*'   # or whatever naming the harness produced
```
If no worktree exists for it, that is itself an answer: it died before or during setup, and there is nothing to salvage. If two exist, I have a worse problem and I stop and escalate.

**1c. Rung 1 — ask it, once, explicitly.** `SendMessage`: *report now; if you did not finish, say so plainly and list what you did and did not establish.* Costs nothing, touches no disk. The chase is **once**, and it is logged with its timestamp whether or not it lands. I do not re-spawn on a guess to fill the silence.

**1d. Rung 2 — declarations.**
```
git -C <worktreePath> log --oneline -20
```
Commits are the worker's declaration that work is finished. `WIP:` prefixes are checkpoints and are explicitly *not* that claim. **A worker with no commit did not finish** — I read that as the signal it is rather than going hunting for something to rescue.

**1e. Rung 3 — is it moving or is it dead.**
```
git -C <worktreePath> status --porcelain
git -C <worktreePath> diff --stat
ls -l --time-style=full-iso <worktreePath>/apps/api/src/routes/export.ts \
                            <worktreePath>/apps/api/src/services/export.ts
git -C <worktreePath> log --oneline -3      # base freshness: expected sha AND a file that only exists after it
```
The mtimes are the whole diagnosis. An mtime two minutes old means a slow worker with a dropped channel, and the correct action is patience plus one more chase, not a funeral. An mtime at 09:07 means it stopped 38 minutes ago and the "40 minutes of silence" was 38 minutes of nothing happening.

**1f. Process check, done properly.** Before I conclude "dead", I look for a live process for this agent — **broken down by command line, not counted** (rule 2a). Thirteen of seventeen `node` processes on this machine are language servers and MCP servers on an ordinary day. The question is *does this process have a parent I recognise, and did it start when I asked for something*. I kill nothing. I never kill an editor process or an MCP server. And I do not start a gate while anything is standing up a worktree.

**1g. Rung 4 — the floor.** No `git diff` without `--stat`. I do not read `export.ts` or the service file. I do not commit or cherry-pick uncommitted work. Metadata is observation; content is integration, and integration is not what I am doing yet.

Twice on 2026-08-01 work was declared unfinished while it sat finished on disk. What was lost was the report, not the work. The ladder exists so I stop misreading the second as the first — and it stops at metadata so I do not turn a diagnosis into a silent, ungated merge.

---

## 2. What each finding leads to

| Ladder result | What it means | What I do |
|---|---|---|
| It answers rung 1 | Channel dropped a report that exists | Take the report, integrate normally, gates as usual. No incident, one lesson about the channel. |
| Non-`WIP` commit(s), clean tree | It declared completion; only the report was lost | `git cherry-pick` onto my branch. Then the full gate run — see §2a. |
| `WIP:` commits + dirty tree | Half-written. Integration-unsafe by rule. | Do **not** cherry-pick the dirty part. Fork for the human (§5). |
| No commits, files modified | It got somewhere and never declared anything | Nothing to integrate. Fork for the human (§5); default is re-dispatch clean. |
| No commits, files untouched, no process | Died at or near spawn | Re-dispatch fresh from a **verified current** base — `4cd19ae` may itself be stale by now. |
| mtime is recent | Not dead. Slow. | Hold, chase once more at a stated deadline, do not re-spawn. |

**2a. The gates do not move for any of these.** F3 changes an API route and a service — behavior that a running system can be driven through, so `checker` on the diff and `qa` on the live flow, both. `checker` receives ONLY diff + spec + checklist; there is no worker report to withhold, which is convenient and changes nothing. `qa` takes environment exclusivity while it runs, and I enforce that because `qa` cannot. Salvaged provenance is not a reason to soften a gate — if anything, a diff whose author never reported is the diff I most want graded on a clean context.

**2b. If I re-dispatch,** the new worker (`be-dev-8`) gets its own worktree, a base-freshness check written into the brief (`git log --oneline -3` must show a named sha *and* a named file that only exists after the work it depends on), the report clause spelled out verbatim, the delivery mechanism named — a background teammate's plain text reaches no one, it must call `SendMessage` — and **a FILE deliverable with its path**, because "no file = task not done" is the one prevention with a measured record behind it.

---

## 3. Release

Chasing beats "never hold idle agents", and this is exactly the collision that rule was written for: a silent worker is not idle in the sense the release rule means, because its context may be the only place its findings still exist. **I hold until the report is recovered or the escalation resolves, then release.**

Release is an act I confirm, not a request I send: `SendMessage {"type":"shutdown_request","reason":…}`, then wait for the termination. `TaskStop` is the fallback for runtimes that have it, not the operative path. Of five such requests on 2026-07-25, three needed a second attempt. If it neither answers nor terminates, the run log says **"release unconfirmed — possible live agent"**, not "released". "Released" is written only for a termination I observed.

---

## 4. The status file — disposition

Nothing in my definition tells me who owns `.ai/status/be-dev-7.md` once the worker stops. So I state the reasoning rather than pretend to a protocol.

**Not option A: leave it.** A stale open claim is a lock nobody holds. The next session — or the next lead after a context reset — reads `.ai/status/` and cannot distinguish this from a live worker, which re-creates on disk precisely the ambiguity the observation ladder just cost me twenty minutes to resolve in memory. Leaving it is how the same failure happens twice.

**Not option B: delete it.** The file's own existence and timestamps are evidence that a delegation happened and locked two paths. A plain delete leaves the run log as the sole trace and erases the artifact that could corroborate it. `.ai/` is memory, not scratch.

**What I do:** I take ownership of the file — the lead owns integration, and closing an abandoned claim is integration — and **rewrite it to a terminal state carrying the observed facts**, then archive it. Concretely, appended to what is already there:

```yaml
status: abandoned-unreported        # or: recovered / superseded — whichever the ladder produced
last_observed: 2026-08-02T09:47:00Z
observed_by: team-lead
evidence:
  chased: 2026-08-02T09:45:00Z (SendMessage, no response)
  commits: <shas, or "none">
  tree: <clean | N files dirty>
  last_file_mtime: <ISO>
  process: <live pid+cmdline | none found>
disposition: <cherry-picked <sha> | discarded | superseded by be-dev-8>
claim_released: true                # the two paths are free only from this line onward
released_agent: <confirmed | unconfirmed>
closed: 2026-08-02T09:50:00Z
closed_by: team-lead
```

Then `git mv .ai/status/be-dev-7.md .ai/status/closed/be-dev-7.md`, so `.ai/status/` reads as the live lock table and only live claims sit in it.

**Ordering matters and is not cosmetic:** the claim on those two paths is released *after* the disposition of the old tree is decided, never before. Worktrees make a second worker on those files physically safe; they do nothing about two half-integrations of the same feature landing on my branch. Until §2's row is picked, nobody is dispatched onto `export.ts`.

And the durable record does not live here. The run log entry in `.ai/runs/` plus `.ai/STATE.md` are what survive a context reset (rule 6); the status file is the lock, and a closed lock is an archive entry, not documentation.

---

## 5. What goes to the human, and when

The disposition of partial work is a fork with more than one defensible answer, so it does not get decided by me in prose. I carry on with everything that does not depend on it — the ladder, the file closure, the run log, the lessons entry — and bring the accumulated set in one window, with the measurement already taken so the card is grounded rather than plausible:

- **A (recommended, if `--stat` shows the work is substantially there): re-dispatch `be-dev-8` from the abandoned tree's last non-`WIP` commit.** Buys the work already done. Costs a fresh worker and a brief, and inherits whatever assumption killed the first one.
- **B: re-dispatch clean from a verified current base, discard the tree.** Buys a provenance nobody has to reason about. Costs the elapsed 40 minutes outright.
- **C: cherry-pick the completed commit as-is and send it straight to `checker` + `qa`.** Only available on the clean-tree row. Buys the fastest path to a graded diff. Costs nothing on rigor — the gates are unchanged — but leaves a diff whose author never explained it, which `checker` will feel.
- **D: park F3, re-plan.** If the ladder shows it died at spawn, the question is why, and the answer may be an `ENV-DEFECT` (no documented one-command path from clean clone to running app) that will kill `be-dev-8` the same way.

I also tell them plainly: **`be-dev-7` returned nothing.** An empty return is data. I do not say "be-dev-7 found no issues", I do not paper over the gap by writing F3 myself, and I name which delegation produced nothing.

---

## 6. Records I write before moving on

- **`.ai/runs/`** — who was spawned, what they returned (nothing), how long, what the ladder found, the disposition, release confirmed or not. Model routing recorded including the non-override, marked as default.
- **`.ai/STATE.md`** — updated before I walk away, so a reset resumes without re-deriving this.
- **`.ai/lessons.md`** — the real harvest here, and it is about the instrument rather than the worker:
  - *Context:* worker status file at `.ai/status/<id>.md`, written once at open.
  - *Problem:* with only an `opened` timestamp, the file cannot distinguish a worker that died in its first minute from one still working. It also omits `worktreePath` / `worktreeBranch`, so it does not lead anyone to the work it describes, and its placement relative to the worktree mandate is undefined.
  - *Rule:* a status file is a lock, not a signal, unless it carries a heartbeat or `last_update`; it must record the worktree path and branch; and it must have a defined terminal state with an owner. Until then, treat it as a claim and climb the metadata ladder for liveness.
  - *Applies-to:* any lead reading `.ai/status/`.

---

## 7. What I do not do

Read either claimed file's content · `git diff` without `--stat` · cherry-pick uncommitted work · re-spawn before the ladder runs · kill processes on a count instead of a command-line breakdown · start a gate while a worktree is being stood up · drop `checker` or `qa` because the diff arrived by an unusual route · write "released" without a confirmed termination · delete the status file · forward the silence as a result.

---

*Control arm: this answer is derived from `team-lead-pre-F5.md` alone. That definition contains a full protocol for a silent worker and none at all for a status file — §4 and the lessons entry are my own construction, and are marked as such rather than presented as doctrine.*
