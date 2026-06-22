/**
 * Seeds the "Introduction to Calculus" demo course
 * managed by samimshs@gmail.com, with public attribution to Khan Academy.
 *
 * Khan Academy calculus videos are embedded via the YouTube IFrame API.
 * The platform's VideoPlayer component accepts bare video IDs.
 *
 * Run:
 *   set -a && source .env.local && set +a
 *   node scripts/seed-calculus-course.mjs
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
const CREATOR_USERNAME = "khan-academy";
const CREATOR_PROFILE = {
  username: CREATOR_USERNAME,
  name: "Khan Academy",
  professionalTitle: "Nonprofit educational organization",
  bio: "Khan Academy is a nonprofit educational organization that offers free online lessons, practice exercises, and instructional videos across subjects including mathematics, science, computing, economics, and humanities.",
  bioPs: "خان اکادمۍ یوه غیرانتفاعي تعلیمي اداره ده چې د ریاضیاتو، ساینس، کمپیوټر، اقتصاد او بشري علومو په ګډون په بېلابېلو مضمونونو کې وړیا آنلاین درسونه، تمرینونه او ښوونیزې ویډیوګانې وړاندې کوي.",
  bioDa: "خان آکادمی یک سازمان آموزشی غیرانتفاعی است که درس‌های آنلاین رایگان، تمرین‌ها و ویدیوهای آموزشی را در مضمون‌هایی مانند ریاضیات، ساینس، کمپیوتر، اقتصاد و علوم انسانی ارائه می‌کند.",
  avatarUrl: null,
  linkedinUrl: null,
  youtubeUrl: "https://www.youtube.com/@khanacademy"
};

// ─── Course definition ────────────────────────────────────────────────────────
const COURSE = {
  id:            "intro-calculus",
  titleEn:       "Introduction to Calculus",
  titlePs:       "د کلکولس پېژندنه",
  titleDa:       "مقدمه‌ای بر حساب دیفرانسیل و انتگرال",
  descriptionEn: "Master the foundational ideas of calculus — limits, continuity, and derivatives. Each lesson builds on the last, using real examples and Khan Academy video explanations to make abstract ideas concrete. By the end you will be able to evaluate limits, determine continuity, and differentiate polynomial functions.",
  descriptionPs: "د کلکولس بنسټیزې موضوعات زده کړئ — حدونه، دوامداري، او مشتقات. هر درس د تیر درس پر بنسټ جوړیږي، د واقعي مثالونو او د خان اکادمۍ د ویدیو توضیحاتو له لارې انتزاعي نظریات ملموسه کوي. پای ته کله به چې ورسیږئ حدونه حساب کولی، دوامداري معلوموای، او د پولینوم فنکشنونه توپیر کولی شئ.",
  descriptionDa: "ایده‌های پایه‌ای حساب دیفرانسیل را تسلط یابید — حدها، پیوستگی و مشتقات. هر درس بر اساس درس قبلی بنا می‌شود و از مثال‌های واقعی و توضیحات ویدیویی خان آکادمی برای ملموس کردن مفاهیم انتزاعی استفاده می‌کند. در پایان می‌توانید حدها را ارزیابی کنید، پیوستگی را تشخیص دهید و توابع چندجمله‌ای را مشتق بگیرید.",
  level:         "intermediate",

  modules: [

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 1 — Limits and Continuity
    // ══════════════════════════════════════════════════════════════════════════
    {
      id:      "limits-continuity",
      titleEn: "Limits and Continuity",
      titlePs: "حدونه او دوامداري",
      titleDa: "حدها و پیوستگی",
      order:   1,

      lessons: [

        // ── Lesson 1 — What Is a Limit? ───────────────────────────────────────
        {
          id:            "what-is-a-limit",
          type:          "VIDEO",
          order:         1,
          titleEn:       "What Is a Limit?",
          titlePs:       "حد (Limit) څه دی؟",
          titleDa:       "حد چیست؟",
          descriptionEn: "Develop an intuition for limits — the fundamental concept that underpins all of calculus. Watch the Khan Academy introduction and then read the summary below.",
          descriptionPs: "د حدونو لپاره پوهه وده کړئ — هغه بنسټيز مفهوم چې د ټول کلکولس بنسټ دی. د خان اکادمۍ پېژندنه وګورئ او بیا لاندې لنډیز ولولئ.",
          descriptionDa: "شهود لازم برای درک حدها را توسعه دهید — مفهومی که پایه تمام حساب دیفرانسیل است. مقدمه خان آکادمی را تماشا کنید سپس خلاصه زیر را بخوانید.",
          // Khan Academy — "Introduction to limits (intuition)"
          youtubeId:     "riXcZT2ICjA",
          readingEn: `## What Is a Limit?

A **limit** asks: as the input x gets closer and closer to some value a, what value does f(x) approach?

### Notation

We write: lim(x→a) f(x) = L

This reads: "the limit of f(x) as x approaches a equals L."

### Key ideas

- The limit describes **approach**, not arrival. f(a) might not even exist.
- We approach from **both sides** — left (x → a⁻) and right (x → a⁺).
- The two-sided limit exists only when both one-sided limits agree.

### Example

Let f(x) = (x² − 4) / (x − 2).

At x = 2, the denominator is 0, so f(2) is undefined. But we can factor:

(x² − 4) / (x − 2) = (x + 2)(x − 2) / (x − 2) = x + 2  (when x ≠ 2)

So **lim(x→2) f(x) = 4**, even though f(2) is undefined.

### Learning objectives

After this lesson you should be able to:
- Explain what a limit represents
- Evaluate simple limits by substitution or factoring
- Recognize when a limit does not exist`,

          readingPs: `## حد (Limit) څه دی؟

یو **حد** پوښتنه کوي: کله چې د ننوت x د a ارزښت ته نږدې کیږي، f(x) کومه ارزښت ته نږدې کیږي؟

### ناستنامه

موږ لیکو: lim(x→a) f(x) = L

دا داسې لوستل کیږي: "د x د a ته نږدې کیدو پرمهال د f(x) حد L دی."

### مهمې موضوعات

- حد **نږدې کیدل** بیانوي، نه ورسیدل. f(a) ممکن اصلاً نه وي.
- موږ له **دواړو خواوو** نږدې کیږو — چپ (x → a⁻) او ښي (x → a⁺).
- دوه اړخیز حد یوازې هغه وخت شتون لري چې دواړه یو اړخیز حدونه سره موافق وي.

### مثال

که f(x) = (x² − 4) / (x − 2) وي.

د x = 2 پر ټکي، بل (مخرج) صفر دی، نو f(2) ناتعریف دی. خو موږ فاکتور کولی شو:

(x² − 4) / (x − 2) = (x + 2)  (کله چې x ≠ 2)

نو **lim(x→2) f(x) = 4**، حتی که f(2) ناتعریف وي.

### د زده کړې اهداف

د دې درس وروسته تاسو باید وکولی شئ:
- د حد مفهوم تشریح کړئ
- ساده حدونه د ځای‌ناستلو یا فاکتور کولو له لارې حساب کړئ
- وپوهیږئ کله چې حد شتون نه لري`,

          readingDa: `## حد چیست؟

یک **حد** می‌پرسد: هنگامی که متغیر ورودی x به مقدار a نزدیک می‌شود، f(x) به چه مقداری نزدیک می‌شود؟

### نماد

می‌نویسیم: lim(x→a) f(x) = L

به این صورت خوانده می‌شود: "حد f(x) هنگامی که x به a نزدیک می‌شود برابر L است."

### ایده‌های کلیدی

- حد **نزدیک شدن** را توصیف می‌کند، نه رسیدن. f(a) ممکن است اصلاً وجود نداشته باشد.
- از **هر دو طرف** نزدیک می‌شویم — چپ (x → a⁻) و راست (x → a⁺).
- حد دوطرفه فقط وقتی وجود دارد که هر دو حد یک‌طرفه با هم برابر باشند.

### مثال

فرض کنید f(x) = (x² − 4) / (x − 2).

در x = 2، مخرج صفر است، پس f(2) تعریف نشده است. اما می‌توانیم تجزیه کنیم:

(x² − 4) / (x − 2) = (x + 2)  (وقتی x ≠ 2)

پس **lim(x→2) f(x) = 4**، حتی اگر f(2) تعریف نشده باشد.

### اهداف یادگیری

پس از این درس باید بتوانید:
- توضیح دهید حد چه چیزی را نشان می‌دهد
- حدهای ساده را با جایگزینی یا تجزیه محاسبه کنید
- تشخیص دهید چه زمانی حد وجود ندارد`
        },

        // ── Lesson 2 — One-Sided Limits ──────────────────────────────────────
        {
          id:            "one-sided-limits",
          type:          "VIDEO",
          order:         2,
          titleEn:       "One-Sided Limits",
          titlePs:       "یو اړخیز حدونه",
          titleDa:       "حدهای یک‌طرفه",
          descriptionEn: "Explore limits from the left and right separately, and understand when the two-sided limit exists.",
          descriptionPs: "له چپ او ښي خوا حدونه جلا جلا وپلټئ، او پوه شئ چې کله دوه اړخیز حد شتون لري.",
          descriptionDa: "حدها از چپ و راست را جداگانه بررسی کنید و بفهمید چه زمانی حد دوطرفه وجود دارد.",
          // Khan Academy — "One-sided limits from graphs"
          youtubeId:     "nOnd3SiYZqM",
          readingEn: `## One-Sided Limits

Sometimes a function behaves differently depending on which side of a value we approach from.

### Left-hand limit

lim(x→a⁻) f(x) — x approaches a from the **left** (values smaller than a)

### Right-hand limit

lim(x→a⁺) f(x) — x approaches a from the **right** (values larger than a)

### The two-sided limit exists when

lim(x→a⁻) f(x) = lim(x→a⁺) f(x) = L

If the two one-sided limits are different, the two-sided limit **does not exist**.

### Piecewise example

Let f(x) = { x + 1 if x < 2 ; x² − 1 if x ≥ 2 }

- lim(x→2⁻) f(x) = 2 + 1 = **3**
- lim(x→2⁺) f(x) = 4 − 1 = **3**

Both sides agree → **lim(x→2) f(x) = 3**  (even though f(2) = 3 by the second branch, the limit exists independently)

Now change the second branch to x² + 1:
- lim(x→2⁺) = 5 ≠ 3 → **limit does not exist**`,

          readingPs: `## یو اړخیز حدونه

کله کله یو فنکشن د هغه ارزښت له کوم اړخه ورسره نږدې کیږو پر اساس توپیر کوي.

### د چپ لاس حد

lim(x→a⁻) f(x) — x له **چپ** اړخه a ته نږدې کیږي (له a نه کوچني ارزښتونه)

### د ښي لاس حد

lim(x→a⁺) f(x) — x له **ښي** اړخه a ته نږدې کیږي (له a نه لوي ارزښتونه)

### دوه اړخیز حد هغه وخت شتون لري کله چې

lim(x→a⁻) f(x) = lim(x→a⁺) f(x) = L

که دواړه یو اړخیز حدونه توپیر ولري، دوه اړخیز حد **شتون نه لري**.

### مثال

که f(x) = { x + 1 که x < 2 وي ; x² − 1 که x ≥ 2 وي } وي:

- lim(x→2⁻) f(x) = 2 + 1 = **3**
- lim(x→2⁺) f(x) = 4 − 1 = **3**

دواړه اړخونه موافق دي → **lim(x→2) f(x) = 3**`,

          readingDa: `## حدهای یک‌طرفه

گاهی یک تابع بسته به اینکه از کدام طرف به مقدار نزدیک می‌شویم رفتار متفاوتی دارد.

### حد از چپ

lim(x→a⁻) f(x) — x از **چپ** به a نزدیک می‌شود (مقادیر کوچکتر از a)

### حد از راست

lim(x→a⁺) f(x) — x از **راست** به a نزدیک می‌شود (مقادیر بزرگتر از a)

### حد دوطرفه وقتی وجود دارد که

lim(x→a⁻) f(x) = lim(x→a⁺) f(x) = L

اگر دو حد یک‌طرفه متفاوت باشند، حد دوطرفه **وجود ندارد**.

### مثال تابع تکه‌ای

فرض کنید f(x) = { x + 1 اگر x < 2 ; x² − 1 اگر x ≥ 2 }

- lim(x→2⁻) f(x) = 2 + 1 = **3**
- lim(x→2⁺) f(x) = 4 − 1 = **3**

هر دو طرف موافقند → **lim(x→2) f(x) = 3**`
        },

        // ── Lesson 3 — Continuity ─────────────────────────────────────────────
        {
          id:            "continuity",
          type:          "VIDEO",
          order:         3,
          titleEn:       "Continuity",
          titlePs:       "دوامداري",
          titleDa:       "پیوستگی",
          descriptionEn: "Learn the three conditions for continuity at a point and identify discontinuities in graphs and formulas.",
          descriptionPs: "د یوه ټکي پر اساس د دوامدارۍ درې شرطونه زده کړئ او د ګرافونو او فورمولونو کې ناپیوستګي وپیژنئ.",
          descriptionDa: "سه شرط پیوستگی در یک نقطه را بیاموزید و ناپیوستگی‌ها را در نمودارها و فرمول‌ها شناسایی کنید.",
          // Khan Academy — "Continuity at a point"
          youtubeId:     "joewRl1CTL8",
          readingEn: `## Continuity

A function f is **continuous at x = a** if and only if three conditions all hold:

1. **f(a) is defined** — the function has a value at that point
2. **lim(x→a) f(x) exists** — both one-sided limits agree
3. **lim(x→a) f(x) = f(a)** — the limit equals the function value

If any condition fails, the function has a **discontinuity** at a.

### Types of discontinuity

| Type | Description | Example |
|------|-------------|---------|
| Removable | A "hole" in the graph — limit exists but ≠ f(a) | f(x) = (x²−4)/(x−2) at x=2 |
| Jump | Left and right limits both exist but differ | Piecewise step function |
| Infinite | Function grows without bound (vertical asymptote) | f(x) = 1/x at x=0 |

### Continuity on an interval

f is continuous on [a, b] if it is continuous at every point in [a, b] (with one-sided limits at the endpoints).

Polynomials, sine, cosine, and exponentials are continuous **everywhere**.`,

          readingPs: `## دوامداري

یو فنکشن f **د x = a پر ټکي دوامداره دی** که او یوازې که درې شرطونه ټول سم وي:

1. **f(a) تعریف شوی وي** — فنکشن د هغه ټکي پر ارزښت لري
2. **lim(x→a) f(x) شتون ولري** — دواړه یو اړخیز حدونه موافق وي
3. **lim(x→a) f(x) = f(a)** — حد د فنکشن ارزښت سره مساوي وي

که کومه شرط پوره نشي، فنکشن د a پر ټکي **ناپیوستګي** لري.

### د ناپیوستګۍ ډولونه

| ډول | تشریح |
|-----|-------|
| د لرې کولو وړ | یو "سوری" — حد شتون لري خو د f(a) سره مساوي نه دی |
| جهش | دواړه یو اړخیز حدونه شتون لري خو توپیر لري |
| بې‌حده | فنکشن پرته له حده لویږي (عمودي اسیمپتوت) |`,

          readingDa: `## پیوستگی

تابع f در **x = a پیوسته است** اگر و تنها اگر سه شرط زیر برقرار باشد:

1. **f(a) تعریف شده باشد** — تابع در آن نقطه مقدار داشته باشد
2. **lim(x→a) f(x) وجود داشته باشد** — هر دو حد یک‌طرفه با هم برابر باشند
3. **lim(x→a) f(x) = f(a)** — حد با مقدار تابع برابر باشد

اگر هر یک از شرط‌ها برقرار نباشد، تابع در a **ناپیوسته** است.

### انواع ناپیوستگی

| نوع | توضیح |
|-----|-------|
| قابل رفع | یک "سوراخ" در نمودار — حد موجود است اما ≠ f(a) |
| پرشی | هر دو حد یک‌طرفه موجودند اما متفاوتند |
| بی‌نهایت | تابع بدون مرز رشد می‌کند (مجانب قائم) |

چندجمله‌ای‌ها، سینوس، کسینوس و توابع نمایی **همه‌جا** پیوسته‌اند.`
        }
      ],

      // ── Module 1 Quiz ─────────────────────────────────────────────────────
      quiz: {
        id:            "limits-continuity-quiz",
        titleEn:       "Limits and Continuity Quiz",
        titlePs:       "د حدونو او دوامدارۍ ازموینه",
        titleDa:       "آزمون حدها و پیوستگی",
        descriptionEn: "Test your understanding of limits and continuity. Pass with 70% or higher to unlock Module 2.",
        descriptionPs: "د حدونو او دوامدارۍ خپله پوهه وازمویئ. د دویم ماډیول د خلاصولو لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        descriptionDa: "درک خود از حدها و پیوستگی را آزمایش کنید. برای باز کردن ماژول ۲ با ۷۰٪ یا بالاتر قبول شوید.",
        passScore: 70,
        questions: [
          {
            id: "calc-lim-q1",
            promptEn: "What value does lim(x→2) [x²] approach?",
            promptPs: "lim(x→2) [x²] کومه ارزښت ته نږدې کیږي؟",
            promptDa: "حد lim(x→2) [x²] به کدام مقدار نزدیک می‌شود؟",
            options: [
              { en: "2",  ps: "۲",  da: "۲",  correct: false },
              { en: "4",  ps: "۴",  da: "۴",  correct: true  },
              { en: "8",  ps: "۸",  da: "۸",  correct: false },
              { en: "16", ps: "۱۶", da: "۱۶", correct: false }
            ]
          },
          {
            id: "calc-lim-q2",
            promptEn: "A function f is continuous at x = a if:",
            promptPs: "د فنکشن f دوامداري د x = a پر ټکي کله ده؟",
            promptDa: "تابع f در x = a پیوسته است اگر:",
            options: [
              { en: "f(a) is defined, lim(x→a) f(x) exists, and both equal each other", ps: "f(a) تعریف شوی، lim(x→a) f(x) شتون لري، او دواړه مساوي دي", da: "f(a) تعریف شده، lim(x→a) f(x) موجود است و هر دو برابرند", correct: true  },
              { en: "f(a) = 0",                ps: "f(a) = 0",                             da: "f(a) = 0",                         correct: false },
              { en: "The graph has no corners", ps: "ګراف کنجونه نه لري",                  da: "نمودار گوشه‌ای ندارد",              correct: false }
            ]
          },
          {
            id: "calc-lim-q3",
            promptEn: "What does lim(x→0) [sin(x) / x] equal?",
            promptPs: "lim(x→0) [sin(x) / x] د کومه سره مساوي دی؟",
            promptDa: "حد lim(x→0) [sin(x) / x] برابر با چیست؟",
            options: [
              { en: "0",         ps: "۰",        da: "۰",            correct: false },
              { en: "1",         ps: "۱",        da: "۱",            correct: true  },
              { en: "∞",         ps: "∞",        da: "∞",            correct: false },
              { en: "Undefined", ps: "ناتعریف",   da: "تعریف‌نشده",  correct: false }
            ]
          },
          {
            id: "calc-lim-q4",
            promptEn: "If lim(x→3⁻) f(x) = 5 and lim(x→3⁺) f(x) = 7, what is lim(x→3) f(x)?",
            promptPs: "که lim(x→3⁻) f(x) = 5 او lim(x→3⁺) f(x) = 7 وي، lim(x→3) f(x) څه دی؟",
            promptDa: "اگر lim(x→3⁻) f(x) = 5 و lim(x→3⁺) f(x) = 7 باشد، lim(x→3) f(x) چقدر است؟",
            options: [
              { en: "6 (average)",     ps: "۶ (اوسط)",    da: "۶ (میانگین)",  correct: false },
              { en: "5",               ps: "۵",            da: "۵",            correct: false },
              { en: "Does not exist",  ps: "شتون نه لري",  da: "وجود ندارد",   correct: true  },
              { en: "7",               ps: "۷",            da: "۷",            correct: false }
            ]
          },
          {
            id: "calc-lim-q5",
            promptEn: "Which of the following is an example of a removable discontinuity?",
            promptPs: "لاندې کومه د لرې کولو وړ ناپیوستګۍ مثال دی؟",
            promptDa: "کدام‌یک از موارد زیر مثالی از ناپیوستگی قابل رفع است؟",
            options: [
              { en: "f(x) = 1/x at x = 0 (vertical asymptote)", ps: "f(x) = 1/x د x = 0 پر ټکي (عمودي اسیمپتوت)", da: "f(x) = 1/x در x = 0 (مجانب قائم)", correct: false },
              { en: "f(x) = (x²−4)/(x−2) at x = 2 (hole in graph)", ps: "f(x) = (x²−4)/(x−2) د x = 2 پر ټکي (سوری)", da: "f(x) = (x²−4)/(x−2) در x = 2 (سوراخ در نمودار)", correct: true  },
              { en: "A piecewise step function with a jump at x = 1", ps: "یوه ټوکه‌ای فنکشن د x = 1 پر ټکي جهش سره", da: "یک تابع تکه‌ای با پرش در x = 1", correct: false }
            ]
          }
        ]
      }
    },

    // ══════════════════════════════════════════════════════════════════════════
    // MODULE 2 — Introduction to Derivatives
    // ══════════════════════════════════════════════════════════════════════════
    {
      id:      "intro-derivatives",
      titleEn: "Introduction to Derivatives",
      titlePs: "د مشتقاتو پېژندنه",
      titleDa: "مقدمه‌ای بر مشتقات",
      order:   2,

      lessons: [

        // ── Lesson 1 — The Concept of a Derivative ────────────────────────────
        {
          id:            "derivative-concept",
          type:          "VIDEO",
          order:         1,
          titleEn:       "The Concept of a Derivative",
          titlePs:       "د مشتق مفهوم",
          titleDa:       "مفهوم مشتق",
          descriptionEn: "Understand the derivative as instantaneous rate of change and the slope of the tangent line to a curve.",
          descriptionPs: "مشتق د آنی بدلون د نرخ او د منحنۍ د مماس کرښې د میلان او لپاره وپوهیږئ.",
          descriptionDa: "مشتق را به عنوان نرخ تغییر لحظه‌ای و شیب خط مماس بر منحنی درک کنید.",
          // Khan Academy — "Introduction to derivatives (the definition)"
          youtubeId:     "ANyVpMS3HL4",
          readingEn: `## The Concept of a Derivative

The **derivative** of a function f at a point a measures how fast f is changing at that exact instant.

### From average to instantaneous rate of change

The **average rate of change** over [a, a+h] is:

  [f(a+h) − f(a)] / h

As h → 0, this becomes the **instantaneous rate of change**, which is the derivative:

  f'(a) = lim(h→0) [f(a+h) − f(a)] / h

### Geometric meaning

f'(a) is the **slope of the tangent line** to the graph of f at the point (a, f(a)).

- If f'(a) > 0, the function is increasing at a
- If f'(a) < 0, the function is decreasing at a
- If f'(a) = 0, the tangent is horizontal (a local max, min, or saddle)

### Notation

| Notation | Meaning |
|----------|---------|
| f'(x)    | Derivative using prime notation |
| dy/dx    | Leibniz notation |
| Df(x)    | Operator notation |

### Learning objectives

- State the limit definition of the derivative
- Interpret the derivative geometrically as a slope
- Identify where a function is increasing, decreasing, or has a horizontal tangent`,

          readingPs: `## د مشتق مفهوم

د یوه فنکشن f **مشتق** د a ارزښت پر ټکي اندازه کوي چې f د هغه دقیق لحظه کې سره ډیر چټکتیا بدلیږي.

### د اوسط نه آنی د بدلون نرخ ته

د [a, a+h] پر اوږدو **د بدلون اوسط نرخ** دا دی:

  [f(a+h) − f(a)] / h

کله چې h → 0 شي، دا **د بدلون آنی نرخ** کیږي، چې مشتق دی:

  f'(a) = lim(h→0) [f(a+h) − f(a)] / h

### هندسي معنا

f'(a) د f ګراف پر (a, f(a)) ټکي د **مماس کرښې میلان** دی.

- که f'(a) > 0 وي، فنکشن د a پر ټکي زیاتیږي
- که f'(a) < 0 وي، فنکشن د a پر ټکي کمیږي
- که f'(a) = 0 وي، مماس افقي دی`,

          readingDa: `## مفهوم مشتق

**مشتق** تابع f در نقطه a اندازه می‌گیرد که f با چه سرعتی در آن لحظه تغییر می‌کند.

### از نرخ تغییر متوسط به نرخ تغییر لحظه‌ای

**نرخ تغییر متوسط** روی [a, a+h]:

  [f(a+h) − f(a)] / h

وقتی h → 0، این به **نرخ تغییر لحظه‌ای** تبدیل می‌شود که همان مشتق است:

  f'(a) = lim(h→0) [f(a+h) − f(a)] / h

### معنای هندسی

f'(a) **شیب خط مماس** بر نمودار f در نقطه (a, f(a)) است.

- اگر f'(a) > 0 باشد، تابع در a صعودی است
- اگر f'(a) < 0 باشد، تابع در a نزولی است
- اگر f'(a) = 0 باشد، مماس افقی است`
        },

        // ── Lesson 2 — The Power Rule ─────────────────────────────────────────
        {
          id:            "power-rule",
          type:          "VIDEO",
          order:         2,
          titleEn:       "The Power Rule",
          titlePs:       "د قدرت قاعده",
          titleDa:       "قانون توان",
          descriptionEn: "Apply the power rule to efficiently differentiate polynomial and power functions without returning to the limit definition every time.",
          descriptionPs: "د قدرت قاعده وکاروئ ترڅو د پولینومي او د قدرت فنکشنونه هر ځل د حد تعریف ته د ستنیدو پرته چټکه توپیر کړئ.",
          descriptionDa: "قانون توان را به کار ببرید تا توابع چندجمله‌ای و توانی را به‌کارایی بدون بازگشت به تعریف حد مشتق بگیرید.",
          // Khan Academy — "Basic differentiation rules: the power rule"
          youtubeId:     "IvLpN1G1Ncg",
          readingEn: `## The Power Rule

Instead of applying the limit definition every time, we use shortcut **differentiation rules**.

### The Power Rule

If f(x) = xⁿ (where n is any real number), then:

  **f'(x) = n · xⁿ⁻¹**

### Examples

| f(x)   | f'(x)        | Reasoning              |
|--------|-------------|------------------------|
| x⁵     | 5x⁴         | Bring down 5, reduce power |
| x²     | 2x          | Bring down 2, reduce power |
| x      | 1           | x¹ → 1·x⁰ = 1          |
| 7      | 0           | Constant rule (n = 0)  |
| x⁻²   | −2x⁻³       | Works for negative powers |
| √x = x^(1/2) | (1/2)x^(−1/2) | Works for fractions |

### Combining with constants

- **Constant multiple rule**: d/dx[c · f(x)] = c · f'(x)
- **Sum rule**: d/dx[f(x) + g(x)] = f'(x) + g'(x)

### Example: differentiate f(x) = 4x³ − 3x + 5

f'(x) = 4·3x² − 3·1 + 0 = **12x² − 3**

### Learning objectives

- State and apply the power rule
- Use the constant multiple rule and sum rule
- Differentiate any polynomial function`,

          readingPs: `## د قدرت قاعده

د هر ځل د حد تعریف پر ځای، موږ د **توپیر قواعدو** لنډلار کاروو.

### د قدرت قاعده

که f(x) = xⁿ وي (چیرته چې n کومه حقیقي شمیره ده)، نو:

  **f'(x) = n · xⁿ⁻¹**

### مثالونه

| f(x)   | f'(x)        |
|--------|-------------|
| x⁵     | 5x⁴         |
| x²     | 2x          |
| x      | 1           |
| 7      | 0           |
| x⁻²   | −2x⁻³       |

### د ثابتو سره یوځای کول

- **د ثابت ضرب قاعده**: d/dx[c · f(x)] = c · f'(x)
- **د مجموع قاعده**: d/dx[f(x) + g(x)] = f'(x) + g'(x)

### مثال: f(x) = 4x³ − 3x + 5 توپیر کړئ

f'(x) = 12x² − 3`,

          readingDa: `## قانون توان

به جای اعمال تعریف حد هر بار، از **قوانین میانبر مشتق‌گیری** استفاده می‌کنیم.

### قانون توان

اگر f(x) = xⁿ (که n هر عدد حقیقی باشد)، آنگاه:

  **f'(x) = n · xⁿ⁻¹**

### مثال‌ها

| f(x)   | f'(x)        |
|--------|-------------|
| x⁵     | 5x⁴         |
| x²     | 2x          |
| x      | 1           |
| 7      | 0           |
| x⁻²   | −2x⁻³       |

### ترکیب با ثابت‌ها

- **قانون ضرب ثابت**: d/dx[c · f(x)] = c · f'(x)
- **قانون جمع**: d/dx[f(x) + g(x)] = f'(x) + g'(x)

### مثال: f(x) = 4x³ − 3x + 5 را مشتق بگیرید

f'(x) = 12x² − 3`
        }
      ],

      // ── Module 2 Quiz ─────────────────────────────────────────────────────
      quiz: {
        id:            "derivatives-quiz",
        titleEn:       "Derivatives Quiz",
        titlePs:       "د مشتقاتو ازموینه",
        titleDa:       "آزمون مشتقات",
        descriptionEn: "Test your understanding of derivatives and the power rule. Pass with 70% or higher to complete the course and earn your certificate.",
        descriptionPs: "د مشتقاتو او د قدرت قاعدې خپله پوهه وازمویئ. د کورس د بشپړولو او سند د ترلاسه کولو لپاره ۷۰٪ یا لوړ نمره ترلاسه کړئ.",
        descriptionDa: "درک خود از مشتقات و قانون توان را آزمایش کنید. برای تکمیل دوره و دریافت گواهینامه با ۷۰٪ یا بالاتر قبول شوید.",
        passScore: 70,
        questions: [
          {
            id: "calc-deriv-q1",
            promptEn: "What is the derivative of f(x) = x³?",
            promptPs: "د f(x) = x³ مشتق کوم دی؟",
            promptDa: "مشتق f(x) = x³ چیست؟",
            options: [
              { en: "3x²", ps: "3x²", da: "3x²", correct: true  },
              { en: "x²",  ps: "x²",  da: "x²",  correct: false },
              { en: "3x³", ps: "3x³", da: "3x³", correct: false },
              { en: "3x",  ps: "3x",  da: "3x",  correct: false }
            ]
          },
          {
            id: "calc-deriv-q2",
            promptEn: "Geometrically, the derivative f'(a) represents:",
            promptPs: "هندسي توګه، مشتق f'(a) ښيي:",
            promptDa: "از نظر هندسی، مشتق f'(a) نشان‌دهنده است:",
            options: [
              { en: "The area under the curve at x = a",      ps: "د منحنۍ لاندې ساحه د x = a پر ټکي",  da: "ناحیه زیر منحنی در x = a",   correct: false },
              { en: "The slope of the tangent line at x = a", ps: "د مماس کرښې میلان د x = a پر ټکي",   da: "شیب خط مماس در x = a",        correct: true  },
              { en: "The y-intercept of the function",        ps: "د فنکشن y-محور سره د کتلو ټکی",      da: "نقطه تقاطع تابع با محور y",   correct: false }
            ]
          },
          {
            id: "calc-deriv-q3",
            promptEn: "If f(x) = 7 (a constant function), then f'(x) = ?",
            promptPs: "که f(x) = 7 (یو ثابت فنکشن) وي، نو f'(x) = ؟",
            promptDa: "اگر f(x) = 7 (تابع ثابت) باشد، آنگاه f'(x) = ؟",
            options: [
              { en: "7",  ps: "۷",  da: "۷",  correct: false },
              { en: "0",  ps: "۰",  da: "۰",  correct: true  },
              { en: "1",  ps: "۱",  da: "۱",  correct: false },
              { en: "x",  ps: "x",  da: "x",  correct: false }
            ]
          },
          {
            id: "calc-deriv-q4",
            promptEn: "Using the Power Rule, d/dx[x⁵] = ?",
            promptPs: "د قدرت قاعدې له لارې، d/dx[x⁵] = ؟",
            promptDa: "با استفاده از قانون توان، d/dx[x⁵] = ؟",
            options: [
              { en: "5x⁶", ps: "5x⁶", da: "5x⁶", correct: false },
              { en: "x⁴",  ps: "x⁴",  da: "x⁴",  correct: false },
              { en: "5x⁴", ps: "5x⁴", da: "5x⁴", correct: true  },
              { en: "5x",  ps: "5x",  da: "5x",  correct: false }
            ]
          },
          {
            id: "calc-deriv-q5",
            promptEn: "A function has a horizontal tangent line where:",
            promptPs: "فنکشن چیرته افقي مماس کرښه لري؟",
            promptDa: "یک تابع خط مماس افقی دارد در جایی که:",
            options: [
              { en: "f(x) = 0",            ps: "f(x) = 0",       da: "f(x) = 0",       correct: false },
              { en: "f'(x) = 0",           ps: "f'(x) = 0",      da: "f'(x) = 0",      correct: true  },
              { en: "f''(x) = 0",          ps: "f''(x) = 0",     da: "f''(x) = 0",     correct: false },
              { en: "f is increasing",     ps: "f زیاتیږي",      da: "f صعودی است",    correct: false }
            ]
          }
        ]
      }
    }
  ]
};

// ─── Seed function ─────────────────────────────────────────────────────────────
async function main() {
  const author = await db.user.findUniqueOrThrow({
    where: { email: AUTHOR_EMAIL },
    select: { id: true, name: true }
  });

  const creatorProfile = await db.creatorProfile.upsert({
    where: { username: CREATOR_USERNAME },
    update: {
      name: CREATOR_PROFILE.name,
      professionalTitle: CREATOR_PROFILE.professionalTitle,
      bio: CREATOR_PROFILE.bio,
      bioPs: CREATOR_PROFILE.bioPs,
      bioDa: CREATOR_PROFILE.bioDa,
      avatarUrl: CREATOR_PROFILE.avatarUrl,
      linkedinUrl: CREATOR_PROFILE.linkedinUrl,
      youtubeUrl: CREATOR_PROFILE.youtubeUrl
    },
    create: {
      ...CREATOR_PROFILE,
      createdById: author.id
    },
    select: { id: true }
  });

  console.log(`Technical owner: ${author.name} (${author.id})`);
  console.log(`Public author profile: ${CREATOR_PROFILE.name} (${creatorProfile.id})`);

  // Upsert course
  await db.course.upsert({
    where: { id: COURSE.id },
    create: {
      id: COURSE.id, slug: COURSE.id, status: CourseStatus.PUBLISHED,
      level: COURSE.level,
      titleEn: COURSE.titleEn, titlePs: COURSE.titlePs, titleDa: COURSE.titleDa,
      descriptionEn: COURSE.descriptionEn, descriptionPs: COURSE.descriptionPs, descriptionDa: COURSE.descriptionDa,
      authorId: author.id, authorProfileId: creatorProfile.id, publishedAt: new Date()
    },
    update: {
      status: CourseStatus.PUBLISHED, level: COURSE.level,
      titleEn: COURSE.titleEn, titlePs: COURSE.titlePs, titleDa: COURSE.titleDa,
      descriptionEn: COURSE.descriptionEn, descriptionPs: COURSE.descriptionPs, descriptionDa: COURSE.descriptionDa,
      authorId: author.id, authorProfileId: creatorProfile.id, publishedAt: new Date()
    }
  });
  console.log(`✓ Course upserted: ${COURSE.id}`);

  let totalVideo = 0, totalQuestions = 0;

  for (const mod of COURSE.modules) {
    const moduleId = `${COURSE.id}:${mod.id}`;

    await db.module.upsert({
      where: { id: moduleId },
      create: { id: moduleId, courseId: COURSE.id, order: mod.order, titleEn: mod.titleEn, titlePs: mod.titlePs, titleDa: mod.titleDa ?? null },
      update: { courseId: COURSE.id, order: mod.order, titleEn: mod.titleEn, titlePs: mod.titlePs, titleDa: mod.titleDa ?? null }
    });
    console.log(`  ✓ Module: ${mod.titleEn}`);

    // Reset quiz to a safe order first so video lessons don't collide
    await db.lesson.updateMany({
      where: { id: `${COURSE.id}:${mod.id}:quiz` },
      data: { order: mod.lessons.length + 1 }
    });

    for (const lesson of mod.lessons) {
      const lessonId = `${COURSE.id}:${lesson.id}`;
      await db.lesson.upsert({
        where: { id: lessonId },
        create: {
          id: lessonId, moduleId, order: lesson.order, type: LessonType.VIDEO,
          titleEn: lesson.titleEn, titlePs: lesson.titlePs, titleDa: lesson.titleDa ?? null,
          descriptionEn: lesson.descriptionEn, descriptionPs: lesson.descriptionPs, descriptionDa: lesson.descriptionDa ?? null,
          youtubeUrl: lesson.youtubeId,
          readingEn: lesson.readingEn ?? null, readingPs: lesson.readingPs ?? null, readingDa: lesson.readingDa ?? null,
          isFinalTest: false, passingScore: null
        },
        update: {
          moduleId, order: lesson.order, type: LessonType.VIDEO,
          titleEn: lesson.titleEn, titlePs: lesson.titlePs, titleDa: lesson.titleDa ?? null,
          descriptionEn: lesson.descriptionEn, descriptionPs: lesson.descriptionPs, descriptionDa: lesson.descriptionDa ?? null,
          youtubeUrl: lesson.youtubeId,
          readingEn: lesson.readingEn ?? null, readingPs: lesson.readingPs ?? null, readingDa: lesson.readingDa ?? null,
          isFinalTest: false, passingScore: null
        }
      });
      totalVideo++;
      console.log(`    ✓ Lesson: ${lesson.titleEn} (${lesson.youtubeId})`);
    }

    // Quiz lesson
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
        create: {
          id: questionId, quizId: quizRecord.id, order: qi + 1,
          type: QuestionType.SINGLE_CHOICE,
          promptEn: question.promptEn, promptPs: question.promptPs, promptDa: question.promptDa ?? null
        },
        update: {
          quizId: quizRecord.id, order: qi + 1,
          type: QuestionType.SINGLE_CHOICE,
          promptEn: question.promptEn, promptPs: question.promptPs, promptDa: question.promptDa ?? null
        }
      });

      // Delete and recreate choices so we get a clean order every run
      await db.answerChoice.deleteMany({ where: { questionId } });

      for (const [ci, opt] of question.options.entries()) {
        await db.answerChoice.create({
          data: {
            questionId,
            order: ci + 1,
            textEn: opt.en, textPs: opt.ps, textDa: opt.da ?? null,
            isCorrect: opt.correct
          }
        });
      }
      totalQuestions++;
    }
    console.log(`    ✓ Quiz: ${q.titleEn} (${q.questions.length} questions)`);
  }

  // Keep the visible instructor list aligned with the public Khan Academy attribution.
  await db.courseInstructor.deleteMany({
    where: { courseId: COURSE.id, profileId: { not: creatorProfile.id } }
  });

  await db.courseInstructor.upsert({
    where: { courseId_profileId: { courseId: COURSE.id, profileId: creatorProfile.id } },
    create: { courseId: COURSE.id, profileId: creatorProfile.id, order: 0 },
    update: { order: 0 }
  });
  console.log("  ✓ Public instructor linked");

  console.log(`\n✅ Done — ${COURSE.id}: ${COURSE.modules.length} modules, ${totalVideo} video lessons, ${totalQuestions} quiz questions`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
