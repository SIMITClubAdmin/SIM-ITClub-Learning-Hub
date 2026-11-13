"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CodeBox } from "./CodeBox";

// A simplified, space-themed take on last year's ITCamp CSS Playground (made by Michelle).

const LABEL = "font-mono text-xs tracking-wider text-dim uppercase";
const CHIP = "border px-3 py-1.5 font-mono text-sm transition-colors";
const chip = (on: boolean) => `${CHIP} ${on ? "border-(--accent-primary) bg-(--accent-primary) text-(--accent-on-primary)" : "border-violet/60 text-ink hover:border-accent"}`;

function Range(props: { label: string; value: number; min: number; max: number; unit?: string; onChange: (n: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between">
        <span className={LABEL}>{props.label}</span>
        <span className="font-mono text-sm text-accent">
          {props.value}
          {props.unit ?? "px"}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="accent-[#4fd8eb]"
      />
    </label>
  );
}

function Colour({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className={LABEL}>{label}</span>
      <span className="flex items-center gap-2 font-mono text-sm text-accent">
        {value}
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 bg-transparent" />
      </span>
    </label>
  );
}

/** Controls on the left, a white "browser" preview and the generated CSS on the right. */
function ToolLayout({ controls, preview, css, label = "style.css" }: { controls: ReactNode; preview: ReactNode; css: string; label?: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(16rem,22rem)_1fr]">
      <div className="flex flex-col gap-5">{controls}</div>
      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-h-56 overflow-hidden bg-white p-6 text-[#111]" style={{ fontFamily: "Times, serif" }}>
          {preview}
        </div>
        <CodeBox code={css} label={label} />
      </div>
    </div>
  );
}

/* ---------------- 1. Selectors ---------------- */

type El = { tag: string; id?: string; cls?: string; text: string; depth: number };
const PAGE: El[] = [
  { tag: "header", id: "main-header", text: "", depth: 0 },
  { tag: "h1", text: "My Projects", depth: 1 },
  { tag: "p", text: "Welcome to my portfolio.", depth: 0 },
  { tag: "div", cls: "project-card", text: "", depth: 0 },
  { tag: "h2", text: "Linktree page", depth: 1 },
  { tag: "p", text: "Built at ITCamp.", depth: 1 },
  { tag: "div", cls: "project-card", text: "", depth: 0 },
  { tag: "h2", text: "Dark mode toggle", depth: 1 },
  { tag: "p", text: "My first JavaScript.", depth: 1 },
];
const SELECTORS = [
  { sel: "p", name: "Element", match: (e: El) => e.tag === "p" },
  { sel: ".project-card", name: "Class", match: (e: El) => e.cls === "project-card" },
  { sel: "#main-header", name: "ID", match: (e: El) => e.id === "main-header" },
  { sel: "*", name: "Universal", match: () => true },
];

function SelectorsTool() {
  const [pick, setPick] = useState(0);
  const { sel, match } = SELECTORS[pick];
  const attrs = (e: El) => `${e.id ? ` id="${e.id}"` : ""}${e.cls ? ` class="${e.cls}"` : ""}`;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {SELECTORS.map((s, i) => (
          <button key={s.sel} type="button" onClick={() => setPick(i)} className={chip(i === pick)} aria-pressed={i === pick}>
            {s.name} <span className="opacity-70">{s.sel}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className={LABEL}>HTML · matched lines light up</p>
          <pre className="mt-2 overflow-x-auto bg-[#05081a] p-4 font-mono text-sm leading-7">
            {PAGE.map((e, i) => (
              <div key={i} className={match(e) ? "bg-accent/20 text-accent" : "text-dim"} style={{ paddingLeft: e.depth * 20 }}>
                {`<${e.tag}${attrs(e)}>${e.text}${e.text ? `</${e.tag}>` : ""}`}
              </div>
            ))}
          </pre>
        </div>
        <div>
          <p className={LABEL}>Browser · matched elements get a red outline</p>
          <div className="mt-2 bg-white p-4 text-[#111]" style={{ fontFamily: "Times, serif" }}>
            {(() => {
              const out: ReactNode[] = [];
              let i = 0;
              while (i < PAGE.length) {
                const e = PAGE[i];
                const kids: El[] = [];
                let j = i + 1;
                while (j < PAGE.length && PAGE[j].depth > 0) kids.push(PAGE[j++]);
                const ring = (x: El) => (match(x) ? "outline outline-2 outline-offset-2 outline-red-500" : "");
                out.push(
                  <div key={i} className={`my-2 ${e.tag === "div" ? "bg-[#f3e8ff] p-2" : ""} ${ring(e)}`}>
                    {e.text}
                    {kids.map((k, n) => {
                      const Tag = k.tag as "h1" | "h2" | "p";
                      const size = k.tag === "h1" ? "text-2xl font-bold" : k.tag === "h2" ? "text-lg font-bold" : "";
                      return (
                        <Tag key={n} className={`${size} ${ring(k)}`}>
                          {k.text}
                        </Tag>
                      );
                    })}
                  </div>,
                );
                i = j;
              }
              return out;
            })()}
          </div>
        </div>
      </div>
      <CodeBox code={`${sel} {\n    outline: 2px solid red;\n}`} label="style.css" />
    </div>
  );
}

/* ---------------- 2. Specificity ---------------- */

const ROUNDS = [
  {
    name: "Element vs class",
    html: '<p class="note">Who wins?</p>',
    rules: [
      { css: "p { color: green; }", score: "0, 0, 0, 1", color: "green" },
      { css: ".note { color: blue; }", score: "0, 0, 1, 0", color: "blue" },
    ],
    winner: 1,
    why: "A class is more specific than an element.",
  },
  {
    name: "Class vs ID",
    html: '<p id="intro" class="note">Who wins?</p>',
    rules: [
      { css: ".note { color: blue; }", score: "0, 0, 1, 0", color: "blue" },
      { css: "#intro { color: red; }", score: "0, 1, 0, 0", color: "red" },
    ],
    winner: 1,
    why: "An ID beats any number of classes.",
  },
  {
    name: "One class vs two classes",
    html: '<p class="note big">Who wins?</p>',
    rules: [
      { css: ".note.big { color: purple; }", score: "0, 0, 2, 0", color: "purple" },
      { css: ".note { color: blue; }", score: "0, 0, 1, 0", color: "blue" },
    ],
    winner: 0,
    why: "Two classes add up to more than one, even though the one-class rule comes later.",
  },
  {
    name: "ID vs inline",
    html: '<p id="intro" style="color: orange;">Who wins?</p>',
    rules: [
      { css: "#intro { color: red; }", score: "0, 1, 0, 0", color: "red" },
      { css: 'style="color: orange;"', score: "1, 0, 0, 0", color: "orange" },
    ],
    winner: 1,
    why: "Inline CSS beats every selector. That's why it's hard to override later.",
  },
];

function SpecificityTool() {
  const [round, setRound] = useState(0);
  const r = ROUNDS[round];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {ROUNDS.map((x, i) => (
          <button key={x.name} type="button" onClick={() => setRound(i)} className={chip(i === round)} aria-pressed={i === round}>
            Round {i + 1}: {x.name}
          </button>
        ))}
      </div>
      <p className="font-mono text-sm text-dim">{r.html}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {r.rules.map((rule, i) => (
          <div key={rule.css} className={`p-4 ${i === r.winner ? "bg-accent/15" : "bg-grid/40 opacity-70"}`}>
            <p className="font-mono text-ink">{rule.css}</p>
            <p className="mt-2 font-mono text-xs tracking-wider text-dim uppercase">Score {rule.score}</p>
            {i === r.winner && <p className="mt-2 font-display text-lg font-semibold text-accent">Winner</p>}
          </div>
        ))}
      </div>
      <div className="bg-white p-5 text-2xl" style={{ fontFamily: "Times, serif", color: r.rules[r.winner].color }}>
        Who wins?
      </div>
      <p className="text-lg text-dim">{r.why}</p>
      <p className="text-dim">
        Score order: <span className="font-mono text-ink">inline, IDs, classes, elements</span>. Compare from the left; the first bigger
        number wins.
      </p>
    </div>
  );
}

/* ---------------- 3. Basic styling ---------------- */

const FONTS = ["Arial, sans-serif", "'Times New Roman', serif", "'Courier New', monospace", "Georgia, serif", "Verdana, sans-serif"];
const WEIGHTS = [300, 400, 600, 700, 900];

function BasicStylingTool() {
  const [bg, setBg] = useState("#1a2150");
  const [text, setText] = useState("#e6f1ff");
  const [size, setSize] = useState(24);
  const [weight, setWeight] = useState(400);
  const [font, setFont] = useState(FONTS[0]);
  const [align, setAlign] = useState("center");
  const css = `.box {\n    background-color: ${bg};\n    color: ${text};\n    font-size: ${size}px;\n    font-weight: ${weight};\n    font-family: ${font};\n    text-align: ${align};\n}`;
  return (
    <ToolLayout
      css={css}
      controls={
        <>
          <Colour label="background-color" value={bg} onChange={setBg} />
          <Colour label="color" value={text} onChange={setText} />
          <Range label="font-size" value={size} min={12} max={72} onChange={setSize} />
          <div className="flex flex-col gap-2">
            <span className={LABEL}>font-weight</span>
            <div className="flex flex-wrap gap-2">
              {WEIGHTS.map((w) => (
                <button key={w} type="button" onClick={() => setWeight(w)} className={chip(w === weight)} aria-pressed={w === weight}>
                  {w}
                </button>
              ))}
            </div>
          </div>
          <label className="flex flex-col gap-2">
            <span className={LABEL}>font-family</span>
            <select value={font} onChange={(e) => setFont(e.target.value)} className="border border-violet bg-bg px-3 py-2 text-ink">
              {FONTS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-col gap-2">
            <span className={LABEL}>text-align</span>
            <div className="flex gap-2">
              {["left", "center", "right"].map((a) => (
                <button key={a} type="button" onClick={() => setAlign(a)} className={chip(a === align)} aria-pressed={a === align}>
                  {a}
                </button>
              ))}
            </div>
          </div>
        </>
      }
      preview={
        <div
          className="p-6"
          style={{ backgroundColor: bg, color: text, fontSize: size, fontWeight: weight, fontFamily: font, textAlign: align as "left" }}
        >
          Hello ITCamp! 👋
          <div style={{ fontSize: "0.6em" }}>This is your canvas.</div>
        </div>
      }
    />
  );
}

/* ---------------- 4. Box model ---------------- */

function BoxModelTool() {
  const [margin, setMargin] = useState(20);
  const [border, setBorder] = useState(5);
  const [padding, setPadding] = useState(20);
  const [width, setWidth] = useState(200);
  const [sizing, setSizing] = useState<"content-box" | "border-box">("content-box");
  const total = sizing === "content-box" ? width + 2 * padding + 2 * border : width;
  const content = sizing === "content-box" ? width : Math.max(0, width - 2 * padding - 2 * border);
  const css = `.box {\n    box-sizing: ${sizing};\n    width: ${width}px;\n    padding: ${padding}px;\n    border: ${border}px solid #6d4aff;\n    margin: ${margin}px;\n}`;
  return (
    <ToolLayout
      css={css}
      controls={
        <>
          <div className="flex gap-2">
            {(["content-box", "border-box"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSizing(s)} className={chip(s === sizing)} aria-pressed={s === sizing}>
                {s}
              </button>
            ))}
          </div>
          <Range label="margin (space outside)" value={margin} min={0} max={60} onChange={setMargin} />
          <Range label="border (edge line)" value={border} min={0} max={30} onChange={setBorder} />
          <Range label="padding (space inside)" value={padding} min={0} max={50} onChange={setPadding} />
          <Range label="width" value={width} min={150} max={300} onChange={setWidth} />
          <p className="leading-relaxed text-dim">
            Width on screen: <span className="font-mono text-accent">{total}px</span>
            {sizing === "content-box"
              ? ` = ${width} + ${padding} + ${padding} + ${border} + ${border}. Padding and border are added to the width.`
              : ". Padding and border fit inside the width, so the box stays the size you set."}
          </p>
        </>
      }
      preview={
        <div className="inline-block bg-[#ffd9a8]" style={{ padding: margin }} title="margin">
          <div style={{ border: `${border}px solid #6d4aff`, padding, background: "#c8f0e0", width: total }} title="padding">
            <div className="flex items-center justify-center bg-[#bcd4ff] py-6 text-center font-sans text-sm" style={{ width: content }}>
              content {content}px
            </div>
          </div>
        </div>
      }
    />
  );
}

/* ---------------- 5. Styling boxes ---------------- */

const BORDER_STYLES = ["solid", "dashed", "dotted", "double"];

function StylingBoxesTool() {
  const [borderWidth, setBorderWidth] = useState(3);
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderColor, setBorderColor] = useState("#6d4aff");
  const [radius, setRadius] = useState(12);
  const [padding, setPadding] = useState(24);
  const [shadowY, setShadowY] = useState(8);
  const [blur, setBlur] = useState(20);
  const [bg, setBg] = useState("#ffffff");
  const shadow = `0 ${shadowY}px ${blur}px rgba(0, 0, 0, 0.25)`;
  const css = `.card {\n    background-color: ${bg};\n    padding: ${padding}px;\n    border: ${borderWidth}px ${borderStyle} ${borderColor};\n    border-radius: ${radius}px;\n    box-shadow: ${shadow};\n}`;
  return (
    <ToolLayout
      css={css}
      controls={
        <>
          <Range label="border width" value={borderWidth} min={0} max={20} onChange={setBorderWidth} />
          <div className="flex flex-wrap gap-2">
            {BORDER_STYLES.map((s) => (
              <button key={s} type="button" onClick={() => setBorderStyle(s)} className={chip(s === borderStyle)} aria-pressed={s === borderStyle}>
                {s}
              </button>
            ))}
          </div>
          <Colour label="border colour" value={borderColor} onChange={setBorderColor} />
          <Range label="border-radius" value={radius} min={0} max={50} onChange={setRadius} />
          <Range label="padding" value={padding} min={0} max={60} onChange={setPadding} />
          <Range label="shadow distance" value={shadowY} min={0} max={20} onChange={setShadowY} />
          <Range label="shadow blur" value={blur} min={0} max={40} onChange={setBlur} />
          <Colour label="background-color" value={bg} onChange={setBg} />
        </>
      }
      preview={
        <div className="flex min-h-48 items-center justify-center bg-[#eef1f8]">
          <div
            className="w-64 font-sans"
            style={{ backgroundColor: bg, padding, border: `${borderWidth}px ${borderStyle} ${borderColor}`, borderRadius: radius, boxShadow: shadow }}
          >
            <p className="font-bold">Jeff</p>
            <p className="text-sm">IT Club member</p>
          </div>
        </div>
      }
    />
  );
}

export const PLAYGROUND_TOOLS = [
  { id: "selectors", title: "Selectors", text: "Pick a selector and see which elements it finds.", Tool: SelectorsTool },
  { id: "specificity", title: "Specificity battle", text: "Two rules, one element: who wins?", Tool: SpecificityTool },
  { id: "basic-styling", title: "Colours and text", text: "Change colours, fonts and alignment.", Tool: BasicStylingTool },
  { id: "box-model", title: "Box model", text: "Margin, border, padding and content, with box-sizing.", Tool: BoxModelTool },
  { id: "styling-boxes", title: "Styling boxes", text: "Borders, rounded corners and shadows.", Tool: StylingBoxesTool },
];

/** The whole playground: a sidebar of tools and one numbered section per tool. */
export function Playground() {
  return (
    <div className="grid gap-8 md:grid-cols-[13rem_1fr] lg:grid-cols-[15rem_1fr] xl:gap-14">
      <nav aria-label="Playground tools" className="md:sticky md:top-6 md:h-[calc(100svh-8rem)] md:self-start md:border-r md:border-violet/50 md:pr-6">
        <Link href="/learn" className="font-mono text-xs tracking-wider text-dim uppercase hover:text-accent">
          ← All topics
        </Link>
        <p className="mt-5 font-mono text-xs tracking-wider text-accent uppercase">CSS Playground</p>
        <ol className="mt-2 flex flex-col gap-0.5">
          {PLAYGROUND_TOOLS.map((tool, i) => (
            <li key={tool.id}>
              <a href={`#${tool.id}`} className="block py-1.5 text-sm text-dim hover:text-ink">
                <span className="mr-2 font-mono text-xs text-accent">{String(i + 1).padStart(2, "0")}</span>
                {tool.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex min-w-0 flex-col gap-16 pb-16">
        <header className="flex flex-col gap-4">
          <p className="font-mono text-xs tracking-wider text-accent uppercase">Play around · nothing here can break</p>
          <h1 className="text-4xl font-semibold sm:text-6xl">CSS Playground</h1>
          <p className="max-w-3xl text-xl text-dim">
            Move the sliders and press the buttons to see CSS change live. Every tool writes the CSS for you, so you can copy it into
            your own <span className="font-mono text-accent">style.css</span>.
          </p>
          <p className="text-sm text-dim">
            Based on last year&apos;s ITCamp CSS Playground by{" "}
            <a
              href="https://www.linkedin.com/in/mchellechan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink underline underline-offset-4 hover:text-accent"
            >
              Michelle Chan
            </a>
            , 25/26 Vice
            President.
          </p>
        </header>
        {PLAYGROUND_TOOLS.map(({ id, title, text, Tool }, i) => (
          <section key={id} id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
            <p className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</p>
            <h2 id={`${id}-title`} className="mt-1 text-3xl font-semibold sm:text-4xl">
              {title}
            </h2>
            <p className="mt-2 mb-6 text-lg text-dim">{text}</p>
            <Tool />
          </section>
        ))}
      </div>
    </div>
  );
}
