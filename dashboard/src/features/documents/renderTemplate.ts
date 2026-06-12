/**
 * Substitute `{{PLACEHOLDER}}` tokens in a template body. Pure and
 * synchronous so the step-18 wizard can live-preview on every keystroke;
 * the mock backend uses the same function at creation time so preview and
 * stored `renderedBody` can never drift.
 *
 * Unknown or empty keys render as `«—»` — the raw `{{TOKEN}}` must never
 * leak into a rendered document.
 */
export function renderTemplate(
  bodyTemplate: string,
  values: Record<string, string>,
): string {
  return bodyTemplate.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    const value = values[key];
    return value !== undefined && value.trim() !== '' ? value : '«—»';
  });
}
