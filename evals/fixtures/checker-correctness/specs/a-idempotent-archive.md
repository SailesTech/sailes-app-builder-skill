# Spec: archiving a note is idempotent

Status: approved

## Behaviour

- `archiveNote(user, noteId)` stamps `archivedAt` with the current time (ISO string) and returns the note.
- Archiving a note that is already archived leaves `archivedAt` at its original value (no re-stamp).
- An unknown `noteId` throws `NotFound`.

## Files

- `src/notes/notes.service.js` (`archiveNote`)
- `test/notes.test.js`

## Done-when

- `node --test test/notes.test.js` → exit 0, including a test that a second `archiveNote` call keeps the first `archivedAt`.
