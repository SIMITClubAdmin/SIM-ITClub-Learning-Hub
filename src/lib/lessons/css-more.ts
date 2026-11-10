import { page, type Lesson } from "./types";

// Written from last year's "Lesson 1: Intro to Web, HTML, CSS" Canva slides (ITCamp 2025).
// "extra" blocks go beyond the slides.

const BOX_PREVIEW_CSS = `.box{width:200px;padding:20px;border:5px solid #6d4aff;margin:20px;background:#e6f1ff}`;

const LINKTREE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Links</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <main class="profile">
        <img class="avatar" src="profile-pic.png" alt="My profile photo">
        <h1>Your Name</h1>
        <p class="bio">IT Club member · loves coding</p>

        <a class="button" href="https://www.instagram.com" target="_blank">Instagram</a>
        <a class="button" href="https://www.linkedin.com" target="_blank">LinkedIn</a>
        <a class="button" href="https://github.com" target="_blank">GitHub</a>
    </main>

    <footer>
        <p>Made at ITCamp</p>
    </footer>
</body>
</html>`;

const LINKTREE_CSS = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background-color: #f3e8ff;
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 40px 16px;
}

.avatar {
    width: 120px;
    height: 120px;
    border: 4px solid #6d4aff;
    border-radius: 50%;
}

h1 {
    font-size: 28px;
    margin-top: 12px;
}

.bio {
    color: #555;
    margin-bottom: 24px;
}

.button {
    display: block;
    max-width: 360px;
    margin: 0 auto 12px;
    padding: 14px;
    background-color: #6d4aff;
    color: white;
    text-decoration: none;
    border-radius: 12px;
}

footer {
    margin-top: 32px;
    font-size: 14px;
    color: #777;
}`;

