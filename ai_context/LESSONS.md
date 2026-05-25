# Devon — Build Lessons

> Things that surfaced during build that future sessions should respect. Organized by topic, not chronologically. Pair with [`HISTORY.md`](./HISTORY.md) (timeline) and [`AI_CONTEXT.md`](./AI_CONTEXT.md) (snapshot).

---

## Layout

### Dashboard main content area is full-width

**Decision (2026-05-25, step 05 AppShell):** the `<main>` inside [`AppShell.tsx`](../dashboard/src/components/layout/AppShell.tsx) does **not** clamp to a max-width. Content fills the full viewport minus the desktop sidebar (240px on `lg+`, 0 below) and the horizontal padding (`px-4` → `md:px-6`).

**Why:** Devon's dashboard is a data-dense admin surface — tables, kanban boards, audit logs, employee lists — that benefits from horizontal room. The original step 05 prompt set `max-w-[1280px] mx-auto` on `<main>` which made the page feel like a marketing landing page on wide monitors (1440+) and wasted vertical scrolling on tables that would otherwise fit horizontally.

**How to apply:**
- When adding new dashboard pages, let `<PageHeader>` + content sit directly under `<main>` without an outer `max-w-*` wrapper on the page shell.
- If a specific page legitimately needs constrained width (e.g., a one-column form, the employee wizard step content), use `max-w-*` on the *inner* form/section container — not on the page shell.
- Do **not** re-introduce a clamp on `<main>` in `AppShell.tsx` even if a later step prompt suggests it.
