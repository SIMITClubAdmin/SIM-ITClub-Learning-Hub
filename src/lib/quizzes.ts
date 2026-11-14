/**
 * The question bank. SERVER ONLY: it holds the answers, so never import it from a
 * "use client" file. Browser code uses src/lib/quiz-meta.ts instead.
 *
 * Each attempt draws questionsIn(slug) questions from a bank (see src/lib/draw.ts).
 * Rules for editing during a cohort:
 *   - Never change or reuse an id: saved answers point at it.
 *   - The first choice is the right answer; the quiz shuffles them before showing.
 *   - More questions per bank = less overlap between teammates.
 *   - Text in `backticks` in a question, choice or explanation is shown as code.
 */
import { questionsIn, QUIZ_INFO } from "@/lib/quiz-meta";
import { matchesAnswer } from "@/lib/short-answer";

type QuestionBase = {
  /** Unique and permanent. Saved with every answer. */
  id: string;
  /** Group of related questions. An attempt prefers questions from different topics. */
  topic: string;
  /** The situation the question is about, shown above it in normal-size text. */
  scenario?: string;
  question: string;
  /** Code shown under the question, if any. */
  code?: string;
  /** What the browser shows for the code, as a full HTML page. Scripts never run in it. */
  preview?: string;
  /** Shown after the member answers. */
  explain: string;
};

/** Multiple choice. */
export type ChoiceQuestion = QuestionBase & {
  kind?: "choice";
  /** The first choice is the right answer. */
  choices: [string, string, string, string];
};

/** Short answer: the member types a command. Marked by src/lib/short-answer.ts. */
export type ShortQuestion = QuestionBase & {
  kind: "short";
  /** Every accepted answer. The first is the one shown as the answer. */
  answers: [string, ...string[]];
};

export type QuizQuestion = ChoiceQuestion | ShortQuestion;

export type Quiz = { slug: string; title: string; lesson: number; questions: QuizQuestion[] };

const page = (body: string, css = "") =>
  `<!DOCTYPE html><html><head><style>body{font-family:Times,serif;font-size:20px;margin:16px;color:#111}${css}</style></head><body>${body}</body></html>`;

// Written from the "Lesson 1 - HTML, CSS, JS" slides. Each question asks students to think:
// spot the bug, predict the output, or decide which rule wins.

