import { StudioLoader } from "../StudioLoader";
import { Callout, Card, Menu, Pill, Section, Steps, Terminal } from "./ui";
import { ConflictResolver } from "./widgets";

/** A tiny two-lane branch picture: main along the top, a branch peeling off and back. */
function BranchPicture() {
  return (
    <svg viewBox="0 0 520 120" className="w-full max-w-2xl" role="img" aria-label="A branch leaves main, gets two commits, and merges back">
      <line x1="30" y1="40" x2="490" y2="40" strokeWidth="3" style={{ stroke: "var(--git-local)" }} />
      <path d="M 130 40 C 170 40, 170 90, 210 90 L 330 90 C 370 90, 370 40, 410 40" fill="none" strokeWidth="3" style={{ stroke: "var(--git-remote)" }} />
      {[30, 130, 270, 410, 490].map((x) => (
        <circle key={x} cx={x} cy="40" r="10" strokeWidth="3" style={{ fill: "var(--bg-surface)", stroke: "var(--git-local)" }} />
      ))}
      {[210, 330].map((x) => (
        <circle key={x} cx={x} cy="90" r="10" strokeWidth="3" style={{ fill: "var(--bg-surface)", stroke: "var(--git-remote)" }} />
      ))}
      <text x="30" y="20" className="gs-svg-text" fontSize="13" style={{ fill: "var(--git-local)" }}>
        main branch
      </text>
      <text x="210" y="116" className="gs-svg-text" fontSize="13" style={{ fill: "var(--git-remote)" }}>
        test branch
      </text>
    </svg>
  );
}

export function BranchingLesson() {
  return (
    <>
      <Section id="what-is-a-branch" index={1} title="What is a branch?">
        <p>
          A <strong>separate workspace</strong> where you can make changes to your project without affecting the main version.
        </p>
        <div className="gs-card p-6">
          <BranchPicture />
        </div>
      </Section>

      <Section id="why-branch" index={2} title="Why do we need branching?">
        <ul className="flex list-disc flex-col gap-2 pl-6 text-(--text-muted)">
          <li>Work on new features without breaking the main project.</li>
          <li>Experiment safely: try ideas without risk.</li>
          <li>Fix bugs while continuing other development.</li>
          <li>Collaborate: each teammate can work on their own branch.</li>
          <li>Then we merge changes back when ready.</li>
        </ul>
      </Section>

      <Section id="best-practices" index={3} title="Best practices for branching">
        <div className="grid gap-5 md:grid-cols-3">
          <Card title="Name branches by what they do" tag="Descriptive" tone="var(--accent-soft)">
            One branch per feature: <Pill>feature/navbar</Pill>, <Pill>feature/user-login</Pill>, <Pill>fix/footer-link</Pill>.
          </Card>
          <Card title="Merge back often" tag="Frequently" tone="var(--git-local)">
            Merge finished features back into <Pill>main</Pill> whenever a feature is completed.
          </Card>
          <Card title="Never push straight to main" tag="Safety" tone="var(--git-danger)">
            Push to your own branch first, then merge into main with a pull request on GitHub.
          </Card>
        </div>
        <Callout>Always branch off an up-to-date main.</Callout>
      </Section>

      <Section id="create-switch" index={4} title="How to create & switch branches">
        <p className="text-(--text-muted)">The same moves in both tools: create, publish, switch.</p>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="flex flex-col gap-3">
            <h3 className="gs-heading text-xl font-semibold">A. Using the terminal</h3>
            <Terminal
              lines={[
                "# 1) create and switch",
                "% git switch -c feature/navbar",
                "Switched to a new branch 'feature/navbar'",
                "# 2) see your branches (star = current)",
                "% git branch",
                "* feature/navbar",
                "  main",
                "# 3) publish to GitHub",
                "% git push -u origin feature/navbar",
                "branch 'feature/navbar' set up to track 'origin/feature/navbar'.",
                "# 4) switch to another branch",
                "% git switch main",
                "Switched to branch 'main'",
              ]}
            />
            <p className="text-base text-(--text-muted)">
              Older commands you will also see: <Pill>git checkout -b &lt;branch&gt;</Pill> (create and switch) and <Pill>git checkout &lt;branch&gt;</Pill>{" "}
              (switch).
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <h3 className="gs-heading text-xl font-semibold">B. Using GitHub Desktop</h3>
            <Steps
              items={[
                <>
                  Open the <Menu>Current branch</Menu> dropdown and click <Menu>New branch</Menu>.
                </>,
                <>
                  Type the name and click <Menu>Create branch</Menu>. You are switched to it automatically.
                </>,
                <>
                  Click <Menu>Publish branch</Menu> (<Menu>Ctrl+P</Menu>) to push it to GitHub.
                </>,
                <>
                  To switch: open <Menu>Current branch</Menu> and click <Menu>main</Menu>. The top bar now says main.
                </>,
              ]}
            />
            <Callout tone="var(--git-local)">Safe default: commit first, then switch. The branch appears in the dropdown on GitHub once published.</Callout>
            <p className="text-base text-(--text-muted)">
              In VS Code, click the branch name in the bottom-left corner and choose <Menu>Create new branch</Menu>.
            </p>
          </div>
        </div>
      </Section>

      <Section id="activity-2" index={5} title="Activity 2 · Git branching + merging" wide>
        <StudioLoader kind="activity2" />
      </Section>
    </>
  );
}

