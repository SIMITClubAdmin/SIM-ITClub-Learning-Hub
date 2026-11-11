/**
 * The question bank. SERVER ONLY: it holds the answers, so never import it from a
 * "use client" file. Browser code uses src/lib/quiz-meta.ts instead.
 *
 * Each attempt draws QUESTIONS_PER_QUIZ questions from a bank (see src/lib/draw.ts).
 * Rules for editing during a cohort:
 *   - Never change or reuse an id: saved answers point at it.
 *   - The first choice is the right answer; the quiz shuffles them before showing.
 *   - More questions per bank = less overlap between teammates.
 */
import { QUIZ_TITLES } from "@/lib/quiz-meta";

export type QuizQuestion = {
  /** Unique and permanent. Saved with every answer. */
  id: string;
  /** Group of related questions. An attempt prefers questions from different topics. */
  topic: string;
  question: string;
  /** Code shown under the question, if any. */
  code?: string;
  /** What the browser shows for the code, as a full HTML page. Scripts never run in it. */
  preview?: string;
  /** The first choice is the right answer. */
  choices: [string, string, string, string];
  /** Shown after the member answers. */
  explain: string;
};

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

/** Quizzes by topic slug. Titles come from quiz-meta so the browser can show them too. */
export const QUIZZES: Record<string, Quiz> = {
  html: { slug: "html", title: QUIZ_TITLES.html, lesson: 1, questions: HTML_QUESTIONS },
  css: { slug: "css", title: QUIZ_TITLES.css, lesson: 1, questions: CSS_QUESTIONS },
  javascript: { slug: "javascript", title: QUIZ_TITLES.javascript, lesson: 1, questions: JS_QUESTIONS },
};

export function findQuestion(quiz: Quiz, id: string) {
  return quiz.questions.find((q) => q.id === id);
}
