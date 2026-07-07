# Premium UX — the interaction feel that makes an app *behave* expensive

Pair with `premium-craft.md` (visual finish). Craft makes the app **look** premium; this file makes it **feel** premium. The two ship together — a beautiful app that lags, loses state, or nags with confirm dialogs reads as cheap the moment someone uses it. Linear, Raycast, and Superhuman earn "premium" mostly *here*: speed, keyboard, forgiveness.

**Core thesis: premium feel = respect for the user's time and intent.** Every pattern below is one of two moves: *remove waiting* or *remove fear*. An app that responds instantly and can always be undone feels expensive; an app that makes you wait and then asks "are you sure?" feels like bureaucracy.

Scope: B2B web on the Sailes baseline (TanStack Start + React Query + shadcn). Apply to any app a person uses more than once a week; for a one-off internal form, the basics in `ux-rules.md` suffice.

## 1. Speed is the premium feature — the latency budget

Users read latency as quality. Design to a budget, not to "add a spinner":

| Delay | What the user must experience | Implementation |
|---|---|---|
| < 100ms | Instant — no indicator at all | optimistic update, local state |
| 100–300ms | Continuous — a transition covers it | ease-out transition, no spinner |
| 300ms–2s | Placeholder — skeleton matching final layout | skeleton (never a lone spinner in a blank box) |
| > 2s | Narrated progress — what's happening + real progress | progress bar/steps, cancellable |

- **Optimistic UI as the default for mutations.** Write the change to the UI immediately, sync in the background, roll back with an explanatory error if it fails (React Query `onMutate`/`onError`). Waiting for the server on a checkbox toggle is the internal-tool tell.
- **Prefetch on intent.** Prefetch route data on link hover/focus (TanStack Router `preload: 'intent'`). Navigation that arrives already-loaded is the single cheapest "this app is fast" win.
- **No spinner flash.** Delay any loading indicator ~150–300ms so sub-perceptible loads never flicker one. A skeleton that flashes for 80ms reads as jank, not speed.
- **Keep data warm.** Sensible React Query `staleTime` so back-navigation renders instantly from cache and revalidates quietly — never a blank refetch of a page the user just saw.

Checkable: mutations are optimistic w/ rollback; hover-prefetch on primary nav; loading indicators delayed ≥150ms; back-nav renders from cache instantly.

## 2. Keyboard-first — the power-user contract

For any app used daily, the keyboard is the premium interface. Mouse-only operation is tolerated; keyboard flow is *loved*.

- **Command palette (⌘K)** for apps with >5 destinations or frequent actions: navigate, act, and search from one field (shadcn `<Command>`). This is the highest-status single feature in modern B2B.
- **List navigation**: ↑/↓ or j/k moves selection, Enter opens, Esc closes/backs out. Selection state visibly styled (not browser default).
- **Focus is managed, never lost.** Modal opens → focus its first field; modal closes → focus returns to the trigger; item deleted → focus moves to the neighbor. Focus evaporating to `<body>` is a tell.
- **Shortcuts are discoverable**: shown in tooltips and the palette (`⌘K` next to the label), not a hidden readme. A handful of memorable ones beats thirty.
- Everything remains fully operable by keyboard per `ux-rules.md` a11y — this section is about making it *pleasant*, not just possible.

Checkable: ⌘K palette present (daily-use apps); lists arrow-navigable; focus managed on open/close/delete; shortcuts visible in tooltips.

## 3. Forgiveness over friction — undo, not "are you sure?"

Confirm dialogs tax every action to guard against a rare mistake. Premium apps invert this: act immediately, make reversal trivial.

- **Undo instead of confirm** for anything reversible: delete → the row leaves + toast "Deleted — Undo" (5–10s). Reserve confirmation for the truly irreversible, and there use a *typed* confirm (name of the thing), not a reflexive "OK".
- **Autosave with a quiet indicator** ("Saved" / "Saving…") for editors and settings; no Save button to forget. Where an explicit submit exists, **drafts survive** navigation and refresh.
- **No data loss, ever.** Warn before closing with unsaved changes; restore form state after an auth timeout; a failed submit never eats the input.
- **Destructive is visually and spatially separated** (from `ux-rules.md`) *and* behaviorally slower: no destructive action on the fastest path (default button, Enter).

