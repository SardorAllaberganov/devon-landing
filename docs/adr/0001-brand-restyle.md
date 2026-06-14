# ADR 0001 — Brand restyle: blue/navy palette, token rename, font split, self-hosted fonts

- **Status:** Accepted
- **Date:** 2026-06-14
- **Deciders:** Product owner (Sardor) + AI pair
- **Surfaces:** `landing/index.html`, `dashboard/` SPA
- **Supersedes:** the original "warm chrome" identity (emerald `#1F4E3F` + cream + cinnamon, Inter + Fraunces)

## Context

Devon received a new brand kit: an icon mark + full logo (`assets/devon_icon.svg`, `assets/devon_logo_full.svg`) in vivid blue `#0878FE` on deep navy `#011528`, plus the **Craftwork Grotesk** typeface. The existing UI used a warm emerald/cream/cinnamon palette with Inter + Fraunces. The new blue logo clashed badly with the warm palette, so a partial asset swap would have looked unfinished — a full visual rebrand was required across both surfaces.

Three structural questions had to be settled before implementation:

1. **Palette completeness** — two brand colors can't run a UI; we needed a full derived system (surfaces, neutrals, text tiers, semantic states) that holds WCAG 2.1 AA contrast (`.claude/rules/accessibility.md` requires ≥4.5:1 body text, ≥3:1 large/non-text UI).
2. **Token naming** — the dashboard's palette lives in `dashboard/src/index.css` as two layers (shadcn semantic vars + Devon `--color-*` brand tokens). Hue-named tokens (`emerald`/`cream`/`cinnamon`/`signal`) would become lies if simply repointed to blue/gray/amber.
3. **Fonts + on-premise** — Devon is fully on-premise (data sovereignty is a hard constraint in `CLAUDE.md`), yet both surfaces loaded Inter + Fraunces from `fonts.googleapis.com` — an external runtime dependency.

## Decision

1. **"Cool corporate" palette.** White surfaces, cool-gray canvas (`#F7F9FC`), navy ink (`#011528`), slate text tiers, blue actions, white sidebar. Full token set with hex + HSL is recorded in the design spec ([`docs/superpowers/specs/2026-06-14-brand-restyle-design.md`](../superpowers/specs/2026-06-14-brand-restyle-design.md) §3).

2. **Brand/primary contrast split.** Pure brand blue `#0878FE` only reaches ~4.1:1 on white — below the 4.5:1 floor for normal text. We therefore split it: `--color-brand` `#0878FE` for identity / focus ring / large + decorative use only (all ≥3:1 contexts), and `--color-primary` `#0A6BE0` (~5:1) for all interactive text, links, and buttons. Soft-tint **badges** use darker foreground tokens (`--color-success-fg #15803D`, `--color-warning-fg #B45309`, `--color-error-fg #B91C1C`, all ≥4.5:1) because the mid-shade foregrounds fail AA on the light soft backgrounds.

3. **Rename hue tokens to honest names; repoint neutral names.** `emerald→primary`/`brand`, `cream→canvas`, `cream-deep`/`cream-warm→surface-2`, `cinnamon→warning`, `signal→success`. Already-neutral tokens (`ink`, `line`, `surface`, `body`, `muted-fg`) keep their names and are repointed. The rename is a mechanical, grep-verifiable consumer sweep (~70 dashboard files); the codebase and the `ai_context/*` docs stay truthful.

4. **Display/body font split, self-hosted.** Craftwork Grotesk (`--font-display` / `--font-heading`) for headings, wordmark, buttons, stat numerals, and the slogan; Inter (`--font-sans`) for body, tables, forms, and tabular numbers. Fraunces (the old serif) is retired. Both families are **self-hosted** — Craftwork Grotesk as a vendored variable woff2, Inter via `@fontsource/inter` (dashboard) and vendored woff2 (landing). The Google Fonts `<link>` is removed from both surfaces.

5. **Logo lockup.** Icon-mark SVG (`BrandMark` component in the dashboard; inline SVG on the landing) + a live mixed-case "Devon" wordmark in Craftwork Grotesk — replacing the prior uppercase letter-spaced "DEVON" + geometric "D". Favicon redesigned around the blue mark; `theme-color` → navy `#011528`.

6. **No dark mode** authored (light-only; `@custom-variant dark` remains but no `.dark` palette). No layout/feature/data changes; no `SEED_VERSION` bump.

## Consequences

**Positive**
- A single cohesive identity across landing + dashboard; the brand kit is faithfully applied.
- The codebase is truthful — no `text-emerald`-renders-blue traps; `ai_context` docs match reality.
- No external font dependency — aligns with the on-premise mandate and slightly improves load (self-hosted woff2, ~23 KB CWG variable).
- AA contrast is verified and the brand/primary + `*-fg` discipline is documented for future work.

**Negative / ongoing**
- One-time mechanical churn (~90 dashboard files swept). Mitigated by grep-to-zero gates and a two-stage subagent review.
- A standing discipline: contributors must use `brand` only for large/decorative/focus and `primary` for interactive text — easy to get wrong.
- The landing's cool section-rotation recolor is a maintained design judgment (not derivable from tokens alone).
- A naming-collision gotcha surfaced and was fixed: renaming the landing's `btn-emerald` class to `btn-primary` collided with a pre-existing `btn-primary`; it became `btn-brand` instead. (Captured in `ai_context/LESSONS.md`.)

## References
- Spec: [`docs/superpowers/specs/2026-06-14-brand-restyle-design.md`](../superpowers/specs/2026-06-14-brand-restyle-design.md)
- Plan: [`docs/superpowers/plans/2026-06-14-brand-restyle.md`](../superpowers/plans/2026-06-14-brand-restyle.md)
- Accessibility rule: [`.claude/rules/accessibility.md`](../../.claude/rules/accessibility.md)
