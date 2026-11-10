export type QuizQuestion = {
  question: string;
  /** Code shown under the question, if any. */
  code?: string;
  /** What the browser shows for the code, as a full HTML page. Scripts never run in it. */
  preview?: string;
  /** The first choice is the right answer; the quiz shuffles them before showing. */
  choices: [string, string, string, string];
  /** Shown after the member answers. */
  explain: string;
};

export type Quiz = { title: string; lesson: number; questions: QuizQuestion[] };

/** Every quiz has this many questions; scores are saved out of it. */
export const QUESTIONS_PER_QUIZ = 5;

const page = (body: string, css = "") =>
  `<!DOCTYPE html><html><head><style>body{font-family:Times,serif;font-size:20px;margin:16px;color:#111}${css}</style></head><body>${body}</body></html>`;

// Written from the "Lesson 1 - HTML, CSS, JS" slides. Each question asks students to think:
// spot the bug, predict the output, or decide which rule wins.

const HTML: Quiz = {
  title: "HTML",
  lesson: 1,
  questions: [
    {
      question: "Your project has index.html and a folder called photos with cat.png inside. The image won't show on index.html. Without moving any files, how do you fix the code?",
      code: '<img src="cat.png" alt="My cat">',
      preview: page('<span style="font:14px sans-serif;color:#666">🖼️ My cat</span>'),
      choices: [
        'Change the src to "photos/cat.png"',
        "alt has to come before src",
        "<img> needs a closing </img> tag",
        "Browsers can't show .png images",
      ],
      explain: "The src is a path from your HTML file. cat.png is inside the photos folder, so the path must be photos/cat.png. (Moving cat.png next to index.html would also work.) When the browser can't find the image, it shows the alt text instead.",
    },
    {
      question: "Clicking this link opens a \"page not found\" error instead of SIM's website. Why?",
      code: '<a href="www.sim.edu.sg" target="_blank">Visit SIM</a>',
      choices: [
        "The href is missing https://, so the browser looks for a file in your folder",
        'target="_blank" stops links from working',
        "Links can only go to .html files",
        "The link text must be the same as the URL",
      ],
      explain: "Without https://, the browser treats www.sim.edu.sg as a file name next to your page. A full web address starts with https://.",
    },
    {
      question: "You pressed Enter between the two lines, but the browser shows them on one line. How do you fix it?",
      code: `<p>Line 1
Line 2</p>`,
      preview: page("<p>Line 1 Line 2</p>"),
      choices: [
        "Add <br> after Line 1",
        "Press Enter twice instead of once",
        "Change <p> to <h1>",
        "Add a space at the end of Line 1",
      ],
      explain: "The browser ignores Enter and extra spaces in your code. <br> is the tag that tells it to start a new line.",
    },
    {
      question: "Which part of this code has a bug?",
      code: '<p>I love <a href="about.html">ITCamp</p></a>',
      choices: [
        "</p> and </a> are closed in the wrong order",
        "A link can't go inside a paragraph",
        'href needs single quotes, not double quotes',
        "about.html needs a / in front",
      ],
      explain: "Tags close in the opposite order they opened: last opened, first closed. It should end with </a></p>.",
    },
    {
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
      explain: "The <title> shows on the browser tab, not the page, and the commented-out <h2> is ignored. Only Welcome and Projects show.",
    },
  ],
};

const CSS: Quiz = {
  title: "CSS",
  lesson: 1,
  questions: [
    {
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
      question: "Where does this CSS go so it styles the page?",
      code: `<style>
    h1 { color: purple; }
</style>`,
      choices: [
        "Inside the <head>",
        "After the closing </html> tag",
        "Inside the <h1> tag",
        "In a separate .js file",
      ],
      explain: "Internal CSS goes in a <style> tag inside the <head>. External CSS goes in a .css file linked with <link>.",
    },
    {
      question: "What colour is the text?",
      code: `<p class="tip">Hi!</p>

.tip { color: blue; }
p    { color: red; }`,
      choices: ["Blue", "Red", "Purple", "Black"],
      explain: "A class selector is stronger than an element selector, so .tip wins even though the p rule comes later.",
    },
    {
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
      explain: "CSS property names use American spelling. The browser doesn't know \"colour\", so it skips that line but still applies text-align.",
    },
  ],
};

const JS: Quiz = {
  title: "JavaScript",
  lesson: 1,
  questions: [
    {
      question: "What does this print?",
      code: `let count = "3";
count = count + 1;
console.log(count);`,
      choices: ['"31"', "4", "NaN", "An error"],
      explain: '"3" is a string (it\'s in quotes), so + joins instead of adding: "3" + 1 gives "31".',
    },
    {
      question: "This code crashes. What's the fix?",
      code: `const score = 0;
score = score + 10;`,
      choices: [
        "Change const to let",
        "Change 10 to \"10\"",
        "Change score + 10 to score - 10",
        "Add a second semicolon",
      ],
      explain: "A const can't be given a new value. Use let when the value needs to change.",
    },
    {
      question: "What is the last number printed?",
      code: `for (let i = 0; i < 5; i++) {
  console.log(i);
}`,
      choices: ["4", "5", "6", "It never stops"],
      explain: "i starts at 0 and the loop runs while i < 5, so it prints 0, 1, 2, 3, 4. When i becomes 5, it stops.",
    },
    {
      question: "Clicking the button does nothing, and the console says \"Cannot read properties of null\". What's the bug?",
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
      explain: 'querySelector uses CSS addresses. "toggle" looks for a <toggle> tag, finds nothing (null), and crashes. "#toggle" finds the id.',
    },
    {
      question: "What does this print?",
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
  ],
};

/** Quizzes by topic slug, matching Topic.slug in topics.ts. */
export const QUIZZES: Record<string, Quiz> = { html: HTML, css: CSS, javascript: JS };