function FileBox({ title, lines, tone }: { title: string; lines: string[]; tone: string }) {
  return (
    <div className="overflow-hidden rounded border bg-(--code-bg)" style={{ borderColor: tone }}>
      <p className="gs-ui border-b px-3 py-1.5 text-xs tracking-wider uppercase" style={{ borderColor: tone, color: tone }}>
        {title}
      </p>
      <pre className="gs-code px-3 py-2 text-sm leading-6 text-(--code-text)">{lines.join("\n")}</pre>
    </div>
  );
}

export function PullRequestsLesson() {
  return (
    <>
      <Section id="git-merge" index={1} title="Combining branches: git merge">
        <p className="text-(--text-muted)">After we create a new branch, how do we combine it with main? We use <Pill>git merge</Pill>.</p>
        <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          <FileBox title="main · part1.txt" lines={["Hello my name is Michelle."]} tone="var(--git-local)" />
          <span className="text-center text-2xl text-(--text-muted)">+</span>
          <FileBox title="branch-a · part1.txt" lines={["Hello my name is Michelle.", "Hello world."]} tone="var(--git-remote)" />
          <span className="gs-code text-center text-sm text-(--accent-soft)">git merge branch-a →</span>
          <FileBox title="main after merge" lines={["Hello my name is Michelle.", "Hello world."]} tone="var(--accent-soft)" />
        </div>
        <Terminal lines={["% git switch main", "% git merge branch-a", "Updating 9f8e7d6..a1b2c3d", "Fast-forward"]} />
      </Section>

      <Section id="pull-request" index={2} title="Merging into main: the pull request">
        <p>
          A pull request (PR) asks: <em>&quot;Please merge my branch into main.&quot;</em> Teammates review the changes before they land, and the merge happens
          on GitHub, not on your laptop.
        </p>
        <ol className="flex flex-wrap items-center gap-2 text-base">
          {["feature/navbar pushed", "Open pull request", "Teammate reviews + approves", "Merged into main", "Everyone switches to main and pulls"].map((step, i, all) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded border border-(--border-subtle) bg-(--bg-surface) px-3 py-1.5">{step}</span>
              {i < all.length - 1 && <span className="text-(--accent-soft)">→</span>}
            </li>
          ))}
        </ol>
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="gs-card flex flex-col gap-3 p-6">
            <h3 className="gs-heading text-lg font-semibold">Open a pull request</h3>
            <Steps
              items={[
                <>
                  Click <Menu>Compare &amp; pull request</Menu>.
                </>,
                <>
                  Set <Menu>base: main</Menu> ← <Menu>compare: your-branch</Menu>.
                </>,
                <>Write a clear title and what you changed.</>,
                <>Request a reviewer.</>,
                <>
                  Click <Menu>Create pull request</Menu>.
                </>,
              ]}
            />
          </div>
          <div className="gs-card flex flex-col gap-3 p-6">
            <h3 className="gs-heading text-lg font-semibold">Review and merge</h3>
            <Steps
              items={[
                <>Request a reviewer.</>,
                <>
                  Reviewer: <Menu>Files changed &gt; Review changes &gt; Approve</Menu>.
                </>,
                <>
                  Check the box says <em>&quot;No conflicts with base branch&quot;</em>, then <Menu>Merge pull request</Menu>.
                </>,
                <>
                  <Menu>Confirm merge</Menu>.
                </>,
              ]}
            />
          </div>
          <div className="gs-card flex flex-col gap-3 p-6">
            <h3 className="gs-heading text-lg font-semibold">After merging: clean up</h3>
            <Steps
              items={[
                <>
                  A purple <Menu>Merged</Menu> badge means your work is in main.
                </>,
                <>
                  <Menu>Delete branch</Menu>: it&apos;s done, the work is safe in main. Deleted by mistake? <Menu>Restore branch</Menu>.
                </>,
                <>
                  Then everyone: switch to <Pill>main</Pill> and <Pill>git pull</Pill>.
                </>,
              ]}
            />
          </div>
        </div>
      </Section>

      <Section id="merge-conflicts" index={3} title="Merge conflicts">
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Why do they happen?" tag="The cause" tone="var(--git-danger)">
            Git doesn&apos;t know how to merge two branches automatically when they changed <strong className="text-(--text-main)">the same line of the same file</strong>.
            Here line 2 of <Pill>part1.txt</Pill> is <Pill>Hello world!</Pill> on main but <Pill>Hello ITC!</Pill> on branch-b.
          </Card>
          <Card title="How to resolve" tag="The fix" tone="var(--git-local)">
            Manually choose which change to keep (or keep both), then save with <Pill>Ctrl + S</Pill>, run <Pill>git add .</Pill> and{" "}
            <Pill>git commit -m &quot;merge conflict&quot;</Pill>.
          </Card>
        </div>
        <ConflictResolver />
      </Section>

      <Section id="activity-3" index={4} title="Activity 3 · the branching game" wide>
        <p className="max-w-4xl text-(--text-muted)">
          In class we play <a className="text-(--accent-soft) underline underline-offset-4" href="https://learngitbranching.js.org/" target="_blank" rel="noreferrer">learngitbranching.js.org</a>.
          These four levels practise the same moves right here: blue and red branches, a fast-forward merge, deleting branches, and a remote sync with{" "}
          <Pill>git fakeTeamwork</Pill>.
        </p>
        <StudioLoader kind="game" />
      </Section>
    </>
  );
}

