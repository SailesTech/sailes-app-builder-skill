# Codex marketplace installation with controlled automatic updates

Status: draft — Open Questions gate
Weight: feature — new distribution surface and a local update workflow.

## TLDR

Package the existing Sailes skills as a Codex personal-marketplace plugin for this machine and
replace the manually copied skill installation with an update path. The plugin-creator workflow
supports a local marketplace; its documented development update flow is cachebuster + reinstall,
not autonomous GitHub tracking, so automatic updates require a separate local synchronizer.

## Open Questions — GATE

1. **Update policy:** **automatic, fast-forward-only updates — chosen by the user, 2026-09-01.**
   The cost is that every upstream `main` change reaches this machine without a per-release review.
2. **Cadence:** **daily automatic updates — chosen by the user, 2026-09-01.**
3. **Source of truth:** **`SailesTech/sailes-app-builder-skill` on GitHub — chosen by the user,
   2026-09-01.**
4. **Scheduler:** should the daily synchronizer run as a systemd user timer or as a cron job?
   **Recommendation: systemd user timer** — systemd is available on this machine and provides
   inspectable status and logs; cron is simpler but gives weaker visibility when a refresh fails.

## Non-goals

- No push, release, version bump, or modification of `main` in this framework repository.
- No automatic update of the already-installed standalone copies until the replacement plugin and
  its updater are approved and verified.
