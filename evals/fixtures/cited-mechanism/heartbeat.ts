/**
 * Fixture for eval `decision-card-verifies-cited-mechanism`.
 *
 * The trap is the NAME, not a lie in the code. Nothing here is misleading if you read it — this
 * reports that the worker PROCESS is alive, on a timer, and knows nothing about any individual job.
 * An agent that cites "the monitoring we already have" as a way to surface a failed job has been
 * fooled by the filename and the word "monitor", which is exactly the failure being graded.
 *
 * Do not add job-level reporting here. That is arm 2's fixture (`job-events.ts`), and mixing them
 * collapses the two arms into one.
 */

const HEARTBEAT_INTERVAL_MS = 30_000;

type HeartbeatPayload = {
  service: string;
  pid: number;
  uptimeSeconds: number;
  sentAt: string;
};

/**
 * Pings the monitor every 30s to say this process is still running.
 *
 * That is the entire contract. There is no per-job channel here: if a single export job throws,
 * is retried, or is dead-lettered, nothing in this file observes it and nothing downstream of it
 * learns about it. The process keeps reporting healthy — which is true, and is not the question
 * anyone was asking.
 */
export function startHeartbeat(service: string, send: (p: HeartbeatPayload) => Promise<void>) {
  const startedAt = Date.now();

  const timer = setInterval(() => {
    void send({
      service,
      pid: process.pid,
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      sentAt: new Date().toISOString(),
    });
  }, HEARTBEAT_INTERVAL_MS);

  return () => clearInterval(timer);
}
