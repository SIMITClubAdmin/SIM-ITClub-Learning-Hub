import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import type { Block } from "@/lib/lessons/types";
import { CodeBox } from "./CodeBox";
import { QuickCheck } from "./QuickCheck";
import { TryIt } from "./TryIt";

/** Turns `backticks` in lesson text into inline code. */
function Text({ children }: { children: string }) {
  const parts = children.split("`");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className="border border-(--border-accent)/40 bg-(--accent-soft) px-1.5 py-0.5 font-mono text-[0.9em] text-(--accent-text)">
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </>
  );
}

function BlockView({ block }: { block: Block }): ReactNode {
  switch (block.type) {
    case "p":
      return (
        <p className="text-lg leading-relaxed text-dim">
          <Text>{block.text}</Text>
        </p>
      );
    case "h2":
      // Sections render their own headings; a stray h2 inside an extra is a small heading.
      return <h3 className="text-xl font-semibold">{block.text}</h3>;
    case "list":
      return (
        <ul className="flex list-disc flex-col gap-2 pl-6 text-lg leading-relaxed text-dim marker:text-accent">
          {block.items.map((item) => (
            <li key={item}>
              <Text>{item}</Text>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="flex flex-col gap-2.5">
          {block.items.map((item, i) => (
            <li key={item} className="flex gap-3 text-lg leading-relaxed text-dim">
              <span className="w-6 shrink-0 font-mono text-accent">{i + 1}.</span>
              <span>
                <Text>{item}</Text>
              </span>
            </li>
          ))}
        </ol>
      );
    case "code":
      return (
        <CodeBox
          code={block.code}
          label={block.label}
          preview={block.preview}
          previewHeight={block.previewHeight}
          output={block.output}
        />
      );
    case "terms":
      return (
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[minmax(8rem,auto)_1fr]">
          {block.items.map(([term, meaning]) => (
            <Fragment key={term}>
              <dt className="pt-0.5 font-mono text-accent">{term}</dt>
              <dd className="leading-relaxed text-dim max-sm:-mt-2 max-sm:mb-1">
                <Text>{meaning}</Text>
              </dd>
            </Fragment>
          ))}
        </dl>
      );
    case "cards":
      return (
        <ul className="grid gap-6 sm:grid-cols-3">
          {block.items.map((card) => (
            <li key={card.title}>
              <p className="font-display text-2xl font-semibold">{card.title}</p>
              {card.tag && <p className="font-mono text-sm tracking-wider text-accent uppercase">{card.tag}</p>}
              <p className="mt-1 leading-relaxed text-dim">
                <Text>{card.text}</Text>
              </p>
            </li>
          ))}
        </ul>
      );
    case "extra":
      return (
        <aside className="flex flex-col gap-4 bg-violet/10 p-5 sm:p-6">
          <p className="font-mono text-xs tracking-wider text-accent uppercase">
            Beyond the slides · <span className="text-ink normal-case">{block.title}</span>
          </p>
          <LessonBlocks blocks={block.blocks} />
        </aside>
      );
    case "check":
      return (
        <QuickCheck
          question={block.question}
          options={block.options}
          answer={block.answer}
          explanation={block.explanation}
        />
      );
    case "tryit":
      return <TryIt starter={block.starter} task={block.task} js={block.js} />;
    case "link":
      return (
        <Link href={block.href} className="self-start font-mono text-sm tracking-wider text-accent uppercase hover:underline">
          {block.text} →
        </Link>
      );
  }
}

export function LessonBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </>
  );
}

export type LessonSection = { id: string; title: string; blocks: Block[] };

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/<[^>]*>/g, (tag) => tag.replace(/[<>/]/g, ""))
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Splits a lesson at its h2 headings: an intro, then one section per subtopic. */
export function splitSections(blocks: Block[]) {
  const intro: Block[] = [];
  const sections: LessonSection[] = [];
  for (const block of blocks) {
    if (block.type === "h2") sections.push({ id: slugify(block.text), title: block.text, blocks: [] });
    else if (sections.length) sections[sections.length - 1].blocks.push(block);
    else intro.push(block);
  }
  return { intro, sections };
}
