"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { generatedAiCourseSchema, type GeneratedAiCourse } from "@/lib/ai-course-builder";

const STORAGE_KEY = "ai-course-builder-v1";

function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return (parsed[key] as T) ?? fallback;
  } catch {
    return fallback;
  }
}

function clearStorage() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

type StepKey = "topic" | "audience" | "format" | "source" | "structure" | "review";
type LessonFormat = "reading" | "video" | "mixed";
type SourceDocument = {
  sourceType: "upload" | "paste";
  documentId?: string;
  filename: string;
  uploadedAt: string;
  preview: string;
  text?: string;
  characterCount: number;
  warning?: string;
};

type BuilderSettings = {
  topic: string;
  targetAudience: string;
  lessonFormat: LessonFormat;
  difficulty: "beginner" | "intermediate" | "advanced";
  primaryLanguage: "en" | "ps" | "fa";
  autoStructure: boolean;
  moduleCount: number;
  lessonsPerModule: number;
  generateQuizzes: boolean;
  generateSlideOutlines: boolean;
  generateVideoScript: boolean;
  generateDariPashto: boolean;
  slidesPerLesson: number;
  quizQuestionsPerLesson: number;
  sourceDocument?: SourceDocument;
};

const LIMITS = {
  maxModules: 8,
  maxLessonsPerModule: 10,
  maxSlidesPerLesson: 10,
  maxQuizQuestionsPerLesson: 10
};

const stepKeys: StepKey[] = ["topic", "audience", "format", "source", "structure", "review"];

