// WF-A — spec: eksport faktur do CSV i powiadomienie e-mail — wave 1 (F1 + F2)
// Lane: middle (tier C both) for this wave. No fe-dev/designer — backend-only spec.
// F3 is withheld from this script on purpose: its Human-STOP (CSV storage: bytea vs
// S3+signed URL) blocks its *dispatch*, not just its gate, so it cannot run here.
// D8 still applies: tester/checker run ONCE, after the LAST phase of the whole spec (F3),
// in whichever script finishes it — never here, even though this script is where wave 1 ends.

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

const IMPL_SCHEMA = {
  type: 'object',
  required: ['status', 'commit', 'touched', 'done_when', 'note'],
  properties: {
    status: { type: 'string', enum: ['done', 'blocked'] },
    commit: { type: 'string', description: 'full sha, empty unless status=done' },
    touched: { type: 'array', items: { type: 'string' } },
    done_when: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          command: { type: 'string' },
          exit: { type: 'number' },
          output_tail: { type: 'string' }
        }
      }
    },
    note: { type: 'string' }
  }
};

const LEAD_SHA = '9227eab7a6f95185f6d4928e95ec68ff5ef7defb';

// Boot the stack once, before dispatching any phase, per workflow-orchestration.md
// "Boot e2e once, before WF2". BOOT_CMD is this client repo's own documented
// one-command boot (its AGENTS.md/README) — not knowable from the fixture spec alone.
// If the repo has none, that is an ENV-DEFECT to report, not a reason to skip isolation.
let bootResult;
try {
  bootResult = execSync('<BOOT_CMD>', { encoding: 'utf8' });
} catch (err) {
  bootResult = `ENV-DEFECT: boot failed — ${err.message}`;
  console.error(`[boot] ${bootResult}`);
}

function preamble(phaseLabel) {
  return `
Sync to base: git merge --ff-only ${LEAD_SHA} ; git log --oneline -1
  (confirm the log names ${LEAD_SHA.slice(0, 12)} before touching any file; never git reset --hard)
Turn budget: at ~70% of your maxTurns, commit "WIP:" and immediately return status:"blocked" via StructuredOutput.
Context economy: read only the files named for ${phaseLabel} below; grep with line ranges; never read a
  whole large file you are not editing; never run the full suite mid-phase — only this phase's own Done-when.
Environment: boot e2e result — ${bootResult.toString().slice(0, 400)}
  If that says ENV-DEFECT, stop and report it — do not attempt the phase blind.
`;
}

const briefF1 = `${preamble('F1')}
Phase F1 — generator CSV faktur (spec: eksport faktur do CSV i powiadomienie e-mail).
Lane: middle — tier C (odczyt i formatowanie).
Files you own — create/edit ONLY these:
  - apps/api/src/invoices/csv-export.service.ts
  - apps/api/src/invoices/csv-export.service.spec.ts
Depends-on: none.
Contract (F1.1): exportMonth(orgId, yyyymm) returns CSV — header row, one line per invoice,
  amounts in cents (grosze).
Done-when: pnpm vitest run apps/api/src/invoices/csv-export.service.spec.ts -> 0 failures.
  Run it yourself and paste the output in your report.
Report via StructuredOutput matching the IMPL schema. Commit in your own worktree — the commit
  is your declaration the phase is finished. Cannot finish -> commit "WIP:", return status:"blocked"
  with a note naming exactly what remains.
`;

const briefF2 = `${preamble('F2')}
Phase F2 — szablon e-maila "eksport gotowy" (spec: eksport faktur do CSV i powiadomienie e-mail).
Lane: middle — tier C (UI e-maila).
Files you own — create/edit ONLY these:
  - apps/worker/src/mail/templates/export-ready.tsx
  - apps/worker/src/mail/templates/export-ready.spec.tsx
Depends-on: none.
Contract (F2.1): template renders a download link and the export month's name.
Done-when: pnpm vitest run apps/worker/src/mail/templates/export-ready.spec.tsx -> 0 failures.
  Run it yourself and paste the output in your report.
Report via StructuredOutput matching the IMPL schema. Commit in your own worktree. Cannot finish ->
  commit "WIP:", return status:"blocked" with a note naming exactly what remains.
`;

// F1 and F2 own disjoint file sets per the spec's ownership tables — dispatch in parallel.
// Both write, so both take isolation: worktree (mandatory — "does it write", not "is it listed").
// No model override: mechanical CSV formatting / static email template, not judgment work —
// default (be-dev's own pinned claude-sonnet-5) stands. Logged as a default, not a deviation.
const [implF1, implF2] = await Promise.all([
  safe(() => agent({
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    prompt: briefF1
  }), 'be-dev:F1'),
  safe(() => agent({
    agentType: 'sailes-app-builder:be-dev',
    schema: IMPL_SCHEMA,
    isolation: 'worktree',
    prompt: briefF2
  }), 'be-dev:F2')
]);

export default {
  wave: 1,
  boot: bootResult,
  F1: implF1,
  F2: implF2
};
