export type QuizQuestion = {
  question: string;
  /** Code shown under the question, if any. */
  code?: string;
  /** The first choice is the right answer; the quiz shuffles them before showing. */
  choices: [string, string, string, string];
  /** Shown after the member answers. */
  explain: string;
};

export type Quiz = { title: string; lesson: number; questions: QuizQuestion[] };

// All three are written from the "Lesson 1 - HTML, CSS, JS" Canva slides.

const HTML: Quiz = {
  title: "HTML",
  lesson: 1,
  questions: [
    {
      question: "What does HTML stand for?",
      choices: ["HyperText Markup Language", "HighText Machine Language", "HyperTool Markup Language", "Home Tag Markup Language"],
      explain: "HTML is HyperText Markup Language. It defines the structure and content of a web page.",
    },
    {
      question: "In this element, what is </p>?",
      code: "<p>This is a paragraph</p>",
      choices: ["The closing tag", "The opening tag", "The content", "An attribute"],
      explain: "<p> is the opening tag, the text is the content and </p> is the closing tag. All together they make the element.",
    },
    {
      question: "What does <!DOCTYPE html> at the top of the file do?",
      choices: [
        "Declares the document as HTML5",
        "Sets the page's language to English",
        "Adds a title to the browser tab",
        "Links the CSS file",
      ],
      explain: "<!DOCTYPE html> tells the browser this is an HTML5 document. lang=\"en\" is what sets the language.",
    },
    {
      question: "Which part of the HTML skeleton holds the content you see on the page?",
      choices: ["<body>", "<head>", "<title>", "<!DOCTYPE html>"],
      explain: "<body> holds the visible content. <head> holds information about the page that isn't shown on it.",
    },
    {
      question: "HTML has six heading tags. Which one is the largest?",
      choices: ["<h1>", "<h6>", "<head>", "<heading>"],
      explain: "Headings go from <h1> (largest) to <h6> (smallest).",
    },
    {
      question: "Which tag adds a line break and has no closing tag?",
      choices: ["<br>", "<p>", "<hr></hr>", "<break></break>"],
      explain: "<br> inserts a line break without starting a new paragraph. It's self-closing, so there's no </br>.",
    },
    {
      question: "Which attribute of <img> gives the text that shows if the image can't load?",
      code: '<img src="cat.png" ___="A sleepy cat">',
      choices: ["alt", "src", "href", "title"],
      explain: "alt is the descriptive text shown when the image can't be loaded. src is the image's path.",
    },
    {
      question: "Which attribute of <a> sets where the link goes?",
      code: '<a ___="https://sim.edu.sg">SIM</a>',
      choices: ["href", "src", "alt", "link"],
      explain: "href (hypertext reference) defines the link's destination.",
    },
    {
      question: "Which is true about the <div> tag?",
      choices: [
        "It's a box that groups elements, with no look or meaning of its own",
        "It's a semantic tag that tells search engines what the content is",
        "It always shows a border around its content",
        "It can only hold text",
      ],
      explain: "A div groups other elements together. It has no look and no meaning by itself, so you style it with CSS.",
    },
    {
      question: "Why use semantic tags like <header> and <nav> instead of only <div>?",
      choices: [
        "They're meaningful, accessible and SEO-friendly",
        "They make the page load faster",
        "They add colours to the page automatically",
        "Browsers can't show a <div>",
      ],
      explain: "Semantic tags say what the content is, which helps screen readers and search engines. A div says nothing.",
    },
  ],
};