Checkable: reversible actions use undo-toast, not confirm; editors autosave or preserve drafts; refresh/auth-expiry never loses input; nothing destructive on the default keypress.

## 4. Input intelligence — the form does the work

- **Smart defaults everywhere**: prefill from context (current project, last-used values, the record they came from). An empty form the system could have half-filled is laziness the user feels.
- **Parse, don't police.** Accept the paste: phone numbers with spaces, NIP with dashes, dates in the local format, a URL with whitespace — normalize on blur instead of rejecting. Format-as-you-type for masked values (phone, amounts).
- **Search that forgives**: case/diacritic-insensitive (crucial for Polish data — "lodz" finds "Łódź"), partial matches, most-recent-first suggestions.
- **Fewer fields is the feature.** Every field must justify itself; derive what's derivable (city from postal code), stage what's optional into a later step.
- Validation discipline (on-blur, error-below-field with the fix) stays as defined in `ux-rules.md`.

Checkable: context prefill on every create-form; pasted messy input normalized, not rejected; search diacritic-insensitive; no field that could have been derived or deferred.

## 5. Direct manipulation & continuity — the app remembers

- **Edit in place** where the user reads the value: click the title to rename, click the status badge to change it — not a detour through an edit page for one field.
- **State lives in the URL**: filters, sort, active tab, search query. Refresh reproduces the exact view; every screen is deep-linkable and shareable. Scroll position survives back-navigation.
- **The app remembers the user**: last-visited tab, column widths, collapsed sections, chosen density — persisted per user. Re-configuring the same view every session is the internal-tool experience.
- **Click-to-copy** with instant feedback on every ID, email, token, and reference a user might need elsewhere.

Checkable: single-field edits inline; filters/sort/tab in URL params; per-user view prefs persist; IDs/emails copyable in one click.

## 6. Feedback discipline — quiet, placed, truthful

- **Feedback near the action.** Inline result at the point of change; toast only when the result is *out of view* (background job done, undo offers). Toast-for-everything is noise.
- **Buttons narrate their own async**: label → spinner-in-button → success state, in place (per `ux-rules.md` loading rules). Not a global overlay for a row-level action.
- **Errors follow the writing rules** in `design-judgment.md`: what happened + how to fix, never apologetic, never vague — and after an optimistic rollback, the error must say *what was rolled back*.
- **Numbers change with continuity**: counters roll/animate on change (see `premium-craft.md` §5) so the user sees *that* and *what* changed — not a silent teleport.

Checkable: toasts only for out-of-view results; async feedback in the triggering control; rollback errors name the rolled-back change.

## The premium-feel tells — pass/fail before handoff

Run with the `premium-craft.md` checklist, on the real interactive app (not a static render):

- [ ] Mutations optimistic w/ rollback; nothing sub-300ms shows a spinner; indicators delayed ≥150ms
- [ ] Primary nav prefetches on hover/intent; back-navigation is instant from cache
- [ ] ⌘K palette (daily-use apps); lists keyboard-navigable; focus managed on open/close/delete
- [ ] Reversible actions = undo-toast; irreversible = typed confirm; drafts/inputs survive refresh
- [ ] Create-forms prefilled from context; messy paste normalized; search diacritic-insensitive
- [ ] Filters/sort/tab in the URL; per-user view preferences persist; inline edit for single fields
- [ ] Feedback placed at the action; toasts only for out-of-view results

## Anti-patterns — what makes a correct app feel cheap

- Spinner on every click; a checkbox that waits for the server; skeleton flash on instant loads.
- "Are you sure?" on reversible actions; a delete that's faster to trigger than to undo.
- Forms that reject pasted real-world input; empty forms the system could have prefilled.
- Filters reset on refresh; scroll lost on back; the same view re-configured every session.
- Global loading overlays for row-level actions; toast confetti for in-view changes.
- Mouse-only operation of an app someone uses eight hours a day.
</content>
