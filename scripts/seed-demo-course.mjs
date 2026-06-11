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

const AUTHOR_EMAIL     = "samimshs@gmail.com";
const CREATOR_USERNAME = "sami-samim";

const COURSE = {
  id:            "web-dev-fundamentals",
  titleEn:       "Web Development Fundamentals",
  titlePs:       "د ویب پراختیا بنسټونه",
  titleDa:       "مبانی توسعه وب",
  descriptionEn: "Learn HTML, CSS, and JavaScript from scratch. Build real web pages, style them with modern CSS, and make them interactive with JavaScript. Perfect for absolute beginners.",
  descriptionPs: "د HTML، CSS، او JavaScript له صفره زده کړئ. د زده کړې پروسه کې د ریښتیني ویب پاڼو جوړول، د عصري CSS سره یې سینګار کول، او د JavaScript له لارې یې فعال کول زده کړئ.",
  descriptionDa: "HTML، CSS و JavaScript را از صفر بیاموزید. صفحات وب واقعی بسازید، آنها را با CSS مدرن طراحی کنید و با JavaScript تعاملی کنید. مناسب برای مبتدیان کامل.",
  level: "beginner",

  modules: [

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 1 — HTML Basics
    // ══════════════════════════════════════════════════════════════════════════
    {
      id:      "html-basics",
      titleEn: "HTML Basics",
      titlePs: "د HTML بنسټونه",
      titleDa: "مبانی HTML",
      order:   1,
      lessons: [
        // ── Video 1 ──────────────────────────────────────────────────────────
        {
          id:            "what-is-html",
          type:          "VIDEO",
          titleEn:       "What Is HTML?",
          titlePs:       "HTML څه دی؟",
          titleDa:       "HTML چیست؟",
          descriptionEn: "Understand what HTML is, why it exists, and how browsers use it to display web pages.",
          descriptionPs: "پوه شئ چې HTML څه دی، ولې موجود دی، او لټوونکي یې د ویب پاڼو د ښودلو لپاره څنګه کاروي.",
          descriptionDa: "بیاموزید HTML چیست، چرا وجود دارد و مرورگرها چگونه از آن برای نمایش صفحات وب استفاده می‌کنند.",
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
- HTML د پروګرامولو ژبه نه ده — دا یوه **مارکپ** ژبه ده چې جوړښت تشریح کوي

### یوه ساده HTML پاڼه

\`\`\`html
<!DOCTYPE html>
<html lang="ps">
  <head>
    <title>زما لومړۍ پاڼه</title>
  </head>
  <body>
    <h1>سلام نړۍ!</h1>
    <p>دا زما لومړۍ ویب پاڼه ده.</p>
  </body>
</html>
\`\`\``,
          readingDa: `## HTML چیست؟

HTML (زبان نشانه‌گذاری ابرمتن) پایه هر صفحه وب است. به مرورگر می‌گوید **چه محتوایی نمایش دهد** — عنوان‌ها، پاراگراف‌ها، تصاویر، لینک‌ها، لیست‌ها و بیشتر.

### ایده‌های کلیدی

- HTML از **عناصری** تشکیل شده که به صورت *تگ* نوشته می‌شوند: \`<h1>سلام</h1>\`
- تگ‌ها معمولاً جفت هستند: یک **تگ باز** و یک **تگ بسته**
- مرورگرها HTML را از بالا به پایین می‌خوانند
- HTML یک زبان برنامه‌نویسی نیست — یک زبان **نشانه‌گذاری** است که ساختار را توصیف می‌کند

### یک صفحه HTML ساده

\`\`\`html
<!DOCTYPE html>
<html lang="fa">
  <head>
    <title>اولین صفحه من</title>
  </head>
  <body>
    <h1>سلام دنیا!</h1>
    <p>این اولین صفحه وب من است.</p>
  </body>
</html>
\`\`\``,
          order: 1
        },

        // ── Video 2 ──────────────────────────────────────────────────────────
        {
          id:            "html-elements-tags",
          type:          "VIDEO",
          titleEn:       "Elements, Tags & Attributes",
          titlePs:       "عناصر، ټاګونه او خصوصیتونه",
          titleDa:       "عناصر، تگ‌ها و ویژگی‌ها",
          descriptionEn: "Learn the core building blocks: headings, paragraphs, links, images, lists, and how attributes add extra information.",
          descriptionPs: "اصلي جوړښتي برخې زده کړئ: سرلیکونه، پاراګرافونه، لینکونه، انځورونه، لیستونه، او دا چې خصوصیتونه اضافي معلومات څنګه ورزیاتوي.",
          descriptionDa: "عناصر اصلی را بیاموزید: عنوان‌ها، پاراگراف‌ها، لینک‌ها، تصاویر، لیست‌ها و نحوه اضافه کردن اطلاعات اضافی با ویژگی‌ها.",
          youtubeId:     "salY_Sm6mv4",
          readingEn: `## Elements, Tags & Attributes

### Common text elements

| Tag | Purpose | Example |
|-----|---------|---------|
| \`<h1>\` – \`<h6>\` | Headings (h1 = largest) | \`<h1>Title</h1>\` |
| \`<p>\` | Paragraph | \`<p>Some text.</p>\` |
| \`<strong>\` | Bold / important | \`<strong>Warning</strong>\` |
| \`<em>\` | Italic / emphasis | \`<em>Note this</em>\` |
| \`<br>\` | Line break (self-closing) | \`<br>\` |
| \`<hr>\` | Horizontal divider | \`<hr>\` |

### Links

\`\`\`html
<a href="https://example.com" target="_blank">Visit Example</a>
\`\`\`

The \`href\` attribute holds the destination URL. \`target="_blank"\` opens the link in a new tab. Attributes always go inside the **opening tag** as \`name="value"\` pairs.

### Images

\`\`\`html
<img src="photo.jpg" alt="A mountain landscape" width="600" height="400">
\`\`\`

- \`src\` — path to the image file
- \`alt\` — text shown if the image fails, also read by screen readers (always include it)
- \`width\` / \`height\` — optional size hints; helps browser reserve space while loading

### Lists

\`\`\`html
<!-- Unordered (bullet) list -->
<ul>
  <li>HTML</li>
  <li>CSS</li>
  <li>JavaScript</li>
</ul>

<!-- Ordered (numbered) list -->
<ol>
  <li>Learn HTML</li>
  <li>Learn CSS</li>
  <li>Build projects</li>
</ol>
\`\`\`

### Nesting

Elements can be placed inside other elements. The inner element must close before the outer one:

\`\`\`html
<!-- ✓ Correct nesting -->
<p>Visit <a href="https://example.com"><strong>our site</strong></a> today.</p>

<!-- ✗ Wrong — tags overlap -->
<p>Visit <a href="#">our <strong>site</a> today</strong>.</p>
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
<a href="https://example.com" target="_blank">بیلګه وګورئ</a>
\`\`\`

### انځورونه

\`\`\`html
<img src="photo.jpg" alt="د غرونو منظره" width="600">
\`\`\`

### لیستونه

\`\`\`html
<ul>
  <li>HTML</li>
  <li>CSS</li>
</ul>
\`\`\``,
          readingDa: `## عناصر، تگ‌ها و ویژگی‌ها

### عناصر متنی رایج

| تگ | هدف |
|----|-----|
| \`<h1>\` – \`<h6>\` | عنوان‌ها (h1 = بزرگ‌ترین) |
| \`<p>\` | پاراگراف |
| \`<strong>\` | پررنگ / مهم |
| \`<em>\` | کج / تأکید |

### لینک‌ها

\`\`\`html
<a href="https://example.com" target="_blank">مثال را ببینید</a>
\`\`\`

### تصاویر

\`\`\`html
<img src="photo.jpg" alt="منظره کوه" width="600">
\`\`\`

### لیست‌ها

\`\`\`html
<ul>
  <li>HTML</li>
  <li>CSS</li>
</ul>
\`\`\``,
          order: 2
        },

        // ── Video 3 ──────────────────────────────────────────────────────────
        {
          id:            "html-forms",
          type:          "VIDEO",
          titleEn:       "HTML Forms",
          titlePs:       "د HTML فورمونه",
          titleDa:       "فرم‌های HTML",
          descriptionEn: "Build forms that collect user input: text fields, dropdowns, checkboxes, and the submit button.",
          descriptionPs: "هغه فورمونه جوړ کړئ چې د کارونکي ننوتنه راټولوي: د متن بکسونه، ډراپ‌ډاونونه، چیک‌باکسونه، او د لیږلو تڼۍ.",
          descriptionDa: "فرم‌هایی بسازید که ورودی کاربر را جمع‌آوری می‌کنند: فیلدهای متن، منوهای کشویی، چک‌باکس‌ها و دکمه ارسال.",
          youtubeId:     "fNcJuPIZ2WE",
          readingEn: `## HTML Forms

Forms let users send data to a server — login boxes, search bars, contact forms, and sign-up sheets are all built with \`<form>\`.

### Basic form structure

\`\`\`html
<form action="/submit" method="post">
  <label for="name">Your name:</label>
  <input type="text" id="name" name="name" placeholder="e.g. Ahmad" required>

  <label for="email">Email address:</label>
  <input type="email" id="email" name="email" required>

  <label for="level">Experience level:</label>
  <select id="level" name="level">
    <option value="beginner">Beginner</option>
    <option value="intermediate">Intermediate</option>
    <option value="advanced">Advanced</option>
  </select>

  <label>
    <input type="checkbox" name="newsletter"> Subscribe to newsletter
  </label>

  <button type="submit">Send</button>
</form>
\`\`\`

### Common input types

| type | What it accepts | Notes |
|------|----------------|-------|
| \`text\` | Any text | General purpose |
| \`email\` | Email address | Browser auto-validates format |
| \`password\` | Hidden characters | Characters shown as dots |
| \`number\` | Numeric values | Shows up/down arrows |
| \`tel\` | Phone number | Shows numeric keyboard on mobile |
| \`url\` | Web address | Browser validates format |
| \`date\` | Calendar date | Shows date picker |
| \`checkbox\` | True / false | Multi-select; use \`name\` arrays |
| \`radio\` | One of a group | Share the same \`name\` attribute |
| \`file\` | File upload | Add \`accept=".jpg,.png"\` to filter |

### Accessibility rule

Always pair every \`<input>\` with a \`<label>\`. The \`for\` attribute on the label must match the \`id\` on the input — this lets users click the label text to focus the field, and screen readers announce the label when the field is focused.`,
          readingPs: `## د HTML فورمونه

فورمونه کارونکو ته اجازه ورکوي چې معلومات سرور ته واستوي.

### د فورم بنسټیز جوړښت

\`\`\`html
<form action="/submit" method="post">
  <label for="name">ستاسو نوم:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">ایمیل پته:</label>
  <input type="email" id="email" name="email" required>

  <button type="submit">واستوئ</button>
</form>
\`\`\`

### عام د ننوتلو ډولونه

| ډول | منل شوي معلومات |
|-----|---------------|
| \`text\` | هر ډول متن |
| \`email\` | د ایمیل پته |
| \`password\` | پټ حروف |
| \`checkbox\` | سم / غلط |
| \`radio\` | له ډلې یو |`,
          readingDa: `## فرم‌های HTML

فرم‌ها به کاربران اجازه می‌دهند داده‌ها را به سرور ارسال کنند.

### ساختار پایه فرم

\`\`\`html
<form action="/submit" method="post">
  <label for="name">نام شما:</label>
  <input type="text" id="name" name="name" required>

  <label for="email">آدرس ایمیل:</label>
  <input type="email" id="email" name="email" required>

  <button type="submit">ارسال</button>
</form>
\`\`\`

### انواع رایج ورودی

| نوع | داده‌های پذیرفته شده |
|-----|---------------------|
| \`text\` | هر متن |
| \`email\` | آدرس ایمیل |
| \`password\` | کاراکترهای پنهان |
| \`checkbox\` | درست / غلط |
| \`radio\` | یکی از گروه |`,
          order: 3
        },

        // ── Reading lesson ────────────────────────────────────────────────────
        {
          id:            "html-practice",
          type:          "READING",
          titleEn:       "Practice: Build a Personal Profile Page",
          titlePs:       "تمرین: د شخصي پروفایل پاڼه جوړه کړئ",
          titleDa:       "تمرین: صفحه پروفایل شخصی بسازید",
          descriptionEn: "Put your HTML knowledge together by building a complete personal profile page from scratch — step by step with full code.",
          descriptionPs: "خپله د HTML پوهه یو ځای کړئ او د ګام پر ګام بشپړ کوډ سره د شخصي پروفایل پاڼه له صفره جوړه کړئ.",
          descriptionDa: "دانش HTML خود را یکجا کنید و با کدهای کامل گام به گام یک صفحه پروفایل شخصی از صفر بسازید.",
          youtubeId:     null,
          readingEn: `## Practice: Build a Personal Profile Page

In this lesson you will build a complete personal profile page using only HTML. No CSS or JavaScript yet — just clean, well-structured markup.

---

### What you will build

A page that includes:
- Your name as the main heading
- A short bio paragraph
- A profile photo (placeholder image used below)
- A list of your skills
- A list of your favourite links
- A simple contact form

---

### Step 1 — Create the file

Create a new file called \`profile.html\` and add the HTML skeleton:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ahmad Karimi — Profile</title>
  </head>
  <body>

    <!-- your content goes here -->

  </body>
</html>
\`\`\`

---

### Step 2 — Add the header section

Inside \`<body>\`, add your name and a short bio:

\`\`\`html
<header>
  <img src="https://placehold.co/120x120" alt="Profile photo of Ahmad Karimi">
  <h1>Ahmad Karimi</h1>
  <p>
    I'm a Computer Science student at Kabul University, passionate about
    web development and building tools that help Afghan communities.
  </p>
</header>
\`\`\`

---

### Step 3 — Add your skills

\`\`\`html
<section>
  <h2>Skills</h2>
  <ul>
    <li>HTML5</li>
    <li>CSS3</li>
    <li>JavaScript</li>
    <li>Python (beginner)</li>
    <li>Git & GitHub</li>
  </ul>
</section>
\`\`\`

---

### Step 4 — Add favourite links

\`\`\`html
<section>
  <h2>Useful Resources</h2>
  <ol>
    <li><a href="https://developer.mozilla.org" target="_blank">MDN Web Docs</a> — the best HTML/CSS/JS reference</li>
    <li><a href="https://css-tricks.com" target="_blank">CSS-Tricks</a> — deep CSS guides</li>
    <li><a href="https://javascript.info" target="_blank">JavaScript.info</a> — thorough JS tutorial</li>
  </ol>
</section>
\`\`\`

---

### Step 5 — Add a contact form

\`\`\`html
<section>
  <h2>Contact Me</h2>
  <form action="#" method="post">
    <p>
      <label for="visitor-name">Your name:</label><br>
      <input type="text" id="visitor-name" name="visitor-name" placeholder="Your name" required>
    </p>
    <p>
      <label for="visitor-email">Your email:</label><br>
      <input type="email" id="visitor-email" name="visitor-email" placeholder="you@example.com" required>
    </p>
    <p>
      <label for="message">Message:</label><br>
      <textarea id="message" name="message" rows="5" cols="40" placeholder="Write your message here..."></textarea>
    </p>
    <button type="submit">Send message</button>
  </form>
</section>
\`\`\`

---

### Step 6 — Add a footer

\`\`\`html
<footer>
  <p>&copy; 2026 Ahmad Karimi. Built with HTML.</p>
</footer>
\`\`\`

---

### Complete file

Here is the full \`profile.html\` assembled:

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ahmad Karimi — Profile</title>
  </head>
  <body>

    <header>
      <img src="https://placehold.co/120x120" alt="Profile photo of Ahmad Karimi">
      <h1>Ahmad Karimi</h1>
      <p>
        I'm a Computer Science student at Kabul University, passionate about
        web development and building tools that help Afghan communities.
      </p>
    </header>

    <section>
      <h2>Skills</h2>
      <ul>
        <li>HTML5</li>
        <li>CSS3</li>
        <li>JavaScript</li>
        <li>Python (beginner)</li>
        <li>Git &amp; GitHub</li>
      </ul>
    </section>

    <section>
      <h2>Useful Resources</h2>
      <ol>
        <li><a href="https://developer.mozilla.org" target="_blank">MDN Web Docs</a></li>
        <li><a href="https://css-tricks.com" target="_blank">CSS-Tricks</a></li>
        <li><a href="https://javascript.info" target="_blank">JavaScript.info</a></li>
      </ol>
    </section>

    <section>
      <h2>Contact Me</h2>
      <form action="#" method="post">
        <p>
          <label for="visitor-name">Your name:</label><br>
          <input type="text" id="visitor-name" name="visitor-name" required>
        </p>
        <p>
          <label for="visitor-email">Your email:</label><br>
          <input type="email" id="visitor-email" name="visitor-email" required>
        </p>
        <p>
          <label for="message">Message:</label><br>
          <textarea id="message" name="message" rows="5" cols="40"></textarea>
        </p>
        <button type="submit">Send message</button>
      </form>
    </section>

    <footer>
      <p>&copy; 2026 Ahmad Karimi. Built with HTML.</p>
    </footer>

  </body>
</html>
\`\`\`

---

### What to try next

- Change the name, bio, and skills to match your own profile
- Add a second section for "Education" or "Projects" using the same pattern
- Open the file in your browser by double-clicking it — it works with no server needed`,
          readingPs: `## تمرین: د شخصي پروفایل پاڼه جوړه کړئ

پدې درس کې به تاسو یوازې د HTML سره بشپړه شخصي پروفایل پاڼه جوړ کړئ.

---

### ګام ۱ — فایل جوړ کړئ

یو نوی فایل \`profile.html\` جوړ کړئ:

\`\`\`html
<!DOCTYPE html>
<html lang="ps">
  <head>
    <meta charset="UTF-8">
    <title>احمد کریمي — پروفایل</title>
  </head>
  <body>
    <!-- ستاسو محتوا دلته راځي -->
  </body>
</html>
\`\`\`

---

### ګام ۲ — سرلیک برخه زیاته کړئ

\`\`\`html
<header>
  <img src="https://placehold.co/120x120" alt="د احمد کریمي انځور">
  <h1>احمد کریمي</h1>
  <p>زه د کابل پوهنتون د کمپیوټر ساینس محصل یم.</p>
</header>
\`\`\`

---

### ګام ۳ — مهارتونه زیاتئ

\`\`\`html
<section>
  <h2>مهارتونه</h2>
  <ul>
    <li>HTML5</li>
    <li>CSS3</li>
    <li>JavaScript</li>
  </ul>
</section>
\`\`\`

---

### ګام ۴ — د اړیکې فورم زیاتئ

\`\`\`html
<section>
  <h2>راسره اړیکه ونیسئ</h2>
  <form action="#" method="post">
    <p>
      <label for="name">ستاسو نوم:</label><br>
      <input type="text" id="name" name="name" required>
    </p>
    <p>
      <label for="email">ایمیل:</label><br>
      <input type="email" id="email" name="email" required>
    </p>
    <button type="submit">واستوئ</button>
  </form>
</section>
\`\`\``,
          readingDa: `## تمرین: صفحه پروفایل شخصی بسازید

در این درس یک صفحه پروفایل شخصی کامل فقط با HTML می‌سازید.

---

### گام ۱ — فایل را بسازید

فایل جدیدی به نام \`profile.html\` بسازید:

\`\`\`html
<!DOCTYPE html>
<html lang="fa">
  <head>
    <meta charset="UTF-8">
    <title>احمد کریمی — پروفایل</title>
  </head>
  <body>
    <!-- محتوای شما اینجا می‌آید -->
  </body>
</html>
\`\`\`

---

### گام ۲ — بخش هدر را اضافه کنید

\`\`\`html
<header>
  <img src="https://placehold.co/120x120" alt="تصویر احمد کریمی">
  <h1>احمد کریمی</h1>
  <p>من دانشجوی علوم کامپیوتر در دانشگاه کابل هستم.</p>
</header>
\`\`\`

---

### گام ۳ — مهارت‌ها را اضافه کنید

\`\`\`html
<section>
  <h2>مهارت‌ها</h2>
  <ul>
    <li>HTML5</li>
    <li>CSS3</li>
    <li>JavaScript</li>
  </ul>
</section>
\`\`\`

---

### گام ۴ — فرم تماس را اضافه کنید

\`\`\`html
<section>
  <h2>با من تماس بگیرید</h2>
  <form action="#" method="post">
    <p>
      <label for="name">نام شما:</label><br>
      <input type="text" id="name" name="name" required>
    </p>
    <p>
      <label for="email">ایمیل:</label><br>
      <input type="email" id="email" name="email" required>
    </p>
    <button type="submit">ارسال</button>
  </form>
</section>
\`\`\``,
          order: 4
        }
      ],

      quiz: {
        id:            "html-basics-quiz",
        titleEn:       "HTML Basics Quiz",
        titlePs:       "د HTML بنسټونو ازموینه",
        titleDa:       "آزمون مبانی HTML",
        descriptionEn: "Test your understanding of HTML structure, tags, attributes, and forms. Pass with 70% or higher to unlock Module 2.",
        descriptionPs: "د HTML جوړښت، ټاګونو، خصوصیتونو، او فورمونو خپله پوهه وازمویئ. د دویم ماډیول د خلاصولو لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        descriptionDa: "درک خود از ساختار HTML، تگ‌ها، ویژگی‌ها و فرم‌ها را آزمایش کنید. برای باز کردن ماژول ۲ با ۷۰٪ یا بالاتر قبول شوید.",
        passScore: 70,
        questions: [
          {
            id: "html-q1", promptEn: "What does HTML stand for?", promptPs: "HTML لنډیز د کومو کلمو دی؟", promptDa: "HTML مخفف چه عبارتی است؟",
            options: [
              { en: "HyperText Markup Language",    ps: "HyperText Markup Language",    da: "HyperText Markup Language",    correct: true  },
              { en: "High Transfer Markup Language", ps: "High Transfer Markup Language", da: "High Transfer Markup Language", correct: false },
              { en: "HyperText Machine Learning",    ps: "HyperText Machine Learning",    da: "HyperText Machine Learning",    correct: false }
            ]
          },
          {
            id: "html-q2", promptEn: "Which tag creates a hyperlink?", promptPs: "کوم ټاګ هایپرلینک جوړوي؟", promptDa: "کدام تگ یک هایپرلینک ایجاد می‌کند؟",
            options: [
              { en: "<link>", ps: "<link>", da: "<link>", correct: false },
              { en: "<a>",    ps: "<a>",    da: "<a>",    correct: true  },
              { en: "<href>", ps: "<href>", da: "<href>", correct: false }
            ]
          },
          {
            id: "html-q3", promptEn: "What attribute holds the URL in an anchor tag?", promptPs: "د انکر ټاګ کې کوم خصوصیت URL لري؟", promptDa: "کدام ویژگی URL را در تگ لنگر نگه می‌دارد؟",
            options: [
              { en: "src",  ps: "src",  da: "src",  correct: false },
              { en: "link", ps: "link", da: "link", correct: false },
              { en: "href", ps: "href", da: "href", correct: true  }
            ]
          },
          {
            id: "html-q4", promptEn: "Which input type hides the characters the user types?", promptPs: "کوم د ننوتلو ډول د کارونکي لیکل شوي حروف پټوي؟", promptDa: "کدام نوع ورودی کاراکترهایی که کاربر تایپ می‌کند را پنهان می‌کند؟",
            options: [
              { en: "hidden",   ps: "hidden",   da: "hidden",   correct: false },
              { en: "password", ps: "password", da: "password", correct: true  },
              { en: "secret",   ps: "secret",   da: "secret",   correct: false }
            ]
          },
          {
            id: "html-q5", promptEn: "What is the purpose of the alt attribute on an <img> tag?", promptPs: "د <img> ټاګ د alt خصوصیت موخه څه ده؟", promptDa: "هدف ویژگی alt در تگ <img> چیست؟",
            options: [
              { en: "Sets the image width",                              ps: "د انځور عرض ټاکي",                    da: "عرض تصویر را تنظیم می‌کند",                             correct: false },
              { en: "Provides alternative text if the image cannot load", ps: "که انځور بار نشي، بدیل متن وړاندې کوي", da: "اگر تصویر بارگذاری نشود، متن جایگزین فراهم می‌کند", correct: true  },
              { en: "Links the image to another page",                   ps: "انځور بل پاڼه سره تړي",               da: "تصویر را به صفحه دیگری لینک می‌کند",                    correct: false }
            ]
          }
        ]
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 2 — CSS Styling
    // ══════════════════════════════════════════════════════════════════════════
    {
      id:      "css-styling",
      titleEn: "CSS Styling",
      titlePs: "د CSS سینګار",
      titleDa: "طراحی با CSS",
      order:   2,
      lessons: [
        // ── Video 1 ──────────────────────────────────────────────────────────
        {
          id:            "css-intro",
          type:          "VIDEO",
          titleEn:       "Introduction to CSS",
          titlePs:       "د CSS پېژندنه",
          titleDa:       "معرفی CSS",
          descriptionEn: "Learn what CSS is, how to link a stylesheet to HTML, and how selectors target elements.",
          descriptionPs: "زده کړئ CSS څه دی، سټایل‌شیټ HTML سره څنګه تړل کیږي، او سلیکټرونه د عناصرو ټاکلو لپاره کیف کاریږي.",
          descriptionDa: "بیاموزید CSS چیست، چگونه یک استایل‌شیت به HTML لینک می‌شود و چگونه انتخاب‌گرها عناصر را هدف قرار می‌دهند.",
          youtubeId:     "wRNinF7YQqQ",
          readingEn: `## Introduction to CSS

CSS (Cascading Style Sheets) controls how HTML elements **look** — colors, fonts, spacing, layout, and more. Without CSS a web page is plain black text on a white background.

### Three ways to add CSS

1. **External stylesheet** (recommended)
   \`\`\`html
   <link rel="stylesheet" href="style.css">
   \`\`\`
   Place inside \`<head>\`. One file styles the whole site.

2. **Internal** — a \`<style>\` block inside \`<head>\`
   \`\`\`html
   <style>
     h1 { color: navy; }
   </style>
   \`\`\`

3. **Inline** — a \`style\` attribute directly on an element (avoid for anything beyond quick tests)
   \`\`\`html
   <p style="color: red;">Warning</p>
   \`\`\`

### Anatomy of a CSS rule

\`\`\`css
selector {
  property: value;
}

/* Example */
h1 {
  color: #1a73e8;
  font-size: 2rem;
  font-weight: 700;
}
\`\`\`

### Common selectors

| Selector | Example | Targets |
|----------|---------|---------|
| Element  | \`p\`      | All \`<p>\` elements |
| Class    | \`.card\`  | All elements with \`class="card"\` |
| ID       | \`#hero\`  | The one element with \`id="hero"\` |
| Descendant | \`.nav a\` | \`<a>\` tags anywhere inside \`.nav\` |
| Child    | \`ul > li\` | \`<li>\` that are direct children of \`<ul>\` |
| Pseudo-class | \`a:hover\` | \`<a>\` when the cursor is on it |

### Specificity — which rule wins?

When two rules target the same element, the more *specific* selector wins:

\`\`\`
Inline style  > ID  > Class  > Element
    1000      > 100 >   10   >    1
\`\`\``,
          readingPs: `## د CSS پېژندنه

CSS (Cascading Style Sheets) کنترولوي چې HTML عناصر **څنګه ښکاري**.

### د CSS قاعدې جوړښت

\`\`\`css
h1 {
  color: #1a73e8;
  font-size: 2rem;
}
\`\`\`

### عام سلیکټرونه

| سلیکټر | بیلګه | هدف |
|--------|-------|-----|
| عنصر   | \`p\`   | ټول \`<p>\` عناصر |
| کلاس   | \`.card\` | د \`class="card"\` ټول عناصر |
| ID     | \`#hero\` | د \`id="hero"\` عنصر |`,
          readingDa: `## معرفی CSS

CSS (صفحات سبک آبشاری) کنترول می‌کند که عناصر HTML چگونه **به نظر برسند**.

### ساختار یک قانون CSS

\`\`\`css
h1 {
  color: #1a73e8;
  font-size: 2rem;
}
\`\`\`

### انتخاب‌گرهای رایج

| انتخاب‌گر | مثال | هدف |
|-----------|------|-----|
| عنصر | \`p\` | همه عناصر \`<p>\` |
| کلاس | \`.card\` | عناصر با \`class="card"\` |
| ID | \`#hero\` | عنصر با \`id="hero"\` |`,
          order: 1
        },

        // ── Video 2 ──────────────────────────────────────────────────────────
        {
          id:            "css-box-model",
          type:          "VIDEO",
          titleEn:       "The Box Model & Spacing",
          titlePs:       "د بکس ماډل او فاصله",
          titleDa:       "مدل جعبه و فاصله‌گذاری",
          descriptionEn: "Every HTML element is a box. Understand margin, border, padding, and width to control layout with precision.",
          descriptionPs: "هر HTML عنصر یو بکس دی. د ترتیب د دقیق کنترول لپاره مارجین، بارډر، پیډینګ، او عرض وپوهیئ.",
          descriptionDa: "هر عنصر HTML یک جعبه است. مارجین، بوردر، پدینگ و عرض را برای کنترل دقیق چیدمان درک کنید.",
          youtubeId:     "rIO5326FgbE",
          readingEn: `## The CSS Box Model

Every element is surrounded by four layers — from inside out:

\`\`\`
┌────────────────────────────────┐
│            MARGIN              │  space outside the border
│  ┌────────────────────────┐   │
│  │         BORDER         │   │
│  │  ┌──────────────────┐  │   │
│  │  │     PADDING      │  │   │  space inside the border
│  │  │  ┌────────────┐  │  │   │
│  │  │  │  CONTENT   │  │  │   │
│  │  │  └────────────┘  │  │   │
│  │  └──────────────────┘  │   │
│  └────────────────────────┘   │
└────────────────────────────────┘
\`\`\`

### Example

\`\`\`css
.card {
  width: 320px;
  padding: 24px;           /* inner breathing room */
  border: 1px solid #ddd;  /* visible edge */
  margin: 16px auto;       /* 16px top/bottom, centered left/right */
  border-radius: 8px;      /* rounded corners */
  box-sizing: border-box;  /* width includes padding & border */
}
\`\`\`

### Shorthand for margin and padding

\`\`\`css
/* Four values: top right bottom left (clockwise) */
margin: 10px 20px 10px 20px;

/* Two values: top/bottom  left/right */
padding: 12px 24px;

/* One value: all four sides */
margin: 16px;

/* Individual sides */
padding-top: 8px;
margin-left: 0;
\`\`\`

### Always use box-sizing: border-box

Without it, adding padding increases the element's total rendered width beyond what \`width\` says, which breaks layouts. Set it globally once at the top of your stylesheet:

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
}
\`\`\``,
          readingPs: `## د CSS بکس ماډل

هر عنصر له څلورو پوښونو لخوا احاطه شوی:

- **محتوا** (Content): اصلي متن یا انځور
- **پیډینګ** (Padding): د بارډر دننه فاصله
- **بارډر** (Border): لیدل کیدونکی کناره
- **مارجین** (Margin): د بارډر بهر فاصله

\`\`\`css
.card {
  padding: 24px;
  border: 1px solid #ddd;
  margin: 16px auto;
  box-sizing: border-box;
}
\`\`\``,
          readingDa: `## مدل جعبه CSS

هر عنصر توسط چهار لایه احاطه شده است:

- **محتوا** (Content): متن یا تصویر اصلی
- **پدینگ** (Padding): فضای داخل بوردر
- **بوردر** (Border): لبه قابل مشاهده
- **مارجین** (Margin): فضای خارج از بوردر

\`\`\`css
.card {
  padding: 24px;
  border: 1px solid #ddd;
  margin: 16px auto;
  box-sizing: border-box;
}
\`\`\``,
          order: 2
        },

        // ── Video 3 ──────────────────────────────────────────────────────────
        {
          id:            "css-flexbox",
          type:          "VIDEO",
          titleEn:       "Flexbox Layout",
          titlePs:       "د فلیکس‌باکس ترتیب",
          titleDa:       "چیدمان فلکس‌باکس",
          descriptionEn: "Master the Flexbox system to align and distribute elements in rows and columns without manual calculation.",
          descriptionPs: "د فلیکس‌باکس سیستم مسلط کړئ ترڅو پرته له لاسي حساب کولو عناصر ورتیاییو او کالمونو کې سمبال کړئ.",
          descriptionDa: "سیستم فلکس‌باکس را برای تراز و توزیع عناصر در ردیف‌ها و ستون‌ها بدون محاسبه دستی یاد بگیرید.",
          youtubeId:     "phWxA89Dy94",
          readingEn: `## Flexbox Layout

Flexbox is the most practical tool for one-dimensional layouts (a row **or** a column).

### Enabling Flexbox

\`\`\`css
.container {
  display: flex;
}
\`\`\`

All direct children of \`.container\` become **flex items** and line up in a row by default.

### Container properties

| Property | Common values | Effect |
|----------|--------------|--------|
| \`flex-direction\` | \`row\` / \`column\` | Main axis direction |
| \`justify-content\` | \`flex-start\` \`center\` \`space-between\` \`space-around\` \`space-evenly\` | Align on main axis |
| \`align-items\` | \`flex-start\` \`center\` \`stretch\` \`flex-end\` | Align on cross axis |
| \`gap\` | \`16px\` | Space between items (no margin hacks needed) |
| \`flex-wrap\` | \`wrap\` \`nowrap\` | Allow items to wrap to next row |

### Item properties

| Property | Example | Effect |
|----------|---------|--------|
| \`flex: 1\` | \`flex: 1\` | Item grows to fill available space |
| \`flex: 0 0 200px\` | — | Fixed width, no grow/shrink |
| \`align-self\` | \`align-self: flex-end\` | Override container's \`align-items\` for this item |
| \`order\` | \`order: -1\` | Change visual order without changing HTML order |

### Practical examples

**Navigation bar**
\`\`\`css
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 64px;
}
\`\`\`

**Centered card**
\`\`\`css
.page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
\`\`\`

**Equal-width columns**
\`\`\`css
.columns {
  display: flex;
  gap: 24px;
}
.columns > * {
  flex: 1;
}
\`\`\``,
          readingPs: `## د فلیکس‌باکس ترتیب

فلیکس‌باکس د یو اړخیزو ترتیبونو لپاره تر ټولو عملي وسیله ده.

\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
\`\`\`

### د کنتینر خصوصیتونه

| خصوصیت | اغیز |
|---------|------|
| \`flex-direction\` | د اصلي محور لوری |
| \`justify-content\` | د اصلي محور پر سر سمون |
| \`align-items\` | د متقاطع محور پر سر سمون |
| \`gap\` | د آیټمونو ترمنځ فاصله |`,
          readingDa: `## چیدمان فلکس‌باکس

فلکس‌باکس عملی‌ترین ابزار برای چیدمان‌های یک‌بُعدی است.

\`\`\`css
.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
\`\`\`

### ویژگی‌های کانتینر

| ویژگی | تأثیر |
|-------|-------|
| \`flex-direction\` | جهت محور اصلی |
| \`justify-content\` | تراز روی محور اصلی |
| \`align-items\` | تراز روی محور عرضی |
| \`gap\` | فاصله بین آیتم‌ها |`,
          order: 3
        },

        // ── Video 4 ──────────────────────────────────────────────────────────
        {
          id:            "css-responsive",
          type:          "VIDEO",
          titleEn:       "Responsive Design & Media Queries",
          titlePs:       "ځوابند ډیزاین او میډیا کویریز",
          titleDa:       "طراحی واکنش‌گرا و مدیا کوئری‌ها",
          descriptionEn: "Make web pages look good on phones, tablets, and desktops using media queries and relative units.",
          descriptionPs: "د میډیا کویریز او اړونده واحدونو له کارولو سره ویب پاڼې د ګرځنده، ټبلیټ، او ډیسکټاپ پر سر ښه ښکاري کړئ.",
          descriptionDa: "صفحات وب را با استفاده از مدیا کوئری‌ها و واحدهای نسبی روی گوشی، تبلت و دسکتاپ زیبا کنید.",
          youtubeId:     "bn-DQCifeQQ",
          readingEn: `## Responsive Design

A responsive site adapts to whatever screen size the user has. The key tools are **media queries** and **relative units**.

### Relative units

| Unit | Meaning | Best for |
|------|---------|---------|
| \`%\` | Percentage of parent width | Fluid widths |
| \`vw\` | % of viewport width | Full-width sections |
| \`vh\` | % of viewport height | Full-height sections |
| \`rem\` | Multiple of root font size (usually 16px) | Font sizes, spacing |
| \`em\` | Multiple of current element's font size | Component-relative spacing |

### Media queries

\`\`\`css
/* ── Mobile first (default styles, no query needed) ── */
.grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Tablet (≥ 640px) ── */
@media (min-width: 640px) {
  .grid {
    flex-direction: row;
    flex-wrap: wrap;
  }
  .grid > * {
    flex: 1 1 calc(50% - 8px);
  }
}

/* ── Desktop (≥ 1024px) ── */
@media (min-width: 1024px) {
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
}
\`\`\`

### The viewport meta tag

Without this tag, mobile browsers zoom out to show the desktop version. Always include it:

\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

### Mobile-first vs desktop-first

**Mobile-first** (recommended): write base styles for phones, then use \`min-width\` queries to enhance for larger screens. You add features as space grows.

**Desktop-first**: write base styles for large screens, then use \`max-width\` queries to strip things back. You subtract features as space shrinks — harder to manage.`,
          readingPs: `## ځوابند ډیزاین

یو ځوابند سایټ د کارونکي د سکرین اندازې سره برابریږي.

### اړونده واحدونه

| واحد | مفهوم |
|------|-------|
| \`%\` | د والدین د عرض سلنه |
| \`vw\` | د لیدغاه د عرض سلنه |
| \`rem\` | د اصلي فونټ اندازې ضرب |

### میډیا کویریز

\`\`\`css
/* ګرځنده (پیش فرض) */
.grid { flex-direction: column; }

/* ټبلیټ */
@media (min-width: 640px) {
  .grid { flex-direction: row; }
}

/* ډیسکټاپ */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
\`\`\``,
          readingDa: `## طراحی واکنش‌گرا

یک سایت واکنش‌گرا با هر اندازه صفحه‌ای که کاربر دارد سازگار می‌شود.

### واحدهای نسبی

| واحد | معنی |
|------|------|
| \`%\` | درصد عرض والد |
| \`vw\` | درصد عرض ویوپورت |
| \`rem\` | ضریب اندازه فونت ریشه |

### مدیا کوئری‌ها

\`\`\`css
/* موبایل (پیش‌فرض) */
.grid { flex-direction: column; }

/* تبلت */
@media (min-width: 640px) {
  .grid { flex-direction: row; }
}

/* دسکتاپ */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
\`\`\``,
          order: 4
        },

        // ── Reading lesson ────────────────────────────────────────────────────
        {
          id:            "css-practice",
          type:          "READING",
          titleEn:       "Practice: Style the Profile Page with CSS",
          titlePs:       "تمرین: د CSS سره د پروفایل پاڼه سینګار کړئ",
          titleDa:       "تمرین: صفحه پروفایل را با CSS طراحی کنید",
          descriptionEn: "Take the HTML profile page you built in Module 1 and transform it into a polished, styled page using everything you have learned in this module.",
          descriptionPs: "هغه HTML پروفایل پاڼه واخلئ چې تاسو د لومړي ماډیول کې جوړه کړه او د دې ماډیول زده کړو د کارولو سره یې جذابه سینګار شوې پاڼه کې بدل کړئ.",
          descriptionDa: "صفحه پروفایل HTML که در ماژول ۱ ساختید را با همه چیزهایی که در این ماژول یاد گرفتید تبدیل به یک صفحه شیک و طراحی شده کنید.",
          youtubeId:     null,
          readingEn: `## Practice: Style the Profile Page with CSS

In this lesson you will create \`style.css\` and link it to your \`profile.html\` to apply real styling.

---

### Step 1 — Create style.css and link it

Add this line inside \`<head>\` of your HTML file:

\`\`\`html
<link rel="stylesheet" href="style.css">
\`\`\`

Create a new file called \`style.css\` in the same folder.

---

### Step 2 — CSS reset and global styles

Start every stylesheet with a reset so browsers render consistently:

\`\`\`css
/* ── Reset ── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* ── Base ── */
body {
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #1a1a2e;
  background-color: #f5f5f5;
}

h1, h2, h3 {
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

p {
  margin-bottom: 1rem;
}

a {
  color: #1a73e8;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
\`\`\`

---

### Step 3 — Center the page content

\`\`\`css
/* ── Layout wrapper ── */
body > * {
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 20px;
}
\`\`\`

---

### Step 4 — Style the header

\`\`\`css
/* ── Header ── */
header {
  text-align: center;
  padding: 48px 20px 32px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
}

header img {
  width: 120px;
  height: 120px;
  border-radius: 50%;          /* circular photo */
  object-fit: cover;
  border: 3px solid #1a73e8;
  display: block;
  margin: 0 auto 16px;
}

header h1 {
  font-size: 2rem;
  color: #1a1a2e;
}

header p {
  color: #555;
  max-width: 480px;
  margin: 8px auto 0;
}
\`\`\`

---

### Step 5 — Style sections and lists

\`\`\`css
/* ── Sections ── */
section {
  background: white;
  padding: 32px 24px;
  margin: 24px 0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

section h2 {
  font-size: 1.25rem;
  color: #1a73e8;
  border-bottom: 2px solid #e8f0fe;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

ul, ol {
  padding-left: 24px;
}

li {
  margin-bottom: 8px;
  color: #333;
}
\`\`\`

---

### Step 6 — Style the contact form

\`\`\`css
/* ── Form ── */
form p {
  margin-bottom: 16px;
}

label {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  color: #444;
  margin-bottom: 4px;
}

input[type="text"],
input[type="email"],
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #1a73e8;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.15);
}

button[type="submit"] {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

button[type="submit"]:hover {
  background: #1558b0;
}
\`\`\`

---

### Step 7 — Style the footer

\`\`\`css
/* ── Footer ── */
footer {
  text-align: center;
  padding: 24px;
  color: #888;
  font-size: 0.875rem;
  border-top: 1px solid #e8e8e8;
  margin-top: 40px;
}
\`\`\`

---

### Step 8 — Add a responsive breakpoint

At narrow widths the header text should feel less cramped:

\`\`\`css
@media (max-width: 480px) {
  header h1 {
    font-size: 1.5rem;
  }

  section {
    padding: 20px 16px;
    border-radius: 8px;
  }
}
\`\`\`

---

### What to experiment with

- Try changing \`#1a73e8\` to a different brand color throughout
- Add a \`background: linear-gradient(135deg, #667eea, #764ba2)\` to the header
- Set \`font-family: 'Georgia', serif\` on the \`body\` for a different feel
- Add \`transition: transform 0.2s\` and \`transform: translateY(-2px)\` on \`li:hover\` in the skills list`,
          readingPs: `## تمرین: د CSS سره د پروفایل پاڼه سینګار کړئ

### ګام ۱ — style.css جوړ کړئ او تړلو

د HTML فایل \`<head>\` کې دا کرښه زیاته کړئ:

\`\`\`html
<link rel="stylesheet" href="style.css">
\`\`\`

### ګام ۲ — CSS ریسیټ او عمومي سټایلونه

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  background: #f5f5f5;
}
\`\`\`

### ګام ۳ — د سرلیک سینګار

\`\`\`css
header {
  text-align: center;
  padding: 48px 20px;
  background: white;
}

header img {
  width: 120px;
  border-radius: 50%;
  border: 3px solid #1a73e8;
  display: block;
  margin: 0 auto 16px;
}
\`\`\`

### ګام ۴ — د تڼۍ سینګار

\`\`\`css
button[type="submit"] {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 6px;
  cursor: pointer;
}
\`\`\``,
          readingDa: `## تمرین: صفحه پروفایل را با CSS طراحی کنید

### گام ۱ — style.css بسازید و لینک کنید

داخل \`<head>\` فایل HTML خود این خط را اضافه کنید:

\`\`\`html
<link rel="stylesheet" href="style.css">
\`\`\`

### گام ۲ — ریست CSS و سبک‌های کلی

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  background: #f5f5f5;
}
\`\`\`

### گام ۳ — هدر را طراحی کنید

\`\`\`css
header {
  text-align: center;
  padding: 48px 20px;
  background: white;
}

header img {
  width: 120px;
  border-radius: 50%;
  border: 3px solid #1a73e8;
  display: block;
  margin: 0 auto 16px;
}
\`\`\`

### گام ۴ — دکمه را طراحی کنید

\`\`\`css
button[type="submit"] {
  background: #1a73e8;
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 6px;
  cursor: pointer;
}
\`\`\``,
          order: 5
        }
      ],

      quiz: {
        id:            "css-styling-quiz",
        titleEn:       "CSS Styling Quiz",
        titlePs:       "د CSS سینګار ازموینه",
        titleDa:       "آزمون طراحی با CSS",
        descriptionEn: "Test your CSS knowledge — selectors, box model, Flexbox, and responsive design. Pass with 70% or higher to unlock Module 3.",
        descriptionPs: "خپله د CSS پوهه وازمویئ. د درېیم ماډیول لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        descriptionDa: "دانش CSS خود را آزمایش کنید — انتخاب‌گرها، مدل جعبه، فلکس‌باکس و طراحی واکنش‌گرا. برای باز کردن ماژول ۳ با ۷۰٪ یا بالاتر قبول شوید.",
        passScore: 70,
        questions: [
          {
            id: "css-q1", promptEn: "Which CSS property changes text color?", promptPs: "کوم CSS خصوصیت د متن رنګ بدلوي؟", promptDa: "کدام ویژگی CSS رنگ متن را تغییر می‌دهد؟",
            options: [
              { en: "font-color",  ps: "font-color",  da: "font-color",  correct: false },
              { en: "text-color",  ps: "text-color",  da: "text-color",  correct: false },
              { en: "color",       ps: "color",        da: "color",       correct: true  }
            ]
          },
          {
            id: "css-q2", promptEn: "In the box model, which layer is directly outside the content?", promptPs: "د بکس ماډل کې، کوم پوښ مستقیم د محتوا بهر دی؟", promptDa: "در مدل جعبه، کدام لایه مستقیماً بیرون از محتوا قرار دارد؟",
            options: [
              { en: "Margin",  ps: "مارجین",  da: "مارجین",  correct: false },
              { en: "Border",  ps: "بارډر",   da: "بوردر",   correct: false },
              { en: "Padding", ps: "پیډینګ",  da: "پدینگ",   correct: true  }
            ]
          },
          {
            id: "css-q3", promptEn: "Which CSS property enables Flexbox on a container?", promptPs: "کوم CSS خصوصیت د کنتینر پر سر فلیکس‌باکس فعالوي؟", promptDa: "کدام ویژگی CSS فلکس‌باکس را روی یک کانتینر فعال می‌کند؟",
            options: [
              { en: "display: flex", ps: "display: flex", da: "display: flex", correct: true  },
              { en: "flex: true",    ps: "flex: true",    da: "flex: true",    correct: false },
              { en: "layout: flex",  ps: "layout: flex",  da: "layout: flex",  correct: false }
            ]
          },
          {
            id: "css-q4", promptEn: "What does a media query allow you to do?", promptPs: "میډیا کویري تاسو ته اجازه ورکوي چې څه وکړئ؟", promptDa: "یک مدیا کوئری به شما چه اجازه‌ای می‌دهد؟",
            options: [
              { en: "Query a database from CSS",                           ps: "له CSS نه ډیټابیس پوښتنه کول",                  da: "پرس‌وجو از پایگاه داده از CSS",                            correct: false },
              { en: "Apply different styles based on screen size",          ps: "د سکرین اندازې پر بنسټ مختلف سټایلونه پلي کول", da: "اعمال سبک‌های مختلف بر اساس اندازه صفحه",               correct: true  },
              { en: "Load images faster",                                   ps: "انځورونه ژر بارول",                              da: "بارگذاری سریع‌تر تصاویر",                                correct: false }
            ]
          },
          {
            id: "css-q5", promptEn: "What does justify-content: space-between do in Flexbox?", promptPs: "د فلیکس‌باکس کې justify-content: space-between څه کوي؟", promptDa: "justify-content: space-between در فلکس‌باکس چه می‌کند؟",
            options: [
              { en: "Adds padding inside each item",                                                    ps: "د هر آیټم دننه پیډینګ زیاتوي",                                           da: "پدینگ داخل هر آیتم اضافه می‌کند",                                                               correct: false },
              { en: "Spreads items with equal space between them, first and last at the edges",          ps: "آیټمونه یې خوروي نو منځ کې برابره فاصله وي، لومړی او وروستی پر سرحدونو", da: "آیتم‌ها را با فضای مساوی بین آنها پخش می‌کند، اول و آخر در لبه‌ها",             correct: true  },
              { en: "Centers all items",                                                                  ps: "ټول آیټمونه مرکز ته اړوي",                                                da: "همه آیتم‌ها را در مرکز قرار می‌دهد",                                                             correct: false }
            ]
          }
        ]
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 3 — JavaScript Fundamentals
    // ══════════════════════════════════════════════════════════════════════════
    {
      id:      "javascript-fundamentals",
      titleEn: "JavaScript Fundamentals",
      titlePs: "د JavaScript بنسټونه",
      titleDa: "مبانی JavaScript",
      order:   3,
      lessons: [
        // ── Video 1 ──────────────────────────────────────────────────────────
        {
          id:            "js-intro-variables",
          type:          "VIDEO",
          titleEn:       "Variables, Data Types & Operators",
          titlePs:       "متغیرونه، د معلوماتو ډولونه او عملیات",
          titleDa:       "متغیرها، انواع داده و عملگرها",
          descriptionEn: "Learn how to store values in variables, the basic JavaScript data types, and how to work with them using operators.",
          descriptionPs: "زده کړئ چې متغیرونو کې ارزښتونه د ذخیره کولو لار، د JavaScript بنسټیز د معلوماتو ډولونه، او د عملیاتو له لارې یې سره کارول.",
          descriptionDa: "بیاموزید چگونه مقادیر را در متغیرها ذخیره کنید، انواع داده پایه JavaScript و نحوه کار با آنها با استفاده از عملگرها.",
          youtubeId:     "edlFjlzxkSI",
          readingEn: `## Variables, Data Types & Operators

### Declaring variables

\`\`\`js
let   name = "Ahmad";  // can be reassigned
const age  = 24;       // cannot be reassigned — use this by default
var   city = "Kabul";  // old style — avoid in modern code
\`\`\`

> **Rule of thumb:** always start with \`const\`. Change to \`let\` only when you know the value will be reassigned. Never use \`var\`.

### Primitive data types

| Type | Example | Notes |
|------|---------|-------|
| \`string\` | \`"Ahmad"\`, \`'hello'\` | Text; use template literals with \${} to embed values |
| \`number\` | \`42\`, \`3.14\`, \`-7\` | All numbers (integer and float) share one type |
| \`boolean\` | \`true\`, \`false\` | Yes/no, on/off |
| \`null\` | \`null\` | Intentionally empty — you set it |
| \`undefined\` | \`undefined\` | Variable declared but not assigned — JS sets it |

### Reference types (objects)

\`\`\`js
// Array — ordered list of values
const skills = ["HTML", "CSS", "JavaScript"];
skills[0]; // "HTML"
skills.length; // 3

// Object — key/value pairs
const user = { name: "Ahmad", age: 24, city: "Kabul" };
user.name;       // "Ahmad" — dot notation
user["city"];    // "Kabul" — bracket notation
\`\`\`

### Operators

\`\`\`js
// Arithmetic
5 + 3   // 8
10 - 4  // 6
6 * 7   // 42
9 / 3   // 3
10 % 3  // 1  (remainder / modulo)
2 ** 8  // 256 (exponentiation)

// String concatenation
"Hello" + " " + "Ahmad"  // "Hello Ahmad"
\`Hello \${name}!\`         // template literal — same result, cleaner

// Comparison — always use === (strict), never == (loose)
5 === 5    // true  — same value AND same type
5 === "5"  // false — number ≠ string
5 !== 3    // true
5 > 3      // true
5 >= 5     // true

// Logical
true && false  // false (AND — both must be true)
true || false  // true  (OR  — either can be true)
!true          // false (NOT — flips the boolean)
\`\`\``,
          readingPs: `## متغیرونه، د معلوماتو ډولونه او عملیات

### د متغیرونو اعلان

\`\`\`js
const name = "احمد";  // بیا ټاکل نه شي
let   age  = 24;      // بیا ټاکل کیدی شي
\`\`\`

**قاعده:** تل \`const\` پیل کړئ، یوازې هله \`let\` وکاروئ چې ارزښت به بدل شي.

### بنسټیز ډولونه

| ډول | بیلګه |
|-----|-------|
| \`string\` | \`"احمد"\` |
| \`number\` | \`42\`, \`3.14\` |
| \`boolean\` | \`true\`, \`false\` |

### عملیات

\`\`\`js
5 + 3   // 8
5 === 5  // true (سخت مساواتو)
5 !== 3  // true
\`\`\``,
          readingDa: `## متغیرها، انواع داده و عملگرها

### اعلام متغیرها

\`\`\`js
const name = "احمد";  // قابل تخصیص مجدد نیست
let   age  = 24;      // قابل تخصیص مجدد است
\`\`\`

**قانون:** همیشه با \`const\` شروع کنید، فقط زمانی \`let\` استفاده کنید که مقدار تغییر می‌کند.

### انواع پایه

| نوع | مثال |
|-----|------|
| \`string\` | \`"احمد"\` |
| \`number\` | \`42\`, \`3.14\` |
| \`boolean\` | \`true\`, \`false\` |

### عملگرها

\`\`\`js
5 + 3   // 8
5 === 5  // true (تساوی دقیق)
5 !== 3  // true
\`\`\``,
          order: 1
        },

        // ── Video 2 ──────────────────────────────────────────────────────────
        {
          id:            "js-functions",
          type:          "VIDEO",
          titleEn:       "Functions & Control Flow",
          titlePs:       "فنکشنونه او د جریان کنترول",
          titleDa:       "توابع و کنترول جریان",
          descriptionEn: "Write reusable functions and learn how to make decisions with if/else and loop through data with for loops.",
          descriptionPs: "د بیاکارونې وړ فنکشنونه ولیکئ او د if/else سره پریکړه کول او د for لوپونو سره د معلوماتو له لارې تیریدل زده کړئ.",
          descriptionDa: "توابع قابل استفاده مجدد بنویسید و یاد بگیرید چگونه با if/else تصمیم بگیرید و با حلقه‌های for از داده‌ها عبور کنید.",
          youtubeId:     "xUI5Tsl2JpY",
          readingEn: `## Functions & Control Flow

### Functions

A function is a named, reusable block of code.

\`\`\`js
// Declaration — hoisted (can be called before it's defined)
function greet(name) {
  return "Hello, " + name + "!";
}

// Expression — not hoisted
const greet = function(name) {
  return "Hello, " + name + "!";
};

// Arrow function — modern shorthand
const greet = (name) => "Hello, " + name + "!";

// Arrow function with multiple lines
const add = (a, b) => {
  const result = a + b;
  return result;
};

// Default parameters
function greet(name = "stranger") {
  return \`Hello, \${name}!\`;
}
greet();         // "Hello, stranger!"
greet("Fatima"); // "Hello, Fatima!"
\`\`\`

### if / else if / else

\`\`\`js
const score = 85;

if (score >= 90) {
  console.log("A — Excellent!");
} else if (score >= 70) {
  console.log("B — Good pass");
} else if (score >= 50) {
  console.log("C — Needs improvement");
} else {
  console.log("F — Please retake");
}
\`\`\`

### Ternary operator — one-line if/else

\`\`\`js
const label = score >= 70 ? "Pass" : "Fail";
\`\`\`

### for loop

\`\`\`js
for (let i = 0; i < 5; i++) {
  console.log("Count:", i);  // 0, 1, 2, 3, 4
}

// Loop over an array
const fruits = ["apple", "banana", "mango"];
for (const fruit of fruits) {
  console.log(fruit);
}

// forEach (common for arrays)
fruits.forEach((fruit, index) => {
  console.log(index, fruit);
});
\`\`\`

### while loop

\`\`\`js
let count = 0;
while (count < 3) {
  console.log("count is", count);
  count++;
}
\`\`\``,
          readingPs: `## فنکشنونه او د جریان کنترول

### فنکشنونه

\`\`\`js
// اعلان
function greet(name) {
  return "سلام، " + name + "!";
}

// د تیرو فنکشن (Arrow)
const greet = (name) => \`سلام، \${name}!\`;

// د پیش فرض پارامتر
function greet(name = "لیدونکی") {
  return \`سلام، \${name}!\`;
}
\`\`\`

### if / else if / else

\`\`\`js
const score = 85;

if (score >= 90) {
  console.log("ممتاز!");
} else if (score >= 70) {
  console.log("ښه!");
} else {
  console.log("نور هڅه وکړئ");
}
\`\`\`

### for لوپ

\`\`\`js
for (let i = 0; i < 5; i++) {
  console.log(i);
}

const fruits = ["مڼه", "کیله", "انبه"];
for (const fruit of fruits) {
  console.log(fruit);
}
\`\`\``,
          readingDa: `## توابع و کنترول جریان

### توابع

\`\`\`js
// اعلام
function greet(name) {
  return "سلام، " + name + "!";
}

// تابع پیکانی (Arrow)
const greet = (name) => \`سلام، \${name}!\`;

// پارامتر پیش‌فرض
function greet(name = "بازدیدکننده") {
  return \`سلام، \${name}!\`;
}
\`\`\`

### if / else if / else

\`\`\`js
const score = 85;

if (score >= 90) {
  console.log("عالی!");
} else if (score >= 70) {
  console.log("خوب!");
} else {
  console.log("بیشتر تلاش کنید");
}
\`\`\`

### حلقه for

\`\`\`js
for (let i = 0; i < 5; i++) {
  console.log(i);
}

const fruits = ["سیب", "موز", "انبه"];
for (const fruit of fruits) {
  console.log(fruit);
}
\`\`\``,
          order: 2
        },

        // ── Video 3 ──────────────────────────────────────────────────────────
        {
          id:            "js-dom",
          type:          "VIDEO",
          titleEn:       "DOM Manipulation",
          titlePs:       "د DOM اداره کول",
          titleDa:       "دستکاری DOM",
          descriptionEn: "Use JavaScript to select HTML elements, change their content and styles, and respond to user events like clicks.",
          descriptionPs: "د JavaScript له کارولو سره HTML عناصر وټاکئ، د هغوی محتوا او سټایل بدل کړئ، او د کارونکي پیښو لکه کلیکونو ته ځواب ورکړئ.",
          descriptionDa: "از JavaScript برای انتخاب عناصر HTML، تغییر محتوا و سبک‌ها و پاسخ به رویدادهای کاربر مانند کلیک‌ها استفاده کنید.",
          youtubeId:     "5fb2aPlgoys",
          readingEn: `## DOM Manipulation

The DOM (Document Object Model) is the browser's live tree of all HTML elements. JavaScript can read and modify it to make pages interactive.

### Selecting elements

\`\`\`js
// Single element — returns first match or null
const heading   = document.querySelector("h1");
const btn       = document.querySelector("#submitBtn");
const firstCard = document.querySelector(".card");

// Multiple elements — returns a NodeList (like an array)
const allCards  = document.querySelectorAll(".card");
const allLinks  = document.querySelectorAll("a");
\`\`\`

### Reading & changing content

\`\`\`js
// Text content (safe — no HTML injection risk)
heading.textContent = "Welcome!";
console.log(heading.textContent);

// HTML content (use carefully — avoid user-supplied values)
heading.innerHTML = "<em>Welcome</em>, <strong>Ahmad!</strong>";

// Attributes
const img = document.querySelector("img");
img.setAttribute("src", "new-photo.jpg");
img.setAttribute("alt", "Updated photo");
const src = img.getAttribute("src");

// Styles
heading.style.color = "navy";
heading.style.fontSize = "2.5rem";
\`\`\`

### Classes

\`\`\`js
const card = document.querySelector(".card");

card.classList.add("active");      // add a class
card.classList.remove("active");   // remove a class
card.classList.toggle("active");   // add if absent, remove if present
card.classList.contains("active"); // true / false
\`\`\`

### Creating & inserting elements

\`\`\`js
const li = document.createElement("li");
li.textContent = "New skill";
li.classList.add("skill-item");

const list = document.querySelector("ul");
list.appendChild(li);   // add at end
list.prepend(li);        // add at beginning
\`\`\`

### Event listeners

\`\`\`js
const btn = document.querySelector("#saveBtn");

btn.addEventListener("click", (event) => {
  event.preventDefault();   // stop default action (e.g. form submit)
  console.log("Saved!", event.target);
});

// Remove listener when done
const handler = () => console.log("clicked");
btn.addEventListener("click", handler);
btn.removeEventListener("click", handler);
\`\`\`

### Common events

| Event | Fires when... |
|-------|--------------|
| \`click\` | User clicks the element |
| \`dblclick\` | User double-clicks |
| \`input\` | Value of input/textarea changes |
| \`change\` | Select or checkbox changes |
| \`submit\` | Form is submitted |
| \`keydown\` | Any key is pressed |
| \`keyup\` | Any key is released |
| \`mouseover\` | Cursor enters element |
| \`mouseout\` | Cursor leaves element |
| \`load\` | Page or image finishes loading |
| \`DOMContentLoaded\` | HTML parsed, before images load |`,
          readingPs: `## د DOM اداره کول

DOM د ټولو HTML عناصرو د لطبي ونې ژوند بڼه ده. JavaScript یې لوستلی او بدلولی شي.

### عناصر انتخابول

\`\`\`js
const heading = document.querySelector("h1");
const allCards = document.querySelectorAll(".card");
\`\`\`

### محتوا او سټایل بدلول

\`\`\`js
heading.textContent = "ښه راغلاست!";
heading.style.color = "navy";

const card = document.querySelector(".card");
card.classList.add("active");
card.classList.toggle("active");
\`\`\`

### د پیښو اورونکي

\`\`\`js
const btn = document.querySelector("#saveBtn");

btn.addEventListener("click", (event) => {
  event.preventDefault();
  console.log("خوندي شو!");
});
\`\`\``,
          readingDa: `## دستکاری DOM

DOM درخت زنده همه عناصر HTML در مرورگر است. JavaScript می‌تواند آن را بخواند و تغییر دهد.

### انتخاب عناصر

\`\`\`js
const heading = document.querySelector("h1");
const allCards = document.querySelectorAll(".card");
\`\`\`

### تغییر محتوا و سبک

\`\`\`js
heading.textContent = "خوش آمدید!";
heading.style.color = "navy";

const card = document.querySelector(".card");
card.classList.add("active");
card.classList.toggle("active");
\`\`\`

### شنوندگان رویداد

\`\`\`js
const btn = document.querySelector("#saveBtn");

btn.addEventListener("click", (event) => {
  event.preventDefault();
  console.log("ذخیره شد!");
});
\`\`\``,
          order: 3
        },

        // ── Reading lesson ────────────────────────────────────────────────────
        {
          id:            "js-practice",
          type:          "READING",
          titleEn:       "Practice: Build an Interactive To-Do List",
          titlePs:       "تمرین: د تعاملي کارونو لیست جوړ کړئ",
          titleDa:       "تمرین: لیست کارهای تعاملی بسازید",
          descriptionEn: "Combine HTML, CSS, and JavaScript to build a fully working to-do list app — add tasks, mark them done, and delete them.",
          descriptionPs: "HTML، CSS، او JavaScript یو ځای کړئ او د بشپړ کارونو لیست اپ جوړ کړئ — کارونه زیاتئ، بشپړ شوي یې نښه کړئ، او ړنګ یې کړئ.",
          descriptionDa: "HTML، CSS و JavaScript را با هم ترکیب کنید و یک اپ لیست کارها بسازید — کارها را اضافه کنید، انجام شده علامت بزنید و حذف کنید.",
          youtubeId:     null,
          readingEn: `## Practice: Build an Interactive To-Do List

This is your capstone project for the course. You will combine HTML structure, CSS styling, and JavaScript DOM manipulation to build a working to-do list app from scratch.

### Features

- Type a task and press **Enter** or click **Add** to add it to the list
- Click a task to toggle it as **done** (strikethrough)
- Click the **✕** button to delete a task
- Shows a live count of remaining tasks

---

### Step 1 — HTML (index.html)

\`\`\`html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>To-Do List</title>
    <link rel="stylesheet" href="todo.css">
  </head>
  <body>
    <div class="app">
      <h1>My Tasks</h1>

      <div class="input-row">
        <input
          type="text"
          id="taskInput"
          placeholder="What needs to be done?"
          autocomplete="off"
        >
        <button id="addBtn">Add</button>
      </div>

      <p class="count" id="taskCount">0 tasks remaining</p>

      <ul id="taskList"></ul>
    </div>

    <script src="todo.js"></script>
  </body>
</html>
\`\`\`

---

### Step 2 — CSS (todo.css)

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #f0f4ff;
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
}

.app {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 32px;
  width: 100%;
  max-width: 480px;
}

h1 {
  font-size: 1.75rem;
  color: #1a1a2e;
  margin-bottom: 24px;
}

/* ── Input row ── */
.input-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.input-row input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.input-row input:focus {
  outline: none;
  border-color: #4f46e5;
}

.input-row button {
  padding: 10px 20px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.input-row button:hover {
  background: #3730a3;
}

/* ── Count ── */
.count {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 16px;
}

/* ── Task list ── */
#taskList {
  list-style: none;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  animation: slideIn 0.2s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.task-text {
  flex: 1;
  font-size: 1rem;
  cursor: pointer;
  color: #1a1a2e;
  transition: color 0.2s;
}

.task-item.done .task-text {
  text-decoration: line-through;
  color: #aaa;
}

.delete-btn {
  background: none;
  border: none;
  color: #ccc;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.2s;
}

.delete-btn:hover {
  color: #ef4444;
}
\`\`\`

---

### Step 3 — JavaScript (todo.js)

\`\`\`js
// ── State ──────────────────────────────────────────────────
let tasks = [];  // each task: { id, text, done }

// ── DOM references ──────────────────────────────────────────
const input     = document.getElementById("taskInput");
const addBtn    = document.getElementById("addBtn");
const taskList  = document.getElementById("taskList");
const taskCount = document.getElementById("taskCount");

// ── Add task ───────────────────────────────────────────────
function addTask() {
  const text = input.value.trim();
  if (!text) return;              // ignore empty input

  const task = {
    id:   Date.now(),             // unique id from timestamp
    text: text,
    done: false
  };

  tasks.push(task);
  input.value = "";               // clear the input
  renderTasks();
}

// ── Toggle done ────────────────────────────────────────────
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();
}

// ── Delete task ────────────────────────────────────────────
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

// ── Render list ────────────────────────────────────────────
function renderTasks() {
  taskList.innerHTML = "";         // clear existing list

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.done ? " done" : "");

    li.innerHTML = \`
      <span class="task-text">\${escapeHtml(task.text)}</span>
      <button class="delete-btn" aria-label="Delete task">✕</button>
    \`;

    // Click task text to toggle done
    li.querySelector(".task-text")
      .addEventListener("click", () => toggleTask(task.id));

    // Click ✕ to delete
    li.querySelector(".delete-btn")
      .addEventListener("click", () => deleteTask(task.id));

    taskList.appendChild(li);
  });

  // Update count
  const remaining = tasks.filter(t => !t.done).length;
  taskCount.textContent =
    remaining === 1 ? "1 task remaining" : \`\${remaining} tasks remaining\`;
}

// ── Helpers ────────────────────────────────────────────────
function escapeHtml(text) {
  // Prevent XSS by escaping < > & " in user input
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Event listeners ────────────────────────────────────────
addBtn.addEventListener("click", addTask);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});

// ── Initial render ─────────────────────────────────────────
renderTasks();
\`\`\`

---

### How it all works together

1. **State array** — \`tasks\` is the single source of truth. Every change updates this array, then calls \`renderTasks()\`.
2. **renderTasks** — clears the \`<ul>\` and rebuilds it from the current \`tasks\` array. This pattern (state → render) is the foundation of every modern JavaScript framework.
3. **escapeHtml** — never inject user input directly into \`innerHTML\` without escaping it first.

---

### Extend it yourself

- **Persist tasks**: save \`tasks\` to \`localStorage\` after every change and load it on page start with \`JSON.parse(localStorage.getItem("tasks") ?? "[]")\`
- **Filter tabs**: add "All / Active / Completed" buttons that filter the visible tasks
- **Drag to reorder**: explore the HTML Drag and Drop API
- **Edit in place**: double-click a task text to turn it into an \`<input>\`, save on blur`,
          readingPs: `## تمرین: د تعاملي کارونو لیست جوړ کړئ

دا د کورس ستاسو وروستۍ پروژه ده. تاسو به HTML، CSS، او JavaScript یو ځای کوئ.

### ب: د اساسي جوړښت (HTML)

\`\`\`html
<div class="app">
  <h1>زما کارونه</h1>
  <div class="input-row">
    <input type="text" id="taskInput" placeholder="کوم کار؟">
    <button id="addBtn">زیاتول</button>
  </div>
  <ul id="taskList"></ul>
</div>
\`\`\`

### JavaScript

\`\`\`js
let tasks = [];

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  if (!text) return;
  tasks.push({ id: Date.now(), text, done: false });
  document.getElementById("taskInput").value = "";
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.textContent = task.text;
    if (task.done) li.style.textDecoration = "line-through";
    li.addEventListener("click", () => toggleTask(task.id));
    list.appendChild(li);
  });
}

document.getElementById("addBtn").addEventListener("click", addTask);
renderTasks();
\`\`\``,
          readingDa: `## تمرین: لیست کارهای تعاملی بسازید

این پروژه نهایی دوره شما است. HTML، CSS و JavaScript را با هم ترکیب می‌کنید.

### HTML پایه

\`\`\`html
<div class="app">
  <h1>کارهای من</h1>
  <div class="input-row">
    <input type="text" id="taskInput" placeholder="چه کاری؟">
    <button id="addBtn">اضافه کردن</button>
  </div>
  <ul id="taskList"></ul>
</div>
\`\`\`

### JavaScript

\`\`\`js
let tasks = [];

function addTask() {
  const text = document.getElementById("taskInput").value.trim();
  if (!text) return;
  tasks.push({ id: Date.now(), text, done: false });
  document.getElementById("taskInput").value = "";
  renderTasks();
}

function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) task.done = !task.done;
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  renderTasks();
}

function renderTasks() {
  const list = document.getElementById("taskList");
  list.innerHTML = "";
  tasks.forEach(task => {
    const li = document.createElement("li");
    li.textContent = task.text;
    if (task.done) li.style.textDecoration = "line-through";
    li.addEventListener("click", () => toggleTask(task.id));
    list.appendChild(li);
  });
}

document.getElementById("addBtn").addEventListener("click", addTask);
renderTasks();
\`\`\``,
          order: 4
        }
      ],

      quiz: {
        id:            "javascript-fundamentals-quiz",
        titleEn:       "JavaScript Fundamentals Quiz",
        titlePs:       "د JavaScript بنسټونو ازموینه",
        titleDa:       "آزمون مبانی JavaScript",
        descriptionEn: "Test your JavaScript knowledge — variables, functions, control flow, and DOM manipulation. Pass with 70% or higher to complete the course and earn your certificate.",
        descriptionPs: "خپله د JavaScript پوهه وازمویئ. د کورس د بشپړولو او سند د ترلاسه کولو لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        descriptionDa: "دانش JavaScript خود را آزمایش کنید — متغیرها، توابع، کنترول جریان و دستکاری DOM. برای تکمیل دوره و دریافت گواهینامه با ۷۰٪ یا بالاتر قبول شوید.",
        passScore: 70,
        questions: [
          {
            id: "js-q1", promptEn: "Which keyword declares a variable that cannot be reassigned?", promptPs: "کوم کلیدي کلمه داسې متغیر اعلانوي چې بیا ټاکل نه شي؟", promptDa: "کدام کلیدواژه یک متغیر که نمی‌توان دوباره تخصیص داد را اعلام می‌کند؟",
            options: [
              { en: "let",   ps: "let",   da: "let",   correct: false },
              { en: "var",   ps: "var",   da: "var",   correct: false },
              { en: "const", ps: "const", da: "const", correct: true  }
            ]
          },
          {
            id: "js-q2", promptEn: "What does === check compared to ==?", promptPs: "=== د == سره پرتله کې څه کنترولوي؟", promptDa: "=== در مقایسه با == چه چیزی را بررسی می‌کند؟",
            options: [
              { en: "It also checks the data type, not just the value", ps: "دا یوازې ارزښت نه، د معلوماتو ډول هم کنترولوي", da: "نوع داده را هم بررسی می‌کند، نه فقط مقدار",     correct: true  },
              { en: "It is slower than ==",                              ps: "دا د == نه ورو دی",                               da: "از == کندتر است",                              correct: false },
              { en: "It only works with numbers",                        ps: "یوازې د شمیرو سره کار کوي",                      da: "فقط با اعداد کار می‌کند",                      correct: false }
            ]
          },
          {
            id: "js-q3", promptEn: "What is an arrow function?", promptPs: "د تیرو فنکشن (Arrow function) څه دی؟", promptDa: "تابع پیکانی (Arrow function) چیست؟",
            options: [
              { en: "A function with no parameters",                          ps: "پارامتر پرته فنکشن",                               da: "تابعی بدون پارامتر",                                 correct: false },
              { en: "A concise syntax for writing functions using =>",         ps: "د => له کارولو سره د فنکشنونو د لیکلو لنډه ترکیب", da: "نحو مختصر برای نوشتن توابع با استفاده از =>",        correct: true  },
              { en: "A function that only runs once",                          ps: "فنکشن چې یوازې یو ځل چلیږي",                     da: "تابعی که فقط یک بار اجرا می‌شود",                   correct: false }
            ]
          },
          {
            id: "js-q4", promptEn: "Which method selects the first matching HTML element?", promptPs: "کوم میتود لومړی سم شوی HTML عنصر انتخابوي؟", promptDa: "کدام متد اولین عنصر HTML منطبق را انتخاب می‌کند؟",
            options: [
              { en: "document.getElement()",   ps: "document.getElement()",   da: "document.getElement()",   correct: false },
              { en: "document.querySelector()", ps: "document.querySelector()", da: "document.querySelector()", correct: true  },
              { en: "document.findElement()",   ps: "document.findElement()",   da: "document.findElement()",   correct: false }
            ]
          },
          {
            id: "js-q5", promptEn: "Which method attaches an event handler to an element?", promptPs: "کوم میتود د یوه عنصر سره د پیښو هینډلر تړي؟", promptDa: "کدام متد یک رویدادگردان را به یک عنصر متصل می‌کند؟",
            options: [
              { en: "element.onClick()",          ps: "element.onClick()",          da: "element.onClick()",          correct: false },
              { en: "element.on()",               ps: "element.on()",               da: "element.on()",               correct: false },
              { en: "element.addEventListener()", ps: "element.addEventListener()", da: "element.addEventListener()", correct: true  }
            ]
          }
        ]
      }
    }
  ]
};

// ─── Seed function ────────────────────────────────────────────────────────────
async function main() {
  const author = await db.user.findUniqueOrThrow({
    where: { email: AUTHOR_EMAIL },
    select: { id: true, name: true }
  });

  const creatorProfile = await db.creatorProfile.findUniqueOrThrow({
    where: { username: CREATOR_USERNAME },
    select: { id: true }
  });

  console.log(`Author: ${author.name} (${author.id})`);

  // Upsert course
  await db.course.upsert({
    where: { id: COURSE.id },
    create: {
      id: COURSE.id, slug: COURSE.id, status: CourseStatus.PUBLISHED,
      level: COURSE.level, titleEn: COURSE.titleEn, titlePs: COURSE.titlePs, titleDa: COURSE.titleDa ?? null,
      descriptionEn: COURSE.descriptionEn, descriptionPs: COURSE.descriptionPs,
      descriptionDa: COURSE.descriptionDa ?? null,
      authorId: author.id, authorProfileId: creatorProfile.id, publishedAt: new Date()
    },
    update: {
      status: CourseStatus.PUBLISHED, level: COURSE.level,
      titleEn: COURSE.titleEn, titlePs: COURSE.titlePs, titleDa: COURSE.titleDa ?? null,
      descriptionEn: COURSE.descriptionEn, descriptionPs: COURSE.descriptionPs,
      descriptionDa: COURSE.descriptionDa ?? null,
      authorId: author.id, authorProfileId: creatorProfile.id, publishedAt: new Date()
    }
  });

  let totalVideo = 0, totalReading = 0, totalQuestions = 0;

  for (const mod of COURSE.modules) {
    const moduleId = `${COURSE.id}:${mod.id}`;

    await db.module.upsert({
      where: { id: moduleId },
      create: { id: moduleId, courseId: COURSE.id, order: mod.order, titleEn: mod.titleEn, titlePs: mod.titlePs, titleDa: mod.titleDa ?? null },
      update: { courseId: COURSE.id, order: mod.order, titleEn: mod.titleEn, titlePs: mod.titlePs, titleDa: mod.titleDa ?? null }
    });

    // Move the existing quiz to its new order FIRST so lesson orders don't collide
    await db.lesson.updateMany({
      where: { id: `${COURSE.id}:${mod.id}:quiz` },
      data: { order: mod.lessons.length + 1 }
    });

    // Video + Reading lessons
    for (const lesson of mod.lessons) {
      const lessonId = `${COURSE.id}:${lesson.id}`;
      const lessonType = lesson.type === "READING" ? LessonType.READING : LessonType.VIDEO;

      await db.lesson.upsert({
        where: { id: lessonId },
        create: {
          id: lessonId, moduleId, order: lesson.order, type: lessonType,
          titleEn: lesson.titleEn, titlePs: lesson.titlePs, titleDa: lesson.titleDa ?? null,
          descriptionEn: lesson.descriptionEn, descriptionPs: lesson.descriptionPs, descriptionDa: lesson.descriptionDa ?? null,
          youtubeUrl: lesson.youtubeId ?? null,
          readingEn: lesson.readingEn ?? null, readingPs: lesson.readingPs ?? null, readingDa: lesson.readingDa ?? null,
          isFinalTest: false, passingScore: null
        },
        update: {
          moduleId, order: lesson.order, type: lessonType,
          titleEn: lesson.titleEn, titlePs: lesson.titlePs, titleDa: lesson.titleDa ?? null,
          descriptionEn: lesson.descriptionEn, descriptionPs: lesson.descriptionPs, descriptionDa: lesson.descriptionDa ?? null,
          youtubeUrl: lesson.youtubeId ?? null,
          readingEn: lesson.readingEn ?? null, readingPs: lesson.readingPs ?? null, readingDa: lesson.readingDa ?? null,
          isFinalTest: false, passingScore: null
        }
      });

      if (lessonType === LessonType.READING) totalReading++;
      else totalVideo++;
    }

    // Quiz lesson — order = lessons count + 1
    const q = mod.quiz;
    const quizLessonId = `${COURSE.id}:${mod.id}:quiz`;
    const quizOrder = mod.lessons.length + 1;

    await db.lesson.upsert({
      where: { id: quizLessonId },
      create: {
        id: quizLessonId, moduleId, order: quizOrder, type: LessonType.QUIZ,
        titleEn: q.titleEn, titlePs: q.titlePs, titleDa: q.titleDa ?? null,
        descriptionEn: q.descriptionEn, descriptionPs: q.descriptionPs, descriptionDa: q.descriptionDa ?? null,
        isFinalTest: true, passingScore: q.passScore
      },
      update: {
        moduleId, order: quizOrder, type: LessonType.QUIZ,
        titleEn: q.titleEn, titlePs: q.titlePs, titleDa: q.titleDa ?? null,
        descriptionEn: q.descriptionEn, descriptionPs: q.descriptionPs, descriptionDa: q.descriptionDa ?? null,
        isFinalTest: true, passingScore: q.passScore
      }
    });

    await db.quiz.upsert({
      where: { lessonId: quizLessonId },
      create: { id: `${COURSE.id}:${q.id}`, lessonId: quizLessonId },
      update: {}
    });

    const quizRecord = await db.quiz.findUniqueOrThrow({
      where: { lessonId: quizLessonId },
      select: { id: true }
    });

    for (const [qi, question] of q.questions.entries()) {
      const questionId = `${COURSE.id}:${question.id}`;
      await db.question.upsert({
        where: { id: questionId },
        create: { id: questionId, quizId: quizRecord.id, order: qi + 1, type: QuestionType.SINGLE_CHOICE, promptEn: question.promptEn, promptPs: question.promptPs, promptDa: question.promptDa ?? null },
        update: { quizId: quizRecord.id, order: qi + 1, type: QuestionType.SINGLE_CHOICE, promptEn: question.promptEn, promptPs: question.promptPs, promptDa: question.promptDa ?? null }
      });

      for (const [ci, opt] of question.options.entries()) {
        const choiceId = `${questionId}:choice-${ci + 1}`;
        await db.answerChoice.upsert({
          where: { id: choiceId },
          create: { id: choiceId, questionId, order: ci + 1, textEn: opt.en, textPs: opt.ps, textDa: opt.da ?? null, isCorrect: opt.correct },
          update: { questionId, order: ci + 1, textEn: opt.en, textPs: opt.ps, textDa: opt.da ?? null, isCorrect: opt.correct }
        });
      }
      totalQuestions++;
    }

    console.log(`  Module "${mod.titleEn}": ${mod.lessons.filter(l => l.type !== "READING").length} video + ${mod.lessons.filter(l => l.type === "READING").length} reading + 1 quiz (${q.questions.length} questions)`);
  }

  console.log(`\nDone! ${totalVideo} video lessons, ${totalReading} reading lessons, ${totalQuestions} quiz questions.`);
  console.log(`URL: /courses/${COURSE.id}`);
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => db.$disconnect());
