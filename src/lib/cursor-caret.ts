/**
 * Lets a typing surface (the Git studio's terminal) hand the custom cursor its text caret, so
 * the [ ] frame can sit on the caret instead of the mouse while a student types there.
 */
export type CaretRect = { x: number; y: number; w: number; h: number };
export type CaretSource = { el: Element; rect: () => CaretRect | null };

const sources = new Set<CaretSource>();
let listener: (() => void) | null = null;

/** Registers el as a typing surface; rect() returns its caret in viewport pixels, or null when hidden. */
export function registerCaret(el: Element, rect: () => CaretRect | null) {
  const source = { el, rect };
  sources.add(source);
  return () => {
    sources.delete(source);
    listener?.();
  };
}

/** Call whenever the caret may have moved (typing, output, scrolling) so the cursor follows it. */
export function caretMoved() {
  listener?.();
}

/** The typing surface that contains node, if any. */
export function caretSourceFor(node: Node | null | undefined) {
  if (!node) return null;
  for (const source of sources) if (source.el.contains(node)) return source;
  return null;
}

/** Used by the custom cursor: one listener at a time. */
export function onCaretMoved(fn: (() => void) | null) {
  listener = fn;
}
