import { StudioLoader } from "../StudioLoader";
import { Callout, Card, CliVsDesktop, Menu, Pill, Section, Steps } from "./ui";
import { MrtTrain, SavePointTimeline } from "./widgets";

export function IntroductionLesson() {
  return (
    <>
      <Section id="what-is-git" index={1} title="What is Git?">
        <p>
          Git is a <strong>Version Control System (VCS)</strong>. Think of it as a time machine for your code that lives on your computer.
        </p>
        <p className="text-(--text-muted)">It tracks every change you make, so you can revisit any point in time.</p>
      </Section>

      <Section id="save-points" index={2} title="Every commit is a save point">
        <p className="text-(--text-muted)">Each dot is a snapshot of your whole project, with a message saying what changed. Click one to jump back to it.</p>
        <SavePointTimeline />
      </Section>

      <Section id="why-git" index={3} title="Why use Git?">
        <div className="grid gap-5 md:grid-cols-3">
          <Card title="Track project history" tag="History" tone="var(--git-modified)">
            See who changed what, and when.
          </Card>
          <Card title="Collaborate without chaos" tag="Teamwork" tone="var(--git-local)">
            Work with a team on the same project without overwriting each other&apos;s work.
          </Card>
          <Card title="Revert with confidence" tag="Undo" tone="var(--accent-soft)">
            If something breaks, go back to a previous version. It is the ultimate &quot;undo&quot; button for your entire project.
          </Card>
        </div>
      </Section>

      <Section id="git-vs-github" index={4} title="Git vs GitHub">
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Git: the engine" tag="On your computer" tone="var(--git-local)">
            <p>
              <Pill>git</Pill> is the tool that tracks the changes. It keeps your history in a hidden <Pill>.git</Pill> folder inside your project.
            </p>
          </Card>
          <Card title="GitHub: the cloud garage & social hub" tag="On the internet" tone="var(--git-remote)">
            <p>
              <Pill>github.com</Pill> is the website that hosts your projects and helps you collaborate.
            </p>
          </Card>
        </div>
        <Callout>You use Git on your computer, and you use GitHub to share your work and work with others.</Callout>
      </Section>

      <Section id="toolkit" index={5} title="Your toolkit today">
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Git (Terminal)" tag="1" tone="var(--git-local)">
            The engine. Every action has one command.
          </Card>
          <Card title="GitHub Desktop" tag="2" tone="var(--accent-soft)">
            Buttons for the same commands. Great for seeing what changed.
          </Card>
          <Card title="VS Code" tag="3" tone="var(--lane-2)">
            Where you write code and fix merge conflicts.
          </Card>
          <Card title="GitHub.com" tag="4" tone="var(--git-remote)">
            Where your team reviews and merges work (pull requests).
          </Card>
        </div>
      </Section>

      <Section id="setup-check" index={6} title="Setup check (2 minutes)">
        <Steps
          items={[
            <>
              <strong>Terminal:</strong> <Pill>git --version</Pill> prints a version number.
            </>,
            <>
              <strong>Terminal:</strong> <Pill>git config --global user.name &quot;Your Name&quot;</Pill> and{" "}
              <Pill>git config --global user.email &quot;email (same as github email)&quot;</Pill>
            </>,
            <>
              <strong>GitHub Desktop:</strong> signed in under <Menu>File &gt; Options/Settings &gt; Accounts</Menu>
            </>,
            <>
              <strong>GitHub Desktop:</strong> <Menu>Integrations &gt; External Editor = Visual Studio Code</Menu>
            </>,
          ]}
        />
        <Callout tone="var(--git-local)">Both terminal commands also work in the sandbox in lesson 03, so you can try them there.</Callout>
      </Section>
    </>
  );
}