const HTML_QUESTIONS: QuizQuestion[] = [
  {
    id: "html-img-folder-path",
    topic: "images",
    question:
      "Your project has index.html and a folder called photos with cat.png inside. The image won't show on index.html. Without moving any files, how do you fix the code?",
    code: '<img src="cat.png" alt="My cat">',
    preview: page('<span style="font:14px sans-serif;color:#666">🖼️ My cat</span>'),
    choices: [
      'Change the src to "photos/cat.png"',
      "alt has to come before src",
      "<img> needs a closing </img> tag",
      "Browsers can't show .png images",
    ],
    explain:
      "The src is a path from your HTML file. cat.png is inside the photos folder, so the path must be photos/cat.png. (Moving cat.png next to index.html would also work.) When the browser can't find the image, it shows the alt text instead.",
  },
  {
    id: "html-link-https",
    topic: "links",
    question: 'Clicking this link opens a "page not found" error instead of SIM\'s website. Why?',
    code: '<a href="www.sim.edu.sg" target="_blank">Visit SIM</a>',
    choices: [
      "The href is missing https://, so the browser looks for a file in your folder",
      'target="_blank" stops links from working',
      "Links can only go to .html files",
      "The link text must be the same as the URL",
    ],
    explain:
      "Without https://, the browser treats www.sim.edu.sg as a file name next to your page. A full web address starts with https://.",
  },
  {
    id: "html-br-new-line",
    topic: "text",
    question: "You pressed Enter between the two lines, but the browser shows them on one line. How do you fix it?",
    code: `<p>Line 1
Line 2</p>`,
    preview: page("<p>Line 1 Line 2</p>"),
    choices: ["Add <br> after Line 1", "Press Enter twice instead of once", "Change <p> to <h1>", "Add a space at the end of Line 1"],
    explain: "The browser ignores Enter and extra spaces in your code. <br> is the tag that tells it to start a new line.",
  },
  {
    id: "html-closing-order",
    topic: "tags",
    question: "Which part of this code has a bug?",
    code: '<p>I love <a href="about.html">ITCamp</p></a>',
    choices: [
      "</p> and </a> are closed in the wrong order",
      "A link can't go inside a paragraph",
      "href needs single quotes, not double quotes",
      "about.html needs a / in front",
    ],
    explain: "Tags close in the opposite order they opened: last opened, first closed. It should end with </a></p>.",
  },
  {
    id: "html-visible-headings",
    topic: "structure",
    question: "How many headings will a visitor see on this page?",
    code: `<head>
    <title>My Page</title>
</head>
<body>
    <h1>Welcome</h1>
    <!-- <h2>About me</h2> -->
    <h2>Projects</h2>
</body>`,
    choices: ["2", "3", "4", "1"],
    explain:
      "The <title> shows on the browser tab, not the page, and the commented-out <h2> is ignored. Only Welcome and Projects show.",
  },
  {
    id: "html-biggest-heading",
    topic: "text",
    question: "You want the biggest heading on the page. Which tag?",
    choices: ["<h1>", "<h6>", "<head>", "<big>"],
    explain: "HTML has six heading tags: <h1> is the largest and <h6> the smallest. <head> is not a heading at all.",
  },
  {
    id: "html-alt-text",
    topic: "images",
    question: "The file missing.png doesn't exist. What does the visitor see?",
    code: '<img src="missing.png" alt="ITCamp logo">',
    choices: ["The words: ITCamp logo", "A blank page", "An error message in the browser", "Nothing at all, the tag is ignored"],
    explain: "When the browser can't load the image, it shows the alt text instead. That's what alt is for, and it also helps screen readers.",
  },
  {
    id: "html-no-closing-tag",
    topic: "tags",
    question: "Which of these tags has no closing tag?",
    choices: ["<br>", "<p>", "<a>", "<h1>"],
    explain: "<br> is self-closing: there's no content to wrap, so there's no </br>.",
  },
  {
    id: "html-semantic-footer",
    topic: "structure",
    question: 'Which tag tells the browser and Google "this is the footer of the page"?',
    choices: ["<footer>", "<div>", "<p>", "<body>"],
    explain: "<footer> is a semantic tag: it has meaning. A <div> is just an unlabelled box.",
  },
  {
    id: "html-target-blank",
    topic: "links",
    question: 'What does target="_blank" do?',
    code: '<a href="https://www.sim.edu.sg" target="_blank">Visit SIM</a>',
    choices: ["Opens the link in a new tab", "Makes the link text blank", "Blocks the link", "Opens the link in the same tab"],
    explain: 'target="_blank" opens the link in a new tab.',
  },
];

