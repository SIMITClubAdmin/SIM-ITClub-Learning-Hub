const CODE = "bg-grid/60 px-1 font-mono text-[0.9em] [overflow-wrap:anywhere]";

/** Question-bank text with `backticks` shown as inline code. Text without backticks is unchanged. */
export function InlineCode({ text, codeClassName = CODE }: { text: string; codeClassName?: string }) {
  const parts = text.split("`");
  // An unpaired backtick means the text isn't marked up: show it as written.
  if (parts.length % 2 === 0) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) =>
        i % 2 ? (
          <code key={i} className={codeClassName}>
            {part}
          </code>
        ) : (
          part
        ),
      )}
    </>
  );
}
