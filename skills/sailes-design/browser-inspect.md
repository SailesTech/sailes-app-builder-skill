# Browser inspection — turning the UI gates into measurements

Shared instrument reference. Used by `sailes-design` (the physical-integrity gate, a11y, premium
latency budget), `sailes-diagnose` (Step 1 Live), and `sailes-test` (selector ground truth).
**Optional**: everything below has a documented fallback, and its absence is an explicit SKIP,
never a silent one.

## Why this file exists

Three of our own gates state a **binary** requirement and then hand the agent an instrument that
cannot produce a binary answer:

| Gate | Where it is stated | What verified it before |
|---|---|---|
| Physical-integrity — six pass/fail checks | `SKILL.md` §Render and self-verify | a screenshot + the model's eyes |
| Contrast ≥ 4.5:1, focus visible, keyboard nav, dark mode checked separately | `ux-rules.md` a11y + checklist | an unticked checkbox |
| Latency budget (<100ms / 100–300ms / 300ms–2s) | `premium-ux.md` §1 | nothing |

"Categorical checks — pass/fail, not opinion" is the wording in the gate itself. A model looking at
a PNG is neither categorical nor pass/fail; it is an impression with a confident tone, which is the
one output this framework exists to distrust. Chrome DevTools over CDP measures all three directly.

## 🔒 The boundary rule — read this before using any tool below

**A devtools observation never replaces a test in the suite.** CDP is an *interactive, ephemeral*
instrument: it produces no assertion, no file, and nothing that runs again tomorrow. Its legitimate
uses are exactly two:

1. **Diagnosis** — finding out what is happening, once (`sailes-diagnose` Step 1).
2. **Measurable gates** — integrity / a11y / Core Web Vitals, where the output is a number or a
   list of offending elements that goes into the artifact as evidence.

Any behavior that must not regress ends as a **Playwright test in the suite** (`sailes-test`
→ `references/browser-e2e.md`). "I clicked it in devtools and it worked" is the false green this
framework was built against — see `browser-e2e.md` §Devtools is not a test. If you find yourself
proving a behavior with `click` + `evaluate_script` and writing no test, stop: you are spending the
ratchet.

## Availability

Machine prerequisite — an MCP server, installed once per machine:

```bash
claude mcp add chrome-devtools --scope user -- npx -y chrome-devtools-mcp@latest
# No Chrome Stable on the machine? Point it at a dedicated browser instead of installing one:
#   npx -y @puppeteer/browsers install chrome@stable --path ~/.cache/puppeteer
#   ...then add --executablePath "<printed path>" to the args above.
```

Per-project opt-in is a `.mcp.json` decision card in bootstrap (Q21) — committed to the repo, so
every agent and developer on that project gets the same instrument, and no machine is mutated
behind anyone's back.

**If it is not installed:** fall back to the screenshot render (`SKILL.md` §Render and self-verify,
step 1) and record `SKIP browser-inspect (chrome-devtools MCP absent)` in the artifact — the run
log, the incident record, or the qa verdict. An unmeasured gate reported as passed is the failure;
an explicit SKIP is not.

Tools referenced below, all `mcp__chrome-devtools__*`: `navigate_page`, `resize_page`, `emulate`,
`evaluate_script`, `take_snapshot`, `take_screenshot`, `list_console_messages`,
`list_network_requests`, `get_network_request`, `lighthouse_audit`, `performance_start_trace`,
`click`, `fill`, `fill_form`, `wait_for`, `handle_dialog`.

`handle_dialog` is on **`qa`'s allow-list only** — it is the role that drives real flows and can
therefore hit a modal dialog that freezes the session. `fe-dev` inspects rather than interacts and
does not carry it. A tool this file instructs you to use but your role's `tools:` omits cannot be
called at all, so check the allow-list before quoting a recovery step (found 2026-07-26: this list
named fifteen tools and the prose used a sixteenth that no role could invoke).

---

## 1. The physical-integrity gate, measured