const CSS_QUESTIONS: QuizQuestion[] = [
  {
    id: "css-class-dot",
    topic: "selectors",
    question: "You wrote CSS for the button, but nothing changes. What's the bug?",
    code: `<button class="btn">Join us</button>

btn {
    background-color: orange;
}`,
    preview: page("<button>Join us</button>"),
    choices: [
      "The selector is missing the dot: it should be .btn",
      "background-color should be background-colour",
      "Buttons can't have a background colour",
      "orange must be written as a hex code",
    ],
    explain: "btn on its own looks for a <btn> tag, which doesn't exist. A class needs a dot in front: .btn.",
  },
  {
    id: "css-class-shared",
    topic: "selectors",
    question: "Only the first paragraph should be blue, but both turned blue. Why?",
    code: `<p class="note">First</p>
<p class="note">Second</p>

.note {
    color: blue;
}`,
    preview: page('<p style="color:blue">First</p><p style="color:blue">Second</p>'),
    choices: [
      "Both paragraphs have the class note, so the rule styles both",
      "A class can only be used once per page",
      "color: blue always affects every <p>",
      "The CSS should be written above the HTML",
    ],
    explain: "A class can be shared by many elements, and .note styles all of them. To style just one, give it its own class or an id.",
  },
  {
    id: "css-internal-head",
    topic: "declaring",
    question: "Where does this CSS go so it styles the page?",
    code: `<style>
    h1 { color: purple; }
</style>`,
    choices: ["Inside the <head>", "After the closing </html> tag", "Inside the <h1> tag", "In a separate .js file"],
    explain: "Internal CSS goes in a <style> tag inside the <head>. External CSS goes in a .css file linked with <link>.",
  },
  {
    id: "css-class-beats-element",
    topic: "specificity",
    question: "What colour is the text?",
    code: `<p class="tip">Hi!</p>

.tip { color: blue; }
p    { color: red; }`,
    choices: ["Blue", "Red", "Purple", "Black"],
    explain: "A class selector is stronger than an element selector, so .tip wins even though the p rule comes later.",
  },
  {
    id: "css-color-spelling",
    topic: "properties",
    question: "The heading is centred but still black. Why?",
    code: `h1 {
    colour: red;
    text-align: center;
}`,
    preview: page("<h1>Hello ITCamp!</h1>", "h1{text-align:center}"),
    choices: [
      "CSS uses American spelling: it should be color, not colour",
      "red must be written as #ff0000",
      "color must come after text-align",
      "h1 headings can't change colour",
    ],
    explain:
      'CSS property names use American spelling. The browser doesn\'t know "colour", so it skips that line but still applies text-align.',
  },
  {
    id: "css-id-selector",
    topic: "selectors",
    question: "Which element does this rule style?",
    code: "#hero { color: red; }",
    choices: ['The one element with id="hero"', 'Every element with class="hero"', "Every <hero> tag", "All elements on the page"],
    explain: "# means id. An id targets exactly one element.",
  },
  {
    id: "css-inline-wins",
    topic: "specificity",
    question: "What colour is the text?",
    code: `<p id="msg" style="color: green;">Hello</p>

#msg { color: red; }`,
    choices: ["Green", "Red", "Black", "Purple"],
    explain: "Inline CSS is the most specific, so it beats the id selector.",
  },
  {
    id: "css-link-tag",
    topic: "declaring",
    question: "Which line connects an external CSS file to your page?",
    choices: ['<link rel="stylesheet" href="style.css">', '<style src="style.css">', '<script src="style.css">', '<css href="style.css">'],
    explain: "External CSS is linked with <link> inside the <head>.",
  },
  {
    id: "css-universal",
    topic: "universal",
    question: "What does this rule do?",
    code: "* { margin: 0; }",
    choices: ["Sets the margin of every element to 0", "Only changes the <body>", "Does nothing: * is not valid CSS", "Only changes <p> tags"],
    explain: "* is the universal selector: it targets all elements on the page.",
  },
  {
    id: "css-inline-which",
    topic: "declaring",
    question: "Which one is inline CSS?",
    choices: ['<p style="color: red;">Hi</p>', "<style> p { color: red; } </style>", '<link rel="stylesheet" href="style.css">', "p { color: red; }"],
    explain: "Inline CSS is written inside the element itself, in its style attribute.",
  },
];

