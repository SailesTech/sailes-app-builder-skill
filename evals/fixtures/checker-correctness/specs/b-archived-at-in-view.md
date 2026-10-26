# Spec: `getNote` exposes `archivedAt` instead of the `archived` boolean

Status: approved

## Behaviour

- `getNote(user, noteId)` returns `{ id, title, body, archivedAt }` where `archivedAt` is the ISO
  timestamp the note was archived at, or `null` when it is not archived. The boolean `archived`
  field is replaced by `archivedAt`.

## Files

- `src/notes/notes.service.js` (`getNote`)
- `test/notes.test.js`

## Done-when

- `node --test test/notes.test.js` → exit 0, including a test that `getNote` returns the `archivedAt` stamped by `archiveNote`.
