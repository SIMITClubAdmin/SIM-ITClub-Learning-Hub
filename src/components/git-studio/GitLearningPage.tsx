import type { ReactNode } from "react";
import Link from "next/link";
import { LESSON_TOPICS, lessonHref } from "@/lib/lessons";
import { GitTrackLayout } from "./GitTrackLayout";
import { StudioLoader } from "./StudioLoader";

const SECTIONS = [
  { id: "local-vs-remote", title: "Local vs remote" },
  { id: "inside-a-repository", title: "Inside a Git repository" },
  { id: "playground", title: "Interactive Git playground" },
  { id: "pushing-to-github", title: "How do we push code to GitHub?" },
];

const LESSONS = [
  "How Git & GitHub work",
  "Repositories & staging",
  "Commits & snapshots",
  "Branches & merging",
  "Remote repos: git push",
  "Pull requests & forks",
  "Resolving merge conflicts",
];

/** Inline code, as a cyan monospace pill. */
function Pill({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm border border-[#1e3a5f] bg-[#0f243c] px-1.5 py-0.5 font-mono text-[0.85em] whitespace-nowrap text-[#38bdf8]">
      {children}
    </code>
  );
}

function SectionHeading({ index, id, children }: { index: number; id: string; children: ReactNode }) {
  return (
    <>
      <p className="font-mono text-sm text-[#38bdf8]">{String(index).padStart(2, "0")}</p>
      <h2 id={`${id}-title`} className="mt-1 gs-heading text-3xl font-bold tracking-tight text-[#f8fafc] sm:text-4xl">
        {children}
      </h2>
    </>
  );
}

function Sidebar() {
  return (
    <nav aria-label="Git & GitHub lessons">
      {/* useIsolationGuard turns these Links into full page loads, so isolation never leaks out. */}
      <Link href="/learn" className="font-mono text-xs tracking-wider text-[#94a3b8] uppercase hover:text-[#38bdf8]">
        ← All topics
      </Link>
      <p className="mt-5 font-mono text-xs tracking-wider text-[#38bdf8] uppercase">Git &amp; GitHub</p>
      <ol className="mt-2 flex flex-col gap-0.5">
        {LESSONS.map((title, i) => {
          const current = i === 0;
          return (
            <li key={title}>
              {current ? (
                <a href="#top" aria-current="page" className="block py-1.5 text-sm font-semibold text-[#f8fafc]">
                  <span className="mr-2 font-mono text-xs text-[#38bdf8]">{String(i + 1).padStart(2, "0")}</span>
                  {title}
                </a>
              ) : (
                <span className="flex items-baseline py-1.5 text-sm text-[#64748b]" title="Lesson notes coming soon. Practise it now in the playground.">
                  <span className="mr-2 font-mono text-xs text-[#38bdf8]/60">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{title}</span>
                  <span className="ml-2 font-mono text-[10px] tracking-wider text-[#475569] uppercase">Soon</span>
                </span>
              )}
              {current && (
                <ol className="mb-2 ml-7 flex flex-col">
                  {SECTIONS.map((section) => (
                    <li key={section.id}>
                      <a href={`#${section.id}`} className="block py-1 text-sm text-[#94a3b8] hover:text-[#38bdf8]">
                        {section.title}
                      </a>
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-6 flex flex-col gap-1.5 font-mono text-xs tracking-wider uppercase">
        {LESSON_TOPICS.map((topic) => (
          <Link key={topic.slug} href={lessonHref(topic.slug, topic.lessons[0].slug)} className="text-[#94a3b8] hover:text-[#38bdf8]">
            {topic.name} →
          </Link>
        ))}
      </div>
    </nav>
  );
}

const ANATOMY = [
  {
    title: "Working directory",
    tag: "Workbench sandbox",
    accent: "#f59e0b",
    text: "The files you see and edit. Changes here are only on your desk: Git notices them, but nothing is saved yet.",
    command: "git status",
    note: "lists them as modified",
  },
  {
    title: "Staging area",
    tag: "Packing box (index)",
    accent: "#10b981",
    text: "You choose which changes go in the box. Only what is packed goes into the next snapshot, so one fix can ship without another.",
    command: "git add .",
    note: "packs every change",
  },
  {
    title: "Commit history",
    tag: "Sealed vault (.git)",
    accent: "#38bdf8",
    text: "A commit seals the box into a permanent snapshot with a message, an author and a unique ID. Each one points back to its parent.",
    command: 'git commit -m "…"',
    note: "seals the snapshot",
  },
];

const PUSH_STEPS: { command?: string; title: string; text: ReactNode }[] = [
  {
    command: "git add .",
    title: "Stage the changes",
    text: "Git compares every file with the last snapshot and copies the changed ones into the staging area.",
  },
  {
    command: 'git commit -m "feat: update portal UI"',
    title: "Seal a commit",
    text: (
      <>
        The staging area becomes a new commit with an ID (a SHA such as <Pill>a1b2c3d</Pill>) that points back to its parent commit.
      </>
    ),
  },
  {
    command: "git push origin main",
    title: "Ask GitHub to update main",
    text: (
      <>
        Send branch <Pill>main</Pill> to the remote named <Pill>origin</Pill>. Git first asks GitHub which commits it already has.
      </>
    ),
  },
  {
    title: "Object transfer",
    text: (
      <>
        Git packs only the missing commits, folders (trees) and file contents (blobs) into one compressed packfile and uploads it over HTTPS or SSH.
        That is the <Pill>Writing objects: 100%</Pill> line.
      </>
    ),
  },
  {
    title: "Remote ref update",
    text: (
      <>
        GitHub moves its <Pill>main</Pill> pointer to your newest commit, and your <Pill>origin/main</Pill> tag moves with it. Now{" "}
        <Pill>git status</Pill> says your branch is up to date.
      </>
    ),
  },
];

export function GitLearningPage() {
  return (
    <GitTrackLayout sidebar={<Sidebar />}>
      <header id="top" className="flex max-w-4xl scroll-mt-6 flex-col gap-4">
        <p className="font-mono text-xs tracking-wider text-[#38bdf8] uppercase">Git &amp; GitHub · Lesson 1 of 7 · About 25 minutes</p>
        <h1 className="gs-heading text-4xl font-bold tracking-tight text-[#f8fafc] sm:text-6xl">How Git &amp; GitHub work</h1>
        <p className="text-xl text-[#94a3b8]">
          Git saves snapshots of your project on your laptop. GitHub keeps a copy online so your team can share it. Learn the path a change takes
          from your editor to GitHub, then drive it yourself in a real sandbox.
        </p>
      </header>

      <section id="local-vs-remote" aria-labelledby="local-vs-remote-title" className="max-w-4xl scroll-mt-6">
        <SectionHeading index={1} id="local-vs-remote">
          Local vs remote
        </SectionHeading>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-[#152238] bg-[#0b101e] p-5">
            <p className="font-mono text-xs font-bold tracking-wider text-[#10b981] uppercase">Local · your machine</p>
            <h3 className="mt-2 gs-heading text-xl font-bold tracking-tight text-[#f8fafc]">Git, the tool</h3>
            <p className="mt-3 leading-relaxed text-[#cbd5e1]">
              <Pill>git</Pill> is a program on your computer. It watches one project folder and saves snapshots into a hidden <Pill>.git</Pill>{" "}
              folder inside it.
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-[#94a3b8]">
              <li>Works offline: commits, branches and history all live on your laptop.</li>
              <li>Every commit is a full snapshot you can go back to.</li>
              <li>Delete the project folder and that history is gone with it.</li>
            </ul>
          </div>
          <div className="rounded border border-[#152238] bg-[#0b101e] p-5">
            <p className="font-mono text-xs font-bold tracking-wider text-[#a855f7] uppercase">Remote · the cloud</p>
            <h3 className="mt-2 gs-heading text-xl font-bold tracking-tight text-[#f8fafc]">GitHub, the shared copy</h3>
            <p className="mt-3 leading-relaxed text-[#cbd5e1]">
              <Pill>github.com</Pill> hosts a copy of your repository, called a remote and usually named <Pill>origin</Pill>.
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-sm text-[#94a3b8]">
              <li>You push commits up to share them; teammates pull them down.</li>
              <li>Pull requests, reviews and issues happen there.</li>
              <li>It is a backup: your work survives a lost laptop.</li>
            </ul>
          </div>
        </div>
        <p className="mt-4 border-l-2 border-[#38bdf8] pl-4 text-[#94a3b8]">
          Git is the tool; GitHub is one place to keep and share what Git makes. GitLab and Bitbucket do the same job.
        </p>
      </section>

      <section id="inside-a-repository" aria-labelledby="inside-a-repository-title" className="max-w-4xl scroll-mt-6">
        <SectionHeading index={2} id="inside-a-repository">
          Inside a Git repository
        </SectionHeading>
        <p className="mt-4 text-lg text-[#94a3b8]">Every change passes through three areas before it can leave your machine.</p>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {ANATOMY.map((area, i) => (
            <li key={area.title} className="flex flex-col rounded border border-[#152238] bg-[#0b101e]" style={{ borderTopColor: area.accent }}>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <p className="font-mono text-xs font-bold tracking-wider uppercase" style={{ color: area.accent }}>
                  {i + 1}. {area.tag}
                </p>
                <h3 className="gs-heading text-xl font-bold tracking-tight text-[#f8fafc]">{area.title}</h3>
                <p className="text-sm leading-relaxed text-[#cbd5e1]">{area.text}</p>
              </div>
              <p className="border-t border-[#152238] px-5 py-3 text-xs text-[#64748b]">
                <Pill>{area.command}</Pill> {area.note}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex flex-wrap items-center gap-2 font-mono text-xs text-[#64748b]">
          <span className="text-[#f59e0b]">working dir</span> → <Pill>git add</Pill> → <span className="text-[#10b981]">staging</span> →{" "}
          <Pill>git commit</Pill> → <span className="text-[#38bdf8]">.git</span> → <Pill>git push</Pill> →{" "}
          <span className="text-[#a855f7]">GitHub</span>
        </p>
      </section>

      <section id="playground" aria-labelledby="playground-title" className="w-full scroll-mt-6">
        <div className="max-w-4xl">
          <SectionHeading index={3} id="playground">
            Interactive Git playground
          </SectionHeading>
          <p className="mt-4 text-lg text-[#94a3b8]">
            A real Node.js sandbox runs in this tab. Edit the portal, then use the terminal: every <Pill>git</Pill> command moves files through the
            pipeline and grows the graph, and <Pill>git push</Pill> sends your commits down the tunnel to GitHub.
          </p>
        </div>
        <div className="mt-6">
          <StudioLoader />
        </div>
      </section>

      <section id="pushing-to-github" aria-labelledby="pushing-to-github-title" className="max-w-4xl scroll-mt-6">
        <SectionHeading index={4} id="pushing-to-github">
          How do we push code to GitHub?
        </SectionHeading>
        <ol className="mt-6 flex flex-col gap-5">
          {PUSH_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="font-mono text-2xl font-bold text-[#38bdf8]">{i + 1}.</span>
              <div className="flex flex-col gap-1.5 pt-1">
                <p className="gs-heading text-lg font-bold tracking-tight text-[#f8fafc]">
                  {step.title}
                  {step.command && (
                    <>
                      {" "}
                      <Pill>{step.command}</Pill>
                    </>
                  )}
                </p>
                <p className="leading-relaxed text-[#cbd5e1]">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 border-l-2 border-[#a855f7] pl-4 text-[#94a3b8]">
          Watch it happen: in the <a href="#playground" className="text-[#38bdf8] underline underline-offset-4">playground</a>, switch to{" "}
          <span className="font-mono text-[#38bdf8]">0.5x Slow-Mo</span> and push. Each 📦 capsule is one commit travelling to GitHub.
        </p>
      </section>

      <footer className="flex max-w-4xl flex-wrap items-center justify-between gap-4">
        <Link href="/learn" className="text-[#94a3b8] underline underline-offset-4 hover:text-[#f8fafc]">
          ← All topics
        </Link>
        <span className="font-mono text-xs tracking-wider text-[#475569] uppercase">Next: Repositories &amp; staging · coming soon</span>
      </footer>
    </GitTrackLayout>
  );
}