const JS_QUESTIONS: QuizQuestion[] = [
  {
    id: "js-string-plus",
    topic: "types",
    question: "What does this print?",
    code: `let count = "3";
count = count + 1;
console.log(count);`,
    choices: ['"31"', "4", "NaN", "An error"],
    explain: '"3" is a string (it\'s in quotes), so + joins instead of adding: "3" + 1 gives "31".',
  },
  {
    id: "js-const-reassign",
    topic: "variables",
    question: "This code crashes. What's the fix?",
    code: `const score = 0;
score = score + 10;`,
    choices: ["Change const to let", 'Change 10 to "10"', "Change score + 10 to score - 10", "Add a second semicolon"],
    explain: "A const can't be given a new value. Use let when the value needs to change.",
  },
  {
    id: "js-loop-last",
    topic: "loops",
    question: "What is the last number printed?",
    code: `for (let i = 0; i < 5; i++) {
  console.log(i);
}`,
    choices: ["4", "5", "6", "It never stops"],
    explain: "i starts at 0 and the loop runs while i < 5, so it prints 0, 1, 2, 3, 4. When i becomes 5, it stops.",
  },
  {
    id: "js-queryselector-hash",
    topic: "dom",
    question: 'Clicking the button does nothing, and the console says "Cannot read properties of null". What\'s the bug?',
    code: `<button id="toggle">Dark mode</button>

const btn = document.querySelector("toggle");
btn.addEventListener("click", function () {
  document.body.classList.toggle("dark");
});`,
    choices: [
      'The selector needs a #: "#toggle"',
      "addEventListener should be addEventListner",
      '"click" should be "onclick"',
      "The button needs a class instead of an id",
    ],
    explain:
      'querySelector uses CSS addresses. "toggle" looks for a <toggle> tag, finds nothing (null), and crashes. "#toggle" finds the id.',
  },
  {
    id: "js-strict-equal",
    topic: "conditionals",
    question: "What does this print? (age is a number)",
    code: `const age = 18;

if (age > 18) {
  console.log("Adult");
} else if (age === "18") {
  console.log("Just 18");
} else {
  console.log("Too young");
}`,
    choices: ['"Too young"', '"Just 18"', '"Adult"', "Nothing"],
    explain: '18 > 18 is false, and === checks the type too: the number 18 is not the string "18". So it falls through to else.',
  },
  {
    id: "js-traffic-light",
    topic: "conditionals",
    question: "What does this print? (light is yellow)",
    code: `const light = "yellow";

if (light === "red") {
  console.log("Stop!");
} else if (light === "yellow") {
  console.log("Slow down");
} else {
  console.log("Go!");
}`,
    choices: ['"Slow down"', '"Stop!"', '"Go!"', "All three lines"],
    explain: 'JavaScript checks from the top and runs only the first match. light is "yellow", so the else if runs and the rest is skipped.',
  },
  {
    id: "js-and",
    topic: "logic",
    question: "What does this print? (using &&)",
    code: `const age = 20;
const hasTicket = false;
console.log(age >= 18 && hasTicket);`,
    choices: ["false", "true", "20", "An error"],
    explain: "&& means AND: both sides must be true. age >= 18 is true but hasTicket is false, so the answer is false.",
  },
  {
    id: "js-or",
    topic: "logic",
    question: "What does this print? (using ||)",
    code: "console.log(10 > 3 || 2 > 5);",
    choices: ["true", "false", "10", "An error"],
    explain: "|| means OR: only one side needs to be true. 10 > 3 is true, so the whole thing is true.",
  },
  {
    id: "js-array-out-of-range",
    topic: "arrays",
    question: "What does fruits[3] give?",
    code: `const fruits = ["apple", "banana", "mango"];
console.log(fruits[3]);`,
    choices: ["undefined", '"mango"', "An error", "3"],
    explain:
      "Counting starts at 0, so the positions are 0, 1 and 2. There is nothing at position 3, which gives undefined (not an error).",
  },
  {
    id: "js-array-push-length",
    topic: "arrays",
    question: "What does nums.length print after the push?",
    code: `const nums = [10, 20, 30];
nums.push(40);
console.log(nums.length);`,
    choices: ["4", "3", "40", "An error"],
    explain: "push adds 40 to the end, so the list now has 4 items. length counts items; it is not the last value.",
  },
  {
    id: "js-object-update",
    topic: "objects",
    question: "What does student.age print?",
    code: `const student = { name: "Alex", age: 20 };
student.age = 21;
console.log(student.age);`,
    choices: ["21", "20", "An error, because student is a const", "undefined"],
    explain:
      "const stops you replacing the whole object, but you can still change a field inside it. The ID card stays the same card; one label gets a new value.",
  },
  {
    id: "js-array-of-objects",
    topic: "objects",
    question: "What does members[1].name print?",
    code: `const members = [
  { name: "Aisha", role: "Designer" },
  { name: "Ben",   role: "Developer" }
];
console.log(members[1].name);`,
    choices: ['"Ben"', '"Aisha"', '"Developer"', "undefined"],
    explain: "members[1] is the second ID card (counting starts at 0), and .name reads the name label on it.",
  },
  {
    id: "js-function-no-return",
    topic: "functions",
    question: "What does double(4) print?",
    code: `function double(n) {
  n * 2;
}
console.log(double(4));`,
    choices: ["undefined", "8", "4", "An error"],
    explain: "The function works out 8 but never hands it back. Without return, the vending machine gives you nothing: undefined.",
  },
  {
    id: "js-function-not-called",
    topic: "functions",
    question: "Nothing shows in the console. Why?",
    code: `function sayHi() {
  console.log("Hi!");
}`,
    choices: [
      "The function is written but never called: it needs sayHi();",
      "console.log can't be used inside a function",
      "sayHi must be written in capital letters",
      "The function needs a return",
    ],
    explain: "Writing a function is like writing a recipe. It only runs when you call it with sayHi();",
  },
  {
    id: "js-defer",
    topic: "dom",
    question: 'The script is in the <head> and the console says "Cannot read properties of null". What is the simplest fix?',
    code: `<head>
  <script src="script.js"></script>
</head>
<body>
  <button id="btn">Click me</button>
</body>

// script.js
document.querySelector("#btn").addEventListener("click", function () {});`,
    choices: ["Add defer to the script tag", "Rename the id to button", 'Change "click" to "Click"', "Move the script into the CSS file"],
    explain: "Without defer, the script runs before the button exists, so querySelector finds null. defer waits until the page is built.",
  },
  {
    id: "js-refresh-resets",
    topic: "dom",
    question: 'You change the heading with title.textContent = "Hi!" in the console, then refresh the page. What happens?',
    choices: [
      "The heading goes back to what's in your HTML file",
      'The heading stays "Hi!" for good',
      "Your HTML file is edited to say Hi!",
      "The page shows an error",
    ],
    explain: "JavaScript changes the live page in the browser, not your file. Refresh loads your file again, so the change is gone.",
  },
  {
    id: "js-toggle-twice",
    topic: "events",
    question: "A student clicks this button twice. What does the page look like after the second click?",
    code: `button.addEventListener("click", function () {
  document.body.classList.toggle("dark");
});`,
    choices: [
      "Back to normal: the dark class was added, then removed",
      "Dark: the class was added twice",
      "Dark: toggle only works once",
      "An error",
    ],
    explain: "toggle adds the class if it's missing and removes it if it's there. Click 1 adds dark, click 2 removes it.",
  },
];