const AI_COPY = {
  en: {
    steps: {
      topic: "Topic",
      audience: "Audience",
      format: "Format",
      source: "Source",
      structure: "Structure",
      review: "Review"
    },
    backToOptions: "Back to options",
    aiCourseBuilder: "AI Course Builder",
    draftWithAi: "Draft a course with AI",
    reviewWarning: "Review all content before publishing. AI drafts may need editing.",
    stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
    draftOnly: "Draft only · not published",
    topicQuestion: "What would you like to teach?",
    topicPlaceholder: "e.g. Solving linear equations for Afghan students",
    topicHelp: "Be specific. The more detail you give, the better the AI can tailor lessons, examples, and quizzes.",
    examples: ["Solving linear equations", "Introduction to Microsoft Excel", "Writing a professional CV in English", "Python basics for beginners"],
    audienceQuestion: "Who is this course for?",
    audiencePlaceholder: "e.g. Beginner Afghan learners who need step-by-step instruction in Pashto",
    audienceHelp: "The more specific you are, the more relevant the examples, difficulty level, and quiz questions will be for your audience.",
    formatQuestion: "How will students learn?",
    formatHelp: "Choose the lesson format that suits your teaching style.",
    readingTitle: "Reading lessons",
    readingDescription: "AI writes the full lesson text. Students read and study at their own pace.",
    videoTitle: "Video lessons",
    videoDescription: "AI prepares slide outlines and speaking scripts. You record the videos yourself.",
    mixedTitle: "Mixed",
    mixedDescription: "AI assigns reading or video per lesson based on which suits the content type.",
    primaryLanguage: "Primary language for generated content",
    english: "English",
    pashto: "Pashto",
    dari: "Dari",
    sourceTitle: "Source material",
    sourceHelp: "Optional: ground the AI on your own material. Upload a file or paste text directly.",
    uploadFile: "Upload file",
    pasteText: "Paste text",
    uploading: "Uploading and extracting...",
    replaceSource: "Replace source document",
    chooseSource: "Choose PDF, DOCX, or PPTX",
    sourceLimit: "Max 10 MB. Extracted server-side, not permanently stored.",
    pastePlaceholder: "Paste your lesson notes, textbook excerpts, or any text you want the AI to build from...",
    ready: "Ready",
    characters: "characters",
    remove: "Remove",
    contentPreview: "Content preview",
    noSource: "No source material. The AI will generate content based on your topic and audience.",
    onlySourceTypes: "Only PDF, DOCX, and PPTX files are accepted.",
    sourceTooLarge: "Source document must be 10 MB or smaller.",
    sourceExtractFailed: "Could not extract this source material. Please try another file.",
    textTrimmed: "Text was trimmed to 30,000 characters.",
    autoStructureTitle: "Let AI decide structure",
    autoStructureHelp: (hasSource: boolean) => `AI analyzes ${hasSource ? "your source material" : "the topic"} and decides how many modules and lessons to create.`,
    maxStructure: "Max 8 modules, 10 lessons each.",
    difficulty: "Difficulty",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    modules: "Modules",
    lessonsPerModule: "Lessons per module",
    contentOptions: "Content options",
    generateQuizzes: "Generate quizzes",
    generateQuizzesHelp: "Create one quiz per module, with questions drawn from each lesson.",
    questionsPerLesson: "Questions per lesson",
    generateSlides: "Generate slide outlines",
    generateSlidesReadingHelp: "Key concept outlines and visual descriptions per lesson.",
    generateSlidesVideoHelp: "Visual storyboard per slide to guide your video recording.",
    slidesPerLesson: "Slides per lesson",
    generateScripts: "Generate speaking scripts",
    generateScriptsHelp: "Word-for-word speaking guide per slide for when you record your video.",
    includeTranslations: "Include Dari and Pashto translations",
    includeTranslationsHelp: "Translate lesson titles, module titles, slide text, narration, and quizzes into both Dari and Pashto.",
    readyToGenerate: "Ready to generate your course draft?",
    generateHelp: "The AI agent will create a draft and open it in the course editor, where you can review and polish every detail.",
    lessons: "lessons",
    lesson: "lesson",
    quizzes: "Quizzes",
    slideOutlines: "Slide outlines",
    speakingScripts: "Speaking scripts",
    dariPashtoTranslations: "Dari and Pashto translations",
    source: "Source",
    generateDraft: "Generate draft and open editor",
    generatingDraft: "Generating course draft...",
    generatingHint: "This takes about 20-40 seconds for larger courses.",
    back: "Back",
    continue: "Continue",
    savingDraft: "Saving draft...",
    saveDraft: "Open Course Editor",
    generationFailed: "Could not generate the course draft.",
    noStream: "No response stream received.",
    invalidAiFormat: "The AI returned an unexpected format. Please try again.",
    structureMismatch: "The AI did not follow the requested module and lesson count. Please try generating again.",
    saveFailed: "Could not save the draft course.",
    coursePreview: "Course preview",
    progress: "Progress",
    courseTopic: "Course topic",
    targetAudience: "Target audience",
    format: "Format",
    sourceOptional: "Source material optional",
    courseNotGenerated: "Course not yet generated",
    yourCourseTitle: "Your course title",
    reviewGenerated: "Review and edit the generated draft before saving.",
    regenerate: "Regenerate",
    courseTitle: "Course title",
    courseDescription: "Course description",
    courseOutline: "Course outline",
    module: "Module",
    moduleDescription: "Module description",
    video: "Video",
    reading: "Reading",
    switchTo: "Switch to",
    minutesShort: "Min",
    lessonTitle: "Lesson title",
    summary: "Summary",
    videoDescriptionLabel: "Video description: what this video covers",
    lessonContent: "Lesson content",
    addYoutubeLater: "After saving, add a YouTube URL in the course editor once you have recorded this video.",
    quizPreview: "Quiz preview",
    question: "question",
    questions: "questions",
    correct: "Correct",
    noQuiz: "No quiz requested.",
    slides: "slides",
    slide: "slide",
    noSlides: "No slides requested.",
    speakingPreview: "Speaking script preview"
  },
  ps: {
    steps: {
      topic: "موضوع",
      audience: "زده‌کوونکي",
      format: "بڼه",
      source: "سرچینه",
      structure: "جوړښت",
      review: "کتنه"
    },
    backToOptions: "د جوړولو انتخابونو ته ستنېدل",
    aiCourseBuilder: "د AI کورس جوړوونکی",
    draftWithAi: "د AI په مرسته د کورس مسوده جوړه کړئ",
    reviewWarning: "له خپرولو مخکې ټول مواد په دقت وګورئ. د AI مسوده ښايي سمون ته اړتیا ولري.",
    stepOf: (current: number, total: number) => `ګام ${current} له ${total}`,
    draftOnly: "یوازې مسوده · نه ده خپره شوې",
    topicQuestion: "څه شی تدریسول غواړئ؟",
    topicPlaceholder: "بېلګه: د افغان زده‌کوونکو لپاره د خطي معادلو حل",
    topicHelp: "موضوع روښانه ولیکئ. څومره چې معلومات دقیق وي، AI هماغومره ښه لوستونه، مثالونه او ازموینې جوړوي.",
    examples: ["د خطي معادلو حل", "د مایکروسافټ اېکسل پېژندنه", "په انګلیسي کې مسلکي CV لیکل", "د پیل‌کوونکو لپاره د Python بنسټونه"],
    audienceQuestion: "دا کورس د چا لپاره دی؟",
    audiencePlaceholder: "بېلګه: هغه افغان پیل‌کوونکي چې په پښتو کې ګام په ګام لارښوونې ته اړتیا لري",
    audienceHelp: "د زده‌کوونکو اړتیاوې چې څومره روښانه وي، مثالونه، کچه او ازموینې هماغومره ګټورې کېږي.",
    formatQuestion: "زده‌کوونکي به څنګه زده کړه کوي؟",
    formatHelp: "هغه بڼه وټاکئ چې ستاسو د تدریس له طریقې سره برابره ده.",
    readingTitle: "لوستیز متنونه",
    readingDescription: "AI بشپړ لوستیز متن لیکي. زده‌کوونکي یې په خپل وخت لولي او زده کوي.",
    videoTitle: "ویډیويي لوستونه",
    videoDescription: "AI د سلایډونو طرحه او د وینا متن چمتو کوي. ویډیو تاسو خپله ثبتوئ.",
    mixedTitle: "ګډه بڼه",
    mixedDescription: "AI د هر لوست لپاره د موضوع له مخې لوستیز متن یا ویډیو ټاکي.",
    primaryLanguage: "د جوړېدونکي منځپانګې اصلي ژبه",
    english: "انګلیسي",
    pashto: "پښتو",
    dari: "دري",
    sourceTitle: "د سرچینې مواد",
    sourceHelp: "اختیاري: خپل مواد ورکړئ، څو AI کورس د هغو پر بنسټ جوړ کړي. فایل پورته کړئ یا متن ولګوئ.",
    uploadFile: "فایل پورته کول",
    pasteText: "متن لګول",
    uploading: "پورته کېږي او متن ترې ایستل کېږي...",
    replaceSource: "سرچینه بدله کړئ",
    chooseSource: "PDF، DOCX، یا PPTX وټاکئ",
    sourceLimit: "تر ۱۰ MB پورې. متن په سرور کې ایستل کېږي او فایل دایمي نه ساتل کېږي.",
    pastePlaceholder: "خپل یادښتونه، د کتاب برخې، یا هغه متن دلته ولګوئ چې غواړئ AI کورس ترې جوړ کړي...",
    ready: "چمتو",
    characters: "توري",
    remove: "لرې کول",
    contentPreview: "د منځپانګې لنډه کتنه",
    noSource: "سرچینه نه ده ورکړل شوې. AI به کورس ستاسو د موضوع او زده‌کوونکو پر بنسټ جوړ کړي.",
    onlySourceTypes: "یوازې PDF، DOCX او PPTX فایلونه منل کېږي.",
    sourceTooLarge: "د سرچینې فایل باید ۱۰ MB یا تر هغه کم وي.",
    sourceExtractFailed: "له دې سرچینې څخه متن ونه ایستل شو. مهرباني وکړئ بل فایل وازمویئ.",
    textTrimmed: "متن ۳۰٬۰۰۰ تورو ته راکم شو.",
    autoStructureTitle: "AI دې جوړښت پخپله وټاکي",
    autoStructureHelp: (hasSource: boolean) => `AI ${hasSource ? "ستاسو سرچینه" : "موضوع"} ارزوي او د ماډیولونو او لوستونو شمېر ټاکي.`,
    maxStructure: "تر ۸ ماډیولونو او په هر ماډیول کې تر ۱۰ لوستونو پورې.",
    difficulty: "کچه",
    beginner: "پیل‌کوونکی",
    intermediate: "منځنۍ",
    advanced: "پرمختللې",
    modules: "ماډیولونه",
    lessonsPerModule: "په هر ماډیول کې لوستونه",
    contentOptions: "د منځپانګې انتخابونه",
    generateQuizzes: "ازموینې جوړول",
    generateQuizzesHelp: "د هر ماډیول لپاره یوه ازموینه جوړوي او پوښتنې یې د هماغه ماډیول له لوستونو اخلي.",
    questionsPerLesson: "په هر لوست کې پوښتنې",
    generateSlides: "د سلایډونو طرحه جوړول",
    generateSlidesReadingHelp: "د هر لوست لپاره مهم ټکي او بصري لارښوونې جوړوي.",
    generateSlidesVideoHelp: "د ویډیو د ثبت لپاره د هر سلایډ بصري طرحه جوړوي.",
    slidesPerLesson: "په هر لوست کې سلایډونه",
    generateScripts: "د وینا متن جوړول",
    generateScriptsHelp: "د ویډیو د ثبت لپاره د هر سلایډ د خبرو بشپړ متن جوړوي.",
    includeTranslations: "د دري او پښتو ژباړې ورګډول",
    includeTranslationsHelp: "د لوستونو سرلیکونه، ماډیولونه، سلایډونه، وینا او ازموینې په دري او پښتو کې هم جوړوي.",
    readyToGenerate: "ایا د کورس مسودې جوړولو ته چمتو یاست؟",
    generateHelp: "AI به د کورس مسوده جوړه کړي او د کورس اېډیټر به پرانیزي؛ هلته کولای شئ هره برخه وګورئ او سم یې کړئ.",
    lessons: "لوستونه",
    lesson: "لوست",
    quizzes: "ازموینې",
    slideOutlines: "د سلایډونو طرحې",
    speakingScripts: "د وینا متنونه",
    dariPashtoTranslations: "دري او پښتو ژباړې",
    source: "سرچینه",
    generateDraft: "مسوده جوړه او اېډیټر پرانیزئ",
    generatingDraft: "د کورس مسوده جوړېږي...",
    generatingHint: "د لویو کورسونو لپاره دا کار شاوخوا ۲۰ تر ۴۰ ثانیو وخت نیسي.",
    back: "شاته",
    continue: "دوام",
    savingDraft: "مسوده خوندي کېږي...",
    saveDraft: "د کورس اېډیټر پرانیزئ",
    generationFailed: "د کورس مسوده جوړه نه شوه.",
    noStream: "د ځواب بهیر ترلاسه نه شو.",
    invalidAiFormat: "AI نااشنا بڼه راولېږله. مهرباني وکړئ بیا هڅه وکړئ.",
    structureMismatch: "AI د ماډیولونو او لوستونو غوښتل شوی شمېر سم تعقیب نه کړ. مهرباني وکړئ بیا یې جوړ کړئ.",
    saveFailed: "د کورس مسوده خوندي نه شوه.",
    coursePreview: "د کورس مخکتنه",
    progress: "پرمختګ",
    courseTopic: "د کورس موضوع",
    targetAudience: "هدف زده‌کوونکي",
    format: "بڼه",
    sourceOptional: "د سرچینې مواد اختیاري دي",
    courseNotGenerated: "کورس لا نه دی جوړ شوی",
    yourCourseTitle: "ستاسو د کورس سرلیک",
    reviewGenerated: "جوړه شوې مسوده وګورئ او له خوندي کولو مخکې یې سم کړئ.",
    regenerate: "بیا جوړول",
    courseTitle: "د کورس سرلیک",
    courseDescription: "د کورس تشریح",
    courseOutline: "د کورس جوړښت",
    module: "ماډیول",
    moduleDescription: "د ماډیول تشریح",
    video: "ویډیو",
    reading: "لوست",
    switchTo: "واړوئ",
    minutesShort: "دقیقې",
    lessonTitle: "د لوست سرلیک",
    summary: "لنډیز",
    videoDescriptionLabel: "د ویډیو تشریح: دا ویډیو څه پوښي",
    lessonContent: "د لوست منځپانګه",
    addYoutubeLater: "له خوندي کولو وروسته، کله چې ویډیو ثبت کړئ، د کورس په اېډیټر کې د YouTube لینک ورزیات کړئ.",
    quizPreview: "د ازموینې مخکتنه",
    question: "پوښتنه",
    questions: "پوښتنې",
    correct: "سم ځواب",
    noQuiz: "ازموینه نه ده غوښتل شوې.",
    slides: "سلایډونه",
    slide: "سلایډ",
    noSlides: "سلایډونه نه دي غوښتل شوي.",
    speakingPreview: "د وینا متن مخکتنه"
  },
  fa: {
    steps: {
      topic: "موضوع",
      audience: "شاگردان",
      format: "قالب",
      source: "منبع",
      structure: "ساختار",
      review: "بازبینی"
    },
    backToOptions: "بازگشت به گزینه‌های ساخت کورس",
    aiCourseBuilder: "سازنده کورس با AI",
    draftWithAi: "مسوده کورس را با AI بسازید",
    reviewWarning: "پیش از نشر، همه محتوا را با دقت بازبینی کنید. مسوده‌های AI ممکن است نیاز به اصلاح داشته باشند.",
    stepOf: (current: number, total: number) => `گام ${current} از ${total}`,
    draftOnly: "فقط مسوده · نشر نشده",
    topicQuestion: "چه چیزی را می‌خواهید تدریس کنید؟",
    topicPlaceholder: "نمونه: حل معادلات خطی برای شاگردان افغان",
    topicHelp: "موضوع را مشخص بنویسید. هرقدر معلومات دقیق‌تر باشد، AI درس‌ها، مثال‌ها و آزمون‌ها را بهتر تنظیم می‌کند.",
    examples: ["حل معادلات خطی", "آشنایی با مایکروسافت اکسل", "نوشتن CV مسلکی به انگلیسی", "مبانی Python برای مبتدیان"],
    audienceQuestion: "این کورس برای کیست؟",
    audiencePlaceholder: "نمونه: شاگردان مبتدی افغان که به آموزش گام‌به‌گام به دری نیاز دارند",
    audienceHelp: "هرقدر نیاز شاگردان روشن‌تر باشد، مثال‌ها، سطح دشواری و آزمون‌ها مناسب‌تر می‌شود.",
    formatQuestion: "شاگردان چگونه یاد بگیرند؟",
    formatHelp: "قالبی را انتخاب کنید که با شیوه تدریس شما سازگار است.",
    readingTitle: "درس‌های متنی",
    readingDescription: "AI متن کامل درس را می‌نویسد. شاگردان آن را با سرعت خود می‌خوانند و تمرین می‌کنند.",
    videoTitle: "درس‌های ویدیویی",
    videoDescription: "AI طرح سلایدها و متن گفتار را آماده می‌کند. ویدیو را خودتان ثبت می‌کنید.",
    mixedTitle: "ترکیبی",
    mixedDescription: "AI برای هر درس، با توجه به محتوا، قالب متنی یا ویدیویی را انتخاب می‌کند.",
    primaryLanguage: "زبان اصلی محتوای تولیدشده",
    english: "انگلیسی",
    pashto: "پشتو",
    dari: "دری",
    sourceTitle: "مواد منبع",
    sourceHelp: "اختیاری: مواد خود را بدهید تا AI کورس را بر بنیاد آن بسازد. فایل آپلود کنید یا متن را بچسپانید.",
    uploadFile: "آپلود فایل",
    pasteText: "چسپاندن متن",
    uploading: "در حال آپلود و استخراج متن...",
    replaceSource: "تبدیل منبع",
    chooseSource: "PDF، DOCX یا PPTX انتخاب کنید",
    sourceLimit: "حداکثر ۱۰ MB. متن در سرور استخراج می‌شود و فایل دایمی ذخیره نمی‌شود.",
    pastePlaceholder: "یادداشت‌های درسی، بخش‌هایی از کتاب یا هر متنی را که می‌خواهید AI از آن کورس بسازد اینجا بچسپانید...",
    ready: "آماده",
    characters: "نویسه",
    remove: "حذف",
    contentPreview: "پیش‌نمایش محتوا",
    noSource: "منبعی داده نشده است. AI کورس را بر بنیاد موضوع و شاگردان هدف می‌سازد.",
    onlySourceTypes: "فقط فایل‌های PDF، DOCX و PPTX پذیرفته می‌شود.",
    sourceTooLarge: "فایل منبع باید ۱۰ MB یا کمتر باشد.",
    sourceExtractFailed: "متن از این منبع استخراج نشد. لطفاً فایل دیگری را امتحان کنید.",
    textTrimmed: "متن تا ۳۰٬۰۰۰ نویسه کوتاه شد.",
    autoStructureTitle: "AI ساختار را خودش تعیین کند",
    autoStructureHelp: (hasSource: boolean) => `AI ${hasSource ? "مواد منبع شما" : "موضوع"} را بررسی می‌کند و شمار ماژول‌ها و درس‌ها را تعیین می‌کند.`,
    maxStructure: "حداکثر ۸ ماژول و در هر ماژول حداکثر ۱۰ درس.",
    difficulty: "سطح",
    beginner: "مبتدی",
    intermediate: "متوسط",
    advanced: "پیشرفته",
    modules: "ماژول‌ها",
    lessonsPerModule: "درس در هر ماژول",
    contentOptions: "گزینه‌های محتوا",
    generateQuizzes: "ساخت آزمون‌ها",
    generateQuizzesHelp: "برای هر ماژول یک آزمون می‌سازد و پرسش‌ها را از درس‌های همان ماژول می‌گیرد.",
    questionsPerLesson: "پرسش در هر درس",
    generateSlides: "ساخت طرح سلایدها",
    generateSlidesReadingHelp: "برای هر درس نکات کلیدی و توضیح‌های بصری می‌سازد.",
    generateSlidesVideoHelp: "برای ثبت ویدیو، طرح بصری هر سلاید را آماده می‌کند.",
    slidesPerLesson: "سلاید در هر درس",
    generateScripts: "ساخت متن گفتار",
    generateScriptsHelp: "برای ثبت ویدیو، متن گفتار هر سلاید را آماده می‌کند.",
    includeTranslations: "افزودن ترجمه دری و پشتو",
    includeTranslationsHelp: "عنوان درس‌ها، ماژول‌ها، متن سلایدها، گفتار و آزمون‌ها را به دری و پشتو نیز می‌سازد.",
    readyToGenerate: "آیا برای ساخت مسوده کورس آماده هستید؟",
    generateHelp: "AI مسوده کورس را می‌سازد و آن را در ویرایشگر کورس باز می‌کند؛ در آنجا می‌توانید همه جزئیات را بازبینی و اصلاح کنید.",
    lessons: "درس",
    lesson: "درس",
    quizzes: "آزمون‌ها",
    slideOutlines: "طرح سلایدها",
    speakingScripts: "متن گفتار",
    dariPashtoTranslations: "ترجمه دری و پشتو",
    source: "منبع",
    generateDraft: "ساخت مسوده و باز کردن ویرایشگر",
    generatingDraft: "مسوده کورس در حال ساخت است...",
    generatingHint: "برای کورس‌های بزرگ‌تر، این کار حدود ۲۰ تا ۴۰ ثانیه زمان می‌برد.",
    back: "بازگشت",
    continue: "ادامه",
    savingDraft: "مسوده ذخیره می‌شود...",
    saveDraft: "باز کردن ویرایشگر کورس",
    generationFailed: "مسوده کورس ساخته نشد.",
    noStream: "جریان پاسخ دریافت نشد.",
    invalidAiFormat: "AI قالب نامنتظر فرستاد. لطفاً دوباره تلاش کنید.",
    structureMismatch: "AI شمار ماژول‌ها و درس‌های درخواستی را درست رعایت نکرد. لطفاً دوباره بسازید.",
    saveFailed: "مسوده کورس ذخیره نشد.",
    coursePreview: "پیش‌نمایش کورس",
    progress: "پیشرفت",
    courseTopic: "موضوع کورس",
    targetAudience: "شاگردان هدف",
    format: "قالب",
    sourceOptional: "مواد منبع اختیاری است",
    courseNotGenerated: "کورس هنوز ساخته نشده است",
    yourCourseTitle: "عنوان کورس شما",
    reviewGenerated: "مسوده ساخته‌شده را بازبینی و پیش از ذخیره ویرایش کنید.",
    regenerate: "ساخت دوباره",
    courseTitle: "عنوان کورس",
    courseDescription: "توضیح کورس",
    courseOutline: "ساختار کورس",
    module: "ماژول",
    moduleDescription: "توضیح ماژول",
    video: "ویدیو",
    reading: "درس متنی",
    switchTo: "تبدیل به",
    minutesShort: "دقیقه",
    lessonTitle: "عنوان درس",
    summary: "خلاصه",
    videoDescriptionLabel: "توضیح ویدیو: این ویدیو چه چیز را پوشش می‌دهد",
    lessonContent: "محتوای درس",
    addYoutubeLater: "پس از ذخیره، وقتی ویدیو را ثبت کردید، لینک YouTube را در ویرایشگر کورس اضافه کنید.",
    quizPreview: "پیش‌نمایش آزمون",
    question: "پرسش",
    questions: "پرسش",
    correct: "پاسخ درست",
    noQuiz: "آزمونی درخواست نشده است.",
    slides: "سلاید",
    slide: "سلاید",
    noSlides: "سلایدی درخواست نشده است.",
    speakingPreview: "پیش‌نمایش متن گفتار"
  }
} as const;

