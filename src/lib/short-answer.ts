/**
 * Marking for typed (short-answer) questions. Only the server marks, since the accepted
 * answers live in the question bank, but these helpers hold no answers themselves.
 *
 * Forgiven: extra spaces, curly quotes from phone keyboards, ' versus ", "Git" for "git",
 * and a dash a keyboard turned into – or —. Everything else must match exactly: the
 * command, its flags, branch names and the commit message.
 */

/** Longest typed answer accepted. */
export const SHORT_ANSWER_MAX = 120;

/** A typed answer as it is saved and shown: one line, single spaces, none at either end. */
export function cleanTyped(raw: string) {
  return raw.replace(/\s+/g, " ").trim();
}

/** The form two answers are compared in. */
export function normalizeCommand(raw: string) {
  return cleanTyped(raw)
    .replace(/[‘’‚‛′]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/'/g, '"')
    .replace(/—/g, "--")
    .replace(/[–−]/g, "-")
    .replace(/^git(?= |$)/i, "git");
}

/** Whether a typed answer matches one of the accepted answers. */
export function matchesAnswer(typed: string, accepted: readonly string[]) {
  const answer = normalizeCommand(typed);
  return answer !== "" && accepted.some((a) => normalizeCommand(a) === answer);
}