Run the probe below with `evaluate_script` on the rendered page, at each target width from
`ux-rules.md` (1280 / 1366 / 1440 via `resize_page`). It returns the six checks as data. Paste the
result into the artifact — that is the gate's evidence.

```js
() => {
  const R = el => el.getBoundingClientRect();
  const vw = innerWidth, vh = innerHeight;
  // checkVisibility accounts for ANCESTORS; a hand-rolled getComputedStyle check does not —
  // computed `display` of a child of a display:none parent is still its own value.
  const vis = el => el.checkVisibility
    ? el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    : (s => s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0.01)(getComputedStyle(el));
  const all = [...document.body.querySelectorAll('*')].filter(vis);
  const named = el => el.id ? '#'+el.id
    : el.className && typeof el.className === 'string'
      ? el.tagName.toLowerCase()+'.'+el.className.trim().split(/\s+/).slice(0,2).join('.')
      : el.tagName.toLowerCase();

  // 1. clipped — content larger than its own clipping box
  const clipped = all.filter(el => { const s = getComputedStyle(el);
    if (!/hidden|clip/.test(s.overflow + s.overflowX + s.overflowY)) return false;
    const overX = el.scrollWidth > el.clientWidth + 1, overY = el.scrollHeight > el.clientHeight + 1;
    if (overX && !overY && s.textOverflow === 'ellipsis') return false; // deliberate truncation, not a defect
    return overX || overY;
  }).map(named);

  // 2. off-canvas — laid out OUTSIDE the page, which is not the same as below the fold.
  //    `top >= vh` would flag every element on a scrolling page, so vertical counts only
  //    above the top edge, and only while the page is at scroll 0.
  const offcanvas = all.filter(el => { const r = R(el);
    if (r.width === 0 || r.height === 0) return false;
    return r.right <= 0 || r.left >= vw || (scrollY === 0 && r.bottom <= 0);
  }).map(named);

  // 3. unintended document h-scroll
  const de = document.documentElement;
  const hscroll = de.scrollWidth > de.clientWidth + 1
    ? { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth,
        widest: all.filter(el => R(el).right > de.clientWidth + 1).map(named).slice(0, 5) }
    : null;

  // 4. overlap — interactive controls sitting on each other
  const ctrl = all.filter(el => el.matches('a,button,input,select,textarea,[role=button],[tabindex]'));
  const overlap = [];
  for (let i = 0; i < ctrl.length; i++) for (let j = i + 1; j < ctrl.length; j++) {
    if (ctrl[i].contains(ctrl[j]) || ctrl[j].contains(ctrl[i])) continue;
    const a = R(ctrl[i]), b = R(ctrl[j]);
    if (a.width && b.width && a.left < b.right && b.left < a.right
        && a.top < b.bottom && b.top < a.bottom) overlap.push([named(ctrl[i]), named(ctrl[j])]);
  }

  // 5. controls not actually operable — centre point hits something else, or a sliver hit area
  const unclickable = ctrl.filter(el => { const r = R(el);
    if (!r.width && !r.height) return false;  // not laid out in this state (closed menu, inactive tab) — open it and re-run
    if (r.width < 2 || r.height < 2) return true;
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (cx < 0 || cy < 0 || cx > vw || cy > vh) return false; // off-canvas is check 2's finding
    const hit = document.elementFromPoint(cx, cy);
    return !(hit && (hit === el || el.contains(hit) || hit.contains(el)));
  }).map(named);

  // 6. tiny hit areas — a11y minimum, reported separately from "unclickable"
  const smallHit = ctrl.filter(el => { const r = R(el);
    return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24); }).map(named);

  return { viewport: [vw, vh], clipped: clipped.slice(0,10), offcanvas: offcanvas.slice(0,10),
           hscroll, overlap: overlap.slice(0,10), unclickable: unclickable.slice(0,10),
           smallHit: smallHit.slice(0,10),
           PASS: !clipped.length && !offcanvas.length && !hscroll && !overlap.length && !unclickable.length };
}
```

