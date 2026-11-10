import { page, type Lesson } from "./types";

// Written from the "Lesson 1 - HTML, CSS, JS" Canva slides. "extra" blocks go beyond the slides.

const BOILERPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

</body>
</html>`;

const HEADINGS = `<h1>This is heading 1</h1>
<h2>This is heading 2</h2>
<h3>This is heading 3</h3>
<h4>This is heading 4</h4>
<h5>This is heading 5</h5>
<h6>This is heading 6</h6>`;

const DIV_CARD = `<div class="card">
    <img src="profile-pic.png" alt="Profile photo"
    width="200" height="200">
    <h2>Jeff</h2>
    <p>IT Club member</p>
</div>`;

const CARD_CSS = `.card {
  background-color: lightblue;
  width: 250px;
  padding: 16px;
}`;

const CARD_PREVIEW_BODY = `<div class="card"><div style="width:200px;height:200px;background:#c9b49a;display:flex;align-items:center;justify-content:center;font:14px sans-serif;color:#333">profile-pic.png</div><h2>Jeff</h2><p>IT Club member</p></div><p>This is outside of div element</p>`;

const SEMANTIC_PAGE = `<body>
    <header>
        <h1>ITCamp</h1>
        <nav>
            <a href="index.html">Home</a>
            <a href="about.html">About</a>
        </nav>
    </header>

    <main>
        <article>
            <h2>My first website</h2>
            <p>Today I learned HTML, CSS and JavaScript.</p>
        </article>
    </main>

    <footer>
        <p>Made by an ITCamp member</p>
    </footer>
