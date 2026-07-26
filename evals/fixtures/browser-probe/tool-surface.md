# chrome-devtools MCP — tool surface vs. role allow-lists

**Measured 2026-07-26 against the live server**, not against documentation: a minimal MCP handshake
(`initialize` → `notifications/initialized` → `tools/list`) over stdio to `chrome-devtools-mcp@latest`.
Registry version at the time: `npm view chrome-devtools-mcp dist-tags.latest` = **1.6.0**.

This check had never been run. `handle_dialog` — a tool the docs instructed and no role could call —
was found by accident on 2026-07-26 while an agent was reading prose for an unrelated reason. Nothing
would have found the next one.

## The server offers 29 tools

```
click close_page drag emulate evaluate_script fill fill_form get_console_message
get_network_request handle_dialog hover lighthouse_audit list_console_messages
list_network_requests list_pages navigate_page new_page performance_analyze_insight
performance_start_trace performance_stop_trace press_key resize_page select_page
take_heapsnapshot take_screenshot take_snapshot type_text upload_file wait_for
```

## Direction 1 — phantom tools (a role names something the server does not have): **none**

All three allow-lists were clean after the 1.17.1 `handle_dialog` fix. This is the direction that
fails loudly at the moment of use, mid-gate, on a live app.

## Direction 2 — capabilities silently unavailable: **12 tools, and three of them mattered**

Fixed in 1.21.0:

- **`performance_start_trace` had no `performance_stop_trace` and no `performance_analyze_insight`.**
  `qa` could start a trace it could never stop or read — an unpaired capability, which is a defect
  rather than a gap. Both added.
- **Nobody had `hover`.** `designer` is required to specify *every* interaction state, hover included,
  and `qa` is required to vision-verify the built result against that artifact. The configuration
  forbade verifying a state the doctrine mandates. Added to all three.
- **No page management** (`list_pages`, `new_page`, `select_page`, `close_page`). `sailes-pipedrive`
  is entirely iframes, floating windows and OAuth callbacks; `qa` could not follow a popup or switch
  to an embedded panel. Added to `qa`.
- Also added to `qa`: `drag` (drag-and-drop flows are real behaviour to prove) and `upload_file`
  (B2B apps have uploads, and `qa` could not prove one end to end).

**Deliberately not granted, so the next reader knows it was considered:**

| Tool | Why not |
|---|---|
| `type_text` | `fill` / `fill_form` cover the flows we prove; keystroke-level typing has no case yet |
| `get_console_message` | `list_console_messages` already covers the evidence `qa` collects |
| `take_heapsnapshot` | memory profiling is not `qa`'s lane, and no skill asks for it |
| page management for `fe-dev` / `designer` | both inspect rather than drive; they do not follow popups |

## Runtime verification — 2026-07-26, after the plugin reload

The 1.21.0 grants were written to `agents/*.md` but could not be verified in the session that made
them: the MCP server had just been installed and its tools were not yet in the session's registry.
After `/plugin marketplace update` + `/reload-plugins`, the **real `qa` role** was spawned (not a
stand-in — this is the case where a stand-in proves nothing, because what is under test *is* the
runtime) and asked to enumerate its own tool surface.

**All 26 granted tools present**, including every one added in 1.21.0: `hover`, `drag`,
`upload_file`, `performance_stop_trace`, `performance_analyze_insight`, and all four of
`list_pages` / `new_page` / `select_page` / `close_page`. `handle_dialog` from 1.17.1 likewise.

Two invariants confirmed at runtime in the same pass:

- **The model pin holds** — the role reported `claude-sonnet-5`, which is its frontmatter value, not
  the session's model.
- **`Agent` is absent** — `qa` cannot spawn. This is what makes depth-2 sub-teams safe by
  configuration rather than by promise, and it had only ever been checked by reading `tools:` lists
  and by `validate-frontmatter.test.js`. Now it has been checked from inside the role.

**A third fact, unlooked-for:** the role reported `reasoning_effort=40` against its frontmatter
`effort: high`. That confirms from the other direction what 1.16.2 recorded — **frontmatter `effort`
is applied**, while the Agent *tool's* `effort` parameter is undeclared and silently does nothing.
The numeric scale is not documented anywhere we can cite, so `40` is recorded as an observation, not
interpreted.

## How to re-run this

The probe is `evals/fixtures/browser-probe/` territory. Re-run it whenever the MCP server version
moves — a tool renamed upstream becomes a phantom in our allow-lists silently, and the failure
surfaces mid-gate on a live app rather than in CI.