**Check 6 (responsive elements actually resize)** is the one the probe cannot answer alone: run it
at 1280, 1366 and 1440 and compare the recorded widths of the elements the spec says must flex. A
column whose measured width is identical at all three is frozen — the defect `SKILL.md` names.

**Verified against fixtures that live in the repo** — `evals/fixtures/browser-probe/`, run with
`node evals/fixtures/browser-probe/run-probe.mjs`. The runner extracts the probe from *this code
block*, so editing it here is what the fixtures test. Last run 2026-07-25 (Chromium 150 / Edge
150.0.4078.96, headless, 1254×690), both cases passing:

```json
// defect-page.html — five deliberate defects, all found
{"clipped":["div.clip"],"offcanvas":["button.off"],
 "hscroll":{"scrollWidth":2400,"clientWidth":1254,"widest":["div.wide"]},
 "overlap":[],"unclickable":["#covered","#tinybtn"],
 "smallHit":["button.off","#covered","#tinybtn"],"PASS":false}
// clean-page.html — sticky header, ellipsis truncation, a closed display:none menu,
// 1257px of content on a 690px viewport: nothing invented
{"clipped":[],"offcanvas":[],"hscroll":null,"overlap":[],"unclickable":[],
 "smallHit":["#nav-toggle","#primary-cta","#footer-action","#footer-link"],"PASS":true}
```

Note what the defect run proves about the **division of labour between checks 4 and 5**: the
fixture's button was buried under a plain `div` overlay, `overlap` stayed empty (it compares
interactive controls to each other), and check 5's hit-test caught it as `unclickable`. A control
covered by a *non-interactive* element is check 5's finding, not check 4's — do not read an empty
`overlap` as "nothing is covering anything".

And note why the *clean* fixture is the one that earns its keep. 1.14.0 shipped this probe verified
against the defect page only — a short synthetic page — and on a real application page it returned
`PASS: false` for three reasons that were all correct design: content below the fold (check 2 tested
`top >= vh`), single-line ellipsis truncation (check 1 sees `scrollWidth > clientWidth` by
definition), and links inside a closed `display:none` menu (`getComputedStyle` on a child does not
inherit the parent's `none`, so they passed the visibility filter with a 0×0 box and landed in
`unclickable`). A gate that always fails is a gate agents learn to argue with — the opposite of what
the instrument was adopted for. Fixed in 1.14.1: `checkVisibility()`, horizontal-only off-canvas,
`text-overflow: ellipsis` excluded, zero-size controls excluded.

Four honest limits, so nobody over-trusts it:
- **It finds physical defects, not ugly ones.** Taste, hierarchy, and the premium-craft pass still
  need the screenshot and your judgment. This replaces the *integrity* half of the gate only.
- **`overlap` and `smallHit` produce false positives by design** — deliberate stacking (a badge on
  an avatar, a custom checkbox behind its label) and icon-only affordances with padded parents will
  appear. Read the list; do not paste it as a verdict. `PASS` deliberately excludes `smallHit`.
- **Only what is rendered now is measured.** Content behind a closed modal, an unopened dropdown,
  or a collapsed accordion is not in the DOM or not laid out — open each state and re-run. The gate
  covers the states `ux-rules.md` requires, not just the default one. Corollary: run the probe at
  **scroll position 0** — check 2's "above the top edge" arm is only meaningful there, and it
  disables itself when `scrollY` is anything else.
- **An `overflow: hidden` carousel or marquee still reads as `clipped`.** Only ellipsis truncation
  is excluded, because only it is detectable. Read the named element before believing the finding.

## 2. Accessibility, measured

```
lighthouse_audit({ mode: 'navigation', device: 'desktop' })
```

Covers accessibility, SEO, best practices — and **excludes performance by design** (that is §3).
The accessibility category is axe-core: it returns the failing contrast pairs with their elements
and computed ratios, which is precisely what `ux-rules.md:7` asks you to "verify".

`ux-rules.md:37` requires dark mode's contrast be tested *separately*. That is one extra call:

