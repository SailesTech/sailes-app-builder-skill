## message_to_human

Spec approved + pre-implement READY. This is non-trivial (3 phases, a new API contract, a new worker job) so I'm running it as `team-lead` through `Workflow`, not solo. No `fe-dev`/`designer` in this pipeline — the spec is backend + worker only. Every phase's `Lane:` is `middle` (tier B/C), so gates run as: implementer → `tester` (DERIVED plan, no human-freeze) → `checker` → `qa` (live run on the stack, output pasted, no screenshots) — once, after the last phase, not per phase (D8).

I checked `.ai/lessons.md` and `.ai/archive/` in this repo for `invoice|csv|export|bytea|signed url|s3 bucket|mail template` — no relevant hits (this is the framework repo's own lessons file; on the real client repo I'd grep theirs the same way before dispatching).

**Dispatching now, no decision needed:** WF-A — wave 1, F1 (CSV generator) + F2 (email template) in parallel, disjoint files, both `be-dev`/tier C on the default model (sonnet — mechanical work, no escalation).

**Needs your call before wave 2 (F3) can start** — the spec leaves this open on purpose:

Where do we store the generated CSV, and for how long?

| Option | Buys | Costs |
|---|---|---|
| **A. `bytea` column in Postgres** (recommended if you want zero new infra) | No new dependency, transactionally consistent with the export row, works with what's already there | DB/backup bloat as exports accumulate; no built-in expiry — needs a cleanup job you'd write yourself |
| **B. S3 bucket, signed URL, TTL 7 days** | Keeps Postgres lean, expiry is the bucket's job (lifecycle policy), standard pattern for "download a generated file" | New bucket + IAM/config, signed-URL generation code — worth it mainly if S3/MinIO is already in this stack |