const CSS: Quiz = {
  title: "CSS",
  lesson: 1,
  questions: [
    {
      question: "What does CSS stand for?",
      choices: ["Cascading Style Sheets", "Creative Style System", "Computer Styled Sections", "Colourful Style Sheets"],
      explain: "CSS is Cascading Style Sheets. It describes how HTML elements look.",
    },
    {
      question: "In this rule, what is h1?",
      code: "h1 {\n  color: red;\n}",
      choices: ["The selector", "The property", "The value", "The declaration"],
      explain: "The selector says who to style. Here every <h1> gets styled.",
    },
    {
      question: "In this rule, what is color?",
      code: "h1 {\n  color: red;\n}",
      choices: ["The property", "The selector", "The value", "The element"],
      explain: "color is the property and red is its value. Together they say what to do.",
    },
    {
      question: "Which one is inline CSS?",
      choices: [
        '<h1 style="color: red;">Hi</h1>',
        "<style> h1 { color: red; } </style>",
        '<link rel="stylesheet" href="style.css">',
        "h1 { color: red; } in style.css",
      ],
      explain: "Inline CSS puts the properties and values directly inside the element with the style attribute.",
    },
    {
      question: "Where does internal CSS go?",
      choices: [
        "Inside a <style> tag in the <head>",
        "Inside a <style> tag at the very end of the file, after </html>",
        "In a separate .css file",
        "In the element's style attribute",
      ],
      explain: "Internal CSS is written in a <style> tag wrapped in the <head>.",
    },
    {
      question: "What is external CSS?",
      choices: [
        "Styles written in a separate .css file",
        "Styles copied from another website",
        "Styles written inside the element",
        "Styles the browser adds by default",
      ],
      explain: "External CSS keeps the selectors in their own .css file that the HTML links to.",
    },
    {
      question: "Which selector targets only one specific element?",
      choices: ["#title (ID)", ".title (class)", "h1 (element)", "* (universal)"],
      explain: "An ID belongs to only one element, so an ID selector targets just that one.",
    },
    {
      question: "What does this selector target?",
      code: ".card {\n  padding: 16px;\n}",
      choices: [
        'Every element with class="card"',
        'The one element with id="card"',
        "Every <card> tag",
        "Every element on the page",
      ],
      explain: "A dot means a class selector. It styles every element with that class name.",
    },
    {
      question: "What does the universal selector * target?",
      choices: ["All elements on the page", "Only the <body>", "Only elements with a class", "Only the first element"],
      explain: "The universal selector * targets every element on the page.",
    },
    {
      question: "Several rules give the same element different colours. Which one wins?",
      choices: ["Inline CSS", "An ID selector", "A class selector", "An element selector"],
      explain: "Specificity from strongest to weakest: inline CSS, ID, class, element, then universal.",
    },
  ],
};

const JS: Quiz = {
  title: "JavaScript",
  lesson: 1,
  questions: [
    {
      question: "What does this give?",
      code: '"5" + "5"',
      choices: ['"55"', "10", '"10"', "An error"],
      explain: 'Both are strings (words in quotes), so + joins them into "55". 5 + 5 with numbers gives 10.',
    },
    {
      question: "What happens when this code runs?",
      code: "const age = 20;\nage = 21;",
      choices: ["An error, because a const can't be given a new value", "age becomes 21", "age stays 20 with no error", "age becomes 41"],
      explain: "const is a sealed box: once set it can't be replaced. Use let when the value must change.",
    },
    {
      question: "Which keyword should you start with when making a variable?",
      choices: ["const, and only use let if the value must change", "var, because it's the default", "let, for everything", "No keyword is needed"],
      explain: "Best practice is const first. var is old and leaky.",
    },
    {
      question: "What's the difference between === and ==?",
      choices: [
        "=== also checks the data types match; == converts types first",
        "== also checks the data types match; === converts types first",
        "=== sets a value; == compares values",
        "There's no difference",
      ],
      explain: '=== strictly matches data types, so 5 === "5" is false. == converts types if they mismatch.',
    },
    {
      question: "How many times does this loop print?",
      code: 'for (let i = 1; i <= 5; i++) {\n  console.log("Student " + i);\n}',
      choices: ["5", "4", "6", "It never stops"],
      explain: "i starts at 1 and goes up by 1 while i <= 5, so it prints Student 1 to Student 5.",
    },
    {
      question: "What is fruits.length?",
      code: 'const fruits = ["apple", "banana", "mango"];',
      choices: ["3", "2", '"mango"', "5"],
      explain: "length is how many items are in the array: three.",
    },
    {
      question: "What does student.name give?",
      code: 'const student = {\n  name: "Alex",\n  age: 20\n};',
      choices: ['"Alex"', '"name"', "20", "undefined"],
      explain: "An object stores key-value pairs. name is the key and \"Alex\" is its value.",
    },
    {
      question: "What does this print?",
      code: 'function order(drink) {\n  return "Here\'s your drink " + drink + "!";\n}\nconsole.log(order("100 Plus"));',
      choices: ['Here\'s your drink 100 Plus!', "Here's your drink drink!", "100 Plus", "Nothing"],
      explain: '"100 Plus" goes in as drink, like coins in a vending machine, and the function returns the full sentence.',
    },
    {
      question: "What does this line select?",
      code: 'document.querySelector("#title")',
      choices: ['The element with id="title"', 'Every element with class="title"', "Every <title> tag", "The page's title in the browser tab"],
      explain: "querySelector uses the same addresses as CSS. #title means the element with that ID.",
    },
    {
      question: "What does this code do?",
      code: 'btn.addEventListener("click", function () {\n  title.textContent = "You clicked me!";\n});',
      choices: [
        "Changes the title's text whenever the button is clicked",
        "Clicks the button straight away",
        "Changes the title's text once, when the page loads",
        "Adds a new button to the page",
      ],
      explain: "addEventListener listens for the click and runs the function each time it happens.",
    },
  ],
};

/** Quizzes by topic slug, matching Topic.slug in topics.ts. */
export const QUIZZES: Record<string, Quiz> = { html: HTML, css: CSS, javascript: JS };
