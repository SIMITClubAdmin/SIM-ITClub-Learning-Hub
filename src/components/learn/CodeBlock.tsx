type Props = {
  code: string;
  label?: string;
};

/** Read-only code sample with a small file-name label. */
export function CodeBlock({ code, label }: Props) {
  return (
    <figure className="border border-violet bg-bg/90">
      {label && (
        <figcaption className="border-b border-violet px-4 py-2 font-mono text-xs tracking-wider text-dim uppercase">
          {label}
        </figcaption>
      )}
      <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-ink">
        <code>{code}</code>
      </pre>
    </figure>
  );
}