export function CoreWorkflowLesson() {
  return (
    <>
      <Section id="three-states" index={1} title="The three states of Git">
        <p className="text-(--text-muted)">This is the fundamental cycle for creating and saving changes on your own machine.</p>
        <div className="grid gap-5 md:grid-cols-3">
          <Card title="Working directory" tag="1" tone="var(--git-modified)">
            Any file you&apos;ve modified.
          </Card>
          <Card title="Staging area" tag="2" tone="var(--git-local)">
            Files you&apos;ve marked as ready for the next &quot;save point&quot;.
          </Card>
          <Card title="Repository (.git folder)" tag="3" tone="var(--accent-soft)">
            The permanent, saved history of your project.
          </Card>
        </div>
      </Section>

      <Section id="book-analogy" index={2} title="Analogy 1: writing a book">
        <div className="grid gap-5 md:grid-cols-3">
          <Card title="Working directory" tag="Your desk" tone="var(--git-modified)">
            You&apos;re still writing and editing your book chapters on your desk. They&apos;re messy and a work in progress.
          </Card>
          <Card title="Staging area" tag="Ready-to-save pile" tone="var(--git-local)">
            You pick the chapters you&apos;re happy with and put them in a &quot;ready-to-save&quot; pile.
          </Card>
          <Card title="Local repository (.git)" tag="Bookshelf" tone="var(--accent-soft)">
            You store the finished, approved versions neatly on your bookshelf.
          </Card>
        </div>
      </Section>

      <Section id="computer-vs-github" index={3} title="Your computer vs GitHub">
        <div className="gs-card overflow-x-auto p-6">
          <div className="grid min-w-[640px] grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-center gap-2 text-center text-base">
            <p className="gs-ui col-span-5 text-left text-xs tracking-wider text-(--git-local) uppercase">Your laptop</p>
            <span />
            <p className="gs-ui text-xs tracking-wider text-(--git-remote) uppercase">The internet</p>
            <div className="rounded border border-(--git-modified) px-3 py-4">Working directory</div>
            <span className="gs-code text-sm text-(--accent-soft)">git add →</span>
            <div className="rounded border border-(--git-local) px-3 py-4">Staging area</div>
            <span className="gs-code text-sm text-(--accent-soft)">git commit →</span>
            <div className="rounded border border-(--accent-soft) px-3 py-4">Local repository</div>
            <span className="gs-code flex flex-col text-sm text-(--accent-soft)">
              <span>git push →</span>
              <span>← git pull</span>
              <span className="text-xs text-(--text-muted)">← git clone (first time only)</span>
            </span>
            <div className="rounded border border-(--git-remote) px-3 py-4">GitHub (remote)</div>
          </div>
        </div>
        <h3 className="gs-heading text-xl font-semibold">From states to actions</h3>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <Card title="Clone" tag="GitHub → laptop" tone="var(--git-remote)">
            Copy the project to your laptop, once per project.
          </Card>
          <Card title="Add" tag="Working dir → staging" tone="var(--git-local)">
            &quot;I want this in my save.&quot;
          </Card>
          <Card title="Commit" tag="Staging → local repo" tone="var(--accent-soft)">
            A save point with a label.
          </Card>
          <Card title="Push / Pull" tag="Laptop ↔ GitHub" tone="var(--lane-2)">
            Send your saves up, or bring your team&apos;s saves down.
          </Card>
        </div>
      </Section>

      <Section id="mrt-analogy" index={4} title="Analogy 2: the MRT station">
        <p className="text-(--text-muted)">
          Your computer is the MRT station you&apos;re at (say Lavender EW11). The local repository is the platform, and the people are the changes you
          made. Try the three commands:
        </p>
        <MrtTrain />
        <h3 className="gs-heading text-xl font-semibold">How to check?</h3>
        <div className="grid gap-5 md:grid-cols-2">
          <Card title={<Pill>git status</Pill>} tag="The arrival board" tone="var(--git-modified)">
            Like checking the information board on the platform: <span className="gs-ui text-(--text-main)">Marina South Pier · 3 mins</span>. It shows what is
            waiting right now.
          </Card>
          <Card title={<Pill>git log</Pill>} tag="The timetable" tone="var(--accent-soft)">
            Like looking at the history of trains that have already departed.
          </Card>
        </div>
      </Section>

      <Section id="push-pull" index={5} title="The push vs pull cycle">
        <div className="grid gap-5 md:grid-cols-2">
          <Card title="Pull (git pull)" tag="GitHub → you" tone="var(--git-remote)">
            Downloads the latest changes from GitHub and merges them into your local branch. <strong className="text-(--text-main)">Always pull before you start working!</strong>
          </Card>
          <Card title="Push (git push)" tag="You → GitHub" tone="var(--git-local)">
            Uploads your committed changes from your local machine to GitHub.
          </Card>
        </div>
        <Callout tone="var(--git-remote)">
          <Pill>git pull</Pill> is really two steps: <Pill>git fetch</Pill> (get updates from the remote without merging) then <Pill>git merge</Pill>.
        </Callout>
      </Section>
    </>
  );
}

