import type { ActionStore, OfferAction } from "./types";

export function createMemoryActionStore(seed: OfferAction[] = []): ActionStore {
  const rows = new Map(seed.map((row) => [row.id, { ...row }]));

  return {
    async insert(action) {
      rows.set(action.id, { ...action });
    },
    async update(id, patch) {
      const current = rows.get(id);
      if (!current) return null;
      const next = { ...current, ...patch };
      rows.set(id, next);
      return { ...next };
    },
    async get(id) {
      const row = rows.get(id);
      return row ? { ...row } : null;
    },
    async latestForOffer(offerId) {
      const latest = new Map<string, OfferAction>();
      for (const row of rows.values()) {
        if (row.offer_id !== offerId) continue;
        const current = latest.get(row.action);
        if (!current || current.created_at < row.created_at) latest.set(row.action, row);
      }
      return [...latest.values()].map((row) => ({ ...row }));
    },
    async listForOffer(offerId) {
      return [...rows.values()]
        .filter((row) => row.offer_id === offerId)
        .map((row) => ({ ...row }));
    },
  };
}

const demoStore = createMemoryActionStore();

export function getDemoActionStore() {
  return demoStore;
}
