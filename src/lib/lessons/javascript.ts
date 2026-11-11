import { page, type Block, type Lesson } from "./types";

// Written from the "Lesson 1 - HTML, CSS, JS" Canva slides. "extra" blocks go beyond the slides.

const DARK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dark mode</title>
    <link rel="stylesheet" href="style.css">
    <script src="script.js" defer></script>
</head>
<body>
    <h1 id="title">Hello, ITCamp!</h1>
    <button id="toggle">Toggle dark mode</button>
</body>
</html>`;

const BASE_LESSONS: Lesson[] = [
  {
    slug: "what-is-javascript",
    title: "What is JavaScript?",
    summary: "The brain of the page: it makes pages react when people click, type, scroll and submit.",
    minutes: 8,
    blocks: [
      {
        type: "p",
        text: "Think of a car. HTML is the body and CSS is the paint, but without an engine the car can't move. JavaScript is the engine: it makes the page work.",
      },
      { type: "p", text: "JavaScript makes pages react when people:" },
      { type: "list", items: ["click", "type", "scroll", "submit a form"] },
      { type: "h2", text: "Connect a JavaScript file" },
      {
        type: "p",
        text: "Best practice: put your JavaScript in its own file, like `script.js`. It's reusable and easy to fix. Link it inside `<head>`:",
      },
      { type: "code", label: "index.html", code: '<script src="script.js" defer></script>' },
      { type: "p", text: "`defer` tells the browser to wait until the page is built before running your JavaScript." },
      { type: "p", text: "Then check it works. Put this in `script.js`:" },
      { type: "code", label: "script.js", code: 'console.log("JS works!");', output: "JS works!" },
      {
        type: "extra",
        title: "Where do I see console.log?",
        blocks: [
          {
            type: "steps",
            items: [
              "Open your page in the browser (Live Server).",
              "Right-click anywhere on the page and choose Inspect.",
              "Click the Console tab. Your message shows there.",
            ],
          },
          {
            type: "p",
            text: "Shortcut: `Cmd + Option + J` (Mac) or `Ctrl + Shift + J` (Windows) in Chrome. Red text in the console means an error, and it tells you the line number to check.",
          },
        ],
      },
    ],
  },
  {
    slug: "variables-and-data-types",
    title: "Variables and data types",
    summary: "Store values in let and const, and meet strings, numbers and booleans.",
    minutes: 10,
    blocks: [
      { type: "h2", text: "Variables" },
      { type: "p", text: "A variable is a named box that stores a value." },
      {
        type: "code",
        label: "script.js",
        code: `let score = 0;
const name = "Alex";
var x = 1;`,
      },
      {
        type: "terms",
        items: [
          ["let", "A box you can swap the contents of. Use it when the value must change."],
          ["const", "A sealed box: once set, it can't be replaced."],
          ["var", "The old default. It still works, but it's leaky, so avoid it."],
        ],
      },
      { type: "p", text: "Best practice: start with `const`. Only use `let` if the value must change." },
      { type: "p", text: "Question: will this be an error?" },
      {
        type: "code",
        label: "script.js",
        code: `const age = 20;
age = 21;`,
        output: "Uncaught TypeError: Assignment to constant variable.",
      },
      { type: "p", text: "Yes! `age` is a `const`, so it can't be given a new value. Use `let age = 20;` if it needs to change." },
      { type: "h2", text: "Data types" },
      {
        type: "terms",
        items: [
          ['"Alex"', "String: words in quotes."],
          ["20", "Number: for maths."],
          ["true", "Boolean: a light switch, either true (on) or false (off)."],
        ],
      },
      { type: "p", text: "Question: what do these give?" },
      {
        type: "code",
        label: "script.js",
        code: `console.log("5" + "5");
console.log(5 + 5);`,
        output: `55
10`,
      },
      { type: "p", text: 'Strings in quotes are joined together, so `"5" + "5"` is `"55"`. Numbers are added, so `5 + 5` is `10`.' },
      {
        type: "extra",
        title: "Check a value's type",
        blocks: [
          { type: "p", text: "`typeof` tells you what type a value is. Handy when something adds up strangely." },
          {
            type: "code",
            label: "script.js",
            code: `console.log(typeof "Alex");
console.log(typeof 20);
console.log(typeof true);`,
            output: `string
number
boolean`,
          },
        ],
      },
    ],
  },
  {
    slug: "conditionals-and-operators",
    title: "Conditionals and operators",
    summary: "Make decisions with if / else, comparisons and logic.",
    minutes: 10,
    blocks: [
      { type: "h2", text: "Conditionals" },
      { type: "p", text: "`if` runs code only when something is true. `else if` checks another case, and `else` catches everything left." },
      {
        type: "code",
        label: "script.js",
        code: `const light = "red";

