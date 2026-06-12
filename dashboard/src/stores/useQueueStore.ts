import { create } from 'zustand';

/**
 * Approvals-queue badge state (step 19). The Sidebar shows the acting
 * persona's pending-item count on the "Kelishuvlar" nav item; pages that
 * change queue contents (decide / sign / accept / submit-for-review / delete)
 * call `bump()` so every mounted Sidebar refetches. `setCount` is also called
 * directly by whoever already holds a fresh `listMyApprovals` result (the
 * `/approvals` page itself) to avoid a redundant fetch.
 */
interface QueueState {
  /** null until the first fetch resolves — badge hidden while unknown. */
  count: number | null;
  /** Increment to invalidate; Sidebar effects depend on it. */
  version: number;
  setCount: (count: number) => void;
  bump: () => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  count: null,
  version: 0,
  setCount: (count) => set({ count }),
  bump: () => set((s) => ({ version: s.version + 1 })),
}));