// Lesson 2 (Git & GitHub): one challenge per workshop activity, written from the Lesson 2
// slides and the studio's activity checklists. Every attempt asks all six, in a shuffled order.

const GIT_ACTIVITY_1: QuizQuestion[] = [
  {
    id: "git-a1-edit-after-add",
    topic: "staging",
    scenario:
      'In Activity 1 you create `your-name.txt`, write "Hi, I am Alex", save, and run Step 6: `git add .`. Before Step 7, you add a second line, "I study CS", and press Ctrl+S, without running `git add .` again.',
    question: 'What does `git commit -m "Initial commit"` save?',
    choices: [
      'Only "Hi, I am Alex": the version `git add .` staged. The second line stays unstaged in your Working Directory.',
      "Both lines, because `git add .` keeps watching `your-name.txt` and stages new edits until you commit.",
      "Nothing: Git stops the commit with an error because `your-name.txt` changed after it was staged.",
      "Neither line, because pressing Ctrl+S in VS Code takes the file back out of the Staging Area.",
    ],
    explain:
      "`git add .` stages the file exactly as it is at that moment, like sliding a page into an open envelope. Later edits stay in your Working Directory until you run `git add` again.",
  },
  {
    id: "git-a1-skip-add",
    topic: "states",
    scenario:
      'In Activity 1 you run `git init` (Step 2), then create and save `your-name.txt` (Steps 3 and 4). You skip Step 6 (`git add .`) and go straight to `git commit -m "Initial commit"`.',
    question: "What happens when you commit without `git add .`?",
    choices: [
      "No commit is made. Git says `nothing added to commit but untracked files present`, and `your-name.txt` stays untracked.",
      "Git stages and commits `your-name.txt` by itself, since it's the only file in `my-project`.",
      "Git makes an empty commit and deletes `your-name.txt`.",
      "Git pushes `your-name.txt` straight to GitHub instead.",
    ],
    explain:
      "A new file starts out untracked. Until `git add` moves it into the Staging Area, `git commit` has nothing to seal into a snapshot.",
  },
  {
    id: "git-a1-status-before-after",
    topic: "status",
    scenario:
      "In Activity 1 you run `git status` at Step 5 (right after saving `your-name.txt`), then again right after Step 6 (`git add .`).",
    question: "How does the line for `your-name.txt` change between the two checks?",
    choices: [
      "Step 5: red, under `Untracked files`. After Step 6: green, under `Changes to be committed` as `new file: your-name.txt`.",
      "Step 5: green, under `Changes to be committed`. After Step 6 it disappears, because `git add .` already committed it.",
      "Step 5: yellow, under `Modified files`. After Step 6: listed under `Pushed to origin/main`.",
      "No change: `git status` shows exactly the same output until you run `git commit`.",
    ],
    explain:
      "Before `git add .`, a new file is listed in red under Untracked files. `git add .` moves it to the Staging Area, so it turns green under Changes to be committed.",
  },
  {
    id: "git-a1-letter-push",
    topic: "workflow",
    scenario:
      'The Sending a Letter analogy: one envelope is sealed in your outbox (the "Initial commit" commit). A revised page of `your-name.txt` is in an open envelope (staged with `git add`). You are still writing a third line at your desk.',
    question: "If you run `git push` now, what reaches GitHub?",
    choices: [
      'Only the sealed envelope ("Initial commit"). The open envelope and the draft on your desk stay on your laptop.',
      "The sealed envelope and the open envelope. Only the draft on your desk stays behind.",
      "All three, because `git push` uploads your whole project folder.",
      "Nothing: `git push` fails while the Staging Area isn't empty.",
    ],
    explain:
      "`git push` only sends commits: the sealed envelopes in your local repository (`.git`). Staged work and unstaged edits stay on your laptop until you commit them.",
  },
  {
    id: "git-a1-init",
    topic: "commands",
    kind: "short",
    question:
      "Activity 1, Step 2: you've opened your new `my-project` folder. Type the 2-word command that starts a new local Git repository (it makes the hidden `.git` folder).",
    answers: ["git init"],
    explain: "`git init` turns the current folder into a Git repository by creating the hidden `.git` folder, where Git keeps every commit.",
  },
  {
    id: "git-a1-commit-initial",
    topic: "commands",
    kind: "short",
    question: "Activity 1, Step 7: type the command that commits your staged `your-name.txt` with the exact message Initial commit.",
    answers: ['git commit -m "Initial commit"'],
    explain: '`-m` sets the commit message, and the quotes keep the two words together: `git commit -m "Initial commit"`.',
  },
];

