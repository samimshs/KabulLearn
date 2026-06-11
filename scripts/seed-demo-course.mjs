/**
 * Seeds the "Web Development Fundamentals" demo course
 * assigned to samimshs@gmail.com (Sami Wardak, EDUCATOR).
 *
 * Run:
 *   set -a && source .env.local && set +a
 *   node scripts/seed-demo-course.mjs
 */

import nextEnv from "@next/env";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { CourseStatus, LessonType, PrismaClient, QuestionType } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { loadEnvConfig } = nextEnv;
loadEnvConfig(path.join(__dirname, ".."));

const db = new PrismaClient();

// ─── Author ──────────────────────────────────────────────────────────────────
const AUTHOR_EMAIL     = "samimshs@gmail.com";
const CREATOR_USERNAME = "sami-samim";

// ─── Course data ─────────────────────────────────────────────────────────────
const COURSE = {
  id:          "web-dev-fundamentals",
  titleEn:     "Web Development Fundamentals",
  titlePs:     "د ویب پراختیا بنسټونه",
  descriptionEn: "Learn HTML, CSS, and JavaScript from scratch. Build real web pages, style them with modern CSS, and make them interactive with JavaScript. Perfect for absolute beginners.",
  descriptionPs: "د HTML، CSS، او JavaScript له صفره زده کړئ. د زده کړې پروسه کې د ریښتیني ویب پاڼو جوړول، د عصري CSS سره یې سینګار کول، او د JavaScript له لارې یې فعال کول زده کړئ.",
  level: "beginner",

  modules: [
    // ── Module 1: HTML Basics ─────────────────────────────────────────────────
    {
      id:      "html-basics",
      titleEn: "HTML Basics",
      titlePs:  "د HTML بنسټونه",
      order:   1,
      lessons: [
        {
          id:            "what-is-html",
          titleEn:       "What Is HTML?",
          titlePs:       "HTML څه دی؟",
          descriptionEn: "Understand what HTML is, why it exists, and how browsers use it to display web pages.",
          descriptionPs: "پوه شئ چې HTML څه دی، ولې موجود دی، او لټوونکي یې د ویب پاڼو د ښودلو لپاره څنګه کاروي.",
          youtubeId:     "qz0aGYrrlhU",
          readingEn: `## What Is HTML?

HTML (HyperText Markup Language) is the foundation of every web page. It tells the browser **what content to display** — headings, paragraphs, images, links, lists, and more.

### Key ideas

- HTML is made of **elements** written as *tags*: \`<h1>Hello</h1>\`
- Tags usually come in pairs: an **opening tag** and a **closing tag**
- Browsers read HTML top to bottom and render what they find
- HTML is not a programming language — it is a **markup** language that describes structure, not behavior

### A minimal HTML page

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>My First Page</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
    <p>This is my first web page.</p>
  </body>
</html>
\`\`\`

Every page starts with \`<!DOCTYPE html>\`, which tells the browser this is modern HTML5. The \`<head>\` holds metadata; the \`<body>\` holds visible content.`,
          readingPs: `## HTML څه دی؟

HTML (HyperText Markup Language) د هرې ویب پاڼې بنسټ دی. دا لټوونکي ته وايي چې **کوم محتوا وښيي** — سرلیکونه، پاراګرافونه، انځورونه، لینکونه، لیستونه، او نور.

### مهمې موضوعات

- HTML د عناصرو لخوا جوړه شوې چې د ټاګونو له لارې لیکل کیږي: \`<h1>سلام</h1>\`
- ټاګونه معمولاً جوړه وي: د **پرانیستلو ټاګ** او **تړلو ټاګ**
- لټوونکي HTML له پورته لاندې لولي او هغه چې موييي ښيي
- HTML د پروګرامولو ژبه نه ده — دا یوه **مارکپ** ژبه ده چې جوړښت تشریح کوي`,
          order: 1
        },
        {
          id:            "html-elements-tags",
          titleEn:       "Elements, Tags & Attributes",
          titlePs:       "عناصر، ټاګونه او خصوصیتونه",
          descriptionEn: "Learn the core building blocks: headings, paragraphs, links, images, lists, and how attributes add extra information.",
          descriptionPs: "اصلي جوړښتي برخې زده کړئ: سرلیکونه، پاراګرافونه، لینکونه، انځورونه، لیستونه، او دا چې خصوصیتونه اضافي معلومات څنګه ورزیاتوي.",
          youtubeId:     "salY_Sm6mv4",
          readingEn: `## Elements, Tags & Attributes

### Common text elements

| Tag | Purpose |
|-----|---------|
| \`<h1>\` – \`<h6>\` | Headings (h1 = largest) |
| \`<p>\` | Paragraph |
| \`<strong>\` | Bold / important |
| \`<em>\` | Italic / emphasis |
| \`<br>\` | Line break (no closing tag) |

### Links

\`\`\`html
<a href="https://example.com">Visit Example</a>
\`\`\`

The \`href\` attribute holds the destination URL. Attributes always go inside the **opening tag** as \`name="value"\` pairs.

### Images

\`\`\`html
<img src="photo.jpg" alt="A mountain landscape" width="600">
\`\`\`

\`src\` = file path, \`alt\` = text shown if the image fails to load (also used by screen readers).

### Lists

\`\`\`html
<ul>          <!-- unordered (bullet) list -->
  <li>HTML</li>
  <li>CSS</li>
</ul>

<ol>          <!-- ordered (numbered) list -->
  <li>Learn HTML</li>
  <li>Learn CSS</li>
</ol>
\`\`\``,
          readingPs: `## عناصر، ټاګونه او خصوصیتونه

### عام متني عناصر

| ټاګ | موخه |
|-----|------|
| \`<h1>\` – \`<h6>\` | سرلیکونه (h1 = لوی) |
| \`<p>\` | پاراګراف |
| \`<strong>\` | ډول / مهم |
| \`<em>\` | ترخه / ټینګار |

### لینکونه

\`\`\`html
<a href="https://example.com">بیلګه وګورئ</a>
\`\`\`

### انځورونه

\`\`\`html
<img src="photo.jpg" alt="د غرونو منظره" width="600">
\`\`\``,
          order: 2
        },
        {
          id:            "html-forms",
          titleEn:       "HTML Forms",
          titlePs:       "د HTML فورمونه",
          descriptionEn: "Build forms that collect user input: text fields, dropdowns, checkboxes, and the submit button.",
          descriptionPs: "هغه فورمونه جوړ کړئ چې د کارونکي ننوتنه راټولوي: د متن بکسونه، ډراپ‌ډاونونه، چیک‌باکسونه، او د لیږلو تڼۍ.",
          youtubeId:     "fNcJuPIZ2WE",
          readingEn: `## HTML Forms

Forms let users send data to a server — login boxes, search bars, contact forms, and sign-up sheets are all built with \`<form>\`.

### Basic form structure

\`\`\`html
<form action="/submit" method="post">
  <label for="name">Your name:</label>
  <input type="text" id="name" name="name" placeholder="e.g. Ahmad">

  <label for="email">Email:</label>
  <input type="email" id="email" name="email">

  <button type="submit">Send</button>
</form>
\`\`\`

### Common input types

| type | What it accepts |
|------|----------------|
| \`text\` | Any text |
| \`email\` | Email address (auto-validated) |
| \`password\` | Hidden characters |
| \`number\` | Numeric values |
| \`checkbox\` | True / false tick |
| \`radio\` | One option from a group |
| \`select\` | Dropdown menu |

Always pair every \`<input>\` with a \`<label>\` — it improves accessibility and lets users click the label to focus the field.`,
          readingPs: `## د HTML فورمونه

فورمونه کارونکو ته اجازه ورکوي چې معلومات سرور ته واستوي. د ننوتلو بکسونه، د لټون بارونه، د اړیکې فورمونه، او د ثبت پاڼې ټولې د \`<form>\` سره جوړیږي.

### عام د ننوتلو ډولونه

| ډول | منل شوي معلومات |
|-----|---------------|
| \`text\` | هر ډول متن |
| \`email\` | د ایمیل پته |
| \`password\` | پټ حروف |
| \`checkbox\` | سم / غلط |`,
          order: 3
        }
      ],
      quiz: {
        id:            "html-basics-quiz",
        titleEn:       "HTML Basics Quiz",
        titlePs:       "د HTML بنسټونو ازموینه",
        descriptionEn: "Test your understanding of HTML structure, tags, attributes, and forms. Pass with 70% or higher to unlock Module 2.",
        descriptionPs: "د HTML جوړښت، ټاګونو، خصوصیتونو، او فورمونو خپله پوهه وازمویئ. د دویم ماډیول د خلاصولو لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        passScore: 70,
        questions: [
          {
            id:       "html-q1",
            promptEn: "What does HTML stand for?",
            promptPs:  "HTML لنډیز د کومو کلمو دی؟",
            options: [
              { en: "HyperText Markup Language", ps: "HyperText Markup Language", correct: true },
              { en: "High Transfer Markup Language", ps: "High Transfer Markup Language", correct: false },
              { en: "HyperText Machine Learning", ps: "HyperText Machine Learning", correct: false }
            ]
          },
          {
            id:       "html-q2",
            promptEn: "Which tag creates a hyperlink?",
            promptPs:  "کوم ټاګ هایپرلینک جوړوي؟",
            options: [
              { en: "<link>", ps: "<link>", correct: false },
              { en: "<a>", ps: "<a>", correct: true },
              { en: "<href>", ps: "<href>", correct: false }
            ]
          },
          {
            id:       "html-q3",
            promptEn: "What attribute holds the URL in an anchor tag?",
            promptPs:  "د انکر ټاګ کې کوم خصوصیت URL لري؟",
            options: [
              { en: "src", ps: "src", correct: false },
              { en: "link", ps: "link", correct: false },
              { en: "href", ps: "href", correct: true }
            ]
          },
          {
            id:       "html-q4",
            promptEn: "Which input type hides the characters the user types?",
            promptPs:  "کوم د ننوتلو ډول د کارونکي لیکل شوي حروف پټوي؟",
            options: [
              { en: "hidden", ps: "hidden", correct: false },
              { en: "password", ps: "password", correct: true },
              { en: "secret", ps: "secret", correct: false }
            ]
          },
          {
            id:       "html-q5",
            promptEn: "What is the purpose of the alt attribute on an <img> tag?",
            promptPs:  "د <img> ټاګ د alt خصوصیت موخه څه ده؟",
            options: [
              { en: "Sets the image width", ps: "د انځور عرض ټاکي", correct: false },
              { en: "Provides alternative text if the image cannot load", ps: "که انځور بار نشي، بدیل متن وړاندې کوي", correct: true },
              { en: "Links the image to another page", ps: "انځور بل پاڼه سره تړي", correct: false }
            ]
          }
        ]
      }
    },

    // ── Module 2: CSS Styling ─────────────────────────────────────────────────
    {
      id:      "css-styling",
      titleEn: "CSS Styling",
      titlePs:  "د CSS سینګار",
      order:   2,
      lessons: [
        {
          id:            "css-intro",
          titleEn:       "Introduction to CSS",
          titlePs:       "د CSS پېژندنه",
          descriptionEn: "Learn what CSS is, how to link a stylesheet to HTML, and how selectors target elements.",
          descriptionPs: "زده کړئ CSS څه دی، سټایل‌شیټ HTML سره څنګه تړل کیږي، او سلیکټرونه د عناصرو ټاکلو لپاره کیف کاریږي.",
          youtubeId:     "wRNinF7YQqQ",
          readingEn: `## Introduction to CSS

CSS (Cascading Style Sheets) controls how HTML elements **look** — colors, fonts, spacing, layout, and more. Without CSS a web page is plain black text on a white background.

### Three ways to add CSS

1. **External stylesheet** (recommended): \`<link rel="stylesheet" href="style.css">\` in the \`<head>\`
2. **Internal**: a \`<style>\` block inside \`<head>\`
3. **Inline**: a \`style\` attribute directly on an element

### Anatomy of a CSS rule

\`\`\`css
selector {
  property: value;
}

h1 {
  color: #1a73e8;
  font-size: 2rem;
}
\`\`\`

### Common selectors

| Selector | Example | Targets |
|----------|---------|---------|
| Element | \`p\` | All \`<p>\` tags |
| Class | \`.card\` | Elements with \`class="card"\` |
| ID | \`#hero\` | The element with \`id="hero"\` |
| Descendant | \`.nav a\` | \`<a>\` tags inside \`.nav\` |`,
          readingPs: `## د CSS پېژندنه

CSS (Cascading Style Sheets) کنترولوي چې HTML عناصر **څنګه ښکاري** — رنګونه، فونتونه، فاصلې، ترتیب، او نور. پرته له CSS یوه ویب پاڼه د سپینې شاتمینې پر سر ساده تور متن دی.

### د CSS قاعدې جوړښت

\`\`\`css
h1 {
  color: #1a73e8;
  font-size: 2rem;
}
\`\`\``,
          order: 1
        },
        {
          id:            "css-box-model",
          titleEn:       "The Box Model & Spacing",
          titlePs:       "د بکس ماډل او فاصله",
          descriptionEn: "Every HTML element is a box. Understand margin, border, padding, and width to control layout with precision.",
          descriptionPs: "هر HTML عنصر یو بکس دی. د ترتیب د دقیق کنترول لپاره مارجین، بارډر، پیډینګ، او عرض وپوهیئ.",
          youtubeId:     "rIO5326FgbE",
          readingEn: `## The CSS Box Model

Every element is surrounded by four layers — from inside out:

\`\`\`
┌────────────────────────────┐
│          MARGIN            │  (space outside the border)
│  ┌──────────────────────┐  │
│  │       BORDER         │  │
│  │  ┌────────────────┐  │  │
│  │  │    PADDING     │  │  │  (space inside the border)
│  │  │  ┌──────────┐  │  │  │
│  │  │  │ CONTENT  │  │  │  │
│  │  │  └──────────┘  │  │  │
│  │  └────────────────┘  │  │
│  └──────────────────────┘  │
└────────────────────────────┘
\`\`\`

\`\`\`css
.card {
  width: 320px;
  padding: 20px;          /* space inside */
  border: 2px solid #ddd; /* visible edge */
  margin: 16px auto;      /* center + space outside */
  box-sizing: border-box; /* width includes padding & border */
}
\`\`\`

### Tip: always use \`box-sizing: border-box\`

Without it, adding padding increases the element's total width — which surprises many beginners. Set it globally:

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
}
\`\`\``,
          readingPs: `## د CSS بکس ماډل

هر عنصر له څلورو پوښونو لخوا احاطه شوی — له دننه بهر:

- **محتوا** (Content): اصلي متن یا انځور
- **پیډینګ** (Padding): د بارډر دننه فاصله
- **بارډر** (Border): لیدل کیدونکی کناره
- **مارجین** (Margin): د بارډر بهر فاصله`,
          order: 2
        },
        {
          id:            "css-flexbox",
          titleEn:       "Flexbox Layout",
          titlePs:       "د فلیکس‌باکس ترتیب",
          descriptionEn: "Master the Flexbox system to align and distribute elements in rows and columns without manual calculation.",
          descriptionPs: "د فلیکس‌باکس سیستم مسلط کړئ ترڅو پرته له لاسي حساب کولو عناصر ورتیاییو او کالمونو کې سمبال کړئ.",
          youtubeId:     "phWxA89Dy94",
          readingEn: `## Flexbox Layout

Flexbox is the most practical tool for one-dimensional layouts (a row OR a column).

### Enabling Flexbox

\`\`\`css
.container {
  display: flex;
}
\`\`\`

All direct children of \`.container\` become **flex items**.

### Key container properties

| Property | Values | Effect |
|----------|--------|--------|
| \`flex-direction\` | row / column | Axis direction |
| \`justify-content\` | flex-start / center / space-between / space-around | Align on main axis |
| \`align-items\` | flex-start / center / stretch | Align on cross axis |
| \`gap\` | \`16px\` | Space between items |
| \`flex-wrap\` | wrap / nowrap | Allow items to wrap |

### Practical example — navigation bar

\`\`\`css
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 60px;
}
\`\`\``,
          readingPs: `## د فلیکس‌باکس ترتیب

فلیکس‌باکس د یو اړخیزو ترتیبونو (یوه ورته یا یو کالم) لپاره تر ټولو عملي وسیله ده.

\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
\`\`\``,
          order: 3
        },
        {
          id:            "css-responsive",
          titleEn:       "Responsive Design & Media Queries",
          titlePs:       "ځوابند ډیزاین او میډیا کویریز",
          descriptionEn: "Make web pages look good on phones, tablets, and desktops using media queries and relative units.",
          descriptionPs: "د میډیا کویریز او اړونده واحدونو له کارولو سره ویب پاڼې د ګرځنده، ټبلیټ، او ډیسکټاپ پر سر ښه ښکاري کړئ.",
          youtubeId:     "bn-DQCifeQQ",
          readingEn: `## Responsive Design

A responsive site adapts to the screen size of the device. The key tools are **media queries** and **relative units**.

### Relative units

| Unit | Meaning |
|------|---------|
| \`%\` | Percentage of parent |
| \`vw\` / \`vh\` | % of viewport width / height |
| \`rem\` | Relative to root font size |
| \`em\` | Relative to element's font size |

### Media queries

\`\`\`css
/* default: mobile */
.grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* tablet (≥ 768px) */
@media (min-width: 768px) {
  .grid {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

/* desktop (≥ 1024px) */
@media (min-width: 1024px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
\`\`\`

### Mobile-first approach

Write styles for the smallest screen first, then add \`min-width\` media queries to enhance for larger screens. This is the industry standard.`,
          readingPs: `## ځوابند ډیزاین

یو ځوابند سایټ د وسیلې د سکرین اندازې سره برابریږي. اصلي وسیلې **میډیا کویریز** او **اړونده واحدونه** دي.

\`\`\`css
@media (min-width: 768px) {
  .grid {
    flex-direction: row;
  }
}
\`\`\`

د موبایل-لومړی لار: د تر ټولو کوچني سکرین لپاره سټایل لیکئ، بیا د لویو سکرینونو لپاره \`min-width\` میډیا کویریز زیاتئ.`,
          order: 4
        }
      ],
      quiz: {
        id:            "css-styling-quiz",
        titleEn:       "CSS Styling Quiz",
        titlePs:       "د CSS سینګار ازموینه",
        descriptionEn: "Test your CSS knowledge — selectors, box model, Flexbox, and responsive design. Pass with 70% or higher to unlock Module 3.",
        descriptionPs: "خپله د CSS پوهه وازمویئ — سلیکټرونه، بکس ماډل، فلیکس‌باکس، او ځوابند ډیزاین. د درېیم ماډیول لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        passScore: 70,
        questions: [
          {
            id:       "css-q1",
            promptEn: "Which CSS property changes text color?",
            promptPs:  "کوم CSS خصوصیت د متن رنګ بدلوي؟",
            options: [
              { en: "font-color", ps: "font-color", correct: false },
              { en: "text-color", ps: "text-color", correct: false },
              { en: "color", ps: "color", correct: true }
            ]
          },
          {
            id:       "css-q2",
            promptEn: "In the box model, which layer is directly outside the content?",
            promptPs:  "د بکس ماډل کې، کوم پوښ مستقیم د محتوا بهر دی؟",
            options: [
              { en: "Margin", ps: "مارجین", correct: false },
              { en: "Border", ps: "بارډر", correct: false },
              { en: "Padding", ps: "پیډینګ", correct: true }
            ]
          },
          {
            id:       "css-q3",
            promptEn: "Which CSS property enables Flexbox on a container?",
            promptPs:  "کوم CSS خصوصیت د کنتینر پر سر فلیکس‌باکس فعالوي؟",
            options: [
              { en: "display: flex", ps: "display: flex", correct: true },
              { en: "flex: true", ps: "flex: true", correct: false },
              { en: "layout: flex", ps: "layout: flex", correct: false }
            ]
          },
          {
            id:       "css-q4",
            promptEn: "What does a media query allow you to do?",
            promptPs:  "میډیا کویري تاسو ته اجازه ورکوي چې څه وکړئ؟",
            options: [
              { en: "Query a database from CSS", ps: "له CSS نه ډیټابیس پوښتنه کول", correct: false },
              { en: "Apply different styles based on screen size", ps: "د سکرین اندازې پر بنسټ مختلف سټایلونه پلي کول", correct: true },
              { en: "Load images faster", ps: "انځورونه ژر بارول", correct: false }
            ]
          },
          {
            id:       "css-q5",
            promptEn: "What does justify-content: space-between do in Flexbox?",
            promptPs:  "د فلیکس‌باکس کې justify-content: space-between څه کوي؟",
            options: [
              { en: "Adds padding inside each item", ps: "د هر آیټم دننه پیډینګ زیاتوي", correct: false },
              { en: "Spreads items so space is equal between them, with first and last at edges", ps: "آیټمونه خوروي نو منځ کې برابره فاصله وي، لومړی او وروستی پر سرحدونو", correct: true },
              { en: "Centers all items in the container", ps: "ټول آیټمونه د کنتینر مرکز ته اړوي", correct: false }
            ]
          }
        ]
      }
    },

    // ── Module 3: JavaScript Fundamentals ────────────────────────────────────
    {
      id:      "javascript-fundamentals",
      titleEn: "JavaScript Fundamentals",
      titlePs:  "د JavaScript بنسټونه",
      order:   3,
      lessons: [
        {
          id:            "js-intro-variables",
          titleEn:       "Variables, Data Types & Operators",
          titlePs:       "متغیرونه، د معلوماتو ډولونه او عملیات",
          descriptionEn: "Learn how to store values in variables, the basic JavaScript data types, and how to work with them using operators.",
          descriptionPs: "زده کړئ چې متغیرونو کې ارزښتونه د ذخیره کولو لار، د JavaScript بنسټیز د معلوماتو ډولونه، او د عملیاتو له لارې یې سره کارول.",
          youtubeId:     "edlFjlzxkSI",
          readingEn: `## Variables, Data Types & Operators

### Declaring variables

\`\`\`js
let name = "Ahmad";      // can be reassigned
const age  = 24;         // cannot be reassigned
var city   = "Kabul";    // old style — avoid in modern code
\`\`\`

Always prefer \`const\` by default. Use \`let\` only when you know the value will change.

### Data types

| Type | Example |
|------|---------|
| String | \`"Hello"\`, \`'World'\` |
| Number | \`42\`, \`3.14\` |
| Boolean | \`true\`, \`false\` |
| Null | \`null\` (intentionally empty) |
| Undefined | variable declared but not assigned |
| Array | \`[1, 2, 3]\` |
| Object | \`{ name: "Ahmad", age: 24 }\` |

### Common operators

\`\`\`js
// Arithmetic
5 + 3   // 8
10 - 4  // 6
6 * 7   // 42
9 / 3   // 3
10 % 3  // 1  (remainder)

// Comparison (always use ===, not ==)
5 === 5   // true
5 === "5" // false (strict equality — checks type too)
5 !== 3   // true

// Logical
true && false // false
true || false // true
!true         // false
\`\`\``,
          readingPs: `## متغیرونه، د معلوماتو ډولونه او عملیات

### د متغیرونو اعلان

\`\`\`js
let name = "احمد";     // بیا ټاکل کیدی شي
const age  = 24;       // بیا ټاکل نه شي
\`\`\`

تل د پیل \`const\` غوره کړئ. یوازې هله \`let\` وکاروئ چې پوهیئ ارزښت به بدل شي.

### د معلوماتو ډولونه

| ډول | بیلګه |
|-----|-------|
| String | \`"سلام"\` |
| Number | \`42\`, \`3.14\` |
| Boolean | \`true\`, \`false\` |
| Array | \`[1, 2, 3]\` |
| Object | \`{ name: "احمد" }\` |`,
          order: 1
        },
        {
          id:            "js-functions",
          titleEn:       "Functions",
          titlePs:       "فنکشنونه",
          descriptionEn: "Write reusable blocks of code with functions. Learn declarations, expressions, arrow functions, and parameters.",
          descriptionPs: "د فنکشنونو سره د کوډ د بیاکارونې وړ بلاکونه ولیکئ. اعلانات، بیانونه، تیروونکي فنکشنونه، او پارامترونه زده کړئ.",
          youtubeId:     "xUI5Tsl2JpY",
          readingEn: `## Functions

A function is a named, reusable block of code. You define it once and call it as many times as you like.

### Function declaration

\`\`\`js
function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Ahmad")); // "Hello, Ahmad!"
\`\`\`

### Function expression

\`\`\`js
const greet = function(name) {
  return "Hello, " + name + "!";
};
\`\`\`

### Arrow function (modern shorthand)

\`\`\`js
const greet = (name) => "Hello, " + name + "!";

// Multiple lines need curly braces and explicit return
const add = (a, b) => {
  const result = a + b;
  return result;
};
\`\`\`

### Default parameters

\`\`\`js
function greet(name = "stranger") {
  return "Hello, " + name + "!";
}

greet();         // "Hello, stranger!"
greet("Fatima"); // "Hello, Fatima!"
\`\`\``,
          readingPs: `## فنکشنونه

یو فنکشن د کوډ یو نومول شوی، بیاکارونې وړ بلاک دی. یو ځل یې تعریف کړئ او هر وخت چې غواړئ یې غوښتنه وکړئ.

\`\`\`js
function greet(name) {
  return "سلام، " + name + "!";
}

// د تیرو فنکشنونو (Arrow) لنډه لار
const add = (a, b) => a + b;
\`\`\``,
          order: 2
        },
        {
          id:            "js-dom",
          titleEn:       "DOM Manipulation",
          titlePs:       "د DOM اداره کول",
          descriptionEn: "Use JavaScript to select HTML elements, change their content and styles, and respond to user events like clicks.",
          descriptionPs: "د JavaScript له کارولو سره HTML عناصر وټاکئ، د هغوی محتوا او سټایل بدل کړئ، او د کارونکي پیښو لکه کلیکونو ته ځواب ورکړئ.",
          youtubeId:     "5fb2aPlgoys",
          readingEn: `## DOM Manipulation

The DOM (Document Object Model) is the browser's live tree of all HTML elements. JavaScript can read and modify it to make pages interactive.

### Selecting elements

\`\`\`js
const heading = document.querySelector("h1");          // first match
const buttons = document.querySelectorAll(".btn");     // NodeList of all matches
const byId    = document.getElementById("hero");
\`\`\`

### Reading & changing content

\`\`\`js
heading.textContent = "Welcome!";    // change text
heading.innerHTML   = "<em>Hi</em>"; // change HTML (use carefully)

// Classes
heading.classList.add("active");
heading.classList.remove("active");
heading.classList.toggle("active");

// Attributes
const img = document.querySelector("img");
img.setAttribute("src", "new-photo.jpg");
img.getAttribute("alt");
\`\`\`

### Event listeners

\`\`\`js
const btn = document.querySelector("#submitBtn");

btn.addEventListener("click", (event) => {
  console.log("Button clicked!", event);
  alert("Form submitted!");
});
\`\`\`

Common events: \`click\`, \`input\`, \`submit\`, \`keydown\`, \`mouseover\`, \`load\``,
          readingPs: `## د DOM اداره کول

DOM (Document Object Model) د ټولو HTML عناصرو د لطبي ونې ژوند بڼه ده. JavaScript یې لوستلی او بدلولی شي ترڅو پاڼې فعالې کړي.

\`\`\`js
const heading = document.querySelector("h1");
heading.textContent = "ښه راغلاست!";

const btn = document.querySelector("#myBtn");
btn.addEventListener("click", () => {
  alert("کلیک وشو!");
});
\`\`\``,
          order: 3
        }
      ],
      quiz: {
        id:            "javascript-fundamentals-quiz",
        titleEn:       "JavaScript Fundamentals Quiz",
        titlePs:       "د JavaScript بنسټونو ازموینه",
        descriptionEn: "Test your JavaScript knowledge — variables, functions, and DOM manipulation. Pass with 70% or higher to complete the course and earn your certificate.",
        descriptionPs: "خپله د JavaScript پوهه وازمویئ — متغیرونه، فنکشنونه، او DOM اداره کول. د کورس د بشپړولو او سند د ترلاسه کولو لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        passScore: 70,
        questions: [
          {
            id:       "js-q1",
            promptEn: "Which keyword declares a variable that cannot be reassigned?",
            promptPs:  "کوم کلیدي کلمه داسې متغیر اعلانوي چې بیا ټاکل نه شي؟",
            options: [
              { en: "let", ps: "let", correct: false },
              { en: "var", ps: "var", correct: false },
              { en: "const", ps: "const", correct: true }
            ]
          },
          {
            id:       "js-q2",
            promptEn: "What does === check compared to ==?",
            promptPs:  "=== د == سره پرتله کې څه کنټرولوي؟",
            options: [
              { en: "It also checks the data type, not just the value", ps: "دا یوازې ارزښت نه، د معلوماتو ډول هم کنټرولوي", correct: true },
              { en: "It is slower than ==", ps: "دا د == نه ورو دی", correct: false },
              { en: "It only works with numbers", ps: "یوازې د شمیرو سره کار کوي", correct: false }
            ]
          },
          {
            id:       "js-q3",
            promptEn: "What is an arrow function?",
            promptPs:  "د تیرو فنکشن (Arrow function) څه دی؟",
            options: [
              { en: "A function with no parameters", ps: "پارامتر پرته فنکشن", correct: false },
              { en: "A concise syntax for writing functions using =>", ps: "د => له کارولو سره د فنکشنونو د لیکلو لنډه ترکیب", correct: true },
              { en: "A function that only runs once", ps: "فنکشن چې یوازې یو ځل چلیږي", correct: false }
            ]
          },
          {
            id:       "js-q4",
            promptEn: "Which method selects the first matching HTML element?",
            promptPs:  "کوم میتود لومړی سم شوی HTML عنصر انتخابوي؟",
            options: [
              { en: "document.getElement()", ps: "document.getElement()", correct: false },
              { en: "document.querySelector()", ps: "document.querySelector()", correct: true },
              { en: "document.findElement()", ps: "document.findElement()", correct: false }
            ]
          },
          {
            id:       "js-q5",
            promptEn: "Which method attaches an event handler to an element?",
            promptPs:  "کوم میتود د یوه عنصر سره د پیښو هینډلر تړي؟",
            options: [
              { en: "element.onClick()", ps: "element.onClick()", correct: false },
              { en: "element.on()", ps: "element.on()", correct: false },
              { en: "element.addEventListener()", ps: "element.addEventListener()", correct: true }
            ]
          }
        ]
      }
    }
  ]
};

