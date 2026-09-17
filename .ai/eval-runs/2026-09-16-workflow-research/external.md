# Claude Code External Documentation Research

Date: 2026-09-16

## 1. Claude Code Subagents: Frontmatter Fields & Model Resolution

### Subagent Frontmatter Fields

**Source:** https://code.claude.com/docs/en/sub-agents  
**Fetch method:** WebFetch  
**Verbatim quote:**
```
| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Unique identifier (lowercase, hyphens only) |
| `description` | Yes | When Claude should delegate to this subagent |
| `tools` | No | Tools the subagent can use |
| `model` | No | `sonnet`, `opus`, `haiku`, or `inherit` |
| `permissionMode` | No | `default`, `acceptEdits`, `auto`, `plan`, etc. |
| `maxTurns` | No | Max agentic turns before stopping |
| `memory` | No | `user`, `project`, or `local` for persistent memory |
| `skills` | No | Preload skills into context |
| `mcpServers` | No | MCP servers available to subagent |
| `isolation` | No | Set to `worktree` for isolated git worktree |
```

### Model Resolution Order (v2.1.251+)

**Source:** https://code.claude.com/docs/en/sub-agents (WebFetch) + WebSearch results  
**Fetch method:** WebFetch + WebSearch  
**Verbatim quote from WebSearch result:**
"Claude Code resolves the subagent's model in this order: 1. The per-invocation parameter, 2. The subagent definition's model frontmatter, where inherit selects the main conversation's model, 3. The main conversation's model, 4. If you set CLAUDE_CODE_SUBAGENT_MODEL, Claude Code tries that model first, under these same rules"

**Version note:** "Before v2.1.251, CLAUDE_CODE_SUBAGENT_MODEL came first in this order and overrode both the per-invocation parameter and the frontmatter, including model: inherit."

### CLAUDE_CODE_SUBAGENT_MODEL Environment Variable

**Source:** https://code.claude.com/docs/en/sub-agents  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Set `CLAUDE_CODE_SUBAGENT_MODEL` environment variable as a default for all subagents:

```bash
claude --env CLAUDE_CODE_SUBAGENT_MODEL=haiku
```"

**Status:** The environment variable does NOT appear explicitly listed in the env-vars documentation (fetched), but is referenced in the sub-agents documentation with clear usage examples.

### Agent Definition Configuration (Agent SDK)

**Source:** https://code.claude.com/docs/en/agent-sdk/subagents  
**Fetch method:** WebFetch  
**Verbatim fields from AgentDefinition table:**
- `model: string | No | Model override for this agent. Accepts an alias such as 'fable', 'opus', 'sonnet', 'haiku', 'inherit', or a full model ID. 'inherit' uses the main model. When you omit it, Claude Code picks the model in the subagent model order`
- `effort: 'low' | 'medium' | 'high' | 'xhigh' | 'max' | number | No | Reasoning effort level for this agent`
- `maxTurns: number | No | Maximum number of agentic turns before the agent stops. When the agent reaches the limit, Claude Code returns its output marked as partial, and you can resume the agent to continue. The partial marking requires Claude Code v2.1.246 or later`
- `tools: string[] | No | Array of allowed tool names. If omitted, inherits every tool available to subagents`

---

## 2. Claude Code Workflow Tool & Multi-Agent Orchestration

### Dynamic Workflows Definition

**Source:** https://code.claude.com/docs/en/workflows  
**Fetch method:** WebFetch  
**Verbatim quote:**
"A dynamic workflow is a JavaScript script that orchestrates many subagents at once. Claude writes the script for the task you describe, and a runtime executes it in the background while your session stays responsive."

"Reach for a workflow when a task needs more agents than one conversation can coordinate, or when you want the orchestration codified as a script you can read and rerun. Examples include a codebase-wide bug sweep, a 500-file migration, a research question that needs sources cross-checked against each other, and a hard plan worth drafting from several independent angles before you commit to one."

### Workflow Availability

**Source:** https://code.claude.com/docs/en/workflows  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Dynamic workflows are available on all paid plans, with Anthropic API access, and on Amazon Bedrock, Google Cloud's Agent Platform, and Microsoft Foundry. On Pro, turn them on from the Dynamic workflows row in `/config`."

### Prompt Caching in Workflows

**Source:** https://code.claude.com/docs/en/workflows  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Prompt caching in a fan-out: Agents in the same run can read each other's prompt cache. Two agents that run with the same model, effort level, agent type, tools, output schema, and working directory build the same tools-and-system-prompt prefix, so an agent that starts after a matching sibling's response has begun reads that sibling's cache on its first request.

