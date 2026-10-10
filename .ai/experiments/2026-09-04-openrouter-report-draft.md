# Draft zgłoszenia do OpenRoutera — DO AKCEPTU OLAFA, NIEWYSŁANE

Kanał (do wyboru): GitHub Issues `OpenRouterTeam/*`, Discord OpenRoutera, albo mail do supportu.
Rekomendacja: kanał publiczny (issue), bo dotyczy zachowania CLI, nie konta.
**Nic nie wychodzi bez wyraźnego „ok" na treść.**

---

## Tytuł

`ori claude`: per-subagent reasoning effort is dropped, and provider routing cannot be constrained on the Anthropic-compat path

## Treść

Hi — two findings from evaluating Ori 0.13.0 (alpha channel) as the model layer for an existing
multi-agent Claude Code framework. Both are measured, not inferred; happy to share the raw runs.

**Environment:** `ori 0.13.0+c7b5cda`, Claude Code 2.1.259, Linux (WSL2), OAuth credential from `ori login`.

### 1. Per-subagent reasoning effort does not reach the child under `ori claude`

Claude Code subagents are defined in `.claude/agents/<name>.md` with frontmatter that can pin a model
and a reasoning effort. Natively that field changes behaviour; under `ori claude` it does not, and
neither does the session-level `--reasoning-effort`.

Same agent file, same prompt, `thinkingTokens` read from Claude Code's `--output-format json`
(`modelUsage`), child pinned to Haiku 4.5:

| Setup | native `claude` | `ori claude` |
|---|---|---|
| child `effort: max` | **5950** | 397 (session `--reasoning-effort low`) |
| child `effort: low` | **393** | 543 (session low) / 499 (session **max**) |

The session flag does reach the *main* agent (`thinkingTokens` 0 at `low`, 551 at `max`), so reasoning
passes through the proxy and is reported — it just never reaches the children. n=1 per cell; the
native contrast is on the identical files.

Why it matters: a framework that assigns a high-effort tier to review and test gates loses that tier
silently. Nothing errors; the gates simply reason less.

### 2. No way to constrain provider routing on the Anthropic-compat path

Pinning an `anthropic/*` model does not mean Anthropic serves it. Measured via
`GET /api/v1/generation?id=`:

| Pin | `provider_name` |
|---|---|
| `anthropic/claude-sonnet-5` | Claude Platform on AWS |
| `anthropic/claude-haiku-4.5` | Amazon Bedrock |
| `google/gemini-3.8-flash` | Google |

Attribution after the fact works well. What is missing is control before the request: provider
preferences (`provider.only` / `order` / `data_collection`) are request-body parameters, and Claude Code
under `ori claude` does not send them. For teams working under client NDAs, "we can tell you where it
went" is not an answer to "we must decide where it may go". An Ori-level flag (e.g.
`ori claude --provider-only anthropic`) or an account/org-level enforced allowlist would close this.

### Smaller notes

- `claude-haiku-4-5` (Anthropic API dash form) resolves on the Anthropic-compat path but is rejected
  with `InvalidRequestError` by `ori code`; the catalog form is `anthropic/claude-haiku-4.5`. The
  asymmetry is surprising when the same string is copied between the two paths.
- `task({harness: 'claude'})` in the `ori` loop returns `No harness named "claude" can run a subagent
  here. Installed harnesses: ori.` even with Claude Code installed and launchable (`ori harness list`
  shows it under "Launchable harnesses"). If cross-harness children are not supported yet, the schema
  field is easy to read as a promise.
- Positive, for the record: `result_schema` enforcement is exactly right — an invalid child result is
  retried once and then fails loudly (`subagent_structured_result_invalid`) instead of passing something
  through. And Claude cache seeding works: 204k cache-read tokens across three subagents in one run.

Thanks — Ori is the cleanest thing we've tried for putting one bill and one credential under existing
agent CLIs; these two items are what currently stops us from using it on client work.