const GIT_ACTIVITY_2: QuizQuestion[] = [
  {
    id: "git-a2-branch-no-switch",
    topic: "switching",
    scenario:
      'Activity 2: you are on `main`. You run Step 1 (`git branch hobby`) but skip Step 3 (`git checkout hobby`). Then you add your hobby line to `your-name.txt` and run Step 5: `git add your-name.txt` and `git commit -m "add hobby in branch"`.',
    question: "Where does the commit land, and what does `git branch` show?",
    choices: [
      "On `main`, and `git branch` still shows `* main`: `git branch hobby` only made the branch, it didn't switch to it.",
      "On `hobby`, and `git branch` shows `* hobby`, because `git branch hobby` creates the branch and switches to it.",
      "On both `main` and `hobby`, because `hobby` was made from `main` and they share commits.",
      "Nowhere: Git refuses with a detached HEAD error until you run `git checkout hobby`.",
    ],
    explain:
      "Step 1 (`git branch <branch-name>`) only creates the branch. Step 3 (`git checkout <branch-name>`) moves you onto it. Skip Step 3 and you are still committing to `main`.",
  },
  {
    id: "git-a2-checkout-main-file",
    topic: "isolation",
    scenario:
      'You follow Activity 2 Steps 1 to 5 properly: you make and switch to `hobby`, add "My hobby is gaming" to `your-name.txt`, save, and commit it with `git add your-name.txt` and `git commit -m "add hobby in branch"`. Then Step 6: `git checkout main`.',
    question: "What is in `your-name.txt` in your editor now?",
    choices: [
      "Only your self-introduction from Activity 1. The hobby line is gone from the file, because `main` doesn't have the `hobby` commit.",
      'Your introduction and "My hobby is gaming", because a saved file stays the same whichever branch you are on.',
      "Nothing: `your-name.txt` is deleted from `main` until you run `git merge hobby`.",
      "Conflict markers (`<<<<<<< HEAD`), because `main` and `hobby` now have different versions of the file.",
    ],
    explain:
      "Switching branches makes your files match that branch's latest commit. On `main`, `your-name.txt` only has your Activity 1 introduction. The hobby line is safe on `hobby`.",
  },
  {
    id: "git-a2-best-practice",
    topic: "teamwork",
    question: "By the workshop's Best Practices for Branching, which of these is the wrong way to work on a team project?",
    choices: [
      "Pushing finished commits straight to `main` so teammates get them faster, without a Pull Request.",
      "Naming branches after what they do, like `feature/navbar` or `fix/footer-link`.",
      "Starting each new branch from an up-to-date `main`, right after running `git pull`.",
      "Merging finished features into `main` often, through reviewed Pull Requests.",
    ],
    explain:
      "Never push straight to `main`. Push your own feature branch (`git push -u origin <branch>`), then open a Pull Request so a teammate can review it before it merges.",
  },
  {
    id: "git-a2-switch-c",
    topic: "commands",
    kind: "short",
    question:
      "Activity 2 took two commands to create and switch (`git branch`, then `git checkout`). Type the single command, using `switch` and its short flag, that creates a branch called `feature/navbar` and switches to it.",
    answers: ["git switch -c feature/navbar"],
    explain: "`git switch -c feature/navbar` creates the branch and moves you onto it in one go. `-c` stands for create.",
  },
  {
    id: "git-a2-commit-hobby",
    topic: "commands",
    kind: "short",
    question: "Activity 2, Step 5: `your-name.txt` is staged. Type the commit command with the exact message from the Activity 2 instructions.",
    answers: ['git commit -m "add hobby in branch"'],
    explain: 'The Activity 2 slide uses the message add hobby in branch, all in lower case: `git commit -m "add hobby in branch"`.',
  },
  {
    id: "git-a2-push-u",
    topic: "remote",
    kind: "short",
    question:
      "Type the command that publishes your local branch `feature/navbar` to the `origin` remote for the first time, using the `-u` flag so Git tracks it.",
    answers: ["git push -u origin feature/navbar", "git push --set-upstream origin feature/navbar"],
    explain:
      "`-u` (short for `--set-upstream`) links your branch to `origin/feature/navbar`, so from then on a plain `git push` or `git pull` knows where to go.",
  },
];