type AiBuilderCopy = (typeof AI_COPY)[keyof typeof AI_COPY];

const initialSettings: BuilderSettings = {
  topic: "",
  targetAudience: "",
  lessonFormat: "reading",
  difficulty: "beginner",
  primaryLanguage: "en",
  autoStructure: true,
  moduleCount: 3,
  lessonsPerModule: 3,
  generateQuizzes: true,
  generateSlideOutlines: true,
  generateVideoScript: true,
  generateDariPashto: true,
  slidesPerLesson: 5,
  quizQuestionsPerLesson: 4,
  sourceDocument: undefined
};

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function cloneCourse(course: GeneratedAiCourse): GeneratedAiCourse {
  return JSON.parse(JSON.stringify(course)) as GeneratedAiCourse;
}

function storageSafeSettings(settings: BuilderSettings): BuilderSettings {
  if (!settings.sourceDocument) return settings;
  if (settings.sourceDocument.sourceType === "paste") {
    return { ...settings, sourceDocument: undefined };
  }
  const { text: _text, ...safeSourceDocument } = settings.sourceDocument;
  return { ...settings, sourceDocument: safeSourceDocument };
}

function storageSafeGenerated(course: GeneratedAiCourse | null): GeneratedAiCourse | null {
  if (!course?.course.sourceDocument) return course;
  const safeCourse = cloneCourse(course);
  if (safeCourse.course.sourceDocument) {
    const { text: _text, ...safeSourceDocument } = safeCourse.course.sourceDocument;
    safeCourse.course.sourceDocument = safeSourceDocument;
  }
  return safeCourse;
}