A workflow agent's requests fall outside the main conversation's cache TTL bucket, so its cache holds for five minutes by default, including on a Claude subscription. To keep it for an hour, set `subagentPromptCacheTtl` to `1h`. The API bills 1-hour cache writes at a higher rate."

### Workflow Runtime Constraints

**Source:** https://code.claude.com/docs/en/workflows  
**Fetch method:** WebFetch  
**Table showing behavior and limits:**
- "Up to 16 concurrent agents, fewer when Claude Code has fewer CPUs available, including inside a CPU-limited container"
- "In a fan-out, agents that share the first agent's prompt-cache prefix start up to 5 seconds after it by default"
- "Up to 4,096 items in a single `parallel()` or `pipeline()` call: the runtime rejects a longer list with an error"
- "1,000 agents total per run"

---

## 3. Claude Code Cost Management

### General Cost Tracking

**Source:** https://code.claude.com/docs/en/costs  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Claude Code charges by API token consumption. For subscription plan pricing (Pro, Max, Team, Enterprise), see claude.com/pricing. Per-developer costs vary widely based on model selection, codebase size, and usage patterns such as running multiple instances or automation.

Across enterprise deployments, the average cost is around $13 per developer per active day and $150-250 per developer per month, with costs remaining below $30 per active day for 90% of users."

### Subagent Token Usage Tracking

**Source:** https://code.claude.com/docs/en/costs  
**Fetch method:** WebFetch  
**Verbatim quote:**
"The cache tracking line covers the main conversation only, not subagents. However, on a Pro, Max, Team, or Enterprise plan, `/usage` also shows a breakdown of what counts against your plan limits: Attribution: recent usage attributed to skills, subagents, plugins, and individual MCP servers, each shown as a percentage of the total."

"For specialized cost tracking with subagents, this is useful when you run multiple models (for example, Haiku for subagents and Opus for the main agent) and want to see where tokens are going."

### Cost Optimization for Subagents

**Source:** https://code.claude.com/docs/en/costs  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Delegate these to subagents so the verbose output stays in the subagent's context while only a summary returns to your main conversation. Additionally, for simple subagent tasks, specify `model: haiku` in your subagent configuration."

### Subscription Plan Limits

**Source:** https://code.claude.com/docs/en/costs  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Subscription plans include a rolling usage allowance. When it runs out you see one of these messages: You've hit your session limit, You've hit your weekly limit, You've hit your Opus limit, or You've hit your Sonnet limit, with Claude Code blocking further requests until the reset time shown in the message."

### Workflow Cost Advisory

**Source:** https://code.claude.com/docs/en/workflows  
**Fetch method:** WebFetch  
**Verbatim quote:**
"A workflow spawns many agents, so a single run can use meaningfully more tokens than working through the same task in conversation. Runs count toward your plan's usage and rate limits."

"When a workflow schedules more than 25 agents, or its projected token total passes 1.5 million, its progress line in the task panel below the input box shows a `Large workflow` warning."

### API Cost by Model and Prompt Caching

**Source:** https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching (via redirect from https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)  
**Fetch method:** WebFetch  
**Verbatim table:**
```
| Aspect | Details |
|--------|---------|
| Cache write cost | 1.25x base input tokens (5m) or 2x (1h) |
| Cache read cost | 0.1x base input tokens (0.025x for Claude Fable/Mythos 5.1) |
```

---

## 4. Prompt Caching Behavior

### Cache TTL (Time-To-Live)

**Source:** https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching  
**Fetch method:** WebFetch  
**Verbatim quote:**
"The cache's default minimum lifetime (TTL) is 5 minutes. Anthropic also offers a 1-hour cache TTL. This lifetime is refreshed each time the cached content is used."

"The lifetime is measured from the start of the request that writes or reads the cache entry, not from the end of its response. Time spent generating a response counts against the lifetime, so the window for a follow-up request to reuse the cache is the lifetime minus the generation time."

### Minimum Cacheable Prompt Length by Model

**Source:** https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching  
**Fetch method:** WebFetch  
**Verbatim quote:**
"The minimum cacheable prompt prefix varies by model. For Claude Mythos Preview, Claude Opus 4.7, Claude Opus 4.6, and Claude Opus 4.5, the minimum cacheable prompt length is 4,096 tokens. For Claude Opus 4.8, Claude Sonnet 4.6, Claude Sonnet 4.5, Claude Opus 4.1, Claude Opus 4 (deprecated), and Claude Sonnet 4 (deprecated), it's 1,024 tokens. Additionally, the minimum cacheable prompt length on Claude Opus 5 is 512 tokens, down from 1,024 tokens on Claude Opus 4.8."

### Cache Invalidation Triggers