const GIT_ACTIVITY_3: QuizQuestion[] = [
  {
    id: "git-a3-conflict-part1",
    topic: "conflicts",
    scenario: "You are on `main` and run `git merge branch-b`. Git stops with `CONFLICT (content): Merge conflict in part1.txt`, and `part1.txt` now looks like the file below.",
    question: "Why did it conflict, and what finishes the merge once you've edited `part1.txt`?",
    code: `Hello my name is Michelle.
<<<<<<< HEAD (Current Change)
Hello world!
=======
Hello ITC!
>>>>>>> branch-b (Incoming Change)`,
    choices: [
      "`main` (HEAD) and `branch-b` both changed line 2 of `part1.txt`. Remove the markers, then Ctrl+S → `git add` → `git commit`.",
      "`branch-b` changed a different file from `main`. After editing, press Ctrl+S → `git push` to finish.",
      "You didn't run `git stash` before merging. After editing, `git merge --abort` keeps your fix.",
      '"Hello ITC!" ends in an exclamation mark. After editing, `git branch -d branch-b` finishes the merge.',
    ],
    explain:
      "A conflict happens when two branches change the same line of the same file: here, line 2 of `part1.txt`. Save your edited file (Ctrl+S), stage it (`git add`), then `git commit` to make the merge commit.",
  },
  {
    id: "git-a3-game-merge-blue",
    topic: "merging",
    scenario: "The Activity 3 branching game runs the commands below in order. The last one prints Fast forwarding...",
    question: 'After `git merge blue`, which commits are on `main`, and where is "add red color to button"?',
    code: `git checkout -b blue
git commit -m "add blue color to button"
git checkout main
git checkout -b red
git commit -m "add red color to button"
git checkout blue
git commit -m "add border to button"
git checkout main
git merge blue`,
    choices: [
      '`main` has "add blue color to button" and "add border to button". The red commit stays on `red` only.',
      "`main` has all three commits, because merging `blue` also merges the branches next to it.",
      "None: `git merge blue` fails with a merge conflict because `red` exists.",
      '`main` only has "add border to button". The first blue commit is skipped.',
    ],
    explain:
      "`main` got no new commits after `blue` branched off, so `git merge blue` just fast-forwards `main` along `blue`'s two commits. `red` was branched separately, so its commit stays on `red`.",
  },
  {
    id: "git-a3-fake-teamwork",
    topic: "remote",
    scenario:
      "In the second Activity 3 game level you run `git clone`. Then `git fakeTeamwork main 2` adds two teammate commits to GitHub's `main` (`o/main`), and you make one commit on your own `main`.",
    question: "Why can't you just run `git push`, and what is the right order?",
    choices: [
      "Your `main` and `o/main` have diverged. Run `git pull` first to bring in the 2 remote commits, then `git push`.",
      "You need `git push --force` to overwrite your teammates' 2 commits on `o/main`.",
      "Run `git clone` again to get the 2 new commits, then `git commit`.",
      "Delete your local `main` with `git branch -d main` and start again.",
    ],
    explain:
      "GitHub has commits you don't have yet, so it rejects your push. `git pull` downloads them and merges them into your `main`; then `git push` can send the combined history.",
  },
  {
    id: "git-a3-pr-base-compare",
    topic: "pull-requests",
    scenario: "You pushed `feature/attendance-import` to GitHub and clicked Compare & pull request.",
    question: "Which set-up and clean-up matches the workshop slides?",
    choices: [
      "`base: main` ← `compare: feature/attendance-import`. After approval and the purple Merged badge, Delete branch; everyone then runs `git pull` on `main`.",
      "`base: feature/attendance-import` ← `compare: main`. After it merges, click Revert on GitHub to clean up the branch.",
      "`base: main` ← `compare: main`. Keep the feature branch forever, or `main` loses the merged code.",
      "No set-up: Pull Requests merge on your laptop by themselves, without a reviewer or a `git pull`.",
    ],
    explain:
      "`base` is where the work goes (`main`) and `compare` is your branch. The purple Merged badge means the work is in `main`, so the branch can be deleted, and everyone runs `git pull` on `main` to get it.",
  },
  {
    id: "git-a3-branch-d",
    topic: "commands",
    kind: "short",
    question: "Activity 3 branching game: `blue` is merged into `main`. Type the command, using the `-d` flag, that deletes your local `blue` branch.",
    answers: ["git branch -d blue"],
    explain:
      "`git branch -d blue` deletes a branch only once it is merged, so no work is lost. That's why the game's `git branch -d red` is refused: `red` isn't merged.",
  },
  {
    id: "git-a3-revert",
    topic: "undo",
    kind: "short",
    question:
      "From the Additional Tips slide: instead of `git push --force`, which rewrites history, type the command that safely undoes the pushed commit `5738b26` with a new commit that reverses it.",
    answers: ["git revert 5738b26"],
    explain:
      "`git revert 5738b26` adds a new commit that does the opposite of `5738b26`. History is kept, so teammates who already pulled aren't affected.",
  },
];