export const CSS_MORE_LESSONS: Lesson[] = [
  {
    slug: "colours-and-text",
    title: "Colours and text",
    summary: "Style colours, fonts, sizes, boldness and alignment.",
    minutes: 10,
    blocks: [
      { type: "h2", text: "Colours" },
      { type: "p", text: "`color` changes the text colour and `background-color` changes the background. You can write a colour in four ways:" },
      {
        type: "terms",
        items: [
          ["red", "A named colour: red, blue, green, lightblue…"],
          ["#FF5733", "Hexadecimal: # then 6 characters for red, green and blue."],
          ["rgb(255, 99, 71)", "RGB: how much red, green and blue, from 0 to 255."],
          ["hsl(9, 100%, 64%)", "HSL: hue (0–360), saturation and lightness."],
        ],
      },
      {
        type: "code",
        label: "style.css",
        code: `h1 {
    color: white;
    background-color: #6d4aff;
}

p {
    color: rgb(255, 99, 71);
}`,
        preview: page("<h1>Hello ITCamp!</h1><p>Tomato-coloured text.</p>", "h1{color:white;background-color:#6d4aff}p{color:rgb(255,99,71)}"),
        previewHeight: 120,
      },
      { type: "h2", text: "Typography" },
      {
        type: "terms",
        items: [
          ["font-family", "Controls the font."],
          ["font-size", "Controls the text size."],
          ["font-weight", "The boldness of the text: 300 is light, 400 normal, 700 bold."],
          ["text-align", "Aligns text: left, center or right."],
        ],
      },
      {
        type: "code",
        label: "style.css",
        code: `p {
    font-family: Georgia, serif;
    font-size: 20px;
    font-weight: 700;
    text-align: center;
}`,
        preview: page("<p>Styled with font-family, font-size, font-weight and text-align.</p>", "p{font-family:Georgia,serif;font-size:20px;font-weight:700;text-align:center}"),
        previewHeight: 90,
      },
      {
        type: "extra",
        title: "Pick colours and fonts safely",
        blocks: [
          {
            type: "list",
            items: [
              "List a backup font after a comma, like `Georgia, serif`. If the first font is missing, the browser uses the next.",
              "Check your text is easy to read on its background: dark text on light, or light text on dark.",
              "In VS Code, hover over a colour value to open a colour picker.",
            ],
          },
        ],
      },
      { type: "link", href: "/learn/playground#basic-styling", text: "Try colours and fonts in the CSS Playground" },
    ],
  },
  {
    slug: "box-model",
    title: "The box model",
    summary: "Every element is a box: content, padding, border and margin.",
    minutes: 12,
    blocks: [
      { type: "h2", text: "Every HTML element is a box" },
      { type: "p", text: "Think of a birthday gift. The content is the gift, padding is the bubble wrap, the border is the box, and the margin is the space between this gift and the next one." },
      {
        type: "terms",
        items: [
          ["Content", "The HTML element itself: text, an image…"],
          ["Padding", "Space between the content and the border."],
          ["Border", "Goes around the padding and content."],
          ["Margin", "Space between the border and other elements."],
        ],
      },
      {
        type: "code",
        label: "style.css",
        code: `.box {
    width: 200px;
    padding: 20px;
    border: 5px solid #6d4aff;
    margin: 20px;
}`,
        preview: page('<div class="box">I am the content</div><div class="box">Another box</div>', BOX_PREVIEW_CSS),
        previewHeight: 230,
      },
      { type: "h2", text: "Box sizing" },
      {
        type: "terms",
        items: [
          ["content-box", "The default. `width` is only the content, so padding and border make the box bigger than you set."],
          ["border-box", "Standard practice. `width` includes the padding and border, so the box is exactly the size you set."],
        ],
      },
      {
        type: "code",
        label: "style.css",
        code: `* {
    box-sizing: border-box;
}`,
      },
      { type: "p", text: "Why border-box? Sizing is predictable, layouts are more flexible, and it works better on different screen sizes. content-box can make layouts rigid and overflow." },
      {
        type: "extra",
        title: "Do the maths",
        blocks: [
          { type: "p", text: "With `content-box`, the box above is 200 + 20 + 20 (padding) + 5 + 5 (border) = 250px wide. With `border-box`, it's exactly 200px." },
          { type: "p", text: "Padding and margin can be set per side: `padding-top`, `margin-left`… or all four at once, in the order top, right, bottom, left: `margin: 10px 20px 10px 20px;`" },
        ],
      },
      { type: "link", href: "/learn/playground#box-model", text: "Try the box model in the CSS Playground" },
    ],
  },
  {
    slug: "sizing-and-display",
    title: "Width, rounded corners and display",
    summary: "Size boxes, round their corners, and choose block or inline.",
    minutes: 10,
    blocks: [
      { type: "h2", text: "Width and max-width" },
      {
        type: "terms",
        items: [
          ["width", "A fixed width. On a small phone screen a wide box can overflow."],
          ["max-width", "Grows up to this width, but shrinks on smaller screens. Great for buttons and cards."],
          ["height", "A fixed height. Usually best left alone so the box fits its content."],
        ],
      },
      {
        type: "code",
        label: "style.css",
        code: `.card {
    max-width: 360px;
    padding: 16px;
    background-color: lightblue;
}`,
        preview: page('<div class="card">I am never wider than 360px.</div>', ".card{max-width:360px;padding:16px;background-color:lightblue}"),
        previewHeight: 80,
      },
      { type: "h2", text: "Border radius" },
      { type: "p", text: "`border-radius` rounds the corners. `50%` on a square makes a circle, which is perfect for profile pictures." },
      {
        type: "code",
        label: "style.css",
        code: `.rounded {
    border-radius: 12px;
}

.circle {
    width: 100px;
    height: 100px;
    border-radius: 50%;
}`,
        preview: page('<div class="rounded">Rounded</div><div class="circle"></div>', ".rounded{border-radius:12px;background:#6d4aff;color:white;padding:12px;width:200px;margin-bottom:12px}.circle{width:100px;height:100px;border-radius:50%;background:#4fd8eb}"),
        previewHeight: 180,
      },
      { type: "h2", text: "Block vs inline-block vs inline" },
      {
        type: "terms",
        items: [
          ["block", "Starts on a new line and takes the full width. Like `<div>`, `<p>` and `<h1>`."],
          ["inline", "Sits inside a line of text and ignores width and height. Like `<a>` and `<span>`."],
          ["inline-block", "Sits in a line, but you can set its width, height and padding."],
        ],
      },
      {
        type: "code",
        label: "style.css",
        code: `a.button {
    display: block;
    padding: 12px;
    background-color: #6d4aff;
    color: white;
    text-align: center;
}`,
        preview: page('<a class="button" href="#">I am a full-width button</a><p>An <a href="#">inline link</a> stays in the sentence.</p>', "a.button{display:block;padding:12px;background-color:#6d4aff;color:white;text-align:center;text-decoration:none}"),
        previewHeight: 110,
      },
      { type: "link", href: "/learn/playground#styling-boxes", text: "Try borders, corners and shadows in the CSS Playground" },
    ],
  },
  {
    slug: "linktree-project",
    title: "Mini project: Linktree page",
    summary: "Put it all together: a profile page with your links.",
    minutes: 25,
    blocks: [
      { type: "h2", text: "The task" },
      {
        type: "list",
        items: [
          "Create a separate CSS file and link it to your HTML.",
          "Give the page a background colour of your choice.",
          "Centre-align the content.",
          "Style the profile picture: size, border and border-radius.",
          "Style your headings.",
          "Style the link buttons with `display: block`.",
          "Add a footer.",
        ],
      },
      { type: "h2", text: "Starter code" },
      { type: "p", text: "Copy both files into the same folder, add a photo called `profile-pic.png`, then make it your own." },
      { type: "code", label: "index.html", code: LINKTREE_HTML },
      {
        type: "code",
        label: "style.css",
        code: LINKTREE_CSS,
        preview: `<!DOCTYPE html><html><head><style>${LINKTREE_CSS.replace(".avatar {", ".avatar { background:#c9b49a; display:inline-block;")}</style></head><body><main class="profile"><div class="avatar"></div><h1>Your Name</h1><p class="bio">IT Club member · loves coding</p><a class="button" href="#">Instagram</a><a class="button" href="#">LinkedIn</a><a class="button" href="#">GitHub</a></main><footer><p>Made at ITCamp</p></footer></body></html>`,
        previewHeight: 520,
      },
      {
        type: "extra",
        title: "Level up",
        blocks: [
          {
            type: "list",
            items: [
              "Add a hover effect: `.button:hover { background-color: #4b2fd1; }`",
              "Add a shadow to the buttons: `box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);`",
              "Use the JavaScript dark mode toggle from the DOM lesson.",
            ],
          },
        ],
      },
    ],
  },
];
