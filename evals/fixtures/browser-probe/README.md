# Fixtures — the physical-integrity probe

Two pages and a runner that keep `skills/sailes-design/browser-inspect.md` §1 honest.

```bash
node evals/fixtures/browser-probe/run-probe.mjs
BROWSER_BIN="/path/to/chrome" node evals/fixtures/browser-probe/run-probe.mjs   # explicit binary
```

The runner extracts the probe from the **first ```js block in the doc** — never a copy — so what
runs is what ships. Edit the probe, run this. No Chromium on the machine → it prints
`SKIP browser-probe fixtures` and exits 0.

| Fixture | What it protects |
|---|---|
| `defect-page.html` | The probe still *finds* things: clipped container, off-canvas button, 2400px document scroll, a button under a non-interactive overlay (invisible to any screenshot), a 10×10 sliver control. |
| `clean-page.html` | The probe does not *invent* things. Every pattern here is correct design: a sticky header, single-line ellipsis truncation, a closed `display:none` menu, and 1257px of content on a 690px viewport. Expected: `PASS: true`. |

`clean-page.html` is the one that matters. 1.14.0 shipped with only a defect fixture — a short
synthetic page — and the pasted "fixture-verified" output looked like proof. On a real
application page the same probe returned `PASS: false` with three false-positive classes
(below-the-fold content read as off-canvas, deliberate truncation read as clipping, controls in a
closed menu read as unclickable). A gate that always fails is a gate agents learn to argue with,
which is the failure the instrument was adopted to end. Fixed in 1.14.1.

Last run 2026-07-25, Chromium 150 (Edge 150.0.4078.96) headless, 1254×690 — both cases passing.

**RED-verified 2026-07-25** — restoring the pre-fix off-canvas rule (`r.top >= vh`) makes
`clean-page.html` fail with `offcanvas: ["section","#footer-action","#footer-link"]`, exit 1. The
test detects the fault it was written for; it does not merely mirror the probe.

`smallHit` is deliberately not asserted: sub-24px hit areas are advisory, noisy on default-styled
controls, and excluded from `PASS`.
