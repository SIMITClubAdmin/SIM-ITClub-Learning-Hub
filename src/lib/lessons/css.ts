import { page, type Lesson } from "./types";

// Written from the "Lesson 1 - HTML, CSS, JS" Canva slides. "extra" blocks go beyond the slides.

const INTERNAL = `<head>
    <style>
        .red-paragraph {
            color: red;
        }
    </style>
</head>
<body>
    <!-- Internal CSS -->
    <p class="red-paragraph">Hello, I am Kimberly.</p>
</body>`;

const EXTERNAL_HTML = `<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="style.css">
</head>

<body>
    <!-- Same as the internal CSS -->
    <p class="red-paragraph">Hello, I am Kimberly.</p>
</body>`;

const EXTERNAL_CSS = `.red-paragraph {
    color: red;
}`;

const SELECTOR_RULES = `font-size: 16px;
    line-height: 1.5;
    color: #f2c2c2;`;

export const CSS_LESSONS: Lesson[] = [
  {
    slug: "what-is-css",
    title: "What is CSS?",
    summary: "Cascading Style Sheets: how your HTML looks.",
    minutes: 8,
    blocks: [
      {
        type: "p",
        text: "CSS stands for Cascading Style Sheets. It describes the appearance of HTML elements, designs and styles them, and keeps the look consistent across your website.",
      },
      { type: "h2", text: "CSS anatomy" },
      {
        type: "code",
        label: "style.css",
        code: `h1 {
    color: red;
}`,
        preview: page("<h1>Hello ITCamp!</h1>", "h1{color:red}"),
        previewHeight: 90,
      },
      {
        type: "terms",
        items: [
          ["h1", "The selector: who to style. Here, every `<h1>` element."],
          ["color", "The property: what to change."],
          ["red", "The value: what to change it to."],
          ["{ }  and  ;", "Curly brackets wrap the rules. Each rule ends with a semicolon."],
        ],
      },
      { type: "h2", text: "Declaring" },
      { type: "p", text: "Every CSS rule answers two questions: who to style (an HTML element) and what to do (a styling property)." },
      {
        type: "code",
        label: "style.css",
        code: `p {
    color: red;
}`,
        preview: page("<p>Every paragraph turns red.</p>", "p{color:red}"),
        previewHeight: 60,
      },
      { type: "h2", text: "CSS comments" },
      { type: "p", text: "Comments explain parts of your code, or switch a style off for a moment without deleting it." },
      {
        type: "code",
        label: "style.css",
        code: `/* Main heading colour */
h1 {
    color: red;
}

p {
    /* color: blue;   <- style disabled for now */
    font-size: 18px;
}`,
      },
      {
        type: "extra",
        title: "Properties you will use all the time",
        blocks: [
          { type: "p", text: "One rule can hold many properties. Copy this and change the values to see what each one does." },
          {
            type: "code",
            label: "style.css",
            code: `p {
    color: navy;               /* text colour */
    background-color: lightyellow;
    font-size: 18px;           /* text size */
    font-family: Arial, sans-serif;
    padding: 12px;             /* space inside the box */
    margin: 8px;               /* space outside the box */
    border: 2px solid navy;
    border-radius: 8px;        /* rounded corners */
}`,
            preview: page("<p>Hello ITCamp!</p>", "p{color:navy;background-color:lightyellow;font-size:18px;font-family:Arial,sans-serif;padding:12px;margin:8px;border:2px solid navy;border-radius:8px}"),
            previewHeight: 90,
          },
        ],
      },
    ],
  },
  {
    slug: "adding-css",
    title: "Inline, internal and external CSS",
    summary: "The three ways to add CSS to a page.",
    minutes: 10,
    blocks: [
      { type: "p", text: "There are 3 ways to declare CSS: inline, internal and external." },
      { type: "h2", text: "1. Inline CSS" },
      { type: "p", text: "Properties and values are defined directly inside the element, using the `style` attribute." },
      {
        type: "code",
        label: "index.html",
        code: `<!-- Inline CSS -->
<p style="color: red;">Hello, I am Kimberly.</p>`,
        preview: page('<p style="color: red;">Hello, I am Kimberly.</p>'),
        previewHeight: 60,
      },
      {
        type: "p",
        text: "Inline is okay for one element, but it can only style that one element. To change the colour of every paragraph, you'd edit each `<p style=\"\">` one by one: lots of repetition.",
      },
      { type: "h2", text: "2. Internal CSS" },
      {
        type: "list",
        items: [
          "Properties and values are defined in a `<style>` tag, wrapped in `<head>`.",
          "Give the element a class, then use a class selector (a dot and the class name) to find it.",
        ],
      },
      {
        type: "code",
        label: "index.html",
        code: INTERNAL,
        preview: page('<p class="red-paragraph">Hello, I am Kimberly.</p>', ".red-paragraph{color:red}"),
        previewHeight: 60,
      },
      {
        type: "p",
        text: "Internal CSS only works for one page. If `file2.html` and `file3.html` need the same styles, you'd copy the whole `<style>` block into each file.",
      },
      { type: "h2", text: "3. External CSS" },
      { type: "p", text: "Selectors are defined in a separate `.css` file. A `<link>` in the `<head>` connects it to the HTML." },
      { type: "code", label: "index.html", code: EXTERNAL_HTML },
      {
        type: "code",
        label: "style.css",
        code: EXTERNAL_CSS,
        preview: page('<p class="red-paragraph">Hello, I am Kimberly.</p>', ".red-paragraph{color:red}"),
        previewHeight: 60,
      },
      {
        type: "p",
        text: "External CSS is the best way: styles are shared between pages, HTML and CSS stay separate, and the code is cleaner. Your folder can look like this:",
      },
      {
        type: "code",
        label: "folder",
        code: `my-website/
├── index.html
├── about.html
└── styles/
    └── styles.css

<!-- in index.html and about.html -->
<link rel="stylesheet" href="styles/styles.css">`,
      },
      {
        type: "extra",
        title: "Which one should I use?",
        blocks: [
          {
            type: "list",
            items: [
              "External is best for real websites. One `style.css` can style every page, so changing one line updates the whole site.",
              "Internal is handy for a quick one-page test.",
              "Inline is for a one-off change. It gets messy fast, and it beats every other rule, which makes it hard to override later.",
              "Not working? Check that `style.css` is in the same folder as `index.html`, and that the `href` spelling matches exactly.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "selectors",
    title: "Selectors",
    summary: "ID, class, element and universal selectors, and which one wins.",
    minutes: 12,
    blocks: [
      { type: "p", text: "There are 4 types of selectors: ID, class, element and universal." },
      { type: "h2", text: "ID selectors" },
      { type: "p", text: "Target only one specific element. In CSS, an ID starts with `#`." },
      { type: "code", label: "index.html", code: `<p id="paragraph">I'm from IT Club</p>` },
      {
        type: "code",
        label: "style.css",
        code: `#paragraph {
    ${SELECTOR_RULES}
}`,
      },
      { type: "h2", text: "Class selectors" },
      { type: "p", text: "Target elements with a specific class name. In CSS, a class starts with `.`." },
      { type: "code", label: "index.html", code: `<p class="paragraph">I'm Fukutaro</p>` },
      {
        type: "code",
        label: "style.css",
        code: `.paragraph {
    ${SELECTOR_RULES}
}`,
      },
      { type: "h2", text: "Element selectors" },
      { type: "p", text: "Target an HTML element by its tag name. This styles every `<p>` on the page." },
      { type: "code", label: "index.html", code: "<p>Welcome to ITCamp: Frontendamental</p>" },
      {
        type: "code",
        label: "style.css",
        code: `p {
    ${SELECTOR_RULES}
}`,
      },
      { type: "h2", text: "Universal selector (*)" },
      { type: "p", text: "Targets all elements on the page. It's often used to reset the browser's default spacing." },
      {
        type: "code",
        label: "style.css",
        code: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}`,
      },
      { type: "h2", text: "Specificity: which rule wins?" },
      {
        type: "p",
        text: "When two rules style the same element, the more specific one wins. From most to least specific: inline CSS > ID selector > class selector > element selector > universal selector.",
      },
      {
        type: "extra",
        title: "Specificity in action, and when to use which",
        blocks: [
          {
            type: "code",
            label: "index.html + style.css",
            code: `<p id="intro" class="note">Which colour am I?</p>

p      { color: green; }   /* element */
.note  { color: blue; }    /* class   */
#intro { color: red; }     /* ID wins */`,
            preview: page('<p id="intro" class="note">Which colour am I?</p>', "p{color:green}.note{color:blue}#intro{color:red}"),
            previewHeight: 60,
          },
          {
            type: "list",
            items: [
              "An ID must be unique: use each ID only once per page.",
              "A class can be reused on as many elements as you like. Use classes for most of your styling.",
              "An element can have several classes, separated by spaces: `class=\"card dark\"`.",
            ],
          },
        ],
      },
      { type: "link", href: "/learn/playground#specificity", text: "Watch a specificity battle in the CSS Playground" },
      { type: "h2", text: "Other selectors, nice to know" },
      {
        type: "terms",
        items: [
          [":hover", "A pseudo selector: styles an element based on its state, like when the mouse is over it."],
          ["nav a", "A descendant selector: every `<a>` inside a `<nav>`."],
        ],
      },
      {
        type: "code",
        label: "style.css",
        code: `/* Pseudo selector: when the mouse is over a button */
button:hover {
    background-color: navy;
    color: white;
}

/* Descendant selector: links inside the nav only */
nav a {
    color: red;
}`,
        preview: page('<nav><a href="#">Home</a> <a href="#">About</a></nav><p><a href="#">A link outside nav</a></p><button>Hover me</button>', "button:hover{background-color:navy;color:white}nav a{color:red}"),
        previewHeight: 120,
      },
      { type: "link", href: "/learn/playground#selectors", text: "See selectors filter a page in the CSS Playground" },
      {
        type: "check",
        question: "Which selector styles every element that has class=\"card\"?",
        options: ["#card", ".card", "card", "*card"],
        answer: 1,
        explanation: "A dot means a class selector.",
      },
    ],
  },
];
