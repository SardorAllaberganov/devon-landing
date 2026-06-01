/**
 * Renders a tab trigger label that reserves the active-state (semibold) width
 * even when the tab is inactive. Without this wrapper, the active tab grows
 * because bold characters are wider than regular weight, which shifts every
 * sibling tab around the active marker — a "shimmer" effect every click.
 *
 * Implementation: stack two copies of the label in a CSS grid cell. The first
 * copy is permanently `font-semibold` but `invisible` (reserves width, no ink).
 * The second copy renders at whatever weight the parent's data-active state
 * resolves to. Both share the same grid cell so the visible copy sits on top
 * of the invisible one — no extra height, no double-render artifacts.
 */
interface Props {
  children: string;
}

export default function TabLabel({ children }: Props) {
  return (
    <span className="grid">
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 invisible font-semibold"
      >
        {children}
      </span>
      <span className="col-start-1 row-start-1">{children}</span>
    </span>
  );
}