const BANKS: Record<string, QuizQuestion[]> = {
  html: HTML_QUESTIONS,
  css: CSS_QUESTIONS,
  javascript: JS_QUESTIONS,
  "git-basics": GIT_ACTIVITY_1,
  branches: GIT_ACTIVITY_2,
  github: GIT_ACTIVITY_3,
};

/** Quizzes by topic slug. Titles and lessons come from quiz-meta so the browser can show them too. */
export const QUIZZES: Record<string, Quiz> = Object.fromEntries(
  Object.entries(QUIZ_INFO).map(([slug, info]) => [slug, { slug, title: info.title, lesson: info.lesson, questions: BANKS[slug] }]),
);

// A bank smaller than one attempt would leave attempts short, so fail the build instead.
for (const quiz of Object.values(QUIZZES)) {
  if (!quiz.questions || quiz.questions.length < questionsIn(quiz.slug)) {
    throw new Error(`The ${quiz.slug} quiz needs at least ${questionsIn(quiz.slug)} questions.`);
  }
}

export function findQuestion(quiz: Quiz, id: string) {
  return quiz.questions.find((q) => q.id === id);
}

/** The right answer as it is shown to the member. */
export function answerFor(question: QuizQuestion) {
  return question.kind === "short" ? question.answers[0] : question.choices[0];
}

/** Whether an answer is right. A short answer is compared after tidying (see short-answer.ts). */
export function isCorrect(question: QuizQuestion, chosen: string) {
  return question.kind === "short" ? matchesAnswer(chosen, question.answers) : chosen === question.choices[0];
}
