import type { ReactNode } from "react";

/** Inline code, as an accent pill. */
export function Pill({ children }: { children: ReactNode }) {
  return <code className="gs-pill">{children}</code>;
}

/** A numbered lesson section, matching the sidebar's sub-links. */
export function Section({ id, index, title, children, wide }: { id: string; index: number; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-6 ${wide ? "w-full" : "max-w-4xl"}`}>
      <p className="gs-ui text-sm text-(--accent-text)">{String(index).padStart(2, "0")}</p>
      <h2 id={`${id}-title`} className="gs-heading mt-1 text-3xl font-semibold sm:text-4xl">
        {title}
      </h2>
      <div className="mt-5 flex flex-col gap-5 text-lg leading-relaxed">{children}</div>
    </section>
  );
}

export function Card({ title, tag, tone = "var(--accent-text)", children }: { title: ReactNode; tag?: string; tone?: string; children: ReactNode }) {
  return (
    <div className="gs-card flex flex-col gap-2 p-6" style={{ borderTopColor: tone, borderTopWidth: 2 }}>
      {tag && (
        <p className="gs-ui text-xs font-bold tracking-wider uppercase" style={{ color: tone }}>
          {tag}
        </p>
      )}
      <h3 className="gs-heading text-xl font-semibold">{title}</h3>
      <div className="flex flex-col gap-2 text-base leading-relaxed text-(--text-muted)">{children}</div>
    </div>
  );
}

export function Callout({ children, tone = "var(--accent-primary)" }: { children: ReactNode; tone?: string }) {
  return (
    <div className="border-l-2 pl-4 text-(--text-muted)" style={{ borderColor: tone }}>
      {children}
    </div>
  );
}

/** A terminal transcript: lines starting with "%" are typed, the rest is output. */
export function Terminal({ lines, title = "Terminal (CLI)" }: { lines: string[]; title?: string }) {
  return (
    <figure className="overflow-hidden rounded border border-(--border-subtle) bg-(--code-bg)">
      <figcaption className="gs-ui border-b border-(--border-subtle) bg-(--bg-panel) px-4 py-2 text-xs tracking-wider text-(--text-muted) uppercase">{title}</figcaption>
      <pre className="gs-code overflow-x-auto px-4 py-3 text-sm leading-6">
        {lines.map((line, i) => (
          <div key={i} className={line.startsWith("%") ? "text-(--code-text)" : line.startsWith("#") ? "text-(--text-faint)" : "text-(--git-local)"}>
            {line.startsWith("%") ? (
              <>
                <span className="text-(--accent-text) select-none">% </span>
                {line.slice(2)}
              </>
            ) : (
              line || " "
            )}
          </div>
        ))}
      </pre>
    </figure>
  );
}

/** One of the four actions from the slides: the terminal way next to the GitHub Desktop way. */
export function CliVsDesktop({ cli, desktop, check }: { cli: string[]; desktop: ReactNode; check: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-4 md:grid-cols-2">
        <Terminal lines={cli} />
        <div className="overflow-hidden rounded border border-(--border-subtle) bg-(--bg-surface)">
          <p className="gs-ui border-b border-(--border-subtle) bg-(--bg-panel) px-4 py-2 text-xs tracking-wider text-(--text-muted) uppercase">GitHub Desktop</p>
          <div className="px-4 py-3 text-base leading-relaxed text-(--text-muted)">{desktop}</div>
        </div>
      </div>
      <p className="text-base text-(--text-muted)">
        <span className="gs-ui mr-2 text-xs font-bold tracking-wider text-(--git-local) uppercase">Check</span>
        {check}
      </p>
    </div>
  );
}

/** A "menu path" like File > Clone Repository. */
export function Menu({ children }: { children: ReactNode }) {
  return <span className="gs-ui rounded-sm border border-(--border-subtle) bg-(--bg-panel) px-1.5 py-0.5 text-[0.85em] text-(--text-main)">{children}</span>;
}

export function Steps({ items }: { items: ReactNode[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-4">
          <span className="gs-ui w-7 shrink-0 text-xl font-bold text-(--accent-text)">{i + 1}.</span>
          <div className="pt-0.5 text-base leading-relaxed">{item}</div>
        </li>
      ))}
    </ol>
  );
}