</body>`;

export const HTML_LESSONS: Lesson[] = [
  {
    slug: "how-the-web-works",
    title: "How the web works",
    summary: "Websites, webpages, and what happens when you type a URL and press Enter.",
    minutes: 5,
    blocks: [
      { type: "h2", text: "Website vs webpage" },
      {
        type: "terms",
        items: [
          ["Website", "A collection of related webpages. Example: `sim.edu.sg`."],
          ["Webpage", "One page inside a website. Example: the About SIM page in `sim.edu.sg`."],
        ],
      },
      { type: "h2", text: "Inside a webpage" },
      { type: "p", text: "Every webpage is made of three languages. Think of a webpage like a person:" },
      {
        type: "cards",
        items: [
          { title: "HTML", tag: "Skeleton", text: "The structure. What is on the page." },
          { title: "CSS", tag: "Skin", text: "The appearance. How it looks." },
          { title: "JavaScript", tag: "Brain", text: "The logic. What it does." },
        ],
      },
      { type: "h2", text: "How do we get a webpage?" },
      {
        type: "steps",
        items: [
          "You type the website URL into the browser and press Enter.",
          "The DNS translates the URL (like `sim.edu.sg`) into an IP address (like `208.65.153.238`).",
          "The browser sends a request to the server at that IP address.",
          "The server receives the request and processes it.",
          "The server sends the files (HTML, CSS, JavaScript) back to the browser, which shows the page.",
        ],
      },
      { type: "h2", text: "Think of it like a restaurant" },
      {
        type: "terms",
        items: [
          ["You (the browser)", "Order food: you ask for a webpage."],
          ["The waiter (the internet)", "Carries your order to the kitchen and brings the food back."],
          ["The kitchen (the server)", "Prepares the food: the HTML, CSS and JavaScript files."],
        ],
      },
      { type: "h2", text: "How the browser shows the page" },
      {
        type: "steps",
        items: [
          "DNS lookup: the browser asks where `google.com` is, and gets an IP address like `142.250.80.46`.",
          "HTTP request: the browser asks that server, \"Hey server, give me the homepage!\"",
          "Server responds: it sends back the HTML, CSS and JS files.",
          "Browser renders: it reads the HTML (skeleton), applies the CSS (styling), then runs the JS (interactivity).",
        ],
      },
      { type: "h2", text: "Frontend and backend" },
      {
        type: "terms",
        items: [
          ["Frontend (client)", "What the user sees and interacts with. This is what ITCamp teaches: HTML, CSS and JavaScript."],
          ["Backend (server)", "App logic, databases and web services, plus third-party services like payments, logins and maps."],
        ],
      },
      {
        type: "extra",
        title: "What are a URL, DNS and an IP address?",
        blocks: [
          {
            type: "list",
            items: [
              "A URL is the address you type, like `https://www.sim.edu.sg`. It is easy for people to remember.",
              "An IP address is the number computers use to find each other on the internet, like a phone number.",
              "The DNS (Domain Name System) is the internet's phone book. It looks up the URL and finds its IP address.",
              "A server is a computer that is always on, storing website files and sending them to anyone who asks.",
            ],
          },
        ],
      },
      {
        type: "check",
        question: "Which part of a webpage is the 'skin' that controls how it looks?",
        options: ["HTML", "CSS", "JavaScript"],
        answer: 1,
        explanation: "CSS controls the appearance: colours, sizes, positions and fonts.",
      },
    ],
  },
  {
    slug: "what-is-html",
    title: "What is HTML?",
    summary: "HyperText Markup Language: the structure and content of a web page.",
    minutes: 10,
    blocks: [
      {
        type: "p",
        text: "HTML stands for HyperText Markup Language. It defines the structure and content of a web page, and is made of a series of elements. Elements are the building blocks of a page.",
      },
      { type: "h2", text: "Anatomy of an element" },
      { type: "p", text: "Most elements have an opening tag, some content, and a closing tag. All three together make the element." },
      {
        type: "code",
        label: "element",
        code: "<p>This is a paragraph</p>",
        preview: page("<p>This is a paragraph</p>"),
        previewHeight: 70,
      },
      {
        type: "terms",
        items: [
          ["<p>", "The opening tag. It starts the element."],
          ["This is a paragraph", "The content. What shows on the page."],
          ["</p>", "The closing tag. It has a `/` and ends the element."],
        ],
      },
      { type: "h2", text: "Make your first HTML file" },
      {
        type: "steps",
        items: [
          "Make a folder on your desktop.",
          "Open that folder in VS Code (File → Open Folder).",
          "Create a new file called `index.html`.",
          "Type `html:5` and press Enter. VS Code writes the skeleton below for you.",
        ],
      },
      { type: "code", label: "index.html", code: BOILERPLATE },
      {
        type: "terms",
        items: [
          ["<!DOCTYPE html>", "Declares the document as HTML5."],
          ['<html lang="en">', "Says the main language of the page's content is English."],
          ["<head>", "Holds information about the page (metadata). It is not shown on the page itself."],
          ["<body>", "Holds the visible content of the page. Everything you want people to see goes here."],
        ],
      },
      {
        type: "extra",
        title: "What do the <meta> lines and <title> do?",
        blocks: [
          {
            type: "list",
            items: [
              '`<meta charset="UTF-8">` lets the page show any character, like emoji and accented letters.',
              '`<meta name="viewport" ...>` makes the page fit phone screens instead of looking zoomed out.',
              '`<meta http-equiv="X-UA-Compatible" ...>` was for old Internet Explorer. It is safe to leave or delete.',
              "`<title>` is the text on the browser tab. Change `Document` to your page's name.",
            ],
          },
          {
            type: "p",
            text: "To see your page, right-click `index.html` in VS Code and choose Open with Live Server. The page reloads every time you save.",
          },
        ],
      },
      {
        type: "check",
        question: "You add <h1>Hello ITCamp!</h1>. Should it go in the head or the body?",
        options: ["The head", "The body"],
        answer: 1,
        explanation: "The body holds everything people see on the page.",
      },
      {
        type: "tryit",
        task: "Change the heading to your own name, then add a paragraph below it.",
        starter: `<!DOCTYPE html>
<html lang="en">
<head>
    <title>My Page</title>
</head>
<body>
    <h1>Hello ITCamp!</h1>
</body>
</html>`,
      },
    ],
  },
  {
    slug: "headings-paragraphs-line-breaks",
    title: "Headings, paragraphs and line breaks",
    summary: "The tags for titles and text: <h1> to <h6>, <p> and <br>.",
    minutes: 8,
    blocks: [
      { type: "h2", text: "Headings" },
      { type: "p", text: "HTML has six heading tags, from `<h1>` (largest) to `<h6>` (smallest)." },
      { type: "code", label: "headings", code: HEADINGS, preview: page(HEADINGS), previewHeight: 270 },
      { type: "h2", text: "Paragraph" },
      { type: "p", text: "Text is defined using the `<p>` tag." },
      {
        type: "code",
        label: "paragraph",
        code: "<p>This is a paragraph</p>",
        preview: page("<p>This is a paragraph</p>"),
        previewHeight: 70,
      },
      { type: "h2", text: "Line break" },
      {
        type: "p",
        text: "`<br>` inserts a line break within text, without starting a new paragraph. It is a self-closing tag: there is no `</br>`.",
      },
      {
        type: "code",
        label: "without <br>",
        code: "<p>Line 1 Line 2</p>",
        preview: page("<p>Line 1 Line 2</p>"),
        previewHeight: 70,
      },
      {
        type: "code",
        label: "with <br>",
        code: "<p>Line 1 <br> Line 2</p>",
        preview: page("<p>Line 1 <br> Line 2</p>"),
        previewHeight: 90,
      },
      {
        type: "extra",
        title: "Tips for headings and text",
        blocks: [
          {
            type: "list",
            items: [
              "Use one `<h1>` per page for its main title, then `<h2>` for sections and `<h3>` inside those.",
              "Pick a heading for its meaning, not its size. You can change the size later with CSS.",
              "Pressing Enter in your code does not make a new line on the page. The browser ignores extra spaces and new lines, so use `<p>` or `<br>`.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "images-and-links",
    title: "Images and links",
    summary: "Show pictures with <img> and link to other pages with <a>.",
    minutes: 10,
    blocks: [
      { type: "h2", text: "Image" },
      { type: "p", text: "The `<img>` tag embeds an image. Remember: there is no closing tag." },
      { type: "code", label: "image", code: '<img src="image.png" alt="sample image">' },
      {
        type: "terms",
        items: [
          ["src", "The URL or file path to the image."],
          ["alt", "Descriptive text that appears if the image cannot be loaded. Screen readers read it out too."],
        ],
      },
      { type: "h2", text: "Anchor (hyperlink)" },
      { type: "p", text: "The `<a>` tag links to other pages or sites." },
      {
        type: "code",
        label: "link",
        code: '<a href="https://www.sim.edu.sg" target="_blank">Click here to visit SIM</a>',
        preview: page('<a href="https://www.sim.edu.sg" target="_blank">Click here to visit SIM</a>'),
        previewHeight: 60,
      },
      {
        type: "terms",
        items: [
          ["href", "Hypertext reference: where the link goes (the URL)."],
          ['target="_blank"', "Opens the link in a new tab."],
          ["Click here to visit SIM", "The text people click on."],
        ],
      },
      {
        type: "extra",
        title: "File paths: where is my image?",
        blocks: [
          {
            type: "p",
            text: "If `src` is just a file name, the browser looks in the same folder as your HTML file. If the image is in a folder, include the folder name.",
          },
          {
            type: "code",
            label: "file paths",
            code: `<!-- image.png is next to index.html -->
<img src="image.png" alt="My photo">

<!-- image.png is inside a folder called images -->
<img src="images/image.png" alt="My photo">

<!-- link to another page in the same folder -->
<a href="about.html">About me</a>`,
          },
          {
            type: "p",
            text: "Image not showing? Check the spelling and capital letters of the file name. `Image.PNG` and `image.png` are different files.",
          },
        ],
      },
    ],
  },
  {
    slug: "comments",
    title: "Comments",
    summary: "Leave notes in your code that the browser ignores.",
    minutes: 3,
    blocks: [
      { type: "h2", text: "Writing a comment" },
      { type: "p", text: "Comments in HTML are written like this. The browser ignores them, so they never show on the page." },
      { type: "code", label: "comment", code: "<!-- This is a comment -->" },
      { type: "p", text: "Leaving notes in your code is best practice. It helps you, and your teammates, understand it later." },
      { type: "h2", text: "Shortcut" },
      { type: "p", text: "In VS Code, select some lines and press `Cmd + /` (Mac) or `Ctrl + /` (Windows) to turn them into a comment, or back again." },
      {
        type: "extra",
        title: "Hide code while you test",
        blocks: [
          { type: "p", text: "Commenting out code is a quick way to hide something while you test, without deleting it." },
          {
            type: "code",
            label: "commenting out",
            code: `<p>This shows on the page.</p>
<!-- <p>This is hidden for now.</p> -->`,
            preview: page(`<p>This shows on the page.</p>\n<!-- <p>This is hidden for now.</p> -->`),
            previewHeight: 60,
          },
        ],
      },
    ],
  },
  {
    slug: "div",
    title: "div: the box tag",
    summary: "The most used HTML tag: a box that groups other elements.",
    minutes: 8,
    blocks: [
      { type: "h2", text: "The most used HTML tag" },
      {
        type: "list",
        items: [
          "Think of `<div>` as a box. It's a box in a box, in a box, in another box…",
          "It groups other elements together.",
          "It has no look and no meaning by itself.",
          "Use CSS to style it.",
        ],
      },
      { type: "h2", text: "Before CSS" },
      { type: "p", text: "Here a div groups a photo, a name and a role into one card. Without CSS, it looks like nothing special." },
      {
        type: "code",
        label: "index.html",
        code: DIV_CARD,
        preview: page(CARD_PREVIEW_BODY),
        previewHeight: 360,
      },
      { type: "h2", text: "After CSS" },
      { type: "p", text: "Because everything is inside one div, a few lines of CSS style the whole card at once." },
      {
        type: "code",
        label: "style.css",
        code: CARD_CSS,
        preview: page(CARD_PREVIEW_BODY, CARD_CSS),
        previewHeight: 380,
      },
      {
        type: "extra",
        title: "div vs span",
        blocks: [
          {
            type: "p",
            text: "`<div>` is a block: it starts on a new line and takes the full width. `<span>` is an inline box: it wraps a few words inside a line, so you can style just those words.",
          },
          {
            type: "code",
            label: "span",
            code: '<p>I love <span style="color: red;">coding</span> at ITCamp.</p>',
            preview: page('<p>I love <span style="color: red;">coding</span> at ITCamp.</p>'),
            previewHeight: 60,
          },
        ],
      },
    ],
  },
  {
    slug: "semantic-tags",
    title: "Semantic tags",
    summary: "Tags that say what their content is: header, nav, main, footer and more.",
    minutes: 8,
    blocks: [
      {
        type: "p",
        text: "A page built only from `<div>` boxes works, but nobody can tell what each box is for. Semantic tags are boxes with a meaning.",
      },
      { type: "h2", text: "Semantic vs non-semantic" },
      {
        type: "terms",
        items: [
          ["Non-semantic (<div>, <span>)", "Meaningless, inaccessible and SEO-unfriendly."],
          ["Semantic (<header>, <nav>, <main>…)", "Meaningful, accessible and SEO-friendly."],
        ],
      },
      { type: "h2", text: "Common semantic tags" },
      {
        type: "terms",
        items: [
          ["<header>", "The top of the page: logo, title, and often the nav."],
          ["<nav>", "The main links to move around the site."],
          ["<main>", "The main content of the page. Use it once per page."],
          ["<article>", "A piece that makes sense on its own, like a blog post."],
          ["<section>", "A group of related content with its own heading."],
          ["<aside>", "Side content, like a sidebar or related links."],
          ["<figure>", "An image or diagram, often with a caption."],
          ["<footer>", "The bottom of the page: contact info, copyright."],
        ],
      },
      {
        type: "extra",
        title: "A page built with semantic tags",
        blocks: [
          { type: "p", text: "Copy this into the `<body>` of your file as a starting layout." },
          {
            type: "code",
            label: "index.html",
            code: SEMANTIC_PAGE,
            preview: page(SEMANTIC_PAGE.replace(/<\/?body>/g, ""), "nav a{margin-right:12px}"),
            previewHeight: 300,
          },
          {
            type: "p",
            text: "SEO means search engine optimisation. Search engines like Google read these tags to understand your page, and screen readers use them to let people jump straight to the main content.",
          },
        ],
      },
    ],
  },
];