function localizedCourseTitle(course: GeneratedAiCourse["course"], locale: string) {
  if (locale === "ps") return course.titlePashto || course.title;
  if (locale === "fa") return course.titleDari || course.title;
  return course.title;
}

function localizedCourseDescription(course: GeneratedAiCourse["course"], locale: string) {
  if (locale === "ps") return course.descriptionPashto || course.description;
  if (locale === "fa") return course.descriptionDari || course.description;
  return course.description;
}

function lessonFormatLabel(format: LessonFormat, copy: AiBuilderCopy) {
  if (format === "video") return copy.video;
  if (format === "mixed") return copy.mixedTitle;
  return copy.reading;
}

function lessonTypeColor(type: string) {
  if (type === "video") return "border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--brand)]";
  return "border border-[color:var(--border)] bg-[color:var(--brand-50)] text-[color:var(--brand)]";
}

export function AiCourseBuilderAgent({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { locale } = useLanguage();
  const isRtl = locale === "ps" || locale === "fa";
  const copy = locale === "ps" ? AI_COPY.ps : locale === "fa" ? AI_COPY.fa : AI_COPY.en;
  const steps = stepKeys.map((key) => ({ key, label: copy.steps[key] }));
  const [activeStep, setActiveStep] = useState<StepKey>(() => readStorage("activeStep", "topic" as StepKey));
  const [settings, setSettings] = useState<BuilderSettings>(() => storageSafeSettings(readStorage("settings", initialSettings)));
  const [generated, setGenerated] = useState<GeneratedAiCourse | null>(() => storageSafeGenerated(readStorage("generated", null)));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sourceStatus, setSourceStatus] = useState<"idle" | "uploading" | "ready" | "failed">(() =>
    readStorage("settings", initialSettings).sourceDocument ? "ready" : "idle"
  );
  const [sourceError, setSourceError] = useState("");
  const [sourceInputTab, setSourceInputTab] = useState<"upload" | "paste">(() => readStorage("sourceInputTab", "upload" as "upload" | "paste"));
  const [pasteText, setPasteText] = useState("");
  const [error, setError] = useState("");

  // Persist all builder state on every change so returning to the page restores progress
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        activeStep,
        settings: storageSafeSettings(settings),
        generated: storageSafeGenerated(generated),
        sourceInputTab
      }));
    } catch { /* ignore quota errors */ }
  }, [activeStep, settings, generated, sourceInputTab]);

  const activeIndex = steps.findIndex((step) => step.key === activeStep);

  const canContinue = useMemo(() => {
    if (activeStep === "topic") return settings.topic.trim().length >= 5;
    if (activeStep === "audience") return settings.targetAudience.trim().length >= 3;
    return true;
  }, [activeStep, settings.topic, settings.targetAudience]);

  function patchSettings(patch: Partial<BuilderSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
    setGenerated(null);
    setError("");
  }

  function goNext() {
    const next = steps[activeIndex + 1];
    if (next) setActiveStep(next.key);
  }

  function goBack() {
    const previous = steps[activeIndex - 1];
    if (previous) setActiveStep(previous.key);
  }

  async function requestGeneratedCourse() {
    const response = await fetch("/api/educator/ai-course/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });

    if (!response.ok) throw new Error(copy.generationFailed);
    if (!response.body) throw new Error(copy.noStream);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value, { stream: true });
    }
    accumulated += decoder.decode();

    const parsed = generatedAiCourseSchema.safeParse(JSON.parse(accumulated));
    if (!parsed.success) {
      console.error("Course schema validation failed:\n" + JSON.stringify(parsed.error.issues, null, 2));
      throw new Error(copy.invalidAiFormat);
    }

    const nextGenerated = parsed.data;
    if (!settings.autoStructure) {
      const hasRequestedStructure =
        nextGenerated.modules.length === settings.moduleCount &&
        nextGenerated.modules.every((module) => module.lessons.length === settings.lessonsPerModule);
      if (!hasRequestedStructure) {
        console.error("AI course structure mismatch", {
          expectedModules: settings.moduleCount,
          expectedLessonsPerModule: settings.lessonsPerModule,
          receivedModules: nextGenerated.modules.length,
          receivedLessonsPerModule: nextGenerated.modules.map((module) => module.lessons.length)
        });
        throw new Error(copy.structureMismatch);
      }
    }
    if (settings.sourceDocument) {
      const { sourceType, documentId, filename, uploadedAt, preview, characterCount, warning } = settings.sourceDocument;
      nextGenerated.course.sourceDocument = { sourceType, documentId, filename, uploadedAt, preview, characterCount, warning };
    }
    return nextGenerated;
  }

  async function saveDraft(courseToSave = generated) {
    if (!courseToSave) return;
    setError("");
    setIsSaving(true);
    try {
      const response = await fetch("/api/educator/ai-course/save-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generated: courseToSave })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(copy.saveFailed);
      }
      clearStorage();
      router.push(`/educator/courses/${payload.data.courseId}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : copy.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  async function generateAndOpenEditor() {
    setError("");
    setIsGenerating(true);
    try {
      const nextGenerated = await requestGeneratedCourse();
      setGenerated(nextGenerated);
      await saveDraft(nextGenerated);
    } catch (caught) {
      const localizedErrors = new Set<string>([
        copy.generationFailed,
        copy.noStream,
        copy.invalidAiFormat,
        copy.structureMismatch,
        copy.saveFailed
      ]);
      const message = caught instanceof Error && localizedErrors.has(caught.message) ? caught.message : copy.generationFailed;
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function uploadSourceDocument(file: File | null) {
    setSourceError("");
    if (!file) return;
    if (!/\.(pdf|docx|pptx)$/i.test(file.name)) {
      setSourceStatus("failed");
      setSourceError(copy.onlySourceTypes);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSourceStatus("failed");
      setSourceError(copy.sourceTooLarge);
      return;
    }
    setSourceStatus("uploading");
    const form = new FormData();
    form.set("file", file);
    try {
      const response = await fetch("/api/educator/ai-course/source-document", {
        method: "POST",
        body: form
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(copy.sourceExtractFailed);
      }
      patchSettings({ sourceDocument: payload.data });
      setSourceStatus("ready");
    } catch (caught) {
      patchSettings({ sourceDocument: undefined });
      setSourceStatus("failed");
      setSourceError(caught instanceof Error ? caught.message : copy.sourceExtractFailed);
    }
  }

  function switchSourceTab(tab: "upload" | "paste") {
    setSourceInputTab(tab);
    patchSettings({ sourceDocument: undefined });
    setSourceStatus("idle");
    setSourceError("");
    setPasteText("");
  }

  function handlePasteTextChange(value: string) {
    setPasteText(value);
    if (!value.trim()) {
      patchSettings({ sourceDocument: undefined });
      return;
    }
    const MAX = 30000;
    const trimmed = value.slice(0, MAX);
    patchSettings({
      sourceDocument: {
        sourceType: "paste",
        filename: copy.pasteText,
        uploadedAt: new Date().toISOString(),
        preview: trimmed.slice(0, 600),
        text: trimmed,
        characterCount: trimmed.length,
        warning: value.length > MAX ? copy.textTrimmed : undefined
      }
    });
  }

  const totalLessons = settings.moduleCount * settings.lessonsPerModule;

  return (
    <main dir={isRtl ? "rtl" : "ltr"} className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)_280px] lg:px-8">

      {/* ── Left sidebar: step navigation ── */}
      <aside className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow-sm)] lg:sticky lg:top-24 lg:self-start">
        <button type="button" onClick={() => { clearStorage(); onBack(); }} className="pr-btn-ghost mb-4 !min-h-9 w-full justify-center px-3 text-[12px]">
          {copy.backToOptions}
        </button>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--brand)]">{copy.aiCourseBuilder}</p>
        <h1 className="mt-1.5 text-lg font-black tracking-[-0.02em] text-[color:var(--ink)]">{copy.draftWithAi}</h1>
        <nav className="mt-5 space-y-1">
          {steps.map((step, index) => {
            const isActive = step.key === activeStep;
            const isDone = index < activeIndex || (step.key === "review" && !!generated);
            return (
              <button
                key={step.key}
                type="button"
                onClick={() => setActiveStep(step.key)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${
                  isActive
                    ? "border-[color:var(--brand)] bg-[color:var(--brand-50)] text-[color:var(--brand)]"
                    : "border-transparent text-[color:var(--muted)] hover:bg-[color:var(--surface)]"
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition ${
                  isDone
                    ? "bg-[color:var(--success)] text-white"
                    : isActive
                      ? "bg-[color:var(--brand)] text-white"
                      : "bg-[color:var(--surface)] text-[color:var(--muted)]"
                }`}>
                  {isDone ? "✓" : index + 1}
                </span>
                {step.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-5 rounded-xl border border-[color:var(--border)] bg-[color:var(--warning-50)] p-3 text-xs font-semibold leading-5 text-[color:var(--warning)]">
          {copy.reviewWarning}
        </div>
      </aside>

      {/* ── Center: step content ── */}
      <section className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow)] sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--border)] pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[color:var(--muted)]">{copy.stepOf(activeIndex + 1, steps.length)}</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[color:var(--ink)]">{steps[activeIndex].label}</h2>
          </div>
          <span className="rounded-full bg-[color:var(--success-50)] px-3 py-1 text-xs font-black text-[color:var(--success)]">
            {copy.draftOnly}
          </span>
        </div>

        {/* Step: Topic */}
        {activeStep === "topic" && (
          <div className="space-y-4">
            <label className="pr-label text-base">
              {copy.topicQuestion}
              <textarea
                value={settings.topic}
                onChange={(event) => patchSettings({ topic: event.target.value })}
                className="pr-input min-h-28 text-lg"
                placeholder={copy.topicPlaceholder}
              />
            </label>
            <p className="text-xs font-semibold text-[color:var(--muted)]">{copy.topicHelp}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {copy.examples.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => patchSettings({ topic: example })}
                  className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-3 text-left text-sm font-semibold text-[color:var(--ink-2)] transition hover:border-[color:var(--brand)] hover:bg-[color:var(--card)]"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Audience */}
        {activeStep === "audience" && (
          <div className="space-y-4">
            <label className="pr-label text-base">
              {copy.audienceQuestion}
              <textarea
                value={settings.targetAudience}
                onChange={(event) => patchSettings({ targetAudience: event.target.value })}
                className="pr-input min-h-32"
                placeholder={copy.audiencePlaceholder}
              />
            </label>
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 text-sm font-semibold leading-6 text-[color:var(--muted)]">
              {copy.audienceHelp}
            </div>
          </div>
        )}

        {/* Step: Format */}
        {activeStep === "format" && (
          <div className="space-y-6">
            <div>
              <p className="text-sm font-black text-[color:var(--ink)]">{copy.formatQuestion}</p>
              <p className="mt-1 text-xs font-semibold text-[color:var(--muted)]">{copy.formatHelp}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {([
                {
                  value: "reading" as const,
                  icon: "READ",
                  title: copy.readingTitle,
                  description: copy.readingDescription
                },
                {
                  value: "video" as const,
                  icon: "VID",
                  title: copy.videoTitle,
                  description: copy.videoDescription
                },
                {
                  value: "mixed" as const,
                  icon: "MIX",
                  title: copy.mixedTitle,
                  description: copy.mixedDescription
                }
              ] as const).map(({ value, icon, title, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => patchSettings({ lessonFormat: value })}
                  className={`rounded-2xl border-2 p-4 text-left transition ${
                    settings.lessonFormat === value
                      ? "border-[color:var(--brand)] bg-[color:var(--brand-50)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--brand)] hover:bg-[color:var(--card)]"
                  }`}
                >
                  <span className="text-xs font-black tracking-[0.14em] text-[color:var(--brand)]">{icon}</span>
                  <p className="mt-3 text-sm font-black text-[color:var(--ink)]">{title}</p>
                  <p className="mt-1.5 text-xs font-semibold leading-5 text-[color:var(--muted)]">{description}</p>
                </button>
              ))}
            </div>
            <label className="pr-label">
              {copy.primaryLanguage}
              <select
                value={settings.primaryLanguage}
                onChange={(event) => patchSettings({ primaryLanguage: event.target.value as BuilderSettings["primaryLanguage"] })}
                className="pr-input"
              >
                <option value="en">{copy.english}</option>
                <option value="ps">{copy.pashto}</option>
                <option value="fa">{copy.dari}</option>
              </select>
            </label>
          </div>
        )}

        {/* Step: Source document */}
        {activeStep === "source" && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-black text-[color:var(--ink)]">{copy.sourceTitle}</p>
              <p className="mt-1 text-xs font-semibold text-[color:var(--muted)]">
                {copy.sourceHelp}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1">
              {(["upload", "paste"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => switchSourceTab(tab)}
                  className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-black transition ${
                    sourceInputTab === tab
                      ? "bg-[color:var(--card)] text-[color:var(--ink)] shadow-sm"
                      : "text-[color:var(--muted)] hover:text-[color:var(--ink-2)]"
                  }`}
                >
                  {tab === "upload" ? copy.uploadFile : copy.pasteText}
                </button>
              ))}
            </div>

            {sourceInputTab === "upload" ? (
              <div className="rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-8 text-center transition hover:border-[color:var(--brand)]">
                  <span className="text-sm font-black text-[color:var(--brand)]">
                    {sourceStatus === "uploading"
                      ? copy.uploading
                      : settings.sourceDocument
                        ? copy.replaceSource
                        : copy.chooseSource}
                  </span>
                  <span className="mt-1 text-xs font-semibold text-[color:var(--muted)]">{copy.sourceLimit}</span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                    disabled={sourceStatus === "uploading"}
                    onChange={(event) => void uploadSourceDocument(event.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={pasteText}
                  onChange={(e) => handlePasteTextChange(e.target.value)}
                  placeholder={copy.pastePlaceholder}
                  rows={10}
                  maxLength={30000}
                  className="pr-input resize-y font-mono text-xs leading-relaxed"
                />
                <p className={`text-right text-[10px] font-black tabular-nums ${pasteText.length >= 30000 ? "text-[color:var(--warning)]" : "text-[color:var(--muted)]"}`}>
                  {pasteText.length.toLocaleString()} / 30,000
                </p>
              </div>
            )}

            {settings.sourceDocument ? (
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--success-50)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[color:var(--success)]">{settings.sourceDocument.filename}</p>
                    <p className="mt-0.5 text-xs font-semibold text-[color:var(--success)]">
                      {copy.ready} · {settings.sourceDocument.characterCount.toLocaleString(locale)} {copy.characters}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { patchSettings({ sourceDocument: undefined }); setSourceStatus("idle"); setSourceError(""); setPasteText(""); }}
                    className="rounded-xl bg-[color:var(--card)] px-3 py-1.5 text-xs font-black text-[color:var(--success)] hover:text-[color:var(--danger)]"
                  >
                    {copy.remove}
                  </button>
                </div>
                {settings.sourceDocument.warning && (
                  <p className="mt-3 rounded-xl bg-[color:var(--warning-50)] px-3 py-2 text-xs font-semibold leading-5 text-[color:var(--warning)]">{settings.sourceDocument.warning}</p>
                )}
                <div className="mt-3 rounded-xl bg-[color:var(--card)] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[color:var(--muted)]">{copy.contentPreview}</p>
                  <p className="mt-2 line-clamp-5 text-xs font-semibold leading-5 text-[color:var(--ink-2)]">{settings.sourceDocument.preview}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 text-sm font-semibold leading-6 text-[color:var(--muted)]">
                {copy.noSource}
              </div>
            )}

            {sourceStatus === "failed" && sourceError && (
              <div className="rounded-xl bg-[color:var(--danger-50)] p-3 text-sm font-semibold text-[color:var(--danger)]">
                {sourceError}
              </div>
            )}
          </div>
        )}

        {/* Step: Structure */}
        {activeStep === "structure" && (
          <div className="space-y-6">

            {/* Auto-structure toggle */}
            <button
              type="button"
              onClick={() => patchSettings({ autoStructure: !settings.autoStructure })}
              className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
                settings.autoStructure
                  ? "border-[color:var(--brand)] bg-[color:var(--brand-50)]"
                  : "border-[color:var(--border)] bg-[color:var(--surface)]"
              }`}
            >
              <span className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 transition ${
                settings.autoStructure
                  ? "border-[color:var(--brand)] bg-[color:var(--brand)]"
                  : "border-[color:var(--border)] bg-[color:var(--card)]"
              }`} aria-hidden />
              <div>
                <p className="text-sm font-black text-[color:var(--ink)]">
                  {copy.autoStructureTitle}
                </p>
                <p className="mt-0.5 text-xs font-semibold leading-5 text-[color:var(--muted)]">
                  {copy.autoStructureHelp(!!settings.sourceDocument)} {copy.maxStructure}
                </p>
              </div>
            </button>

            <label className="pr-label w-fit">
              {copy.difficulty}
              <select
                value={settings.difficulty}
                onChange={(event) => patchSettings({ difficulty: event.target.value as BuilderSettings["difficulty"] })}
                className="pr-input"
              >
                <option value="beginner">{copy.beginner}</option>
                <option value="intermediate">{copy.intermediate}</option>
                <option value="advanced">{copy.advanced}</option>
              </select>
            </label>

            {!settings.autoStructure && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="pr-label">
                  {copy.modules}
                  <input
                    type="number"
                    min={1}
                    max={LIMITS.maxModules}
                    value={settings.moduleCount}
                    onChange={(event) => patchSettings({ moduleCount: clampNumber(Number(event.target.value), 1, LIMITS.maxModules) })}
                    className="pr-input"
                  />
                </label>
                <label className="pr-label">
                  {copy.lessonsPerModule}
                  <input
                    type="number"
                    min={1}
                    max={LIMITS.maxLessonsPerModule}
                    value={settings.lessonsPerModule}
                    onChange={(event) => patchSettings({ lessonsPerModule: clampNumber(Number(event.target.value), 1, LIMITS.maxLessonsPerModule) })}
                    className="pr-input"
                  />
                </label>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[color:var(--muted)]">{copy.contentOptions}</p>

              <ToggleOption
                checked={settings.generateQuizzes}
                onChange={(v) => patchSettings({ generateQuizzes: v })}
                title={copy.generateQuizzes}
                description={copy.generateQuizzesHelp}
              >
                {settings.generateQuizzes && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                    {copy.questionsPerLesson}
                    <input
                      type="number"
                      min={1}
                      max={LIMITS.maxQuizQuestionsPerLesson}
                      value={settings.quizQuestionsPerLesson}
                      onChange={(event) => patchSettings({ quizQuestionsPerLesson: clampNumber(Number(event.target.value), 1, LIMITS.maxQuizQuestionsPerLesson) })}
                      className="h-7 w-16 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-2 text-xs outline-none focus:border-[color:var(--brand)]"
                    />
                  </label>
                )}
              </ToggleOption>

              <ToggleOption
                checked={settings.generateSlideOutlines}
                onChange={(v) => patchSettings({ generateSlideOutlines: v })}
                title={copy.generateSlides}
                description={settings.lessonFormat === "video"
                  ? copy.generateSlidesVideoHelp
                  : copy.generateSlidesReadingHelp}
              >
                {settings.generateSlideOutlines && (
                  <label className="flex items-center gap-2 text-xs font-semibold text-[color:var(--muted)]">
                    {copy.slidesPerLesson}
                    <input
                      type="number"
                      min={1}
                      max={LIMITS.maxSlidesPerLesson}
                      value={settings.slidesPerLesson}
                      onChange={(event) => patchSettings({ slidesPerLesson: clampNumber(Number(event.target.value), 1, LIMITS.maxSlidesPerLesson) })}
                      className="h-7 w-16 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)] px-2 text-xs outline-none focus:border-[color:var(--brand)]"
                    />
                  </label>
                )}
              </ToggleOption>

              {(settings.lessonFormat === "video" || settings.lessonFormat === "mixed") && (
                <ToggleOption
                  checked={settings.generateVideoScript}
                  onChange={(v) => patchSettings({ generateVideoScript: v })}
                  title={copy.generateScripts}
                  description={copy.generateScriptsHelp}
                />
              )}

              <ToggleOption
                checked={settings.generateDariPashto}
                onChange={(v) => patchSettings({ generateDariPashto: v })}
                title={copy.includeTranslations}
                description={copy.includeTranslationsHelp}
              />
            </div>
          </div>
        )}

        {/* Step: Review */}
        {activeStep === "review" && (
          <div className="space-y-5">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-5">
                <p className="text-sm font-black text-[color:var(--ink)]">{copy.readyToGenerate}</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[color:var(--muted)]">{copy.generateHelp}</p>
                <div className="mt-4 grid gap-1.5 text-xs font-semibold text-[color:var(--ink-2)]">
                  <p><strong>{settings.topic || "—"}</strong></p>
                  <p>{copy.targetAudience}: {settings.targetAudience}</p>
                  <p>
                    {copy.format}: {lessonFormatLabel(settings.lessonFormat, copy)} · {settings.difficulty === "beginner" ? copy.beginner : settings.difficulty === "intermediate" ? copy.intermediate : copy.advanced}
                  </p>
                  <p>{settings.moduleCount} {copy.modules} × {settings.lessonsPerModule} {copy.lessonsPerModule} = {totalLessons} {totalLessons === 1 ? copy.lesson : copy.lessons}</p>
                  {settings.generateQuizzes && <p>✓ {copy.quizzes} ({settings.quizQuestionsPerLesson} {copy.questionsPerLesson})</p>}
                  {settings.generateSlideOutlines && <p>✓ {copy.slideOutlines} ({settings.slidesPerLesson} {copy.slidesPerLesson})</p>}
                  {(settings.lessonFormat === "video" || settings.lessonFormat === "mixed") && settings.generateVideoScript && <p>✓ {copy.speakingScripts}</p>}
                  {settings.generateDariPashto && <p>✓ {copy.dariPashtoTranslations}</p>}
                  {settings.sourceDocument && <p>{copy.source}: {settings.sourceDocument.filename}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => { void (generated ? saveDraft(generated) : generateAndOpenEditor()); }}
                disabled={isGenerating || isSaving}
                className="pr-btn-primary w-full disabled:opacity-60"
              >
                {isGenerating ? copy.generatingDraft : isSaving ? copy.savingDraft : copy.generateDraft}
              </button>
              {(isGenerating || isSaving) && (
                <p className="text-center text-xs font-semibold text-[color:var(--muted)]">
                  {isGenerating ? copy.generatingHint : copy.savingDraft}
                </p>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-xl bg-[color:var(--danger-50)] p-3 text-sm font-semibold text-[color:var(--danger)]">
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--border)] pt-4">
          <button
            type="button"
            onClick={goBack}
            disabled={activeIndex === 0}
            className="pr-btn-ghost disabled:opacity-40"
          >
            {copy.back}
          </button>
          {activeStep === "review" ? null : (
            <button
              type="button"
              onClick={goNext}
              disabled={!canContinue}
              className="pr-btn-primary disabled:opacity-40"
            >
              {copy.continue}
            </button>
          )}
        </div>
      </section>

      {/* ── Right sidebar: live summary ── */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--muted)]">{copy.coursePreview}</p>
          <div className="mt-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${lessonTypeColor(settings.lessonFormat === "video" ? "video" : "reading")}`}>
                {lessonFormatLabel(settings.lessonFormat, copy)}
              </span>
              <span className="text-[10px] font-semibold text-[color:var(--muted)]">{settings.difficulty}</span>
            </div>
            <h3 className="mt-2 text-sm font-black leading-5 text-[color:var(--ink)]">
              {generated ? localizedCourseTitle(generated.course, locale) : settings.topic || copy.yourCourseTitle}
            </h3>
            <p className="mt-1.5 line-clamp-3 text-[11px] font-semibold leading-4 text-[color:var(--muted)]">
              {generated ? localizedCourseDescription(generated.course, locale) : settings.targetAudience}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-[var(--shadow-sm)]">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--muted)]">{copy.progress}</p>
          <ul className="mt-3 space-y-2 text-xs font-semibold text-[color:var(--ink-2)]">
            <CheckItem done={settings.topic.trim().length >= 5} label={copy.courseTopic} />
            <CheckItem done={settings.targetAudience.trim().length >= 3} label={copy.targetAudience} />
            <CheckItem done={true} label={`${copy.format}: ${lessonFormatLabel(settings.lessonFormat, copy)}`} />
            <CheckItem done={!!settings.sourceDocument} label={settings.sourceDocument ? `${copy.source}: ${settings.sourceDocument.filename}` : copy.sourceOptional} optional />
            <CheckItem done={!!generated} label={generated ? `${totalLessons} ${totalLessons === 1 ? copy.lesson : copy.lessons}` : copy.courseNotGenerated} />
          </ul>
        </div>
      </aside>
    </main>
  );
}

function CheckItem({ done, label, optional }: { done: boolean; label: string; optional?: boolean }) {
  return (
    <li className={`flex items-start gap-2 ${optional && !done ? "opacity-50" : ""}`}>
      <span className={`mt-0.5 text-[11px] font-black ${done ? "text-[color:var(--success)]" : "text-[color:var(--muted)]"}`}>
        {done ? "✓" : "○"}
      </span>
      <span>{label}</span>
    </li>
  );
}

function ToggleOption({
  checked,
  onChange,
  title,
  description,
  children
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-3 transition ${checked ? "border-[color:var(--brand)] bg-[color:var(--brand-50)]" : "border-[color:var(--border)] bg-[color:var(--surface)]"}`}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[color:var(--brand)]"
        />
        <span>
          <span className="block text-sm font-black text-[color:var(--ink)]">{title}</span>
          <span className="mt-0.5 block text-xs font-semibold leading-5 text-[color:var(--muted)]">{description}</span>
        </span>
      </label>
      {children && <div className="mt-3 pl-7">{children}</div>}
    </div>
  );
}
