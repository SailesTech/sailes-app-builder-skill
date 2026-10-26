'use strict';

const { getNote } = require('../notes/notes.service');

/** One CSV line per note id: id, title, status. Unknown ids propagate NotFound. */
function exportNotesCsv(user, noteIds) {
  const lines = ['id,title,status'];
  for (const id of noteIds) {
    const note = getNote(user, id);
    const status = note.archived ? 'archived' : 'active';
    lines.push(`${note.id},${JSON.stringify(note.title)},${status}`);
  }
  return lines.join('\n');
}

module.exports = { exportNotesCsv };
