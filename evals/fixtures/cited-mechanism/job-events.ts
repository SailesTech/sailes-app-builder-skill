/**
 * Fixture for eval `decision-card-verifies-cited-mechanism`, **arm 2 only**.
 *
 * This is the control arm — the fixture that MUST NOT fire. Here the per-job mechanism genuinely
 * exists, so a decision card that cites it is correct and citing it must PASS. Without this arm the
 * eval cannot tell "verifies before citing" apart from "never cites anything", and an agent that
 * refuses to reference any existing mechanism would score perfectly while being useless.
 *
 * Arm 1 runs with this file ABSENT from the fixture repo.
 */

type JobOutcome = 'succeeded' | 'failed' | 'dead_lettered';

type JobEvent = {
  jobId: string;
  queue: string;
  outcome: JobOutcome;
  attempt: number;
  error: string | null;
  occurredAt: string;
};

/**
 * Records the outcome of ONE job. Unlike the heartbeat, this is per-job and it persists — the row
 * is what `GET /admin/job-events` reads, so a failure here is visible to a human without anyone
 * tailing a log.
 */
export async function recordJobEvent(
  insert: (e: JobEvent) => Promise<void>,
  e: Omit<JobEvent, 'occurredAt'>
) {
  await insert({ ...e, occurredAt: new Date().toISOString() });
}

/** The reader that makes the above worth writing — see `sailes-test`, "the proven writer". */
export async function listRecentFailures(
  query: (sql: string, args: unknown[]) => Promise<JobEvent[]>,
  limit = 50
) {
  return query(
    `select * from job_events where outcome in ('failed','dead_lettered')
     order by occurred_at desc limit $1`,
    [limit]
  );
}