```
emulate({ colorScheme: 'dark' })   →   lighthouse_audit(...)   →   emulate({ colorScheme: 'light' })
```

`take_snapshot` returns the accessibility tree as text. Two uses:
- **Focus and keyboard** (`ux-rules.md:66`): drive `press_key('Tab')` and re-snapshot to see where
  focus actually lands and whether the ring is on a real control — a screenshot cannot show tab order.
- **Selector ground truth for `sailes-test`**: the suite's selector doctrine is
  `getByRole('button', { name: 'Zapisz' })` (`browser-e2e.md` §Selectors). The a11y tree *is* the
  ground truth for whether those roles and accessible names exist. Checking it while building kills
  a class of "the selector doesn't resolve" churn before `tester` ever writes one.

## 3. The latency budget, measured

```
performance_start_trace({ reload: true, autoStop: true })
```

Returns Core Web Vitals (LCP, INP, CLS) plus insight sets — the numbers `premium-ux.md` §1 sets
thresholds for. Interaction latency should be read under a realistic load, not on an idle laptop:

```
emulate({ cpuThrottlingRate: 4, networkConditions: 'Fast 4G' })
```

**🚨 The trap that would make this a false instrument.** A dev server serves unminified bundles
through HMR with no CDN and no production cache headers. Its LCP is not the product's LCP. So:

- Treat dev-server timings as a **relative** signal — "this interaction got 3× slower after my
  change" is valid; "LCP 2.1s, budget met" is not.
- Any **absolute** threshold is asserted against a production or preview build only.
- Never turn a dev-server number into a green gate. That is exactly the pattern `.ai/STATE.md`
  records as this repo's recurring failure: *a step that reports success for a reason other than
  the one claimed.*

By contrast, §1 and §2 are **valid on dev** — geometry and contrast do not change with minification.

## 4. Diagnosis — Step 1 Live

`sailes-diagnose` rule #2 requires the real flow with "request URL + response + console" captured
*before* any code audit. Directly:

- `list_console_messages` (filter by pattern) — the console half of the evidence log.
- `list_network_requests` then `get_network_request` — URL, status **and body**, which is the point:
  a 200 carrying `{error:...}` is the case the rule was written for.
- `evaluate_script` reading `localStorage` / `sessionStorage` / cookies — the state the theory rests on.

**The structural gain over a fresh Playwright context.** `diagnosis-loop.md` §1 notes that a
Playwright context starting fresh *cannot* reproduce a stale-`localStorage` bug — you must pre-seed
the state to see it at all. This server does not start fresh: its default profile persists across
calls, and `--browserUrl http://127.0.0.1:9222` attaches to an already-running browser with the
real session in it. State-dependent bugs are observable in the state that produced them, rather
than reconstructed from a guess about what that state was.

Two constraints that still bind, both from `sailes-diagnose`:
- **Read-only on production.** `click`, `fill` and `evaluate_script` can write. On a production
  surface, restrict yourself to reading — snapshot, console, network, storage — and write the
  mutating step out for the human, as rule #1 requires. The browser being "just a UI" does not
  make a POST a read.
- **Never trigger a browser dialog.** `alert`/`confirm`/`prompt` block the CDP channel and the
  session stops responding. Use `handle_dialog` when one is unavoidable, and prefer
  `console.log` + `list_console_messages` over any dialog-based probe.

## 5. Where this is invoked from

| Skill | Step | What it produces |
|---|---|---|
| `sailes-design` | §Render and self-verify — integrity gate | probe JSON at 3 widths + lighthouse a11y, in the ui-spec / run log |
| `sailes-design` | premium-feel pass | CWV trace, relative to the previous measurement |
| `sailes-diagnose` | Step 1 Live | console + network + storage entries in the evidence log, with ids |
| `sailes-test` | writing browser cases | a11y-tree confirmation that role/name selectors resolve |
| `qa` | UI gate | the same probe on the real surface; a non-empty defect list is CHANGES-REQUIRED |

Reference: [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) ·
[Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