// ─── Seed function ────────────────────────────────────────────────────────────
async function main() {
  // 1. Resolve author
  const author = await db.user.findUniqueOrThrow({
    where: { email: AUTHOR_EMAIL },
    select: { id: true, name: true }
  });

  const creatorProfile = await db.creatorProfile.findUniqueOrThrow({
    where: { username: CREATOR_USERNAME },
    select: { id: true }
  });

  console.log(`Author: ${author.name} (${author.id})`);
  console.log(`Creator profile: ${creatorProfile.id}`);

  // 2. Upsert course
  await db.course.upsert({
    where: { id: COURSE.id },
    create: {
      id:              COURSE.id,
      slug:            COURSE.id,
      status:          CourseStatus.PUBLISHED,
      level:           COURSE.level,
      titleEn:         COURSE.titleEn,
      titlePs:         COURSE.titlePs,
      descriptionEn:   COURSE.descriptionEn,
      descriptionPs:   COURSE.descriptionPs,
      authorId:        author.id,
      authorProfileId: creatorProfile.id,
      publishedAt:     new Date()
    },
    update: {
      status:          CourseStatus.PUBLISHED,
      level:           COURSE.level,
      titleEn:         COURSE.titleEn,
      titlePs:         COURSE.titlePs,
      descriptionEn:   COURSE.descriptionEn,
      descriptionPs:   COURSE.descriptionPs,
      authorId:        author.id,
      authorProfileId: creatorProfile.id,
      publishedAt:     new Date()
    }
  });

  console.log(`Upserted course: ${COURSE.titleEn}`);

  let totalLessons = 0;
  let totalQuestions = 0;

  for (const mod of COURSE.modules) {
    const moduleId = `${COURSE.id}:${mod.id}`;

    // 3. Upsert module
    await db.module.upsert({
      where: { id: moduleId },
      create: { id: moduleId, courseId: COURSE.id, order: mod.order, titleEn: mod.titleEn, titlePs: mod.titlePs },
      update: { courseId: COURSE.id, order: mod.order, titleEn: mod.titleEn, titlePs: mod.titlePs }
    });

    // 4. Upsert video lessons
    for (const lesson of mod.lessons) {
      const lessonId = `${COURSE.id}:${lesson.id}`;
      await db.lesson.upsert({
        where: { id: lessonId },
        create: {
          id:            lessonId,
          moduleId,
          order:         lesson.order,
          type:          LessonType.VIDEO,
          titleEn:       lesson.titleEn,
          titlePs:       lesson.titlePs,
          descriptionEn: lesson.descriptionEn,
          descriptionPs: lesson.descriptionPs,
          youtubeUrl:    lesson.youtubeId,
          readingEn:     lesson.readingEn,
          readingPs:     lesson.readingPs,
          isFinalTest:   false,
          passingScore:  null
        },
        update: {
          moduleId,
          order:         lesson.order,
          type:          LessonType.VIDEO,
          titleEn:       lesson.titleEn,
          titlePs:       lesson.titlePs,
          descriptionEn: lesson.descriptionEn,
          descriptionPs: lesson.descriptionPs,
          youtubeUrl:    lesson.youtubeId,
          readingEn:     lesson.readingEn,
          readingPs:     lesson.readingPs,
          isFinalTest:   false,
          passingScore:  null
        }
      });
      totalLessons++;
    }

    // 5. Upsert quiz lesson
    const q = mod.quiz;
    const quizLessonId = `${COURSE.id}:${mod.id}:quiz`;
    await db.lesson.upsert({
      where: { id: quizLessonId },
      create: {
        id:            quizLessonId,
        moduleId,
        order:         mod.lessons.length + 1,
        type:          LessonType.QUIZ,
        titleEn:       q.titleEn,
        titlePs:       q.titlePs,
        descriptionEn: q.descriptionEn,
        descriptionPs: q.descriptionPs,
        isFinalTest:   true,
        passingScore:  q.passScore
      },
      update: {
        moduleId,
        order:         mod.lessons.length + 1,
        type:          LessonType.QUIZ,
        titleEn:       q.titleEn,
        titlePs:       q.titlePs,
        descriptionEn: q.descriptionEn,
        descriptionPs: q.descriptionPs,
        isFinalTest:   true,
        passingScore:  q.passScore
      }
    });

    // 6. Upsert Quiz record
    const quizId = `${COURSE.id}:${q.id}`;
    await db.quiz.upsert({
      where: { lessonId: quizLessonId },
      create: { id: quizId, lessonId: quizLessonId },
      update: {}
    });

    const quizRecord = await db.quiz.findUniqueOrThrow({
      where: { lessonId: quizLessonId },
      select: { id: true }
    });

    // 7. Upsert questions + answer choices
    for (const [qi, question] of q.questions.entries()) {
      const questionId = `${COURSE.id}:${question.id}`;
      await db.question.upsert({
        where: { id: questionId },
        create: {
          id:       questionId,
          quizId:   quizRecord.id,
          order:    qi + 1,
          type:     QuestionType.SINGLE_CHOICE,
          promptEn: question.promptEn,
          promptPs: question.promptPs
        },
        update: {
          quizId:   quizRecord.id,
          order:    qi + 1,
          type:     QuestionType.SINGLE_CHOICE,
          promptEn: question.promptEn,
          promptPs: question.promptPs
        }
      });

      for (const [ci, opt] of question.options.entries()) {
        const choiceId = `${questionId}:choice-${ci + 1}`;
        await db.answerChoice.upsert({
          where: { id: choiceId },
          create: {
            id:         choiceId,
            questionId,
            order:      ci + 1,
            textEn:     opt.en,
            textPs:     opt.ps,
            isCorrect:  opt.correct
          },
          update: {
            questionId,
            order:      ci + 1,
            textEn:     opt.en,
            textPs:     opt.ps,
            isCorrect:  opt.correct
          }
        });
      }
      totalQuestions++;
    }

    console.log(`  Module "${mod.titleEn}": ${mod.lessons.length} lessons + 1 quiz (${q.questions.length} questions)`);
  }

  console.log(`\nDone! Course seeded with ${COURSE.modules.length} modules, ${totalLessons} video lessons, ${totalQuestions} quiz questions.`);
  console.log(`URL: /courses/${COURSE.id}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
