import { StudioLoader } from "../StudioLoader";
import { Callout, Card, Pill, Section, Steps, Terminal } from "./ui";

export function SandboxLesson() {
  return (
    <>
      <Section id="sandbox" index={1} title="The full dev sandbox" wide>
        <p className="max-w-4xl text-(--text-muted)">
          A real Node.js project runs in this tab (a StackBlitz WebContainer). Edit the portal, run <Pill>npm run dev</Pill> to see it live, and use Git
          exactly as you would on your laptop. Pushes go to a pretend GitHub, so you can experiment freely; <strong>Reset</strong> starts over.
        </p>
        <StudioLoader kind="portal" />
      </Section>

      <Section id="how-push-works" index={2} title="How a push really works">
        <Steps
          items={[
            <>
              <Pill>git add .</Pill> Git compares every file with the last snapshot and copies the changed ones into the staging area.
            </>,
            <>
              <Pill>git commit -m &quot;feat: update portal UI&quot;</Pill> The staging area becomes a new commit with an ID (a SHA like <Pill>a1b2c3d</Pill>)
              that points back to its parent.
            </>,
            <>
              <Pill>git push origin main</Pill> Git asks GitHub which commits it already has.
            </>,
            <>
              <strong>Object transfer.</strong> Only the missing commits, folders (trees) and file contents (blobs) are packed into one compressed packfile and
              uploaded over HTTPS or SSH. That is the <Pill>Writing objects: 100%</Pill> line.
            </>,
            <>
              <strong>Remote ref update.</strong> GitHub moves its <Pill>main</Pill> pointer to your newest commit, and your <Pill>origin/main</Pill> moves with it.
              Now <Pill>git status</Pill> says your branch is up to date.
            </>,
          ]}
        />
        <Callout tone="var(--git-remote)">Switch the studio to 0.5x Slow-Mo and push: each 📦 capsule in the tunnel is one commit travelling to GitHub.</Callout>
      </Section>
    </>
  );
}

/** A small before/after commit-graph picture for the advanced commands. */
function Graph({ rows, caption }: { rows: { label: string; dots: (string | null)[]; tone: string }[]; caption: string }) {
  return (
    <figure className="gs-card flex flex-col gap-3 p-5">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="gs-code w-20 shrink-0 text-right text-sm" style={{ color: row.tone }}>
            {row.label}
          </span>
          <div className="flex items-center gap-2">
            {row.dots.map((dot, i) =>
              dot ? (
                <span key={i} className="gs-code flex size-9 items-center justify-center rounded-full border-2 text-xs font-bold" style={{ borderColor: row.tone }}>
                  {dot}
                </span>
              ) : (
                <span key={i} className="size-9" />
              ),
            )}
          </div>
        </div>
      ))}
      <figcaption className="text-sm text-(--text-muted)">{caption}</figcaption>
    </figure>
  );
}

export function AdvancedLesson() {
  return (
    <>
      <Section id="stash" index={1} title="git stash: shelve unfinished work">
        <p>
          You are halfway through an edit and need to switch branches. <Pill>git stash</Pill> puts your uncommitted changes on a shelf and leaves your files
          clean. <Pill>git stash pop</Pill> takes them back off.
        </p>
        <Terminal lines={["% git stash", "Saved working directory and index state WIP on main: 9dc9801 Move meeting to Tuesday", "% git switch hotfix", "# ...fix the bug, commit, switch back...", "% git stash pop"]} />
        <p className="text-base text-(--text-muted)">
          <Pill>git stash list</Pill> shows the shelf; <Pill>git stash drop</Pill> throws the top item away.
        </p>
      </Section>

      <Section id="cherry-pick" index={2} title="git cherry-pick: copy one commit">
        <p>Need just one fix from another branch, not the whole branch? Cherry-pick copies a single commit onto the branch you are on.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Graph
            caption="Before: the typo fix (C3) only exists on feature."
            rows={[
              { label: "main", dots: ["C0", "C1", null, null, "C4"], tone: "var(--git-local)" },
              { label: "feature", dots: [null, null, "C2", "C3", null], tone: "var(--git-remote)" },
            ]}
          />
          <Graph
            caption="After git cherry-pick C3 on main: C5 is a copy of C3."
            rows={[
              { label: "main", dots: ["C0", "C1", null, null, "C4", "C5"], tone: "var(--git-local)" },
              { label: "feature", dots: [null, null, "C2", "C3", null, null], tone: "var(--git-remote)" },
            ]}
          />
        </div>
      </Section>

      <Section id="revert" index={3} title="git revert: undo safely">
        <p>
          <Pill>git revert &lt;commit&gt;</Pill> makes a <em>new</em> commit that does the opposite of an old one. History is kept, so it is safe even after you
          have pushed: nobody&apos;s copy breaks.
        </p>
        <Card title="Why not delete the commit?" tone="var(--git-danger)">
          Rewriting pushed history (for example with <Pill>git reset --hard</Pill> and <Pill>git push --force</Pill>) breaks every teammate who already pulled it.
          Revert never does.
        </Card>
      </Section>

      <Section id="rebase" index={4} title="git rebase: replay a branch">
        <p>
          Rebase lifts your branch&apos;s commits off and replays them on top of another branch, as if you had started from its latest commit. The result is a
          straight line of history.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Graph
            caption="Before: feature started from C1, and main has moved on."
            rows={[
              { label: "main", dots: ["C0", "C1", null, null, "C4"], tone: "var(--git-local)" },
              { label: "feature", dots: [null, null, "C2", "C3", null], tone: "var(--git-remote)" },
            ]}
          />
          <Graph
            caption="After git rebase main on feature: new copies of C2 and C3 sit on top of main."
            rows={[
              { label: "main", dots: ["C0", "C1", "C4", null, null], tone: "var(--git-local)" },
              { label: "feature", dots: [null, null, null, "C2'", "C3'"], tone: "var(--git-remote)" },
            ]}
          />
        </div>
        <Callout tone="var(--git-modified)">Golden rule: only rebase commits you have not pushed yet. Rebasing shared commits rewrites history.</Callout>
      </Section>

      <Section id="try-it" index={5} title="Try it" wide>
        <p className="max-w-4xl text-(--text-muted)">
          This sandbox has a <Pill>main</Pill> branch and a <Pill>feature</Pill> branch that split after C1. Work down the checklist and watch the graph.
        </p>
        <StudioLoader kind="advanced" />
      </Section>
    </>
  );
}