const CHEATSHEET: [string, string, string][] = [
  ["Clone", "git clone <url>", "File > Clone repository"],
  ["See changes", "git status", "Changes tab"],
  ["Stage", "git add .", "Tick the checkboxes"],
  ["Commit", 'git commit -m "msg"', "Summary + Commit to <branch>"],
  ["Push", "git push", "Push origin / Publish branch"],
  ["Pull", "git pull", "Fetch origin, then Pull origin"],
  ["New branch", "git switch -c feature/x", "Current branch > New branch"],
  ["Switch branch", "git switch main", "Current branch dropdown"],
  ["Update from main", "git pull origin main", "Branch > Update from main"],
  ["Merge into main", "Pull Request on GitHub", "Create Pull Request"],
];

export function TipsLesson() {
  return (
    <>
      <Section id="main-vs-master" index={1} title="Common problem: main vs master">
        <p>
          <Pill>master</Pill> was the old default branch name in Git. <Pill>main</Pill> is the new default on GitHub. They are functionally the same, but
          it&apos;s best practice to use main.
        </p>
        <Callout tone="var(--git-modified)">
          Tip: on a <Pill>master</Pill> branch, run <Pill>git branch -m main</Pill> to rename it.
        </Callout>
      </Section>

      <Section id="dos" index={2} title="Do's">
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Commit frequently" tone="var(--git-local)">
            Make small, logical commits for each update.
          </Card>
          <Card title="Write meaningful commit messages" tone="var(--git-local)">
            Explain the what and the why. Like branch names, they must be clear too.
          </Card>
          <Card title="Pull frequently" tone="var(--git-local)">
            Always sync with the remote repository before starting new work.
          </Card>
          <Card title="Use branches" tone="var(--git-local)">
            Never work directly on the main branch.
          </Card>
          <Card title={<>Use .gitignore</>} tone="var(--git-local)">
            Create this file to tell Git which files to ignore, such as secrets and generated folders.
          </Card>
        </div>
      </Section>

      <Section id="donts" index={3} title="Don'ts">
        <div className="grid gap-5 md:grid-cols-3">
          <Card title="Don't commit sensitive files" tone="var(--git-danger)">
            Never save API keys, passwords or <Pill>.env</Pill> files in your repository.
          </Card>
          <Card title="Don't commit generated files" tone="var(--git-danger)">
            Avoid tracking large dependency folders like <Pill>node_modules/</Pill>: thousands of files you can regenerate.
          </Card>
          <Card title="Don't use --force" tone="var(--git-danger)">
            <Pill>git push --force</Pill> can permanently erase history. Avoid it unless you know exactly why you&apos;re using it.
          </Card>
        </div>
      </Section>

      <Section id="pro-tips" index={4} title="Pro tips">
        <div className="grid gap-5 md:grid-cols-3">
          <Card title={<Pill>git stash</Pill>} tag="Stashing" tone="var(--accent-soft)">
            Need to switch branches but not ready to commit? Stash temporarily saves your changes.
          </Card>
          <Card title={<Pill>git revert &lt;commit-hash&gt;</Pill>} tag="Reverting" tone="var(--accent-soft)">
            To safely undo a pushed commit, create a new commit that reverses the changes.
          </Card>
          <Card title="Back up first" tag="Backups" tone="var(--accent-soft)">
            Before a risky operation, duplicate the folder locally or push your branch to a separate backup repository on GitHub.
          </Card>
        </div>
        <Callout>Want to try stash, revert, cherry-pick and rebase? See A2 under Additional content.</Callout>
      </Section>

      <Section id="cheatsheet" index={5} title="Cheatsheet">
        <div className="overflow-x-auto rounded border border-(--border-subtle)">
          <table className="w-full min-w-[560px] border-collapse text-left text-base">
            <thead className="gs-ui bg-(--bg-panel) text-xs tracking-wider text-(--text-muted) uppercase">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Action
                </th>
                <th scope="col" className="px-4 py-3">
                  Terminal (CLI)
                </th>
                <th scope="col" className="px-4 py-3">
                  GitHub Desktop
                </th>
              </tr>
            </thead>
            <tbody>
              {CHEATSHEET.map(([action, cli, desktop]) => (
                <tr key={action} className="border-t border-(--border-subtle) bg-(--bg-surface)">
                  <th scope="row" className="px-4 py-3 font-semibold">
                    {action}
                  </th>
                  <td className="px-4 py-3">
                    <Pill>{cli}</Pill>
                  </td>
                  <td className="px-4 py-3 text-(--text-muted)">{desktop}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="gs-heading text-xl font-semibold text-(--accent-soft)">Pull before you work. Branch off main. Merge with a PR.</p>
      </Section>
    </>
  );
}
