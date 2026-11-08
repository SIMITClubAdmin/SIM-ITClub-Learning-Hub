export type QuizQuestion = {
  /** Which part of the lesson the question comes from. */
  topic: "The web" | "HTML" | "CSS" | "JavaScript";
  question: string;
  /** Code shown under the question, if any. */
  code?: string;
  /** The first choice is the right answer; the quiz shuffles them before showing. */
  choices: [string, string, string, string];
  /** Shown after the member answers. */
  explain: string;
};

export type Quiz = { title: string; lesson: number; questions: QuizQuestion[] };

// Written from the "Lesson 1 - HTML, CSS, JS" Canva slides.
const LESSON_1: Quiz = {
  title: "HTML, CSS and JavaScript",
  lesson: 1,
  questions: [
    {
      topic: "The web",
      question: "A webpage has a skeleton, a skin and a brain. Which one is CSS?",
      choices: ["The skin: how the page looks", "The skeleton: the structure", "The brain: the logic", "None of them"],
      explain: "HTML is the skeleton (structure), CSS is the skin (appearance) and JavaScript is the brain (logic).",
    },
    {
      topic: "The web",
      question: "You type sim.edu.sg and press Enter. What does the DNS do?",
      choices: [
        "Turns the website address into an IP address",
        "Sends the HTML files back to the browser",
        "Styles the page before it loads",
        "Runs the page's JavaScript",
      ],
      explain: "The DNS translates the URL into an IP address. The browser then sends its request to the server at that address.",
    },
    {
      topic: "HTML",
      question: "What does HTML stand for?",
      choices: ["HyperText Markup Language", "HighText Machine Language", "HyperTool Markup Language", "Home Tag Markup Language"],
      explain: "HTML is HyperText Markup Language. It defines the structure and content of a web page.",
    },
    {
      topic: "HTML",
      question: "Which tag adds a line break and has no closing tag?",
      choices: ["<br>", "<p>", "<hr></hr>", "<break></break>"],
      explain: "<br> inserts a line break without starting a new paragraph. It's self-closing, so there's no </br>.",
    },
    {
      topic: "HTML",
      question: "Which attribute of <img> gives the text that shows if the image can't load?",
      code: '<img src="cat.png" ___="A sleepy cat">',
      choices: ["alt", "src", "href", "title"],
      explain: "alt is the descriptive text shown when the image can't be loaded. src is the image's path.",
    },
    {
      topic: "HTML",
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
      topic: "CSS",
      question: "In this rule, what is color?",
      code: "h1 {\n  color: red;\n}",
      choices: ["The property", "The selector", "The value", "The element"],
      explain: "h1 is the selector (who to style), color is the property and red is the value (what to do).",
    },
    {
      topic: "CSS",
      question: "Two rules give the same element different colours. Which selector wins?",
      choices: ["An ID selector (#title)", "A class selector (.title)", "An element selector (h1)", "The universal selector (*)"],
      explain: "Specificity from strongest to weakest: inline CSS, ID, class, element, then universal.",
    },
    {
      topic: "JavaScript",
      question: "What does this give?",
      code: '"5" + "5"',
      choices: ['"55"', "10", '"10"', "An error"],
      explain: 'Both are strings (words in quotes), so + joins them into "55". 5 + 5 with numbers gives 10.',
    },
    {
      topic: "JavaScript",
      question: "What happens when this code runs?",
      code: "const age = 20;\nage = 21;",
      choices: ["An error, because a const can't be given a new value", "age becomes 21", "age stays 20 with no error", "age becomes 41"],
      explain: "const is a sealed box: once set it can't be replaced. Use let when the value must change.",
    },
  ],
};

/** Quizzes by lesson slug, matching CourseModule.slug in topics.ts. */
export const QUIZZES: Record<string, Quiz> = { "web-basics": LESSON_1 };