**Source:** https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Cache is invalidated when these change:
- Tool definitions
- System prompt modifications
- Images anywhere in prompt
- `tool_choice` parameter
- Thinking configuration
- Speed settings"

### Cache Namespaces / Per-Model Cache Separation

**Status:** NOT FOUND  
**Search performed:** WebSearch for "Claude prompt caching cache namespaces per-model cache" on allowed domains  
**Fetch performed:** https://platform.claude.com/docs/en/docs/build-with-claude/prompt-caching  
**Finding:** The documentation does not use the term "cache namespaces" as a distinct feature. The documentation focuses on cache control breakpoints, TTLs, and privacy/organization-level separation, but does not explicitly document per-model cache namespaces or isolate caches by model.

---

## 5. Anthropic Multi-Agent Research System

### Token Multiplier: Multi-Agent vs. Single-Agent

**Source:** https://www.anthropic.com/engineering/multi-agent-research-system  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Multi-agent systems use about 15× more tokens than chats, while agents typically use about 4× more tokens than chat interactions."

### When Multi-Agent Systems Pay Off

**Source:** https://www.anthropic.com/engineering/multi-agent-research-system  
**Fetch method:** WebFetch  
**Verbatim quote:**
"For economic viability, multi-agent systems require tasks where the value of the task is high enough to pay for the increased performance. More specifically, multi-agent architectures handle complex research and analysis where parallel exploration pays dividends."

### Model Efficiency vs. Token Budget

**Source:** https://www.anthropic.com/engineering/multi-agent-research-system  
**Fetch method:** WebFetch  
**Verbatim quote:**
"Interestingly, the latest Claude models act as large efficiency multipliers on token use, as upgrading to Claude Sonnet 4 is a larger performance gain than doubling the token budget on Claude Sonnet 3.7. This suggests that model choice can have a significant impact on token efficiency."

### Core Architecture Pattern

**Source:** https://www.anthropic.com/engineering/multi-agent-research-system  
**Fetch method:** WebFetch  
**Verbatim quote:**
"The orchestrator-worker pattern features:
- A lead agent that analyzes queries and develops research strategies
- Parallel subagents that independently search and evaluate information
- Dynamic, multi-step search replacing traditional static RAG retrieval
- Parallel tool calling that reduces complex query research time by up to 90%"

---

## 6. Items Searched For But Not Found

1. **"Cache namespaces" as distinct feature:** Searched on docs.anthropic.com and docs.claude.com. The documentation does not use this term. Cache management appears to be handled via cache_control fields and per-request breakpoints, not namespaced storage.

2. **Specific CLAUDE_CODE_SUBAGENT_MODEL variable in env-vars documentation:** The variable is referenced in the sub-agents frontmatter documentation with usage examples, but does not appear explicitly in the environment variables reference list at https://code.claude.com/docs/en/env-vars (fetched).

3. **Opus vs. Sonnet usage counting differently against plan limits:** Found that "You've hit your Opus limit" and "You've hit your Sonnet limit" are separate limit messages, but the documentation does not specify whether Opus and Sonnet have separate per-model budgets or share a single monthly allowance. The source describes usage windows and rolling limits but not explicit per-model budget pools.

---

## 7. Findings Summary Table

| Topic | Key Finding | Source |
|-------|--|--|
| Subagent Model Priority | Per-invocation > frontmatter > CLAUDE_CODE_SUBAGENT_MODEL env var > main model (v2.1.251+) | code.claude.com/docs/en/sub-agents |
| Frontmatter Fields | name, description, tools, model, maxTurns, memory, skills, mcpServers, isolation, permissionMode, effort | code.claude.com/docs/en/sub-agents |
| Workflow Max Agents | 1,000 agents per run; 16 concurrent (CPU-dependent) | code.claude.com/docs/en/workflows |
| Workflow Cache TTL | 5 min default, 1h available at 1.25x-2x cost | code.claude.com/docs/en/workflows |
| Multi-Agent Cost | 15× chat tokens, 4× single-agent tokens | anthropic.com/engineering/multi-agent-research-system |
| Cache TTL | 5 min default, 1h at higher cost | platform.claude.com/docs (redirected from docs.anthropic.com) |
| Min Cacheable Prefix | 512 tokens (Opus 5), 1024 (Sonnet 4/Opus 4.x), 4096 (older models) | platform.claude.com/docs |
| Cache Read Cost | 0.1x input tokens (0.025x for Fable/Mythos) | platform.claude.com/docs |
| Cache Write Cost | 1.25x (5m) or 2x (1h) | platform.claude.com/docs |
| Avg Developer Cost | $13/day, $150-250/month (enterprise baseline) | code.claude.com/docs/en/costs |