if (light == "red") {
  console.log("Stop!");
} else if (light == "yellow") {
  console.log("What you will do?");
} else {
  console.log("Go!");
}`,
        output: "Stop!",
      },
      { type: "h2", text: "Comparison and logical operators" },
      {
        type: "terms",
        items: [
          [">", "more than"],
          ["<", "less than"],
          [">=", "more than or equal"],
          ["<=", "less than or equal"],
          ["=== / !==", "equal / not equal, and strictly matches data types"],
          ["== / !=", "equal / not equal, automatically converting types if they mismatch"],
          ["&&", "and: both must be true"],
          ["||", "or: at least one must be true"],
          ["!", "not: flips true and false"],
        ],
      },
      {
        type: "extra",
        title: "Why === is safer than ==",
        blocks: [
          {
            type: "code",
            label: "script.js",
            code: `console.log(5 == "5");    // converts "5" to 5 first
console.log(5 === "5");   // number vs string

const age = 20;
const hasTicket = true;
console.log(age >= 18 && hasTicket);`,
            output: `true
false
true`,
          },
          { type: "p", text: "Use `===` by default, so a number and a string never count as equal by surprise." },
        ],
      },
    ],
  },
  {
    slug: "loops-and-arrays",
    title: "Loops and arrays",
    summary: "Repeat code with for loops, and store lists in arrays.",
    minutes: 12,
    blocks: [
      { type: "h2", text: "Loops: do it again and again" },
      {
        type: "code",
        label: "script.js",
        code: `for (let i = 1; i <= 5; i++) {
  console.log("Student " + i);
}`,
        output: `Student 1
Student 2
Student 3
Student 4
Student 5`,
      },
      {
        type: "terms",
        items: [
          ["let i = 1", "The start point."],
          ["i <= 5", "The end condition: keep going while this is true."],
          ["i++", "Counting: the same as `i = i + 1`."],
        ],
      },
      { type: "p", text: "Warning: a loop that never stops can freeze the tab. If that happens, close the tab." },
      { type: "h2", text: "Arrays" },
      { type: "p", text: "An array is a list of values in square brackets." },
      {
        type: "code",
        label: "script.js",
        code: `const fruits = ["apple", "banana", "mango"];

console.log(fruits[1]);
console.log(fruits.length);

fruits.push("grape");

for (const f of fruits) {
  console.log(f);
}`,
        output: `banana
3
apple
banana
mango
grape`,
      },
      {
        type: "terms",
        items: [
          ["fruits[1]", "Gets one item by its position (index)."],
          ["fruits.length", "How many items are in the list."],
          ['fruits.push("grape")', "Adds an item to the end."],
          ["for (const f of fruits)", "Runs once for every item in the list."],
        ],
      },
      {
        type: "extra",
        title: "Counting starts at 0",
        blocks: [
          {
            type: "p",
            text: 'In JavaScript, the first item is at position 0, not 1. So `fruits[0]` is `"apple"`, `fruits[1]` is `"banana"`, and the last item is at `fruits.length - 1`.',
          },
        ],
      },
    ],
  },
  {
    slug: "objects",
    title: "Objects and arrays of objects",
    summary: "Group related values with keys, like a student ID card.",
    minutes: 10,
    blocks: [
      { type: "h2", text: "Objects: a student ID card" },
      { type: "p", text: "An object stores related values as key: value pairs." },
      {
        type: "code",
        label: "script.js",
        code: `const student = {
  name: "Alex",
  age: 20,
  course: "AI & Big Data"
};

console.log(student.name);
student.age = 21;   // update a field
console.log(student.age);`,
        output: `Alex
21`,
      },
      {
        type: "terms",
        items: [
          ["name, age, course", "The keys: the labels on the card."],
          ['"Alex", 20, "AI & Big Data"', "The values: what each label holds."],
        ],
      },
      { type: "h2", text: "Array of objects: the class list" },
      {
        type: "p",
        text: "A stack of ID cards, like your phone's contact list. Websites are full of these: Shopee products and Instagram posts are lists of objects.",
      },
      {
        type: "code",
        label: "script.js",
        code: `const members = [
  { name: "Aisha", tier: "Silver" },
  { name: "Ben",   tier: "Bronze" }
];

for (const m of members) {
  console.log(m.name + " is " + m.tier);
}`,
        output: `Aisha is Silver
Ben is Bronze`,
      },
      {
        type: "extra",
        title: "Add a new member",
        blocks: [
          { type: "p", text: "Because `members` is an array, `push` adds another object to the end." },
          {
            type: "code",
            label: "script.js",
            code: `members.push({ name: "Chloe", tier: "Gold" });
