'use strict';

const rows = new Map();
let seq = 0;

const db = {
  nextId: () => `n${++seq}`,
  reset: () => {
    rows.clear();
    seq = 0;
  },
  notes: {
    get: (id) => rows.get(id) ?? null,
    put: (note) => {
      rows.set(note.id, note);
      return note;
    },
    listByTenant: (tenantId) => [...rows.values()].filter((n) => n.tenantId === tenantId),
    listAll: () => [...rows.values()],
  },
};

module.exports = { db };
