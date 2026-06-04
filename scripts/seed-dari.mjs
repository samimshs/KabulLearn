/**
 * Backfills Dari (fa) translations for all existing courses, modules, and lessons.
 * Run with: node scripts/seed-dari.mjs
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── Shared lesson description templates ──────────────────────────────────────
const DA_DESC_OVERVIEW   = (title) => `یک درس کوتاه را تماشا کنید که ایده‌های اصلی در ${title} را معرفی می‌کند.`;
const DA_DESC_READING_CORE = "اصطلاحات کلیدی و مثال‌های این ماژول را مرور کنید.";
const DA_DESC_READING_PRACTICE = "اصطلاحات کلیدی و مثال‌های این ماژول را مرور کنید.";
const DA_DESC_MODULE_CHECK = "قبل از ادامه، درک خود را بررسی کنید.";
const DA_DESC_DEMO   = (title) => `یک درس کوتاه را تماشا کنید که ایده‌های اصلی در ${title} را معرفی می‌کند.`;
const DA_DESC_QUIZ_CHECKPOINT = "برای ادامه، این ایست‌گاه اجباری را با ۷۰٪ یا بالاتر قبول شوید.";

const DA_MODULE_DESC = (title) => `یک بخش متمرکز برای ${title}.`;

async function main() {
  // ────────────────────────────────────────────────────────────────────────────
  // COURSES
  // ────────────────────────────────────────────────────────────────────────────
  const courseUpdates = [
    {
      id: "intro-physics",
      titleDa: "مقدمه فزیک",
      descriptionDa: "پایه عملی در حرکت، نیروها، انرژی، و حل مسائل ساده بسازید.",
      levelDa: "مبتدی",
    },
    {
      id: "digital-literacy",
      titleDa: "سواد دیجیتال",
      descriptionDa: "مهارت‌های اساسی کمپیوتر، انترنت، ایمیل، و امنیت آنلاین را برای درس و کار بیاموزید.",
      levelDa: "بنیادی",
    },
    {
      id: "cmpyjb2zl000bojjienvj8j9e",
      titleDa: "مبانی سواد داده",
      descriptionDa: "اعتماد به نفس در خواندن نمودارها، پرسیدن سوال‌های بهتر، و شناسایی شواهد ضعیف را بسازید.",
      levelDa: "مبتدی",
    },
    {
      id: "cmpyjb5kw0015ojjiwtfzlu62",
      titleDa: "مقدمه پایتون برای فراگیران",
      descriptionDa: "اصول پایتون را از طریق تمرین‌های کوچک، مثال‌ها، و پروژه‌های عملی بیاموزید.",
      levelDa: "مبتدی",
    },
    {
      id: "cmpyjb81d001zojjir0wn6q1y",
      titleDa: "مفاهیم یادگیری ماشین",
      descriptionDa: "مدل‌ها، داده‌های آموزشی، ارزیابی، و هوش مصنوعی مسئولانه را بدون ریاضیات سنگین بیاموزید.",
      levelDa: "متوسط",
    },
    {
      id: "cmpyjbb2i002tojjiuyvdsg45",
      titleDa: "اقتصاد برای تصمیمات روزمره",
      descriptionDa: "از ایده‌های اقتصادی اصلی برای استدلال درباره مبادلات، انگیزه‌ها، و انتخاب‌ها استفاده کنید.",
      levelDa: "مبتدی",
    },
    {
      id: "cmpyjbe6n003nojjio4kf82m6",
      titleDa: "حل مسائل جبر",
      descriptionDa: "معادلات، توابع، و مسائل کلامی را با استدلال واضح گام به گام تمرین کنید.",
      levelDa: "مبتدی",
    },
    {
      id: "cmpyjbgm0004hojjizit4vmrc",
      titleDa: "مبانی روش‌های تحقیق",
      descriptionDa: "سوال‌های بهتر طراحی کنید، شواهد را مقایسه کنید، و یافته‌ها را به وضوح بیان کنید.",
      levelDa: "متوسط",
    },
    {
      id: "cmpyjbj9n005bojji2upd2srn",
      titleDa: "از Excel به تحلیل SQL",
      descriptionDa: "از صفحات گسترده به کوئری‌های ساختاریافته برای جریان‌های کاری تحلیل پاک‌تر حرکت کنید.",
      levelDa: "متوسط",
    },
    {
      id: "cmpyjbln00065ojjilocsbax0",
      titleDa: "آغاز توسعه وب",
      descriptionDa: "صفحات وب ساده بسازید و HTML، CSS، جاوا اسکریپت، و مبانی استقرار را بیاموزید.",
      levelDa: "مبتدی",
    },
    {
      id: "cmpyjbo3m006zojji3ooeeo0p",
      titleDa: "هوش مصنوعی برای طراحی آموزش",
      descriptionDa: "از ابزارهای هوش مصنوعی برای برنامه‌ریزی درس، بازخورد، و حمایت از فراگیران به‌طور اندیشمندانه استفاده کنید.",
      levelDa: "متوسط",
    },
    {
      id: "cmpyjbqhn007tojjiiku2z9k7",
      titleDa: "آمار با مثال‌های واقعی",
      descriptionDa: "میانگین، پراکندگی، احتمال، و استنتاج را با استفاده از داده‌های روزمره بیاموزید.",
      levelDa: "مبتدی",
    },
  ];

  // ────────────────────────────────────────────────────────────────────────────
  // MODULES
  // ────────────────────────────────────────────────────────────────────────────
  const moduleUpdates = [
    // intro-physics
    { id: "intro-physics:kinematics",  titleDa: "سینماتیک",       descriptionDa: null },
    { id: "intro-physics:forces",      titleDa: "نیروها",          descriptionDa: null },
    // digital-literacy
    { id: "digital-literacy:computer-basics", titleDa: "اساسات کمپیوتر", descriptionDa: null },
    // data-literacy-foundations
    { id: "cmpyjb3e0000dojjinizwj461", titleDa: "مبانی علم داده",        descriptionDa: DA_MODULE_DESC("مبانی سواد داده") },
    { id: "cmpyjb4k2000rojji959jipot", titleDa: "علم داده کاربردی",      descriptionDa: DA_MODULE_DESC("مبانی سواد داده") },
    // intro-to-python
    { id: "cmpyjb5x50017ojji2q9hpoh9", titleDa: "مبانی نرم‌افزار",       descriptionDa: DA_MODULE_DESC("مقدمه پایتون برای فراگیران") },
    { id: "cmpyjb6yo001lojji9zgvsqjj", titleDa: "نرم‌افزار کاربردی",     descriptionDa: DA_MODULE_DESC("مقدمه پایتون برای فراگیران") },
    // machine-learning-concepts
    { id: "cmpyjb8fg0021ojji1sc1psk4", titleDa: "مبانی یادگیری ماشین",  descriptionDa: DA_MODULE_DESC("مفاهیم یادگیری ماشین") },
    { id: "cmpyjb9xx002fojji9nnzo2ww", titleDa: "یادگیری ماشین کاربردی",descriptionDa: DA_MODULE_DESC("مفاهیم یادگیری ماشین") },
    // economics
    { id: "cmpyjbbr9002vojjino7zv0rp", titleDa: "مبانی اقتصاد",          descriptionDa: DA_MODULE_DESC("اقتصاد برای تصمیمات روزمره") },
    { id: "cmpyjbcv20039ojjixj1q549r", titleDa: "اقتصاد کاربردی",        descriptionDa: DA_MODULE_DESC("اقتصاد برای تصمیمات روزمره") },
    // algebra
    { id: "cmpyjbeh7003pojjinrij1fx9", titleDa: "مبانی ریاضیات",         descriptionDa: DA_MODULE_DESC("حل مسائل جبر") },
    { id: "cmpyjbfjf0043ojjil99nrpfi", titleDa: "ریاضیات کاربردی",       descriptionDa: DA_MODULE_DESC("حل مسائل جبر") },
    // research-methods
    { id: "cmpyjbh5m004jojjipkuc0jfv", titleDa: "مبانی تحقیق",           descriptionDa: DA_MODULE_DESC("مبانی روش‌های تحقیق") },
    { id: "cmpyjbiak004xojjix5hl1c4o", titleDa: "تحقیق کاربردی",         descriptionDa: DA_MODULE_DESC("مبانی روش‌های تحقیق") },
    // excel-to-sql
    { id: "cmpyjbjm1005dojji9c6yd7l4", titleDa: "مبانی داده",             descriptionDa: DA_MODULE_DESC("از Excel به تحلیل SQL") },
    { id: "cmpyjbknn005rojji4gjddpaw", titleDa: "داده کاربردی",           descriptionDa: DA_MODULE_DESC("از Excel به تحلیل SQL") },
    // web-dev
    { id: "cmpyjblzf0067ojjioh4gqam9", titleDa: "مبانی نرم‌افزار",       descriptionDa: DA_MODULE_DESC("آغاز توسعه وب") },
    { id: "cmpyjbn3x006lojjijzyv03t1", titleDa: "نرم‌افزار کاربردی",     descriptionDa: DA_MODULE_DESC("آغاز توسعه وب") },
    // ai-for-education
    { id: "cmpyjbofv0071ojjipd74kgn6", titleDa: "مبانی آموزش",           descriptionDa: DA_MODULE_DESC("هوش مصنوعی برای طراحی آموزش") },
    { id: "cmpyjbpie007fojjibtbnawb7", titleDa: "آموزش کاربردی",          descriptionDa: DA_MODULE_DESC("هوش مصنوعی برای طراحی آموزش") },
    // statistics
    { id: "cmpyjbqu8007vojjiwicwu9d8", titleDa: "مبانی آمار",             descriptionDa: DA_MODULE_DESC("آمار با مثال‌های واقعی") },
    { id: "cmpyjbrtq0089ojjifj1kko98", titleDa: "آمار کاربردی",           descriptionDa: DA_MODULE_DESC("آمار با مثال‌های واقعی") },
  ];

  // ────────────────────────────────────────────────────────────────────────────
  // LESSONS
  // ────────────────────────────────────────────────────────────────────────────
  const lessonUpdates = [
    // ── intro-physics: kinematics ──
    {
      id: "intro-physics:position-velocity",
      titleDa: "موقعیت، فاصله، و سرعت",
      descriptionDa: "یاد بگیرید که فیزیکدانان چگونه موقعیت و سرعت حرکت اجسام را توصیف می‌کنند.",
    },
    {
      id: "intro-physics:acceleration",
      titleDa: "شتاب",
      descriptionDa: "شتاب را به عنوان تغییر سرعت در طول زمان درک کنید.",
    },
    {
      id: "intro-physics:kinematics:quiz",
      titleDa: "آزمون سینماتیک",
      descriptionDa: DA_DESC_QUIZ_CHECKPOINT,
    },
    // ── intro-physics: forces ──
    {
      id: "intro-physics:newtons-laws",
      titleDa: "قوانین نیوتن",
      descriptionDa: "سه قانونی را که توضیح می‌دهند نیروها چگونه بر حرکت تأثیر می‌گذارند بررسی کنید.",
    },
    {
      id: "intro-physics:forces:quiz",
      titleDa: "آزمون نیروها",
      descriptionDa: DA_DESC_QUIZ_CHECKPOINT,
    },
    // ── digital-literacy ──
    {
      id: "digital-literacy:hardware-software",
      titleDa: "سخت‌افزار و نرم‌افزار",
      descriptionDa: "تفاوت بین قطعات فیزیکی کمپیوتر و برنامه‌هایی که روی آن‌ها اجرا می‌شوند را درک کنید.",
    },
    {
      id: "digital-literacy:internet-safety",
      titleDa: "امنیت انترنت",
      descriptionDa: "مرور ایمن‌تر، پسوردهای قوی‌تر، و اشتراک‌گذاری دقیق‌تر آنلاین را تمرین کنید.",
    },
    {
      id: "digital-literacy:computer-basics:quiz",
      titleDa: "آزمون اساسات کمپیوتر",
      descriptionDa: DA_DESC_QUIZ_CHECKPOINT,
    },
    // ── data-literacy-foundations ──
    {
      id: "cmpyjb3jp000fojjiu6ssjftz",
      titleDa: "مرور کلی: مبانی سواد داده",
      descriptionDa: DA_DESC_OVERVIEW("مبانی سواد داده"),
    },
    {
      id: "cmpyjb3sf000hojji1nc17kek",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjb3yr000jojji8z2zzyh9",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjb4pb000tojjit8e9q54l",
      titleDa: "نمایش: مبانی سواد داده",
      descriptionDa: DA_DESC_DEMO("مبانی سواد داده"),
    },
    {
      id: "cmpyjb4wn000vojjizthvnvu1",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjb52e000xojjiwureu0ax",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── intro-to-python ──
    {
      id: "cmpyjb64e0019ojjifh0mqiid",
      titleDa: "مرور کلی: مقدمه پایتون برای فراگیران",
      descriptionDa: DA_DESC_OVERVIEW("مقدمه پایتون برای فراگیران"),
    },
    {
      id: "cmpyjb69r001bojjiwvlw7jhg",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjb6ew001dojjiwmjr80jn",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjb749001nojji0famqzjo",
      titleDa: "نمایش: مقدمه پایتون برای فراگیران",
      descriptionDa: DA_DESC_DEMO("مقدمه پایتون برای فراگیران"),
    },
    {
      id: "cmpyjb7df001pojjilt4rfwmy",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjb7iz001rojjil39a43gi",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── machine-learning-concepts ──
    {
      id: "cmpyjb8to0023ojjil5idrbyb",
      titleDa: "مرور کلی: مفاهیم یادگیری ماشین",
      descriptionDa: DA_DESC_OVERVIEW("مفاهیم یادگیری ماشین"),
    },
    {
      id: "cmpyjb94g0025ojji44vjri8u",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjb9e60027ojjiltawwkph",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjba6a002hojji35qd1ypr",
      titleDa: "نمایش: مفاهیم یادگیری ماشین",
      descriptionDa: DA_DESC_DEMO("مفاهیم یادگیری ماشین"),
    },
    {
      id: "cmpyjbac6002jojji7bxf2hn5",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbajj002lojjija5wi2gs",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── economics ──
    {
      id: "cmpyjbbx0002xojji0sg3dvu5",
      titleDa: "مرور کلی: اقتصاد برای تصمیمات روزمره",
      descriptionDa: DA_DESC_OVERVIEW("اقتصاد برای تصمیمات روزمره"),
    },
    {
      id: "cmpyjbc2u002zojji1whwrzfs",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjbca70031ojjiac8p8ud8",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjbd9t003bojjirdgxhgz7",
      titleDa: "نمایش: اقتصاد برای تصمیمات روزمره",
      descriptionDa: DA_DESC_DEMO("اقتصاد برای تصمیمات روزمره"),
    },
    {
      id: "cmpyjbdhm003dojji5p7t5tk3",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbdmz003fojjiq3r2b25j",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── algebra ──
    {
      id: "cmpyjbeoa003rojjiiddh01zu",
      titleDa: "مرور کلی: حل مسائل جبر",
      descriptionDa: DA_DESC_OVERVIEW("حل مسائل جبر"),
    },
    {
      id: "cmpyjbeu0003tojji5eb96tdd",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjbf1t003vojjimvs358kg",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjbfon0045ojjirhtbsuv8",
      titleDa: "نمایش: حل مسائل جبر",
      descriptionDa: DA_DESC_DEMO("حل مسائل جبر"),
    },
    {
      id: "cmpyjbfw50047ojjidhaycvc8",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbg1j0049ojji1olk1xpf",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── research-methods ──
    {
      id: "cmpyjbhbl004lojjib4wrxv20",
      titleDa: "مرور کلی: مبانی روش‌های تحقیق",
      descriptionDa: DA_DESC_OVERVIEW("مبانی روش‌های تحقیق"),
    },
    {
      id: "cmpyjbhjl004nojjic753lvqs",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjbhoz004pojji69v78jj9",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjbift004zojjimwlciyis",
      titleDa: "نمایش: مبانی روش‌های تحقیق",
      descriptionDa: DA_DESC_DEMO("مبانی روش‌های تحقیق"),
    },
    {
      id: "cmpyjbimt0051ojjimduiamxv",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbis20053ojjiuko0vw6e",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── excel-to-sql ──
    {
      id: "cmpyjbjr4005fojjii4j72nji",
      titleDa: "مرور کلی: از Excel به تحلیل SQL",
      descriptionDa: DA_DESC_OVERVIEW("از Excel به تحلیل SQL"),
    },
    {
      id: "cmpyjbjyi005hojjio2a5rw04",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjbk3r005jojji98f2hefv",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjbkss005tojjilohyyyg3",
      titleDa: "نمایش: از Excel به تحلیل SQL",
      descriptionDa: DA_DESC_DEMO("از Excel به تحلیل SQL"),
    },
    {
      id: "cmpyjbky8005vojjie4kzfmi8",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbl5b005xojjihydtggqa",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── web-dev ──
    {
      id: "cmpyjbm4u0069ojjihvwn60yk",
      titleDa: "مرور کلی: آغاز توسعه وب",
      descriptionDa: DA_DESC_OVERVIEW("آغاز توسعه وب"),
    },
    {
      id: "cmpyjbmc0006bojji4i8mf1w4",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjbmhx006dojjibjl89d3z",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjbn8u006nojjijtc4mp57",
      titleDa: "نمایش: آغاز توسعه وب",
      descriptionDa: DA_DESC_DEMO("آغاز توسعه وب"),
    },
    {
      id: "cmpyjbne5006pojjihcwk16ma",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbnlf006rojjixwr1cem0",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── ai-for-education ──
    {
      id: "cmpyjboky0073ojjiihh9o5ae",
      titleDa: "مرور کلی: هوش مصنوعی برای طراحی آموزش",
      descriptionDa: DA_DESC_OVERVIEW("هوش مصنوعی برای طراحی آموزش"),
    },
    {
      id: "cmpyjbosh0075ojjiofgly4ai",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjboyu0077ojji9lm6pmjb",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjbpnk007hojjir04gq71h",
      titleDa: "نمایش: هوش مصنوعی برای طراحی آموزش",
      descriptionDa: DA_DESC_DEMO("هوش مصنوعی برای طراحی آموزش"),
    },
    {
      id: "cmpyjbpsn007jojji2r8x6tcv",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbq00007lojjiuooe7ba6",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    // ── statistics ──
    {
      id: "cmpyjbqzl007xojjiid54ma8v",
      titleDa: "مرور کلی: آمار با مثال‌های واقعی",
      descriptionDa: DA_DESC_OVERVIEW("آمار با مثال‌های واقعی"),
    },
    {
      id: "cmpyjbr70007zojjiw2nsk17g",
      titleDa: "خواندن: ایده‌های اصلی",
      descriptionDa: DA_DESC_READING_CORE,
    },
    {
      id: "cmpyjbrca0081ojji50fwp69a",
      titleDa: "آزمون ماژول ۱",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
    {
      id: "cmpyjbs0x008bojji3u0ahndj",
      titleDa: "نمایش: آمار با مثال‌های واقعی",
      descriptionDa: DA_DESC_DEMO("آمار با مثال‌های واقعی"),
    },
    {
      id: "cmpyjbs69008dojji5r9pjpng",
      titleDa: "خواندن: یادداشت‌های تمرین",
      descriptionDa: DA_DESC_READING_PRACTICE,
    },
    {
      id: "cmpyjbsdf008fojjipec1ryw8",
      titleDa: "آزمون ماژول ۲",
      descriptionDa: DA_DESC_MODULE_CHECK,
    },
  ];

  // ────────────────────────────────────────────────────────────────────────────
  // APPLY UPDATES
  // ────────────────────────────────────────────────────────────────────────────
  console.log(`Updating ${courseUpdates.length} courses...`);
  for (const c of courseUpdates) {
    await db.course.update({
      where: { id: c.id },
      data: { titleDa: c.titleDa, descriptionDa: c.descriptionDa, levelDa: c.levelDa },
    });
  }

  console.log(`Updating ${moduleUpdates.length} modules...`);
  for (const m of moduleUpdates) {
    await db.module.update({
      where: { id: m.id },
      data: { titleDa: m.titleDa, descriptionDa: m.descriptionDa },
    });
  }

  console.log(`Updating ${lessonUpdates.length} lessons...`);
  for (const l of lessonUpdates) {
    await db.lesson.update({
      where: { id: l.id },
      data: { titleDa: l.titleDa, descriptionDa: l.descriptionDa },
    });
  }

  console.log("Done. All Dari translations applied.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