console.log(members.length);`,
            output: "3",
          },
        ],
      },
    ],
  },
  {
    slug: "functions",
    title: "Functions",
    summary: "Reusable code you can call by name, like a vending machine.",
    minutes: 8,
    blocks: [
      { type: "p", text: "A function is a vending machine: you put coins in, press the button, and get a drink back." },
      {
        type: "code",
        label: "script.js",
        code: `function order(drink) {
  return "Here's your drink " + drink + "!";
}

console.log(order("100 Plus"));`,
        output: "Here's your drink 100 Plus!",
      },
      {
        type: "terms",
        items: [
          ["drink", "The parameter: the coins you put in."],
          ["return", "The drink you get back."],
          ['order("100 Plus")', "Calling it: pressing the button."],
        ],
      },
      {
        type: "extra",
        title: "Call it as often as you like",
        blocks: [
          { type: "p", text: "Write the function once, then reuse it with different inputs. You can also give it more than one parameter." },
          {
            type: "code",
            label: "script.js",
            code: `function add(a, b) {
  return a + b;
}

console.log(add(2, 3));
console.log(add(10, 5));
console.log(order("Milo"));`,
            output: `5
15
Here's your drink Milo!`,
          },
        ],
      },
    ],
  },
  {
    slug: "the-dom",
    title: "The DOM",
    summary: "Select, change and listen to elements on the page with JavaScript.",
    minutes: 15,
    blocks: [
      {
        type: "p",
        text: "The DOM (Document Object Model) is a family tree made from your HTML. It lets JavaScript create, read, update and delete things on the page.",
      },
      {
        type: "p",
        text: "Think of a TV remote. Your JavaScript is the remote: 1. select the TV, 2. change the channel, 3. listen for a button press.",
      },
      { type: "h2", text: "Step 1: Select" },
      {
        type: "code",
        label: "script.js",
        code: `const title = document.querySelector("#title");
const cards = document.querySelectorAll(".card");`,
      },
      {
        type: "p",
        text: "Same addresses as CSS: `#id` is the IC number (one element), `.class` is the team jersey (everyone with that class), and a tag name is everyone with that name.",
      },
      { type: "h2", text: "Step 2: Manipulate" },
      {
        type: "code",
        label: "script.js",
        code: `title.textContent = "Hello, ITCamp!";
title.style.color = "tomato";
title.classList.add("highlight");
title.classList.toggle("dark");`,
      },
      {
        type: "p",
        text: "Like swapping the sign above a shop in real time. Refresh and it resets: JavaScript changes the live page, not your file.",
      },
      { type: "h2", text: "Step 3: Listen to events" },
      {
        type: "code",
        label: "script.js",
        code: `const btn = document.querySelector("button");

btn.addEventListener("click", function () {
  title.textContent = "You clicked me!";
});`,
      },
      { type: "p", text: "Other than `click`, there are other events like `mouseover`, `input`, `submit` and `keydown`." },
      { type: "h2", text: "Put it together: dark mode toggle" },
      { type: "p", text: "Copy all three files into one folder, open `index.html` with Live Server, and click the button." },
      { type: "code", label: "index.html", code: DARK_HTML },
      {
        type: "code",
        label: "style.css",
        code: `.dark {
  background: #111;
  color: white;
}`,
      },
      {
        type: "code",
        label: "script.js",
        code: `const toggle = document.querySelector("#toggle");

toggle.addEventListener("click", function () {
  document.body.classList.toggle("dark");
});`,
        preview: page('<h1 id="title">Hello, ITCamp!</h1><button id="toggle">Toggle dark mode</button><p style="font:13px sans-serif;color:#666">(The preview can\'t run JavaScript. After a click, the page looks like this:)</p><div style="background:#111;color:white;padding:8px 16px"><h1 style="margin:8px 0">Hello, ITCamp!</h1><button>Toggle dark mode</button></div>'),
        previewHeight: 270,
      },
      {
        type: "extra",
        title: "Common mistakes",
        blocks: [
          {
            type: "list",
            items: [
              "`null` errors usually mean the selector found nothing. Check the `#id` or `.class` spelling matches your HTML exactly.",
              "If nothing happens at all, check your `<script>` tag has `defer`, or put it just before `</body>`.",
              "`toggle` adds the class if it's missing and removes it if it's there, so one button can switch both ways.",
            ],
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------------------
// Hands-on extras: every lesson ends with code that really runs (with a console underneath)
// and a quick check. These follow the slides, so students repeat on the site what they saw.
// ---------------------------------------------------------------------------------------

const shell = (body: string, script: string, css = "") => `<!DOCTYPE html>
<html lang="en">
<head>
<style>
  body { font-family: system-ui, sans-serif; padding: 16px; }
  button { font-size: 16px; padding: 8px 14px; cursor: pointer; }
${css}</style>
</head>
<body>
${body}
<script>
${script}
</script>
</body>
</html>`;

const EXTRAS: Record<string, Block[]> = {
  "what-is-javascript": [
    { type: "h2", text: "Your turn: start the engine" },
    {
      type: "tryit",
      js: true,
      task: "Press the button, then read the Console under the preview. Change the message inside console.log and press the button again.",
      starter: shell(
        `<h1>🚗 My car</h1>
<button id="start">Start engine</button>`,
        `console.log("JS works!");

const button = document.querySelector("#start");
button.addEventListener("click", function () {
  console.log("Vroom! The engine is running.");
});`,
      ),
    },
    {
      type: "check",
      question: "What does defer do in <script src=\"script.js\" defer>?",
      options: [
        "Waits until the page is built, then runs the JavaScript",
        "Makes the JavaScript run faster",
        "Stops the JavaScript from running",
        "Runs the JavaScript twice",
      ],
      answer: 0,
      explanation: "Without defer, the script can run before your buttons exist, so it can't find them.",
    },
  ],
  "variables-and-data-types": [
    { type: "h2", text: "Your turn: lunch boxes" },
    {
      type: "tryit",
      js: true,
      task: "Press Feed me to change the let box. Then try changing name = \"Ben\" at the bottom: the sealed const box shows a red error in the Console.",
      starter: shell(
        `<p>Name: <b id="name"></b></p>
<p>Snacks eaten: <b id="snacks"></b></p>
<button id="feed">Feed me 🍪</button>`,
        `const name = "Alex";   // sealed box
let snacks = 0;        // box you can swap

document.querySelector("#name").textContent = name;
document.querySelector("#snacks").textContent = snacks;

document.querySelector("#feed").addEventListener("click", function () {
  snacks = snacks + 1;
  document.querySelector("#snacks").textContent = snacks;
  console.log("snacks is now", snacks, "and its type is", typeof snacks);
});

console.log("5" + "5", "vs", 5 + 5);
// name = "Ben";   // remove the // at the start of this line to see the error`,
      ),
    },
    {
      type: "check",
      question: "What is \"5\" + 5?",
      options: ['"55"', "10", "An error", "NaN"],
      answer: 0,
      explanation: "One side is a string (in quotes), so + joins them into the text \"55\".",
    },
  ],
  "conditionals-and-operators": [
    { type: "h2", text: "Your turn: the bouncer" },
    {
      type: "tryit",
      js: true,
      task: "Type an age and press Enter. Then change the rule so you also need a ticket: age >= 18 && hasTicket.",
      starter: shell(
        `<h2>🎟️ ITCamp Party</h2>
<input id="age" type="number" placeholder="Your age">
<button id="check">Can I come in?</button>
<p id="answer"></p>`,
        `const hasTicket = true;

document.querySelector("#check").addEventListener("click", function () {
  const age = Number(document.querySelector("#age").value);
  const answer = document.querySelector("#answer");

  if (age >= 18) {
    answer.textContent = "Welcome in! 🎉";
  } else if (age >= 16) {
    answer.textContent = "Almost! Come back soon.";
  } else {
    answer.textContent = "Sorry, too young. 🍼";
  }
  console.log("age:", age, "| age >= 18 is", age >= 18);
});

document.querySelector("#age").addEventListener("keydown", function (event) {
  if (event.key === "Enter") document.querySelector("#check").click();
});`,
      ),
    },
    {
      type: "check",
      question: 'What does 5 === "5" give?',
      options: ["false", "true", '"55"', "An error"],
      answer: 0,
      explanation: "=== checks the value AND the type. A number and a string are different types.",
    },
  ],
  "loops-and-arrays": [
    { type: "h2", text: "Your turn: the fruit stall" },
    {
      type: "tryit",
      js: true,
      task: "The loop builds the list from the array. Add \"durian\" with fruits.push, and watch the list and the count grow.",
      starter: shell(
        `<h2>🍉 Fruit stall</h2>
<ul id="list"></ul>
<p id="count"></p>`,
        `const fruits = ["apple", "banana", "mango"];
// fruits.push("durian");

const list = document.querySelector("#list");
for (const fruit of fruits) {
  const item = document.createElement("li");
  item.textContent = fruit;
  list.appendChild(item);
}

document.querySelector("#count").textContent = fruits.length + " fruits";
console.log("first fruit:", fruits[0], "| last fruit:", fruits[fruits.length - 1]);

for (let i = 1; i <= 3; i++) {
  console.log("Loop round", i);
}`,
      ),
    },
    {
      type: "check",
      question: 'fruits = ["apple", "banana", "mango"]. What is fruits[3]?',
      options: ["undefined", '"mango"', '"apple"', "An error"],
      answer: 0,
      explanation: "Counting starts at 0, so the last item is fruits[2]. There is nothing at 3.",
    },
  ],
  objects: [
    { type: "h2", text: "Your turn: the class list" },
    {
      type: "tryit",
      js: true,
      task: "Each object is an ID card, and the loop turns them into cards. Add yourself to the members array.",
      starter: shell(
        `<h2>🪪 ITCamp members</h2>
<div id="cards"></div>`,
        `const members = [
  { name: "Aisha", role: "Designer", emoji: "🎨" },
  { name: "Ben", role: "Developer", emoji: "💻" },
  // { name: "Your name", role: "Your role", emoji: "🚀" },
];

const cards = document.querySelector("#cards");
for (const m of members) {
  const card = document.createElement("div");
  card.className = "card";
  card.textContent = m.emoji + " " + m.name + " · " + m.role;
  cards.appendChild(card);
}
console.log(members.length + " members. The first one is", members[0].name);`,
        `  .card { border: 2px solid #6d4aff; padding: 10px 14px; margin: 8px 0; border-radius: 8px; }`,
      ),
    },
    {
      type: "check",
      question: "const student = { name: \"Alex\", age: 20 }; How do you read the name?",
      options: ["student.name", "student[name]", "student(name)", "name.student"],
      answer: 0,
      explanation: "Dot notation reads one label on the ID card: student.name gives \"Alex\".",
    },
  ],
  functions: [
    { type: "h2", text: "Your turn: the vending machine" },
    {
      type: "tryit",
      js: true,
      task: "Pick a drink and press Buy. Then write your own function add(a, b) that returns a + b, and log add(2, 3).",
      starter: shell(
        `<h2>🥤 Vending machine</h2>
<select id="drink">
  <option>100 Plus</option>
  <option>Milo</option>
  <option>Teh Tarik</option>
</select>
<button id="buy">Buy</button>
<p id="tray"></p>`,
        `function order(drink) {        // drink = the coins you put in
  return "Here's your " + drink + "!";   // return = what comes out
}

document.querySelector("#buy").addEventListener("click", function () {
  const choice = document.querySelector("#drink").value;
  const result = order(choice);  // pressing the button = calling it
  document.querySelector("#tray").textContent = result;
  console.log(result);
});

// Write add(a, b) here, then:
// console.log(add(2, 3));`,
      ),
    },
    {
      type: "check",
      question: "A function has no return line. What does calling it give back?",
      options: ["undefined", "0", "An error", "The last line's value"],
      answer: 0,
      explanation: "Without return, the vending machine works but nothing drops out: undefined.",
    },
  ],
  "the-dom": [
    { type: "h2", text: "Your turn: dark mode that really works" },
    {
      type: "tryit",
      js: true,
      task: "Press the button to switch between white and black. Then make the heading say \"Lights off!\" in dark mode.",
      starter: shell(
        `<h1 id="title">Hello, ITCamp!</h1>
<button id="toggle">Toggle dark mode</button>
<p>Clicks: <span id="clicks">0</span></p>`,
        `const toggle = document.querySelector("#toggle");
let clicks = 0;

toggle.addEventListener("click", function () {
  document.body.classList.toggle("dark");
  clicks++;
  document.querySelector("#clicks").textContent = clicks;
  console.log("dark mode on?", document.body.classList.contains("dark"));
});`,
        `  body { transition: background 0.3s, color 0.3s; }
  .dark { background: #111; color: white; }`,
      ),
    },
    {
      type: "check",
      question: 'Your button is <button id="toggle">. Which line finds it?',
      options: [
        'document.querySelector("#toggle")',
        'document.querySelector("toggle")',
        'document.querySelector(".toggle")',
        "document.querySelector(toggle)",
      ],
      answer: 0,
      explanation: "# means id, the same address as in CSS. Without it, the browser looks for a <toggle> tag.",
    },
    { type: "link", href: "/learn/event-lab", text: "Play with more events in the JS Event Lab" },
  ],
};

export const JS_LESSONS: Lesson[] = BASE_LESSONS.map((lesson) => ({
  ...lesson,
  blocks: [...lesson.blocks, ...(EXTRAS[lesson.slug] ?? [])],
}));