I lean B only if this stack already talks to S3/MinIO elsewhere (then it's no new dependency, actually); otherwise A is the smaller lift. Your call either way — F3 is blocked on it, wave 1 is not.

Wave 1 doesn't need this answer, so it's running in parallel with you deciding — nothing is idle either way.

## what_you_would_do_next

1. Fill `<BOOT_CMD>` in WF-A from this client repo's own documented one-command boot (its AGENTS.md/README task-router table) before actually calling `Workflow` — if none exists, that's an `ENV-DEFECT` to report, not something to skip past. Then run WF-A (the script above).

2. On WF-A's return: `git merge --no-ff <F1 branch>` and `git merge --no-ff <F2 branch>` into the working branch (never fast-forward — the merge commit is the seam). Record both in the run log (`.ai/runs/2026-09-17-invoice-csv-export.md`): worker · task · outcome · commit · base. Update `.ai/STATE.md`.

3. Once you answer the storage question, I fold it verbatim into F3's brief and fill `LEAD_SHA` with the post-wave-1 merge commit, then run WF-B:

```js
// WF-B — spec: eksport faktur do CSV i powiadomienie e-mail — wave 2 (F3) + whole-spec gates.
// Runs only after the human has answered the F3 Human-STOP (CSV storage: bytea vs S3+signed URL)
// and the lead has integrated wave 1 (F1+F2) into the working branch with git merge --no-ff.
// D8: tester (whole spec) + checker (whole diff) run ONCE, here, because F3 is the last phase.

async function safe(fn, label) {
  try {
    const result = await fn();
    if (!result) {
      console.error(`[${label}] empty result — treat as blocked, do not read as "no issues"`);
      return null;
    }
    return result;
  } catch (err) {
    console.error(`[${label}] threw: ${err.message}`);
    return null;
  }
}

const IMPL_SCHEMA = { type: 'object', required: ['status','commit','touched','done_when','note'],
  properties: { status: { type: 'string', enum: ['done','blocked'] }, commit: { type: 'string' },
    touched: { type: 'array', items: { type: 'string' } },
    done_when: { type: 'array', items: { type: 'object', properties: {
      command: { type: 'string' }, exit: { type: 'number' }, output_tail: { type: 'string' } } } },
    note: { type: 'string' } } };

const TEST_SCHEMA = { type: 'object', required: ['status','commit','plan','detection_proof','defects'],
  properties: { status: { type: 'string', enum: ['done','blocked'] }, commit: { type: 'string' },
    plan: { type: 'array', items: { type: 'string' } },
    detection_proof: { type: 'array', items: { type: 'string' } },
    defects: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, description: { type: 'string' }, severity: { type: 'string' } } } } } };

const REVIEW_SCHEMA = { type: 'object', required: ['verdict','findings','commands_run'],
  properties: { verdict: { type: 'string', enum: ['APPROVE','NITS','CHANGES-REQUIRED'] },
    findings: { type: 'array', items: { type: 'object', properties: {
      id: { type: 'string' }, description: { type: 'string' }, location: { type: 'string' } } } },
    commands_run: { type: 'array', items: { type: 'string' } } } };

const LEAD_SHA = '<FULL_SHA_AFTER_WAVE1_MERGE>';
const STORAGE_DECISION = '<HUMAN_ANSWER_VERBATIM>';

let bootResult;
try { bootResult = execSync('<BOOT_CMD>', { encoding: 'utf8' }); }
catch (err) { bootResult = `ENV-DEFECT: boot failed — ${err.message}`; console.error(`[boot] ${bootResult}`); }

function preamble(label) { return `
Sync to base: git merge --ff-only ${LEAD_SHA} ; git log --oneline -1
Turn budget: at ~70% of maxTurns, commit "WIP:" and return status:"blocked".
Context economy: read only files named for ${label}; never run the full suite mid-phase.
Environment: boot e2e — ${bootResult.toString().slice(0,400)}
`; }

const briefF3 = `${preamble('F3')}
Phase F3 — endpoint i job eksportu. Lane: middle — tier B.
Files you own: apps/api/src/invoices/export.controller.ts, apps/worker/src/jobs/invoice-export.job.ts,
  apps/api/test/invoice-export.e2e-spec.ts
Depends-on: F1 (exportMonth) and F2 (export-ready template) — already merged into your base.
KEY DECISION, already settled — build to this: CSV storage: ${STORAGE_DECISION}
Contract: F3.1 POST /invoices/export?month=YYYY-MM -> 202, enqueues job. F3.2 job generates via F1,
  persists per the decision above, sends via F2.
Done-when: pnpm vitest run apps/api/test/invoice-export.e2e-spec.ts -> 0 failures.
Report via StructuredOutput (IMPL). Commit in your own worktree.
`;

const implF3 = await safe(() => agent({ agentType: 'sailes-app-builder:be-dev', schema: IMPL_SCHEMA,
  isolation: 'worktree', prompt: briefF3 }), 'be-dev:F3');

let testerResult = null, checkerResult = null, fixResult = null;

if (!implF3 || implF3.status !== 'done') {
  console.error('[F3] not done — stop before gates; inspect branch/worktree.');
} else {
  const testerBrief = `Derive expected behavior of the WHOLE spec from the spec file alone,
implementation unread. Lane middle -> Status: DERIVED, write suite immediately, no freeze STOP.
ADD-only from diff since ${LEAD_SHA}. Cover F1 CSV shape, F2 template, F3 endpoint+job
(storage: ${STORAGE_DECISION}). Report via StructuredOutput (TEST).`;
  testerResult = await safe(() => agent({ agentType: 'sailes-app-builder:tester', schema: TEST_SCHEMA,
    isolation: 'worktree', prompt: testerBrief }), 'tester:whole-spec');

  const checkerBriefBase = `Review the WHOLE diff (base ${LEAD_SHA}) against the spec + checklist.
Confirm every frozen behavior case is covered. Diff + spec + checklist ONLY, no dev report.
git grep -l changed symbols across tests/ and run whatever that turns up.`;
  checkerResult = await safe(() => agent({ agentType: 'sailes-app-builder:checker', schema: REVIEW_SCHEMA,
    prompt: checkerBriefBase }), 'checker:whole-diff:round1');

  if (checkerResult && checkerResult.verdict === 'CHANGES-REQUIRED') {
    const fixBrief = `${preamble('F3-fix')}
Checker CHANGES-REQUIRED. Findings: ${JSON.stringify(checkerResult.findings, null, 2)}
Fix ONLY these, inside files already owned by F1/F2/F3. Re-run each phase's Done-when.`;
    fixResult = await safe(() => agent({ agentType: 'sailes-app-builder:be-dev', schema: IMPL_SCHEMA,
      isolation: 'worktree', prompt: fixBrief }), 'be-dev:fix-round1');
    if (fixResult && fixResult.status === 'done') {
      checkerResult = await safe(() => agent({ agentType: 'sailes-app-builder:checker', schema: REVIEW_SCHEMA,
        prompt: `${checkerBriefBase}\nFix round — re-check after: ${JSON.stringify(fixResult.touched)}` }),
        'checker:whole-diff:round2');
    }
  }
}

export default { wave: 2, boot: bootResult, F3: implF3, tester: testerResult, checker: checkerResult, fix: fixResult };
```

4. On WF-B's return: `git merge --no-ff <F3 branch>` (and the fix-round branch if one ran). Write the `tester`/`checker` `StructuredOutput` verdicts to `.ai/test-plans/2026-09-17-invoice-csv-export.md` and the run log — this is Workflow-mode, so the gate verdict IS the schema, not a file the gate role wrote (workflow-orchestration.md, D3). Update `.ai/STATE.md`, then hand off per `session-handoff.md`: one line to you, `/clear`, fresh session.

5. New session runs WF3: `qa` (serialized, holding the environment exclusively, live-run output pasted — no screenshots/vision-verify, lane is middle) → `docs-author` (new endpoint + new job are architecture-diagram-worthy). I show you the docs-delta receipt before anything closes — an empty delta still counts, but it has to be shown, not asserted.

6. Only after the docs-delta receipt is shown and accepted: set the spec's `Status: implemented` with pasted evidence (`checker: <verdict>` · `qa: <verdict>`), `git mv` it to `.ai/specs/implemented/`, close estimate-vs-actuals, and land anything worth keeping in `.ai/lessons.md`/`.ai/backlog.md`.

Throughout, I keep exactly six things myself (D5): the two `git merge --no-ff` integrations, the run log, `.ai/STATE.md`, the gate verdicts, and this escalation. Everything else — dispatch, gates, plan derivation — runs inside the two `Workflow` scripts above.