export function WorkingWithGithubLesson() {
  return (
    <>
      <Section id="clone" index={1} title="Action 1: clone a repository">
        <CliVsDesktop
          cli={["% git clone https://github.com/SIMITClubAdmin/ITClub_website.git"]}
          desktop={
            <p>
              <Menu>File &gt; Clone Repository</Menu>, or copy the URL from the green <Menu>&lt;&gt; Code</Menu> button on GitHub.
            </p>
          }
          check="the folder exists; Desktop shows the repo name at the top."
        />
      </Section>

      <Section id="stage" index={2} title="Action 2: see and stage your changes">
        <CliVsDesktop
          cli={["% git status", "% git add README.md", "% git status", "Changes to be committed:", "        modified:   README.md", "Untracked files:", "        index.html"]}
          desktop={
            <p>
              The <Menu>Changes</Menu> tab lists every changed file. The diff panel shows removed lines in red and added lines in green; tick the
              checkboxes for what you want to stage.
            </p>
          }
          check={
            <>
              <Pill>git status</Pill> shows the file in green (staged); Desktop&apos;s diff panel shows red/green lines.
            </>
          }
        />
      </Section>

      <Section id="commit" index={3} title="Action 3: commit (make a save point)">
        <CliVsDesktop
          cli={['% git commit -m "Add navbar to homepage"', "% git log --oneline", "a1b2c3d Add navbar to homepage", "9f8e7d6 Create homepage", "# newest save point on top, with your message"]}
          desktop={
            <p>
              Type a message in the <Menu>Summary</Menu> box and click <Menu>Commit to &lt;branch&gt;</Menu>. Your save points appear in the{" "}
              <Menu>History</Menu> tab.
            </p>
          }
          check={
            <>
              <Pill>git log --oneline</Pill> (terminal) or the History tab (Desktop).
            </>
          }
        />
      </Section>

      <Section id="push-pull" index={4} title="Action 4: push and pull">
        <CliVsDesktop
          cli={["% git push", "% git pull", "# first push of a new branch:", "% git push -u origin <branch>"]}
          desktop={
            <p>
              Click <Menu>Push origin</Menu> (or <Menu>Publish branch</Menu> the first time). <Menu>Fetch origin</Menu> then <Menu>Pull origin</Menu> brings
              your team&apos;s work down.
            </p>
          }
          check="refresh the repo page on GitHub."
        />
        <Callout tone="var(--git-modified)">
          <strong className="text-(--text-main)">First push?</strong> Git opens a browser to sign in to GitHub. Your GitHub password won&apos;t work in the
          terminal.
        </Callout>
      </Section>

      <Section id="fork-pr" index={5} title="The collaboration workflow: fork & pull request">
        <p className="text-(--text-muted)">This is how you contribute to someone else&apos;s project.</p>
        <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Fork", "Create a personal copy of their repository on your own GitHub account."],
            ["Clone", "Download your forked repository to your local machine."],
            ["Branch & push", "Create a new branch, make your changes, and push that branch to your fork."],
            ["Pull request (PR)", "Open a PR from your fork to the original repository: a formal request to have your work reviewed and merged."],
          ].map(([title, text], i) => (
            <li key={title} className="gs-card flex flex-col gap-2 p-5">
              <span className="gs-ui text-2xl font-bold text-(--accent-soft)">{i + 1}</span>
              <p className="gs-heading text-lg font-semibold">{title}</p>
              <p className="text-base text-(--text-muted)">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="activity-1" index={6} title="Activity 1 · basic Git commands" wide>
        <p className="max-w-4xl text-(--text-muted)">
          A real terminal runs below. Follow the eight steps: the checklist ticks itself, and the diagram shows each file moving from your working
          directory, to the staging area, into the repository.
        </p>
        <StudioLoader kind="activity1" />
      </Section>
    </>
  );
}
