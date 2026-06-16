"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { LessonType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { AvatarUpload } from "@/components/educator/AvatarUpload";
import { CourseSubmitButton } from "@/components/educator/CourseSubmitButton";
import { useLanguage } from "@/components/LanguageProvider";
import {
  createLesson,
  createModule,
  deleteLesson as deleteLessonAction,
  deleteModule as deleteModuleAction,
  reorderLessons as reorderLessonsAction,
  reorderModules as reorderModulesAction,
  updateCourse,
  updateLesson as updateLessonAction,
  updateModule as updateModuleAction
} from "@/lib/actions/course-actions";
import { addQuizQuestion, addAnswerChoice } from "@/lib/actions/quiz-builder-actions";
import { localizeLevel, type Dictionary } from "@/lib/i18n";
import type { InstructorInput } from "@/lib/validators/course";

type StepKey = "description" | "language" | "instructors" | "structure" | "pricing" | "publish";
type LessonKind = "VIDEO" | "READING" | "QUIZ" | "PDF" | "SLIDES" | "ATTACHMENT" | "ASSIGNMENT" | "LINK";
type DraftLanguage = "en" | "ps" | "fa" | "trilingual";
type TranslationContext = "courseTitle" | "courseDescription" | "moduleTitle" | "lessonTitle" | "lessonSummary" | "readingContent" | "instructorTitle" | "instructorBio" | "quizPrompt" | "answerChoice" | "quizExplanation";

type InstructorProfile = InstructorInput & {
  id?: string;
  isPrimary?: boolean;
  source?: "current-user" | "platform" | "external";
};

type InstructorSearchResult = InstructorProfile & { id: string };

type DraftQuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT";

type DraftChoice = {
  id: string;
  textEn: string;
  textPs: string;
  textDa: string;
  isCorrect: boolean;
};

type DraftQuestion = {
  id: string;
  promptEn: string;
  promptPs: string;
  promptDa: string;
  type: DraftQuestionType;
  correctAnswer: string;
  explanationEn: string;
  explanationPs: string;
  explanationDa: string;
  choices: DraftChoice[];
};

type DraftLesson = {
  id: string;
  titleEn: string;
  titlePs: string;
  titleDa: string;
  type: LessonKind;
  summaryEn: string;
  summaryPs: string;
  summaryDa: string;
  youtubeUrl: string;
  readingEn: string;
  readingPs: string;
  readingDa: string;
  resourceNote: string;
  resourceUrl: string;
  passingScore: number;
  isFinalTest: boolean;
  draftQuestions: DraftQuestion[];
};

type DraftModule = {
  id: string;
  titleEn: string;
  titlePs: string;
  titleDa: string;
  descriptionEn: string;
};

type WizardState = {
  slug: string;
  level: "" | "beginner" | "intermediate" | "advanced";
  titleEn: string;
  titlePs: string;
  titleDa: string;
  descriptionEn: string;
  descriptionPs: string;
  descriptionDa: string;
  language: DraftLanguage;
  category: string;
  modules: DraftModule[];
  lessonsByModule: Record<string, DraftLesson[]>;
  pricing: "free" | "paid" | "donation" | "subscription";
  priceUsd: string;
};

type FieldErrors = Partial<Record<"slug" | "titleEn" | "descriptionEn" | "instructors" | "structure" | "priceCents", string>>;

type CourseWizardInitial = {
  courseId: string;
  status: string;
  slug: string;
  level: "" | "beginner" | "intermediate" | "advanced";
  titleEn: string;
  titlePs: string;
  titleDa: string;
  descriptionEn: string;
  descriptionPs: string;
  descriptionDa: string;
  isPaid: boolean;
  priceCents: number | null;
  instructors: InstructorProfile[];
  modules: Array<DraftModule & { lessons: DraftLesson[] }>;
};

const STORAGE_KEY = "kabullearn-course-interview-v1";
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const urlPattern = /^https?:\/\//;

const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

function emptyQuestion(): DraftQuestion {
  return {
    id: createId("q"),
    promptEn: "",
    promptPs: "",
    promptDa: "",
    type: "SINGLE_CHOICE",
    correctAnswer: "",
    explanationEn: "",
    explanationPs: "",
    explanationDa: "",
    choices: [
      { id: createId("c"), textEn: "", textPs: "", textDa: "", isCorrect: true },
      { id: createId("c"), textEn: "", textPs: "", textDa: "", isCorrect: false },
    ],
  };
}

function emptyLesson(): DraftLesson {
  return {
    id: createId("lesson"),
    titleEn: "",
    titlePs: "",
    titleDa: "",
    type: "VIDEO",
    summaryEn: "",
    summaryPs: "",
    summaryDa: "",
    youtubeUrl: "",
    readingEn: "",
    readingPs: "",
    readingDa: "",
    resourceNote: "",
    resourceUrl: "",
    passingScore: 70,
    isFinalTest: false,
    draftQuestions: [],
  };
}

function emptyModule(): DraftModule {
  return {
    id: createId("module"),
    titleEn: "",
    titlePs: "",
    titleDa: "",
    descriptionEn: ""
  };
}

function initialState(): WizardState {
  const module = emptyModule();
  return {
    slug: "",
    level: "",
    titleEn: "",
    titlePs: "",
    titleDa: "",
    descriptionEn: "",
    descriptionPs: "",
    descriptionDa: "",
    language: "trilingual",
    category: "",
    modules: [module],
    lessonsByModule: { [module.id]: [emptyLesson()] },
    pricing: "free",
    priceUsd: ""
  };
}

function stateFromInitialCourse(initialCourse: CourseWizardInitial): WizardState {
  const fallback = emptyModule();
  const modules = initialCourse.modules.length
    ? initialCourse.modules.map((module) => ({
      id: module.id,
      titleEn: module.titleEn,
      titlePs: module.titlePs,
      titleDa: module.titleDa,
      descriptionEn: module.descriptionEn
    }))
    : [fallback];
  const lessonsByModule: Record<string, DraftLesson[]> = {};
  for (const module of initialCourse.modules) {
    lessonsByModule[module.id] = module.lessons.length ? module.lessons.map((lesson) => ({
      ...emptyLesson(),
      ...lesson,
      draftQuestions: lesson.draftQuestions ?? []
    })) : [emptyLesson()];
  }
  if (!initialCourse.modules.length) {
    lessonsByModule[fallback.id] = [emptyLesson()];
  }

  return {
    slug: initialCourse.slug,
    level: initialCourse.level,
    titleEn: initialCourse.titleEn,
    titlePs: initialCourse.titlePs,
    titleDa: initialCourse.titleDa,
    descriptionEn: initialCourse.descriptionEn,
    descriptionPs: initialCourse.descriptionPs,
    descriptionDa: initialCourse.descriptionDa,
    language: "trilingual",
    category: "",
    modules,
    lessonsByModule,
    pricing: initialCourse.isPaid ? "paid" : "free",
    priceUsd: initialCourse.priceCents ? (initialCourse.priceCents / 100).toFixed(2) : ""
  };
}

function isPersistedId(id: string, prefix: string) {
  return Boolean(id && !id.startsWith(`${prefix}-`));
}

const emptyManualInstructor = (): InstructorInput => ({
  name: "",
  username: "",
  title: "",
  titlePs: "",
  titleDa: "",
  bio: "",
  bioPs: "",
  bioDa: "",
  avatarUrl: undefined,
  linkedinUrl: "",
  youtubeUrl: "",
});

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function slugifyName(name: string) {
  const slug = slugify(name).slice(0, 44);
  return `${slug || "external-instructor"}-${Date.now().toString(36)}`;
}

function suggestDraft(source: string, existing: string) {
  if (existing.trim() || !source.trim()) return existing;
  return source.trim();
}

async function fetchCourseClassification(title: string, description: string) {
  const response = await fetch("/api/educator/classify-course", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, description })
  });
  if (!response.ok) return null;
  const payload = await response.json() as { ok: boolean; data?: { level?: string; category?: string } };
  return payload.ok ? payload.data ?? null : null;
}

async function fetchDraftTranslation(text: string, context: TranslationContext) {
  const response = await fetch("/api/educator/translate-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, context })
  });
  if (!response.ok) return null;
  const payload = await response.json() as { ok: boolean; data?: { ps?: string; fa?: string } };
  return payload.ok ? payload.data ?? null : null;
}

function visibleLessonTitle(lesson: DraftLesson, t: Dictionary) {
  return lesson.titleEn || lesson.titlePs || lesson.titleDa || t.cwLessonPlaceholder;
}

function visibleModuleTitle(module: DraftModule, t: Dictionary) {
  return module.titleEn || module.titlePs || module.titleDa || t.cwModulePlaceholder;
}

function canPersistLesson(lesson: DraftLesson) {
  if (!visibleRawLessonTitle(lesson)) return false;
  if (lesson.type === "VIDEO") return urlPattern.test(lesson.youtubeUrl);
  if (lesson.type === "READING") return Boolean(lesson.readingEn.trim() || lesson.readingPs.trim() || lesson.readingDa.trim());
  if (lesson.type === "QUIZ") return true;
  return false;
}

function visibleRawLessonTitle(lesson: DraftLesson) {
  return lesson.titleEn.trim() || lesson.titlePs.trim() || lesson.titleDa.trim();
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs font-black text-[var(--danger)]">{message}</p>;
}

function InstructorAvatar({ instructor }: { instructor: InstructorInput }) {
  const initials =
    instructor.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?";

  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-black text-[var(--brand)]">
      {instructor.avatarUrl ? <Image src={instructor.avatarUrl} alt="" width={36} height={36} className="h-full w-full object-cover" /> : initials}
    </span>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-semibold leading-6 outline-none transition focus:border-[var(--brand)] focus:ring-4 focus:ring-blue-100 ${props.className ?? ""}`}
    />
  );
}

export function CourseCreateForm({ className = "", initialCourse }: { className?: string; initialCourse?: CourseWizardInitial }) {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const isEditMode = Boolean(initialCourse);
  const storageKey = initialCourse ? `${STORAGE_KEY}:${initialCourse.courseId}` : STORAGE_KEY;
  const [state, setState] = useState<WizardState>(() => initialCourse ? stateFromInitialCourse(initialCourse) : initialState());
  const [activeStep, setActiveStep] = useState<StepKey>("description");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [savedState, setSavedState] = useState<"idle" | "saving" | "saved">("idle");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"error" | "success" | "warning">("error");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isPending, startTransition] = useTransition();
  const [isTranslating, setIsTranslating] = useState(false);
  const [primaryInstructor, setPrimaryInstructor] = useState<InstructorProfile | null>(initialCourse?.instructors[0] ?? null);
  const [coInstructors, setCoInstructors] = useState<InstructorProfile[]>(initialCourse?.instructors.slice(1) ?? []);
  const [deletedModuleIds, setDeletedModuleIds] = useState<string[]>([]);
  const [deletedLessonIds, setDeletedLessonIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [allEducators, setAllEducators] = useState<InstructorSearchResult[]>([]);
  const [manualOpen, setManualOpen] = useState(false);
  const [manualInstructor, setManualInstructor] = useState<InstructorInput>(emptyManualInstructor());
  const hasHydrated = useRef(false);

  const steps = useMemo<Array<{ key: StepKey; label: string; question: string; help: string }>>(() => [
    { key: "description", label: t.cwTitleLabel, question: t.cwBasicsQuestion, help: t.cwBasicsHelp },
    { key: "language", label: t.cwPrimaryLanguage, question: t.cwLanguageQuestion, help: t.cwLanguageHelp },
    { key: "instructors", label: t.instructors, question: t.cwInstructorsQuestion, help: t.cwInstructorsHelp },
    { key: "structure", label: t.courseStructure, question: t.cwStructureQuestion, help: t.cwStructureHelp },
    { key: "pricing", label: t.cwPricingQuestion, question: t.cwPricingQuestion, help: t.cwPricingHelp },
    { key: "publish", label: t.cwReviewTitle, question: isEditMode ? t.cwEditPublishQuestion : t.cwPublishQuestion, help: isEditMode ? t.cwEditPublishHelp : t.cwPublishHelp }
  ], [t, isEditMode]);

  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === activeStep));
  const saveComplete = isEditMode && messageTone === "success" && Boolean(message);
  const instructors = useMemo(() => primaryInstructor ? [primaryInstructor, ...coInstructors] : coInstructors, [primaryInstructor, coInstructors]);
  const selectedModule = state.modules.find((module) => module.id === selectedModuleId) ?? state.modules[0];
  const selectedLessons = selectedModule ? state.lessonsByModule[selectedModule.id] ?? [] : [];
  const selectedLesson = selectedLessons.find((lesson) => lesson.id === selectedLessonId) ?? selectedLessons[0];
  const allLessons = useMemo(() => Object.values(state.lessonsByModule).flat(), [state.lessonsByModule]);

  const availableEducators = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allEducators.filter((educator) => {
      if (educator.username === primaryInstructor?.username) return false;
      if (coInstructors.some((item) => item.username === educator.username)) return false;
      if (!q) return true;
      return educator.name.toLowerCase().includes(q) || educator.username.toLowerCase().includes(q) || (educator.title?.toLowerCase().includes(q) ?? false);
    });
  }, [allEducators, coInstructors, primaryInstructor, searchQuery]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const raw = { ...(initialCourse ? stateFromInitialCourse(initialCourse) : initialState()), ...JSON.parse(saved) } as WizardState;
        // Migrate: merge each lesson/module with current empty shape so newly-added
        // fields (draftQuestions, resourceUrl, readingPs, …) always exist.
        const migratedLessons: Record<string, DraftLesson[]> = {};
        for (const [mid, lessons] of Object.entries(raw.lessonsByModule)) {
          migratedLessons[mid] = (lessons as DraftLesson[]).map((l) => ({
            ...emptyLesson(),
            ...l,
            draftQuestions: (l.draftQuestions ?? []).map((q) => ({ ...emptyQuestion(), ...q })),
          }));
        }
        const restored: WizardState = {
          ...raw,
          modules: raw.modules.map((m) => ({ ...emptyModule(), ...m })),
          lessonsByModule: migratedLessons,
        };
        setState(restored);
        setSelectedModuleId(restored.modules[0]?.id ?? "");
        setSelectedLessonId(restored.lessonsByModule[restored.modules[0]?.id]?.[0]?.id ?? "");
      } else {
        const fresh = initialCourse ? stateFromInitialCourse(initialCourse) : initialState();
        setState(fresh);
        setSelectedModuleId(fresh.modules[0].id);
        setSelectedLessonId(fresh.lessonsByModule[fresh.modules[0].id][0].id);
      }
    } catch {
      const fresh = initialCourse ? stateFromInitialCourse(initialCourse) : initialState();
      setState(fresh);
      setSelectedModuleId(fresh.modules[0].id);
      setSelectedLessonId(fresh.lessonsByModule[fresh.modules[0].id][0].id);
    } finally {
      hasHydrated.current = true;
    }
  }, [initialCourse, storageKey]);

  useEffect(() => {
    if (!hasHydrated.current) return;
    setSavedState("saving");
    const id = window.setTimeout(() => {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
      setSavedState("saved");
    }, 350);
    return () => window.clearTimeout(id);
  }, [state, storageKey]);

  useEffect(() => {
    if (initialCourse?.instructors.length) return;
    let cancelled = false;
    fetch("/api/educator/profile-context")
      .then((res) => res.json())
      .then((payload: { ok: boolean; data?: InstructorProfile }) => {
        if (cancelled || !payload.ok || !payload.data) return;
        setPrimaryInstructor({ ...payload.data, isPrimary: true, source: "current-user" });
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [initialCourse]);

  useEffect(() => {
    fetch("/api/educator/instructors/search?q=")
      .then((res) => res.json())
      .then((payload: { ok: boolean; data?: InstructorSearchResult[] }) => {
        if (payload.ok) setAllEducators(payload.data ?? []);
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    const source = state.titleEn.trim();
    if (source.length < 3) return;
    const id = window.setTimeout(() => {
      void fetchDraftTranslation(source, "courseTitle").then((translation) => {
        if (!translation) return;
        setState((prev) => {
          if (prev.titleEn.trim() !== source) return prev;
          return {
            ...prev,
            titlePs: translation.ps || prev.titlePs,
            titleDa: translation.fa || prev.titleDa
          };
        });
      });
    }, 900);
    return () => window.clearTimeout(id);
  }, [state.titleEn]);

  useEffect(() => {
    const source = state.descriptionEn.trim();
    if (source.length < 12) return;
    const id = window.setTimeout(() => {
      setIsTranslating(true);
      void fetchDraftTranslation(source, "courseDescription").then((translation) => {
        setIsTranslating(false);
        if (!translation) return;
        setState((prev) => {
          if (prev.descriptionEn.trim() !== source) return prev;
          return {
            ...prev,
            descriptionPs: translation.ps || prev.descriptionPs,
            descriptionDa: translation.fa || prev.descriptionDa
          };
        });
      });
    }, 1100);
    return () => { window.clearTimeout(id); setIsTranslating(false); };
  }, [state.descriptionEn]);

  async function translateDescriptionNow() {
    if (isTranslating) return;
    setIsTranslating(true);

    const titleSource = state.titleEn.trim();
    const descSource = state.descriptionEn.trim();

    const [titleTranslation, descTranslation] = await Promise.all([
      titleSource.length >= 3 ? fetchDraftTranslation(titleSource, "courseTitle") : Promise.resolve(null),
      descSource.length >= 12 ? fetchDraftTranslation(descSource, "courseDescription") : Promise.resolve(null),
    ]);

    setIsTranslating(false);

    setState((prev) => {
      const next = { ...prev };
      if (titleTranslation) {
        next.titlePs = titleTranslation.ps || prev.titlePs;
        next.titleDa = titleTranslation.fa || prev.titleDa;
      }
      if (descTranslation) {
        next.descriptionPs = descTranslation.ps || prev.descriptionPs;
        next.descriptionDa = descTranslation.fa || prev.descriptionDa;
      }
      return next;
    });
  }

  useEffect(() => {
    const title = state.titleEn.trim();
    const description = state.descriptionEn.trim();
    if (title.length < 3 || description.length < 30) return;
    const id = window.setTimeout(() => {
      void fetchCourseClassification(title, description).then((result) => {
        if (!result) return;
        setState((prev) => {
          if (prev.titleEn.trim() !== title || prev.descriptionEn.trim() !== description) return prev;
          return {
            ...prev,
            ...(result.level ? { level: result.level as WizardState["level"] } : {}),
            ...(result.category ? { category: result.category } : {}),
          };
        });
      });
    }, 1500);
    return () => window.clearTimeout(id);
  }, [state.titleEn, state.descriptionEn]);

  useEffect(() => {
    const moduleId = selectedModule?.id;
    const source = selectedModule?.titleEn.trim() ?? "";
    if (!moduleId || source.length < 3) return;
    const id = window.setTimeout(() => {
      void fetchDraftTranslation(source, "moduleTitle").then((translation) => {
        if (!translation) return;
        setState((prev) => ({
          ...prev,
          modules: prev.modules.map((module) => {
            if (module.id !== moduleId || module.titleEn.trim() !== source) return module;
            return {
              ...module,
              titlePs: !module.titlePs.trim() || module.titlePs.trim() === source ? translation.ps || module.titlePs : module.titlePs,
              titleDa: !module.titleDa.trim() || module.titleDa.trim() === source ? translation.fa || module.titleDa : module.titleDa
            };
          })
        }));
      });
    }, 900);
    return () => window.clearTimeout(id);
  }, [selectedModule?.id, selectedModule?.titleEn]);

  useEffect(() => {
    const moduleId = selectedModule?.id;
    const lessonId = selectedLesson?.id;
    const source = selectedLesson?.titleEn.trim() ?? "";
    if (!moduleId || !lessonId || source.length < 3) return;
    const id = window.setTimeout(() => {
      void fetchDraftTranslation(source, "lessonTitle").then((translation) => {
        if (!translation) return;
        setState((prev) => ({
          ...prev,
          lessonsByModule: {
            ...prev.lessonsByModule,
            [moduleId]: (prev.lessonsByModule[moduleId] ?? []).map((lesson) => {
              if (lesson.id !== lessonId || lesson.titleEn.trim() !== source) return lesson;
              return {
                ...lesson,
                titlePs: !lesson.titlePs.trim() || lesson.titlePs.trim() === source ? translation.ps || lesson.titlePs : lesson.titlePs,
                titleDa: !lesson.titleDa.trim() || lesson.titleDa.trim() === source ? translation.fa || lesson.titleDa : lesson.titleDa
              };
            })
          }
        }));
      });
    }, 900);
    return () => window.clearTimeout(id);
  }, [selectedLesson?.id, selectedLesson?.titleEn, selectedModule?.id]);

  function patch(patchValue: Partial<WizardState>) {
    setMessage("");
    setMessageTone("error");
    setFieldErrors({});
    setState((prev) => {
      const next = { ...prev, ...patchValue };
      if (patchValue.titleEn !== undefined && (!prev.slug || prev.slug === slugify(prev.titleEn))) {
        next.slug = slugify(patchValue.titleEn);
      }
      return next;
    });
  }

  function addPlatformInstructor(instructor: InstructorSearchResult) {
    setCoInstructors((prev) => [...prev, { ...instructor, source: "platform" }]);
    setSearchQuery("");
  }

  function addManualInstructor() {
    const name = manualInstructor.name.trim();
    if (!name) return;
    setCoInstructors((prev) => [...prev, { ...manualInstructor, name, username: manualInstructor.username || slugifyName(name), source: "external" }]);
    setManualInstructor(emptyManualInstructor());
    setManualOpen(false);
  }

  function updateModule(moduleId: string, patchValue: Partial<DraftModule>) {
    setState((prev) => ({
      ...prev,
      modules: prev.modules.map((module) => {
        if (module.id !== moduleId) return module;
        const next = { ...module, ...patchValue };
        if (patchValue.titleEn !== undefined) {
          next.titlePs = suggestDraft(patchValue.titleEn, module.titlePs);
          next.titleDa = suggestDraft(patchValue.titleEn, module.titleDa);
        }
        return next;
      })
    }));
  }

  function addModule() {
    const module = emptyModule();
    setState((prev) => ({
      ...prev,
      modules: [...prev.modules, module],
      lessonsByModule: { ...prev.lessonsByModule, [module.id]: [emptyLesson()] }
    }));
    setSelectedModuleId(module.id);
    setSelectedLessonId("");
  }

  function removeModule(moduleId: string) {
    if (isEditMode && isPersistedId(moduleId, "module")) {
      setDeletedModuleIds((prev) => prev.includes(moduleId) ? prev : [...prev, moduleId]);
    }
    setState((prev) => {
      const modules = prev.modules.filter((module) => module.id !== moduleId);
      const nextModules = modules.length ? modules : [emptyModule()];
      const lessonsByModule = { ...prev.lessonsByModule };
      delete lessonsByModule[moduleId];
      if (!lessonsByModule[nextModules[0].id]) lessonsByModule[nextModules[0].id] = [emptyLesson()];
      setSelectedModuleId(nextModules[0].id);
      setSelectedLessonId(lessonsByModule[nextModules[0].id][0]?.id ?? "");
      return { ...prev, modules: nextModules, lessonsByModule };
    });
  }

  function moveModule(moduleId: string, direction: -1 | 1) {
    setState((prev) => {
      const index = prev.modules.findIndex((module) => module.id === moduleId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.modules.length) return prev;
      const modules = [...prev.modules];
      [modules[index], modules[nextIndex]] = [modules[nextIndex], modules[index]];
      return { ...prev, modules };
    });
  }

  function reorderModules(fromId: string, toId: string) {
    setState((prev) => {
      const modules = [...prev.modules];
      const fromIdx = modules.findIndex((m) => m.id === fromId);
      const toIdx = modules.findIndex((m) => m.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const [item] = modules.splice(fromIdx, 1);
      modules.splice(toIdx, 0, item);
      return { ...prev, modules };
    });
  }

  function reorderLessons(moduleId: string, fromId: string, toId: string) {
    setState((prev) => {
      const lessons = [...(prev.lessonsByModule[moduleId] ?? [])];
      const fromIdx = lessons.findIndex((l) => l.id === fromId);
      const toIdx = lessons.findIndex((l) => l.id === toId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
      const [item] = lessons.splice(fromIdx, 1);
      lessons.splice(toIdx, 0, item);
      return { ...prev, lessonsByModule: { ...prev.lessonsByModule, [moduleId]: lessons } };
    });
  }

  function updateLesson(moduleId: string, lessonId: string, patchValue: Partial<DraftLesson>) {
    setState((prev) => ({
      ...prev,
      lessonsByModule: {
        ...prev.lessonsByModule,
        [moduleId]: (prev.lessonsByModule[moduleId] ?? []).map((lesson) => {
          if (lesson.id !== lessonId) return lesson;
          const next = { ...lesson, ...patchValue };
          if (patchValue.titleEn !== undefined) {
            next.titlePs = suggestDraft(patchValue.titleEn, lesson.titlePs);
            next.titleDa = suggestDraft(patchValue.titleEn, lesson.titleDa);
          }
          if (patchValue.summaryEn !== undefined) {
            next.summaryPs = suggestDraft(patchValue.summaryEn, lesson.summaryPs);
            next.summaryDa = suggestDraft(patchValue.summaryEn, lesson.summaryDa);
          }
          return next;
        })
      }
    }));
  }

  function addLesson(moduleId: string) {
    const lesson = emptyLesson();
    setState((prev) => ({
      ...prev,
      lessonsByModule: { ...prev.lessonsByModule, [moduleId]: [...(prev.lessonsByModule[moduleId] ?? []), lesson] }
    }));
    setSelectedModuleId(moduleId);
    setSelectedLessonId(lesson.id);
  }

  function removeLesson(moduleId: string, lessonId: string) {
    if (isEditMode && isPersistedId(lessonId, "lesson")) {
      setDeletedLessonIds((prev) => prev.includes(lessonId) ? prev : [...prev, lessonId]);
    }
    setState((prev) => {
      const nextLessons = (prev.lessonsByModule[moduleId] ?? []).filter((lesson) => lesson.id !== lessonId);
      const lessons = nextLessons.length ? nextLessons : [emptyLesson()];
      setSelectedLessonId(lessons[0].id);
      return { ...prev, lessonsByModule: { ...prev.lessonsByModule, [moduleId]: lessons } };
    });
  }

  function validateForCreate() {
    const errors: FieldErrors = {};
    if (!state.slug || !slugPattern.test(state.slug)) errors.slug = t.slugHint;
    if (!state.titleEn.trim()) errors.titleEn = t.cwCourseTitleMissing;
    if (!state.descriptionEn.trim()) errors.descriptionEn = t.cwCourseDescriptionMissing;
    if (!primaryInstructor?.name.trim()) errors.instructors = t.cwInstructorMissing;
    if (!state.modules.length || !allLessons.length) errors.structure = t.cwStructureMissing;
    if (state.pricing === "paid" && (!Number.isFinite(Number(state.priceUsd)) || Number(state.priceUsd) < 1)) errors.priceCents = t.cwPriceMissing;
    return errors;
  }

  async function saveExistingCourse() {
    if (!initialCourse) return;
    const updateResult = await updateCourse({
      courseId: initialCourse.courseId,
      slug: state.slug,
      level: state.level,
      titleEn: state.titleEn.trim(),
      titlePs: state.titlePs.trim() || state.titleEn.trim(),
      titleDa: state.titleDa.trim() || state.titleEn.trim(),
      descriptionEn: state.descriptionEn.trim(),
      descriptionPs: state.descriptionPs.trim() || state.descriptionEn.trim(),
      descriptionDa: state.descriptionDa.trim() || state.descriptionEn.trim(),
      isPaid: state.pricing === "paid",
      priceCents: state.pricing === "paid" ? Math.round(Number(state.priceUsd) * 100) : undefined,
      instructors: instructors.map((instructor) => ({
        name: instructor.name.trim(),
        username: instructor.username.trim(),
        title: instructor.title?.trim() || undefined,
        titlePs: instructor.titlePs?.trim() || undefined,
        titleDa: instructor.titleDa?.trim() || undefined,
        bio: instructor.bio?.trim() || undefined,
        bioPs: instructor.bioPs?.trim() || undefined,
        bioDa: instructor.bioDa?.trim() || undefined,
        avatarUrl: instructor.avatarUrl?.trim() || undefined,
        linkedinUrl: instructor.linkedinUrl?.trim() || undefined,
        youtubeUrl: instructor.youtubeUrl?.trim() || undefined
      }))
    });
    if (!updateResult.ok) {
      setMessageTone("error");
      setMessage(updateResult.error);
      return;
    }

    for (const lessonId of deletedLessonIds) {
      await deleteLessonAction({ lessonId });
    }
    for (const moduleId of deletedModuleIds) {
      await deleteModuleAction({ moduleId });
    }

    let skippedLessons = 0;
    const persistedModuleIds: string[] = [];
    const persistedLessonIdsByModule: Record<string, string[]> = {};
    for (const module of state.modules) {
      const moduleTitle = module.titleEn.trim() || module.titlePs.trim() || module.titleDa.trim() || t.cwModulePlaceholder;
      let moduleId = module.id;
      if (isPersistedId(module.id, "module")) {
        const result = await updateModuleAction({
          courseId: initialCourse.courseId,
          moduleId: module.id,
          titleEn: module.titleEn.trim() || moduleTitle,
          titlePs: module.titlePs.trim() || moduleTitle,
          titleDa: module.titleDa.trim() || moduleTitle,
          descriptionEn: module.descriptionEn.trim() || undefined,
          descriptionPs: module.descriptionEn.trim() || undefined,
          descriptionDa: module.descriptionEn.trim() || undefined
        });
        if (!result.ok) continue;
      } else {
        const result = await createModule({
          courseId: initialCourse.courseId,
          titleEn: module.titleEn.trim() || moduleTitle,
          titlePs: module.titlePs.trim() || moduleTitle,
          titleDa: module.titleDa.trim() || moduleTitle,
          descriptionEn: module.descriptionEn.trim() || undefined,
          descriptionPs: module.descriptionEn.trim() || undefined,
          descriptionDa: module.descriptionEn.trim() || undefined
        });
        if (!result.ok) {
          skippedLessons += (state.lessonsByModule[module.id] ?? []).length;
          continue;
        }
        moduleId = result.data.moduleId;
      }
      persistedModuleIds.push(moduleId);
      persistedLessonIdsByModule[moduleId] = [];

      for (const lesson of state.lessonsByModule[module.id] ?? []) {
        if (!canPersistLesson(lesson)) {
          skippedLessons += 1;
          if (isPersistedId(lesson.id, "lesson")) {
            persistedLessonIdsByModule[moduleId].push(lesson.id);
          }
          continue;
        }
        const lessonTitle = visibleRawLessonTitle(lesson) || t.cwLessonPlaceholder;
        const type = lesson.type === "READING" ? LessonType.READING : lesson.type === "QUIZ" ? LessonType.QUIZ : LessonType.VIDEO;
        const resourceDesc = lesson.resourceUrl.trim() || lesson.resourceNote.trim() || undefined;
        if (isPersistedId(lesson.id, "lesson")) {
          const result = await updateLessonAction({
            lessonId: lesson.id,
            moduleId,
            type,
            titleEn: lesson.titleEn.trim() || lessonTitle,
            titlePs: lesson.titlePs.trim() || lessonTitle,
            titleDa: lesson.titleDa.trim() || lessonTitle,
            descriptionEn: type === LessonType.VIDEO || type === LessonType.READING ? lesson.summaryEn.trim() || undefined : resourceDesc,
            descriptionPs: lesson.summaryPs.trim() || undefined,
            descriptionDa: lesson.summaryDa.trim() || undefined,
            youtubeUrl: type === LessonType.VIDEO ? lesson.youtubeUrl.trim() : undefined,
            readingEn: type === LessonType.READING ? lesson.readingEn.trim() || undefined : undefined,
            readingPs: type === LessonType.READING ? lesson.readingPs.trim() || undefined : undefined,
            readingDa: type === LessonType.READING ? lesson.readingDa.trim() || undefined : undefined,
            isFinalTest: type === LessonType.QUIZ ? lesson.isFinalTest : false,
            passingScore: type === LessonType.QUIZ ? lesson.passingScore : undefined
          });
          if (!result.ok) skippedLessons += 1;
          else persistedLessonIdsByModule[moduleId].push(lesson.id);
          continue;
        }

        const result = await createLesson({
          moduleId,
          type,
          titleEn: lesson.titleEn.trim() || lessonTitle,
          titlePs: lesson.titlePs.trim() || lessonTitle,
          titleDa: lesson.titleDa.trim() || lessonTitle,
          descriptionEn: type === LessonType.VIDEO || type === LessonType.READING ? lesson.summaryEn.trim() || undefined : resourceDesc,
          descriptionPs: lesson.summaryPs.trim() || undefined,
          descriptionDa: lesson.summaryDa.trim() || undefined,
          youtubeUrl: type === LessonType.VIDEO ? lesson.youtubeUrl.trim() : undefined,
          readingEn: type === LessonType.READING ? lesson.readingEn.trim() || undefined : undefined,
          readingPs: type === LessonType.READING ? lesson.readingPs.trim() || undefined : undefined,
          readingDa: type === LessonType.READING ? lesson.readingDa.trim() || undefined : undefined,
          isFinalTest: type === LessonType.QUIZ ? lesson.isFinalTest : false,
          passingScore: type === LessonType.QUIZ ? lesson.passingScore : undefined
        });
        if (!result.ok) {
          skippedLessons += 1;
        } else {
          persistedLessonIdsByModule[moduleId].push(result.data.lessonId);
          if (type === LessonType.QUIZ && (lesson.draftQuestions ?? []).length > 0) {
            for (const q of lesson.draftQuestions) {
              if (!q.promptEn.trim()) continue;
              const qResult = await addQuizQuestion({
                lessonId: result.data.lessonId,
                type: q.type as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT",
                promptEn: q.promptEn.trim(),
                promptPs: q.promptPs.trim() || q.promptEn.trim(),
                promptDa: q.promptDa.trim() || undefined,
                correctAnswer: q.type === "TEXT_INPUT" ? q.correctAnswer.trim() || undefined : undefined,
                explanationEn: q.explanationEn.trim() || undefined,
                explanationPs: q.explanationPs.trim() || undefined,
                explanationDa: q.explanationDa.trim() || undefined,
              });
              if (!qResult.ok) continue;
              if (q.type !== "TEXT_INPUT") {
                for (const c of q.choices) {
                  if (!c.textEn.trim()) continue;
                  await addAnswerChoice({
                    questionId: qResult.data.questionId,
                    textEn: c.textEn.trim(),
                    textPs: c.textPs.trim() || c.textEn.trim(),
                    textDa: c.textDa.trim() || undefined,
                    isCorrect: c.isCorrect,
                  });
                }
              }
            }
          }
        }
      }
    }

    if (persistedModuleIds.length > 0) {
      await reorderModulesAction({ courseId: initialCourse.courseId, moduleIds: persistedModuleIds });
    }
    for (const [moduleId, lessonIds] of Object.entries(persistedLessonIdsByModule)) {
      if (lessonIds.length > 0) {
        await reorderLessonsAction({ moduleId, lessonIds });
      }
    }

    window.localStorage.removeItem(storageKey);
    setDeletedLessonIds([]);
    setDeletedModuleIds([]);
    setMessageTone(skippedLessons ? "warning" : "success");
    setMessage(skippedLessons ? t.cwDraftCreatedWithSkipped : t.courseUpdated);
    router.refresh();
  }

  function createDraft() {
    const errors = validateForCreate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMessageTone("error");
      setMessage(t.checkFieldsAndRetry);
      return;
    }

    startTransition(async () => {
      try {
        if (isEditMode) {
          await saveExistingCourse();
          return;
        }
        const response = await fetch("/api/educator/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: state.slug,
            level: state.level,
            titleEn: state.titleEn.trim(),
            titlePs: state.titlePs.trim() || state.titleEn.trim(),
            titleDa: state.titleDa.trim() || state.titleEn.trim(),
            descriptionEn: state.descriptionEn.trim(),
            descriptionPs: state.descriptionPs.trim() || state.descriptionEn.trim(),
            descriptionDa: state.descriptionDa.trim() || state.descriptionEn.trim(),
            isPaid: state.pricing === "paid",
            priceCents: state.pricing === "paid" ? Math.round(Number(state.priceUsd) * 100) : undefined,
            instructors: instructors.map((instructor) => ({
              name: instructor.name.trim(),
              username: instructor.username.trim(),
              title: instructor.title?.trim() || undefined,
              bio: instructor.bio?.trim() || undefined,
              avatarUrl: instructor.avatarUrl?.trim() || undefined,
              linkedinUrl: instructor.linkedinUrl?.trim() || undefined,
              youtubeUrl: instructor.youtubeUrl?.trim() || undefined
            }))
          })
        });
        const result = await response.json() as { ok: boolean; error?: string; fieldErrors?: Record<string, string[]>; data?: { courseId: string } };
        if (response.status === 401) { router.push("/login?callbackUrl=%2Feducator"); return; }
        if (!response.ok || !result.ok || !result.data?.courseId) {
          setMessageTone("error");
          setMessage(result.error ?? t.couldNotCreateCourse);
          if (result.fieldErrors?.slug?.[0]) setFieldErrors({ slug: result.fieldErrors.slug[0] });
          return;
        }

        const courseId = result.data.courseId;
        let skippedLessons = 0;
        for (const module of state.modules) {
          const moduleTitle = module.titleEn.trim() || module.titlePs.trim() || module.titleDa.trim() || t.cwModulePlaceholder;
          const moduleResult = await createModule({
            courseId,
            titleEn: module.titleEn.trim() || moduleTitle,
            titlePs: module.titlePs.trim() || moduleTitle,
            titleDa: module.titleDa.trim() || moduleTitle,
            descriptionEn: module.descriptionEn.trim() || undefined,
            descriptionPs: module.descriptionEn.trim() || undefined,
            descriptionDa: module.descriptionEn.trim() || undefined
          });
          if (!moduleResult.ok) {
            skippedLessons += (state.lessonsByModule[module.id] ?? []).length;
            continue;
          }
          for (const lesson of state.lessonsByModule[module.id] ?? []) {
            if (!canPersistLesson(lesson)) {
              skippedLessons += 1;
              continue;
            }
            const lessonTitle = visibleRawLessonTitle(lesson) || t.cwLessonPlaceholder;
            const type = lesson.type === "READING" ? LessonType.READING : lesson.type === "QUIZ" ? LessonType.QUIZ : LessonType.VIDEO;
            const resourceDesc = lesson.resourceUrl.trim() || lesson.resourceNote.trim() || undefined;
            const lessonResult = await createLesson({
              moduleId: moduleResult.data.moduleId,
              type,
              titleEn: lesson.titleEn.trim() || lessonTitle,
              titlePs: lesson.titlePs.trim() || lessonTitle,
              titleDa: lesson.titleDa.trim() || lessonTitle,
              descriptionEn: type === LessonType.VIDEO || type === LessonType.READING ? lesson.summaryEn.trim() || undefined : resourceDesc,
              descriptionPs: lesson.summaryPs.trim() || undefined,
              descriptionDa: lesson.summaryDa.trim() || undefined,
              youtubeUrl: type === LessonType.VIDEO ? lesson.youtubeUrl.trim() : undefined,
              readingEn: type === LessonType.READING ? lesson.readingEn.trim() || undefined : undefined,
              readingPs: type === LessonType.READING ? lesson.readingPs.trim() || undefined : undefined,
              readingDa: type === LessonType.READING ? lesson.readingDa.trim() || undefined : undefined,
              isFinalTest: type === LessonType.QUIZ ? lesson.isFinalTest : false,
              passingScore: type === LessonType.QUIZ ? lesson.passingScore : undefined
            });
            if (!lessonResult.ok) { skippedLessons += 1; continue; }
            if (type === LessonType.QUIZ && lesson.draftQuestions.length > 0) {
              for (const q of lesson.draftQuestions) {
                if (!q.promptEn.trim()) continue;
                const qResult = await addQuizQuestion({
                  lessonId: lessonResult.data.lessonId,
                  type: q.type as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "TEXT_INPUT",
                  promptEn: q.promptEn.trim(),
                  promptPs: q.promptPs.trim() || q.promptEn.trim(),
                  promptDa: q.promptDa.trim() || undefined,
                  correctAnswer: q.type === "TEXT_INPUT" ? q.correctAnswer.trim() || undefined : undefined,
                  explanationEn: q.explanationEn.trim() || undefined,
                  explanationPs: q.explanationPs.trim() || undefined,
                  explanationDa: q.explanationDa.trim() || undefined,
                });
                if (!qResult.ok) continue;
                if (q.type !== "TEXT_INPUT") {
                  for (const c of q.choices) {
                    if (!c.textEn.trim()) continue;
                    await addAnswerChoice({
                      questionId: qResult.data.questionId,
                      textEn: c.textEn.trim(),
                      textPs: c.textPs.trim() || c.textEn.trim(),
                      textDa: c.textDa.trim() || undefined,
                      isCorrect: c.isCorrect,
                    });
                  }
                }
              }
            }
          }
        }

        window.localStorage.removeItem(storageKey);
        setMessageTone(skippedLessons ? "warning" : "success");
        setMessage(skippedLessons ? t.cwDraftCreatedWithSkipped : t.courseDraftCreated);
        router.refresh();
        router.push(`/educator/courses/${encodeURIComponent(courseId)}`);
      } catch {
        setMessageTone("error");
        setMessage(t.couldNotCreateCourse);
      }
    });
  }

  const active = steps[activeIndex];

  return (
    <section className={`min-h-[calc(100vh-120px)] bg-[var(--surface)] px-4 py-5 ${className}`}>
      <div className={`mx-auto flex min-h-[calc(100vh-160px)] w-full flex-col transition-all ${active.key === "structure" ? "max-w-[1400px]" : "max-w-3xl"}`}>
        <header className="shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[1.6px] text-[var(--brand)]">{t.cwTitle}</p>
              <h1 className="mt-1 text-2xl font-black tracking-[-0.6px] text-[var(--ink)]">{active.question}</h1>
            </div>
            <span className="rounded-full bg-[var(--card)] px-3 py-1 text-xs font-black text-[var(--muted)] shadow-sm">
              {savedState === "saving" ? t.cwSaving : savedState === "saved" ? t.cwSaved : t.cwSaveDraft}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">{active.help}</p>
          <nav className="mt-5" aria-label="Course wizard steps">
            <ol className="flex">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                const isFirst = i === 0;
                const isCurrent = i === activeIndex;
                const done = i < activeIndex || (isCurrent && isLast && saveComplete);
                return (
                  <li key={step.key} className="flex flex-1 flex-col items-center">
                    <div className="flex w-full items-center">
                      <div className={`h-px flex-1 transition-colors ${isFirst ? "invisible" : done || isCurrent ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`} />
                      <button
                        type="button"
                        onClick={() => setActiveStep(step.key)}
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-[900] transition-all ${
                          done
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : isCurrent
                            ? "bg-[var(--brand)] text-white shadow-[0_4px_14px_rgba(0,87,255,0.35)] scale-110"
                            : "border-2 border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
                        }`}
                      >
                        {done ? (
                          <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : i + 1}
                      </button>
                      <div className={`h-px flex-1 transition-colors ${isLast ? "invisible" : done ? "bg-[var(--brand)]" : "bg-[var(--border)]"}`} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(step.key)}
                      className={`mt-2 text-center text-[10px] font-[800] leading-tight transition-colors ${
                        done ? "text-emerald-600" : isCurrent ? "text-[var(--brand)]" : "text-[var(--muted)]"
                      }`}
                    >
                      {step.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </header>

        <main className={`my-5 min-h-0 flex-1 rounded-[24px] border border-[var(--border)] bg-[var(--card)] shadow-[0_22px_70px_rgba(15,23,42,0.08)] ${active.key === "structure" ? "overflow-hidden p-0" : "p-5"}`}>
          <StepBody
            step={active.key}
            state={state}
            patch={patch}
            fieldErrors={fieldErrors}
            locale={locale}
            t={t}
            primaryInstructor={primaryInstructor}
            coInstructors={coInstructors}
            setCoInstructors={setCoInstructors}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            availableEducators={availableEducators}
            addPlatformInstructor={addPlatformInstructor}
            manualOpen={manualOpen}
            setManualOpen={setManualOpen}
            manualInstructor={manualInstructor}
            setManualInstructor={setManualInstructor}
            addManualInstructor={addManualInstructor}
            selectedModule={selectedModule}
            selectedLessons={selectedLessons}
            selectedLesson={selectedLesson}
            selectedModuleId={selectedModuleId}
            setSelectedModuleId={setSelectedModuleId}
            setSelectedLessonId={setSelectedLessonId}
            updateModule={updateModule}
            addModule={addModule}
            removeModule={removeModule}
            moveModule={moveModule}
            reorderModules={reorderModules}
            reorderLessons={reorderLessons}
            updateLesson={updateLesson}
            addLesson={addLesson}
            removeLesson={removeLesson}
            allLessons={allLessons}
            message={message}
            messageTone={messageTone}
            instructors={instructors}
            isTranslating={isTranslating}
            translateDescriptionNow={translateDescriptionNow}
            isEditMode={isEditMode}
            courseId={initialCourse?.courseId}
            courseStatus={initialCourse?.status}
          />
        </main>

        <footer className="sticky bottom-0 flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-[0_-14px_36px_rgba(15,23,42,0.08)] backdrop-blur">
          <button
            type="button"
            onClick={() => setActiveStep(steps[Math.max(0, activeIndex - 1)].key)}
            disabled={activeIndex === 0}
            className="h-10 rounded-xl border border-[var(--border)] bg-[var(--card)] px-5 text-sm font-black text-[var(--muted)] transition hover:border-[var(--border)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t.cwBack}
          </button>
          {active.key === "publish" ? (
            <button
              type="button"
              onClick={createDraft}
              disabled={isPending || saveComplete}
              className="h-10 rounded-xl bg-[var(--brand)] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,87,255,0.2)] transition hover:bg-[var(--brand-hover)] disabled:cursor-default disabled:opacity-70"
            >
              {isPending ? (isEditMode ? t.saving : t.cwCreatingDraft) : saveComplete ? t.cwSaved : (isEditMode ? t.saveChanges : t.cwCreateDraft)}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setActiveStep(steps[Math.min(steps.length - 1, activeIndex + 1)].key)}
              className="h-10 rounded-xl bg-[var(--brand)] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,87,255,0.2)] transition hover:bg-[var(--brand-hover)]"
            >
              {t.cwContinue}
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}

function StepBody(props: {
  step: StepKey;
  state: WizardState;
  patch: (patchValue: Partial<WizardState>) => void;
  fieldErrors: FieldErrors;
  locale: Parameters<typeof localizeLevel>[1];
  t: Dictionary;
  primaryInstructor: InstructorProfile | null;
  coInstructors: InstructorProfile[];
  setCoInstructors: Dispatch<SetStateAction<InstructorProfile[]>>;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  availableEducators: InstructorSearchResult[];
  addPlatformInstructor: (instructor: InstructorSearchResult) => void;
  manualOpen: boolean;
  setManualOpen: (value: boolean) => void;
  manualInstructor: InstructorInput;
  setManualInstructor: Dispatch<SetStateAction<InstructorInput>>;
  addManualInstructor: () => void;
  selectedModule?: DraftModule;
  selectedLessons: DraftLesson[];
  selectedLesson?: DraftLesson;
  selectedModuleId: string;
  setSelectedModuleId: (value: string) => void;
  setSelectedLessonId: (value: string) => void;
  updateModule: (moduleId: string, patchValue: Partial<DraftModule>) => void;
  addModule: () => void;
  removeModule: (moduleId: string) => void;
  moveModule: (moduleId: string, direction: -1 | 1) => void;
  reorderModules: (fromId: string, toId: string) => void;
  reorderLessons: (moduleId: string, fromId: string, toId: string) => void;
  updateLesson: (moduleId: string, lessonId: string, patchValue: Partial<DraftLesson>) => void;
  addLesson: (moduleId: string) => void;
  removeLesson: (moduleId: string, lessonId: string) => void;
  allLessons: DraftLesson[];
  message: string;
  messageTone: "error" | "success" | "warning";
  instructors: InstructorProfile[];
  isTranslating: boolean;
  translateDescriptionNow: () => Promise<void>;
  isEditMode: boolean;
  courseId?: string;
  courseStatus?: string;
}) {
  const { step, state, patch, t } = props;
  const languageChoices: Array<{ value: DraftLanguage; label: string; hint: string }> = [
    { value: "ps",        label: t.cwPashto,    hint: t.cwLangHintPs },
    { value: "fa",        label: t.cwDari,       hint: t.cwLangHintFa },
    { value: "en",        label: t.cwEnglish,    hint: t.cwLangHintEn },
    { value: "trilingual", label: t.cwTrilingual, hint: t.cwLangHintMixed },
  ];
  const lessonTypes: Array<{ value: LessonKind; label: string }> = [
    { value: "VIDEO",      label: t.cwVideo },
    { value: "READING",    label: t.cwReading },
    { value: "QUIZ",       label: t.cwQuiz },
    { value: "PDF",        label: t.cwPdf },
    { value: "SLIDES",     label: t.cwSlides },
    { value: "ATTACHMENT", label: t.cwAttachment },
    { value: "ASSIGNMENT", label: t.cwAssignment },
    { value: "LINK",       label: t.cwExternalLink }
  ];
  if (step === "description") {
    return (
      <div className="grid gap-4">
        <label className="grid gap-2 text-sm font-black text-[var(--ink-2)]">
          {t.cwTitleLabel}
          <TextInput value={state.titleEn} onChange={(event) => patch({ titleEn: event.target.value })} placeholder={t.cwTitlePlaceholder} className="h-12 text-lg font-black" />
          <FieldError message={props.fieldErrors.titleEn} />
        </label>
        <label className="grid gap-2 text-sm font-black text-[var(--ink-2)]">
          {t.cwSlugLabel}
          <TextInput value={state.slug} onChange={(event) => patch({ slug: slugify(event.target.value) })} />
          <FieldError message={props.fieldErrors.slug} />
        </label>
        <label className="grid gap-2 text-sm font-black text-[var(--ink-2)]">
          {t.cwDescriptionLabel}
          <TextArea value={state.descriptionEn} onChange={(event) => patch({ descriptionEn: event.target.value })} rows={5} placeholder={t.cwDescriptionPlaceholder} />
          <FieldError message={props.fieldErrors.descriptionEn} />
        </label>
        <div className="grid gap-2">
          <span className="text-xs font-black uppercase tracking-[1.2px] text-[var(--muted)]">{t.cwLevelLabel}</span>
          <div className="flex flex-wrap gap-2">
            {(["beginner", "intermediate", "advanced"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => patch({ level: state.level === lvl ? "" : lvl })}
                className={`rounded-xl border px-4 py-2 text-xs font-black transition ${state.level === lvl ? "border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:border-[var(--border)]"}`}
              >
                {localizeLevel(lvl, props.locale)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[1.4px] text-[var(--muted)]">{t.cwTranslationSuggestions}</p>
          <button
            type="button"
            onClick={props.translateDescriptionNow}
            disabled={props.isTranslating || (!state.descriptionEn.trim() && !state.titleEn.trim())}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--brand)] bg-[var(--brand-50)] px-3 py-1.5 text-xs font-black text-[var(--brand)] transition hover:bg-[var(--brand-50)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {props.isTranslating ? (
              <>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 animate-spin" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" />
                </svg>
                {t.cwTranslating}
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                  <path d="M2 4h8M6 2v2M3 4c0 3 2 5 4 6M7 4c.5 2 2 4 4 5M8 13h6M11 11l3 2-3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t.cwTranslateNow}
              </>
            )}
          </button>
        </div>
        <TranslationFields
          t={t}
          titlePs={state.titlePs}
          titleDa={state.titleDa}
          descriptionPs={state.descriptionPs}
          descriptionDa={state.descriptionDa}
          isTranslating={props.isTranslating}
          onChange={(patchValue) => patch(patchValue)}
        />
      </div>
    );
  }

  if (step === "language") {
    return (
      <div className="grid gap-3">
        {languageChoices.map((choice) => {
          const active = state.language === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => patch({ language: choice.value })}
              className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${active ? "border-[var(--brand)] bg-[var(--brand-50)]" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border)]"}`}
            >
              <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-[var(--brand)]" : "border-[var(--border)]"}`}>
                {active && <span className="h-2 w-2 rounded-full bg-[var(--brand)]" />}
              </span>
              <span className="grid gap-0.5">
                <span className={`text-sm font-black ${active ? "text-[var(--brand)]" : "text-[var(--ink)]"}`}>{choice.label}</span>
                <span className="text-xs font-semibold text-[var(--muted)]">{choice.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (step === "instructors") {
    return (
      <div className="grid gap-4">
        <FieldError message={props.fieldErrors.instructors} />

        {/* Primary instructor (auto-loaded) */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
          {props.primaryInstructor
            ? <InstructorCard instructor={props.primaryInstructor} label={t.primaryInstructorBadge} />
            : <p className="text-sm font-bold text-[var(--muted)]">{t.loadingProfile}</p>}
        </div>

        {/* Co-instructors already added */}
        {props.coInstructors.map((instructor) => (
          <div key={instructor.username} className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3">
            <InstructorCard instructor={instructor} label={instructor.source === "platform" ? t.platformEducatorBadge : t.externalInstructorBadge} />
            <button
              type="button"
              onClick={() => props.setCoInstructors((prev) => prev.filter((item) => item.username !== instructor.username))}
              className="ml-auto shrink-0 text-xs font-black text-[var(--danger)]"
            >{t.cwRemove}</button>
          </div>
        ))}

        {/* Search platform educators */}
        <div className="grid gap-2">
          <TextInput value={props.searchQuery} onChange={(event) => props.setSearchQuery(event.target.value)} placeholder={t.cwSearchEducators} />
          {props.availableEducators.length > 0 && (
            <div className="grid max-h-36 gap-1.5 overflow-y-auto">
              {props.availableEducators.slice(0, 5).map((educator) => (
                <button key={educator.id} type="button" onClick={() => props.addPlatformInstructor(educator)} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-3 text-left transition hover:border-[var(--brand)] hover:bg-[var(--brand-50)]">
                  <InstructorCard instructor={educator} label={t.platformEducatorBadge} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Add external instructor */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <button
            type="button"
            onClick={() => props.setManualOpen(!props.manualOpen)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-black text-[var(--brand)]"
          >
            {t.cwAddExternalInstructor}
            <span className="text-xs text-[var(--muted)]">{props.manualOpen ? "▴" : "▾"}</span>
          </button>

          {props.manualOpen ? (
            <ExternalInstructorForm
              instructor={props.manualInstructor}
              setInstructor={props.setManualInstructor}
              onAdd={props.addManualInstructor}
              t={t}
            />
          ) : null}
        </div>
      </div>
    );
  }

  if (step === "structure") {
    const lesson = props.selectedLesson;
    const colHeader = "sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-[10px] font-black uppercase tracking-[1.4px] text-[#0f766e]";
    const inputSm = "h-8 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-black outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10";
    const pill = "text-[10px] font-black uppercase tracking-[1.2px]";

    return (
      <StructureColumns
        state={state}
        lesson={lesson}
        t={t}
        selectedModuleId={props.selectedModuleId}
        setSelectedModuleId={props.setSelectedModuleId}
        setSelectedLessonId={props.setSelectedLessonId}
        selectedModule={props.selectedModule}
        selectedLessons={props.selectedLessons}
        selectedLesson={props.selectedLesson}
        fieldErrors={props.fieldErrors}
        updateModule={props.updateModule}
        addModule={props.addModule}
        removeModule={props.removeModule}
        moveModule={props.moveModule}
        reorderModules={props.reorderModules}
        reorderLessons={props.reorderLessons}
        updateLesson={props.updateLesson}
        addLesson={props.addLesson}
        removeLesson={props.removeLesson}
        lessonTypes={lessonTypes}
        colHeader={colHeader}
        inputSm={inputSm}
        pill={pill}
      />
    );
  }

  if (step === "pricing") {
    const choices: Array<{ value: WizardState["pricing"]; label: string }> = [
      { value: "free", label: t.cwFree },
      { value: "paid", label: t.cwPaid },
      { value: "donation", label: t.cwDonation },
      { value: "subscription", label: t.cwSubscription }
    ];
    return (
      <div className="grid gap-3">
        {choices.map((choice) => (
          <button key={choice.value} type="button" onClick={() => patch({ pricing: choice.value })} className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${state.pricing === choice.value ? "border-[var(--brand)] bg-[var(--brand-50)] text-[var(--brand)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--ink-2)] hover:border-[var(--border)]"}`}>
            {choice.label}
          </button>
        ))}
        {state.pricing === "paid" ? (
          <label className="grid gap-2 text-sm font-black text-[var(--ink-2)]">
            {t.cwPriceUsd}
            <TextInput value={state.priceUsd} onChange={(event) => patch({ priceUsd: event.target.value })} type="number" min="1" step="0.01" />
            <FieldError message={props.fieldErrors.priceCents} />
          </label>
        ) : null}
      </div>
    );
  }

  const checks = [
    { label: t.cwTitleLabel, ok: Boolean(state.titleEn.trim()), error: t.cwCourseTitleMissing },
    { label: t.cwDescriptionLabel, ok: Boolean(state.descriptionEn.trim()), error: t.cwCourseDescriptionMissing },
    { label: t.instructors, ok: Boolean(props.primaryInstructor?.name.trim()), error: t.cwInstructorMissing },
    { label: t.modules, ok: state.modules.length > 0 && props.allLessons.length > 0, error: t.cwStructureMissing },
    { label: t.cwPricingQuestion, ok: state.pricing !== "paid" || Number(state.priceUsd) >= 1, error: t.cwPriceMissing }
  ];
  const messageClass =
    props.messageTone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : props.messageTone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-[rgba(196,43,43,0.18)] bg-[var(--danger-50)] text-[var(--danger)]";

  return (
    <div className="grid gap-3">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-3">
          <span className="text-sm font-black text-[var(--ink)]">{check.label}</span>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${check.ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {check.ok ? t.cwReady : t.cwNeedsAttention}
          </span>
        </div>
      ))}
      {props.message ? <p className={`rounded-2xl border px-4 py-3 text-sm font-black ${messageClass}`}>{props.message}</p> : null}
    </div>
  );
}

function TBtn({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[9px] font-black text-[var(--muted)] transition hover:border-[#0f766e]/50 hover:text-[#0f766e] disabled:opacity-50"
    >
      {loading ? (
        <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : "AI"}{loading ? "" : " Translate"}
    </button>
  );
}

function StructureColumns(props: {
  state: WizardState;
  lesson: DraftLesson | undefined;
  t: Dictionary;
  selectedModuleId: string;
  setSelectedModuleId: (id: string) => void;
  setSelectedLessonId: (id: string) => void;
  selectedModule: DraftModule | undefined;
  selectedLessons: DraftLesson[];
  selectedLesson: DraftLesson | undefined;
  fieldErrors: FieldErrors;
  updateModule: (moduleId: string, patch: Partial<DraftModule>) => void;
  addModule: () => void;
  removeModule: (moduleId: string) => void;
  moveModule: (moduleId: string, direction: -1 | 1) => void;
  reorderModules: (fromId: string, toId: string) => void;
  reorderLessons: (moduleId: string, fromId: string, toId: string) => void;
  updateLesson: (moduleId: string, lessonId: string, patch: Partial<DraftLesson>) => void;
  addLesson: (moduleId: string) => void;
  removeLesson: (moduleId: string, lessonId: string) => void;
  lessonTypes: Array<{ value: LessonKind; label: string }>;
  colHeader: string;
  inputSm: string;
  pill: string;
}) {
  // — column widths (resizable) —
  const [widths, setWidths] = useState({ col1: 180, col2: 200, col4: 300 });
  const [translatingQIds, setTranslatingQIds] = useState<Set<string>>(new Set());
  const [isTranslatingReading, setIsTranslatingReading] = useState(false);
  const [isTranslatingModTitle, setIsTranslatingModTitle] = useState(false);
  const [isTranslatingLsnTitle, setIsTranslatingLsnTitle] = useState(false);

  const { state, lesson, t, selectedModuleId, selectedModule, selectedLessons, colHeader, inputSm, pill } = props;
  const dragModuleRef = useRef<string | null>(null);
  const dragLessonRef = useRef<string | null>(null);
  const [dragOverModule, setDragOverModule] = useState<string | null>(null);
  const [dragOverLesson, setDragOverLesson] = useState<string | null>(null);

  function startResize(col: "col1" | "col2" | "col4", e: React.MouseEvent) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = widths[col];
    const dir = col === "col4" ? -1 : 1;
    const onMove = (me: MouseEvent) => {
      const delta = (me.clientX - startX) * dir;
      setWidths((prev) => ({ ...prev, [col]: Math.max(140, Math.min(500, startW + delta)) }));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function patchLesson(patch: Partial<DraftLesson>) {
    if (!lesson) return;
    props.updateLesson(selectedModuleId, lesson.id, patch);
  }

  function patchQuestion(qId: string, patch: Partial<DraftQuestion>) {
    if (!lesson) return;
    props.updateLesson(selectedModuleId, lesson.id, {
      draftQuestions: (lesson.draftQuestions ?? []).map((q) => q.id === qId ? { ...q, ...patch } : q),
    });
  }

  function patchChoice(qId: string, choiceId: string, patch: Partial<DraftChoice>) {
    if (!lesson) return;
    props.updateLesson(selectedModuleId, lesson.id, {
      draftQuestions: (lesson.draftQuestions ?? []).map((q) =>
        q.id === qId ? { ...q, choices: q.choices.map((c) => c.id === choiceId ? { ...c, ...patch } : c) } : q
      ),
    });
  }

  function addQuestion() {
    if (!lesson) return;
    props.updateLesson(selectedModuleId, lesson.id, {
      draftQuestions: [...(lesson.draftQuestions ?? []), emptyQuestion()],
    });
  }

  function removeQuestion(qId: string) {
    if (!lesson) return;
    props.updateLesson(selectedModuleId, lesson.id, {
      draftQuestions: (lesson.draftQuestions ?? []).filter((q) => q.id !== qId),
    });
  }

  function addChoiceToQuestion(qId: string) {
    if (!lesson) return;
    const newChoice: DraftChoice = { id: createId("c"), textEn: "", textPs: "", textDa: "", isCorrect: false };
    props.updateLesson(selectedModuleId, lesson.id, {
      draftQuestions: (lesson.draftQuestions ?? []).map((q) =>
        q.id === qId ? { ...q, choices: [...q.choices, newChoice] } : q
      ),
    });
  }

  function removeChoice(qId: string, choiceId: string) {
    if (!lesson) return;
    props.updateLesson(selectedModuleId, lesson.id, {
      draftQuestions: (lesson.draftQuestions ?? []).map((q) =>
        q.id === qId ? { ...q, choices: q.choices.filter((c) => c.id !== choiceId) } : q
      ),
    });
  }

  async function translateModuleTitle() {
    if (!selectedModule?.titleEn.trim()) return;
    // Capture IDs before await so navigation mid-flight doesn't corrupt a different module.
    const moduleId = selectedModule.id;
    const text = selectedModule.titleEn;
    setIsTranslatingModTitle(true);
    const r = await fetchDraftTranslation(text, "moduleTitle");
    if (r) props.updateModule(moduleId, { titlePs: r.ps, titleDa: r.fa });
    setIsTranslatingModTitle(false);
  }

  async function translateLessonTitle() {
    if (!lesson?.titleEn.trim()) return;
    const moduleId = selectedModuleId;
    const lessonId = lesson.id;
    const text = lesson.titleEn;
    setIsTranslatingLsnTitle(true);
    const r = await fetchDraftTranslation(text, "lessonTitle");
    if (r) props.updateLesson(moduleId, lessonId, { titlePs: r.ps, titleDa: r.fa });
    setIsTranslatingLsnTitle(false);
  }

  async function translateReading() {
    if (!lesson?.readingEn.trim()) return;
    const moduleId = selectedModuleId;
    const lessonId = lesson.id;
    const text = lesson.readingEn;
    setIsTranslatingReading(true);
    const r = await fetchDraftTranslation(text, "readingContent");
    if (r) props.updateLesson(moduleId, lessonId, { readingPs: r.ps, readingDa: r.fa });
    setIsTranslatingReading(false);
  }

  async function translateQuestion(qId: string) {
    if (!lesson) return;
    const q = lesson.draftQuestions.find((x) => x.id === qId);
    if (!q?.promptEn.trim()) return;
    // Snapshot everything we need before the await.
    const moduleId = selectedModuleId;
    const lessonId = lesson.id;
    const snapshotQuestions = lesson.draftQuestions;
    setTranslatingQIds((prev) => new Set([...prev, qId]));

    const promptP = fetchDraftTranslation(q.promptEn, "quizPrompt");
    const explanationP = q.explanationEn.trim()
      ? fetchDraftTranslation(q.explanationEn, "quizExplanation")
      : Promise.resolve(null);
    const choicePs = q.choices.map((c) =>
      c.textEn.trim() ? fetchDraftTranslation(c.textEn, "answerChoice") : Promise.resolve(null)
    );
    const [promptResult, explanationResult, ...choiceResults] = await Promise.all([promptP, explanationP, ...choicePs]);

    props.updateLesson(moduleId, lessonId, {
      draftQuestions: snapshotQuestions.map((dq) => {
        if (dq.id !== qId) return dq;
        return {
          ...dq,
          promptPs: promptResult?.ps ?? dq.promptPs,
          promptDa: promptResult?.fa ?? dq.promptDa,
          explanationPs: explanationResult?.ps ?? dq.explanationPs,
          explanationDa: explanationResult?.fa ?? dq.explanationDa,
          choices: dq.choices.map((c, ci) => {
            const r = choiceResults[ci];
            if (!r) return c;
            return { ...c, textPs: r.ps ?? c.textPs, textDa: r.fa ?? c.textDa };
          }),
        };
      }),
    });

    setTranslatingQIds((prev) => {
      const next = new Set(prev);
      next.delete(qId);
      return next;
    });
  }

  const showQuizCol = lesson?.type === "QUIZ";

  const divider = (col: "col1" | "col2" | "col4") => (
    <div
      onMouseDown={(e) => startResize(col, e)}
      className="w-1.5 shrink-0 cursor-col-resize select-none bg-[var(--surface)] transition-colors hover:bg-[#0f766e]/30"
    />
  );

  return (
    <div className="flex min-h-[520px] overflow-hidden rounded-[24px]">

      {/* ── Col 1: Modules ── */}
      <div style={{ width: widths.col1 }} className="flex shrink-0 flex-col overflow-y-auto bg-[var(--surface)]">
        <p className={colHeader}>{t.modules}</p>
        <FieldError message={props.fieldErrors.structure} />
        <div className="flex flex-1 flex-col gap-1 p-2">
          {state.modules.map((module, index) => {
            const isActive = module.id === selectedModuleId;
            const lessonCount = (state.lessonsByModule[module.id] ?? []).length;
            const isDragOver = dragOverModule === module.id;
            return (
              <div
                key={module.id}
                draggable
                onDragStart={() => { dragModuleRef.current = module.id; }}
                onDragOver={(e) => { e.preventDefault(); setDragOverModule(module.id); }}
                onDragLeave={() => setDragOverModule(null)}
                onDrop={() => {
                  setDragOverModule(null);
                  if (dragModuleRef.current && dragModuleRef.current !== module.id) {
                    props.reorderModules(dragModuleRef.current, module.id);
                  }
                  dragModuleRef.current = null;
                }}
                className={`rounded-xl transition ${isDragOver ? "ring-2 ring-[#0f766e]/40" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    props.setSelectedModuleId(module.id);
                    props.setSelectedLessonId((state.lessonsByModule[module.id] ?? [])[0]?.id ?? "");
                  }}
                  className={`flex w-full flex-col rounded-xl px-2.5 py-2 text-left transition ${isActive ? "bg-[#0f766e]/10" : "hover:bg-[var(--card)]"}`}
                >
                  <div className="flex items-center gap-1">
                    <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 shrink-0 text-[var(--muted)]" fill="currentColor">
                      <rect y="1" width="12" height="1.5" rx="0.75"/><rect y="5" width="12" height="1.5" rx="0.75"/><rect y="9" width="12" height="1.5" rx="0.75"/>
                    </svg>
                    <span className={`${pill} ${isActive ? "text-[#0f766e]" : "text-[var(--muted)]"}`}>{t.moduleLabel} {index + 1}</span>
                  </div>
                  <span className={`mt-0.5 text-xs font-black leading-tight ${isActive ? "text-[#0f766e]" : "text-[var(--ink-2)]"}`}>
                    {module.titleEn || t.cwModulePlaceholder}
                  </span>
                  <span className="mt-1 text-[9px] font-semibold text-[var(--muted)]">{lessonCount} {t.lessons}</span>
                </button>
              </div>
            );
          })}
        </div>
        <div className="border-t border-[var(--border)] p-2">
          <button
            type="button"
            onClick={props.addModule}
            className="w-full rounded-xl border border-dashed border-[#0f766e]/50 py-2 text-[10px] font-black text-[#0f766e] transition hover:bg-[#0f766e]/5"
          >+ {t.cwAddModule}</button>
        </div>
      </div>

      {divider("col1")}

      {/* ── Col 2: Lesson list + module title ── */}
      <div style={{ width: widths.col2 }} className="flex shrink-0 flex-col overflow-y-auto">
        <p className={colHeader}>{t.lessons}</p>
        {selectedModule ? (
          <div className="flex flex-1 flex-col gap-2 p-3">
            {/* Module title — EN + PS/DA */}
            <div className="grid gap-1">
              <input
                className={inputSm}
                value={selectedModule.titleEn}
                onChange={(e) => props.updateModule(selectedModule.id, { titleEn: e.target.value })}
                placeholder={t.cwModulePlaceholder}
              />
              <div className="flex items-center justify-between">
                <span className={`${pill} text-[var(--muted)]`}>PS / DA</span>
                <TBtn loading={isTranslatingModTitle} onClick={() => void translateModuleTitle()} />
              </div>
              <input
                dir="rtl"
                className={inputSm}
                value={selectedModule.titlePs}
                onChange={(e) => props.updateModule(selectedModule.id, { titlePs: e.target.value })}
                placeholder="عنوان ماژول (پښتو)"
              />
              <input
                dir="rtl"
                className={inputSm}
                value={selectedModule.titleDa}
                onChange={(e) => props.updateModule(selectedModule.id, { titleDa: e.target.value })}
                placeholder="عنوان ماژول (دری)"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => props.moveModule(selectedModule.id, -1)} className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-black text-[var(--muted)] hover:border-[var(--border)]">↑</button>
              <button type="button" onClick={() => props.moveModule(selectedModule.id, 1)} className="rounded-lg border border-[var(--border)] px-2 py-1 text-[10px] font-black text-[var(--muted)] hover:border-[var(--border)]">↓</button>
              <button type="button" onClick={() => props.removeModule(selectedModule.id)} className="rounded-lg px-2 py-1 text-[10px] font-black text-red-400 hover:bg-red-50">{t.cwRemove}</button>
            </div>
            <div className="flex flex-col gap-1.5">
              {selectedLessons.map((item) => {
                const isActive = item.id === props.selectedLesson?.id;
                const badge = item.type === "VIDEO" ? "VID" : item.type === "READING" ? "READ" : item.type === "QUIZ" ? "QUIZ" : item.type.slice(0, 4);
                const badgeCls = item.type === "VIDEO" ? "bg-teal-50 text-[#0f766e]" : item.type === "QUIZ" ? "bg-amber-50 text-amber-700" : "bg-[var(--surface)] text-[var(--muted)]";
                const isDragOver = dragOverLesson === item.id;
                return (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => { dragLessonRef.current = item.id; }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverLesson(item.id); }}
                    onDragLeave={() => setDragOverLesson(null)}
                    onDrop={() => {
                      setDragOverLesson(null);
                      if (dragLessonRef.current && dragLessonRef.current !== item.id) {
                        props.reorderLessons(selectedModuleId, dragLessonRef.current, item.id);
                      }
                      dragLessonRef.current = null;
                    }}
                    className={`rounded-xl transition ${isDragOver ? "ring-2 ring-[#0f766e]/40" : ""}`}
                  >
                    <div className={`flex items-center gap-1 rounded-xl border px-2.5 py-2 transition ${isActive ? "border-[#0f766e]/30 bg-[#0f766e]/5" : "border-[var(--border)] bg-[var(--card)] hover:border-[var(--border)]"}`}>
                      <button
                        type="button"
                        onClick={() => props.setSelectedLessonId(item.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 shrink-0 cursor-grab text-[var(--muted)]" fill="currentColor">
                          <rect y="1" width="12" height="1.5" rx="0.75"/><rect y="5" width="12" height="1.5" rx="0.75"/><rect y="9" width="12" height="1.5" rx="0.75"/>
                        </svg>
                        <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide ${badgeCls}`}>{badge}</span>
                        <span className={`min-w-0 flex-1 truncate text-xs font-black ${isActive ? "text-[#0f766e]" : "text-[var(--ink-2)]"}`}>
                          {item.titleEn || t.cwLessonPlaceholder}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => props.removeLesson(selectedModuleId, item.id)}
                        className="shrink-0 rounded-md px-1.5 text-sm font-black text-[var(--muted)] hover:bg-red-50 hover:text-red-400"
                        aria-label={t.deleteLesson}
                      >×</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => props.addLesson(selectedModuleId)}
              className="mt-auto rounded-xl border border-dashed border-[#0f766e]/50 py-2 text-[10px] font-black text-[#0f766e] hover:bg-[#0f766e]/5"
            >+ {t.cwAddLesson}</button>
          </div>
        ) : null}
      </div>

      {divider("col2")}

      {/* ── Col 3: Lesson content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <p className={colHeader}>{t.lessonContent}</p>
        {lesson ? (
          <div className="flex flex-col gap-3 p-3">
            {/* Lesson title — EN + PS/DA */}
            <div className="grid gap-1">
              <div className="flex items-center justify-between">
                <span className={`${pill} text-[var(--muted)]`}>{t.cwTitleLabel}</span>
              </div>
              <input className={inputSm} value={lesson.titleEn} onChange={(e) => patchLesson({ titleEn: e.target.value })} placeholder={t.cwLessonPlaceholder} />
              <div className="flex items-center justify-between">
                <span className={`${pill} text-[var(--muted)]`}>PS / DA</span>
                <TBtn loading={isTranslatingLsnTitle} onClick={() => void translateLessonTitle()} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <input dir="rtl" className={inputSm} value={lesson.titlePs} onChange={(e) => patchLesson({ titlePs: e.target.value })} placeholder="عنوان لوست (پښتو)" />
                <input dir="rtl" className={inputSm} value={lesson.titleDa} onChange={(e) => patchLesson({ titleDa: e.target.value })} placeholder="عنوان لوست (دری)" />
              </div>
            </div>

            <label className="grid gap-1">
              <span className={`${pill} text-[var(--muted)]`}>{t.cwLessonType}</span>
              <select
                value={lesson.type}
                onChange={(e) => patchLesson({ type: e.target.value as LessonKind })}
                disabled={isPersistedId(lesson.id, "lesson")}
                className="h-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold outline-none focus:border-[#0f766e] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {props.lessonTypes.map((lt) => <option key={lt.value} value={lt.value}>{lt.label}</option>)}
              </select>
            </label>

            {lesson.type === "VIDEO" && (
              <label className="grid gap-1">
                <span className={`${pill} text-[var(--muted)]`}>{t.cwYoutubeUrl}</span>
                <input className={inputSm} value={lesson.youtubeUrl} onChange={(e) => patchLesson({ youtubeUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
              </label>
            )}

            {lesson.type === "READING" && (
              <div className="grid gap-1">
                <div className="flex items-center justify-between">
                  <span className={`${pill} text-[var(--muted)]`}>{t.cwReadingContent} (EN)</span>
                </div>
                <textarea
                  className="min-h-[140px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs leading-6 outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
                  value={lesson.readingEn}
                  onChange={(e) => patchLesson({ readingEn: e.target.value, readingPs: suggestDraft(e.target.value, lesson.readingPs), readingDa: suggestDraft(e.target.value, lesson.readingDa) })}
                  placeholder={t.cwReadingContent}
                />
                <div className="flex items-center justify-between">
                  <span className={`${pill} text-[var(--muted)]`}>PS / DA</span>
                  <TBtn loading={isTranslatingReading} onClick={() => void translateReading()} />
                </div>
                <textarea
                  dir="rtl"
                  className={`min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs leading-6 outline-none focus:border-[#0f766e] ${isTranslatingReading ? "opacity-50" : ""}`}
                  value={lesson.readingPs}
                  onChange={(e) => patchLesson({ readingPs: e.target.value })}
                  placeholder="متن درس (پښتو)"
                />
                <textarea
                  dir="rtl"
                  className={`min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs leading-6 outline-none focus:border-[#0f766e] ${isTranslatingReading ? "opacity-50" : ""}`}
                  value={lesson.readingDa}
                  onChange={(e) => patchLesson({ readingDa: e.target.value })}
                  placeholder="متن درس (دری)"
                />
              </div>
            )}

            {lesson.type === "QUIZ" && (
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-xs font-black text-[var(--ink-2)]">
                  <input type="checkbox" checked={lesson.isFinalTest} onChange={(e) => patchLesson({ isFinalTest: e.target.checked })} className="h-4 w-4 rounded border-[var(--border)] text-[#0f766e]" />
                  {t.finalTestLabel}
                </label>
                <label className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>{t.passingScore}</span>
                  <input type="number" min={0} max={100} className="h-8 w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 text-xs outline-none focus:border-[#0f766e]" value={lesson.passingScore} onChange={(e) => patchLesson({ passingScore: Number(e.target.value) })} />
                </label>
              </div>
            )}

            {["PDF", "SLIDES", "ATTACHMENT", "LINK"].includes(lesson.type) && (
              <div className="grid gap-2">
                <label className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>
                    {lesson.type === "LINK" ? "URL" : `${lesson.type} URL`}
                  </span>
                  <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] pr-2">
                    <input
                      className="h-8 flex-1 bg-transparent px-3 text-xs font-semibold outline-none"
                      value={lesson.resourceUrl}
                      onChange={(e) => patchLesson({ resourceUrl: e.target.value })}
                      placeholder={lesson.type === "LINK" ? "https://example.com/resource" : "https://drive.google.com/..."}
                      type="url"
                    />
                    {lesson.resourceUrl && (
                      <a href={lesson.resourceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-[10px] font-black text-[#0f766e] hover:underline">↗</a>
                    )}
                  </div>
                  <p className="text-[9px] font-semibold text-[var(--muted)]">Paste a public URL (Google Drive, Dropbox, etc.)</p>
                </label>
                <label className="grid gap-1">
                  <span className={`${pill} text-[var(--muted)]`}>Notes</span>
                  <textarea className="min-h-[60px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs leading-6 outline-none focus:border-[#0f766e]" value={lesson.resourceNote} onChange={(e) => patchLesson({ resourceNote: e.target.value })} placeholder={t.cwResourcePlan} />
                </label>
              </div>
            )}

            {lesson.type === "ASSIGNMENT" && (
              <label className="grid gap-1">
                <span className={`${pill} text-[var(--muted)]`}>{t.cwAssignmentPrompt}</span>
                <textarea className="min-h-[100px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs leading-6 outline-none focus:border-[#0f766e]" value={lesson.resourceNote} onChange={(e) => patchLesson({ resourceNote: e.target.value })} placeholder={t.cwAssignmentPrompt} />
              </label>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-6">
            <p className="text-center text-xs font-semibold text-[var(--muted)]">{t.cwSelectLesson}</p>
          </div>
        )}
      </div>

      {/* ── Col 4: Quiz builder (conditional) ── */}
      {showQuizCol && lesson && (
        <>
          {divider("col4")}
          <div style={{ width: widths.col4 }} className="flex shrink-0 flex-col overflow-y-auto">
            <p className={colHeader}>{t.cwQuiz} — {t.questionsLabel}</p>
            <div className="flex flex-1 flex-col gap-3 p-3">
              {(lesson.draftQuestions ?? []).length === 0 && (
                <p className="pt-4 text-center text-xs font-semibold text-[var(--muted)]">No questions yet. Add one below.</p>
              )}
              {(lesson.draftQuestions ?? []).map((q, qi) => (
                <div key={q.id} className="grid gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-[1.2px] text-[#0f766e]">Q{qi + 1}</span>
                    <div className="flex items-center gap-1.5">
                      <TBtn loading={translatingQIds.has(q.id)} onClick={() => void translateQuestion(q.id)} />
                      <button type="button" onClick={() => removeQuestion(q.id)} className="text-xs font-black text-[var(--muted)] hover:text-red-400">×</button>
                    </div>
                  </div>
                  <select
                    value={q.type}
                    onChange={(e) => patchQuestion(q.id, {
                      type: e.target.value as DraftQuestionType,
                      choices: e.target.value === "TEXT_INPUT" ? [] : q.choices.length ? q.choices : [
                        { id: createId("c"), textEn: "", textPs: "", textDa: "", isCorrect: true },
                        { id: createId("c"), textEn: "", textPs: "", textDa: "", isCorrect: false },
                      ],
                    })}
                    className="h-7 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-[10px] font-semibold outline-none focus:border-[#0f766e]"
                  >
                    <option value="SINGLE_CHOICE">Single choice</option>
                    <option value="MULTIPLE_CHOICE">Multiple choice</option>
                    <option value="TEXT_INPUT">Text answer</option>
                  </select>
                  {/* Prompt — EN / PS / DA */}
                  <input
                    className="h-7 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold outline-none focus:border-[#0f766e]"
                    value={q.promptEn}
                    onChange={(e) => patchQuestion(q.id, { promptEn: e.target.value })}
                    placeholder="Question (English)"
                  />
                  <input
                    dir="rtl"
                    className="h-7 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold outline-none focus:border-[#0f766e]"
                    value={q.promptPs}
                    onChange={(e) => patchQuestion(q.id, { promptPs: e.target.value })}
                    placeholder="پوښتنه (پښتو)"
                  />
                  <input
                    dir="rtl"
                    className="h-7 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold outline-none focus:border-[#0f766e]"
                    value={q.promptDa}
                    onChange={(e) => patchQuestion(q.id, { promptDa: e.target.value })}
                    placeholder="پرسش (دری)"
                  />

                  {q.type === "TEXT_INPUT" ? (
                    <input
                      className="h-7 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs font-semibold outline-none focus:border-[#0f766e]"
                      value={q.correctAnswer}
                      onChange={(e) => patchQuestion(q.id, { correctAnswer: e.target.value })}
                      placeholder="Correct answer"
                    />
                  ) : (
                    <div className="grid gap-2">
                      {q.choices.map((c, ci) => (
                        <div
                          key={c.id}
                          className={`grid gap-1 rounded-lg p-1.5 transition-colors ${c.isCorrect ? "bg-emerald-50 ring-1 ring-emerald-200" : ""}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              title="Mark as correct answer"
                              onClick={() => {
                                if (q.type === "SINGLE_CHOICE") {
                                  patchQuestion(q.id, { choices: q.choices.map((ch) => ({ ...ch, isCorrect: ch.id === c.id })) });
                                } else {
                                  patchChoice(q.id, c.id, { isCorrect: !c.isCorrect });
                                }
                              }}
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${c.isCorrect ? "border-[#0f766e] bg-[#0f766e]" : "border-[var(--border)] hover:border-[var(--muted)]"}`}
                            >
                              {c.isCorrect && (
                                <svg viewBox="0 0 8 8" className="h-2 w-2" fill="none">
                                  <polyline points="1,4 3,6.5 7,1.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                            <input
                              className={`h-7 flex-1 rounded-lg border px-2 text-xs outline-none focus:border-[#0f766e] ${c.isCorrect ? "border-emerald-200 bg-[var(--card)] font-semibold text-emerald-800" : "border-[var(--border)] bg-[var(--surface)]"}`}
                              value={c.textEn}
                              onChange={(e) => patchChoice(q.id, c.id, { textEn: e.target.value })}
                              placeholder={`Choice ${ci + 1} (EN)`}
                            />
                            {c.isCorrect ? (
                              <span className="shrink-0 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[9px] font-black text-emerald-700">✓ Correct</span>
                            ) : (
                              q.choices.length > 2 && (
                                <button type="button" onClick={() => removeChoice(q.id, c.id)} className="text-[10px] font-black text-[var(--muted)] hover:text-red-400">×</button>
                              )
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1 pl-[22px]">
                            <input
                              dir="rtl"
                              className={`h-6 rounded-md border px-2 text-[10px] outline-none focus:border-[#0f766e] ${c.isCorrect ? "border-emerald-200 bg-[var(--card)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
                              value={c.textPs}
                              onChange={(e) => patchChoice(q.id, c.id, { textPs: e.target.value })}
                              placeholder="پښتو"
                            />
                            <input
                              dir="rtl"
                              className={`h-6 rounded-md border px-2 text-[10px] outline-none focus:border-[#0f766e] ${c.isCorrect ? "border-emerald-200 bg-[var(--card)]" : "border-[var(--border)] bg-[var(--surface)]"}`}
                              value={c.textDa}
                              onChange={(e) => patchChoice(q.id, c.id, { textDa: e.target.value })}
                              placeholder="دری"
                            />
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={() => addChoiceToQuestion(q.id)} className="text-left text-[10px] font-black text-[#0f766e] hover:underline">+ Add choice</button>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="grid gap-1 border-t border-[var(--border)] pt-2">
                    <span className="text-[9px] font-black uppercase tracking-[1.2px] text-[var(--muted)]">Explanation (shown after answer)</span>
                    <input
                      className="h-7 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-[#0f766e]"
                      value={q.explanationEn}
                      onChange={(e) => patchQuestion(q.id, { explanationEn: e.target.value })}
                      placeholder="Why this is correct (EN)"
                    />
                    <input
                      dir="rtl"
                      className="h-7 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-[#0f766e]"
                      value={q.explanationPs}
                      onChange={(e) => patchQuestion(q.id, { explanationPs: e.target.value })}
                      placeholder="توضیح (پښتو)"
                    />
                    <input
                      dir="rtl"
                      className="h-7 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs outline-none focus:border-[#0f766e]"
                      value={q.explanationDa}
                      onChange={(e) => patchQuestion(q.id, { explanationDa: e.target.value })}
                      placeholder="توضیح (دری)"
                    />
                  </div>
                </div>
              ))}
              <button type="button" onClick={addQuestion} className="rounded-xl border border-dashed border-[#0f766e]/50 py-2 text-[10px] font-black text-[#0f766e] hover:bg-[#0f766e]/5">
                + Add question
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}

function TranslationFields(props: {
  t: Dictionary;
  titlePs: string;
  titleDa: string;
  descriptionPs: string;
  descriptionDa: string;
  isTranslating?: boolean;
  onChange: (patchValue: Partial<WizardState>) => void;
}) {
  return (
    <div className="grid gap-3 rounded-2xl bg-[var(--surface)] p-3">
      <p className="text-xs font-bold text-[var(--muted)]">{props.t.cwMachineSuggested}</p>
      <label className="grid gap-1.5">
        <span className="text-xs font-black uppercase tracking-[1.2px] text-[var(--muted)]">{props.t.pashtoTitle}</span>
        <TextInput dir="rtl" value={props.titlePs} onChange={(event) => props.onChange({ titlePs: event.target.value })} placeholder={props.t.pashtoTitle} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-black uppercase tracking-[1.2px] text-[var(--muted)]">{props.t.dariTitle}</span>
        <TextInput dir="rtl" value={props.titleDa} onChange={(event) => props.onChange({ titleDa: event.target.value })} placeholder={props.t.dariTitle} />
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-black uppercase tracking-[1.2px] text-[var(--muted)]">{props.t.pashtoDescLabel}</span>
        <div className="relative">
          <TextArea dir="rtl" value={props.descriptionPs} onChange={(event) => props.onChange({ descriptionPs: event.target.value })} rows={3} placeholder={props.t.pashtoDescLabel} className={props.isTranslating ? "opacity-50" : ""} />
          {props.isTranslating && <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-[var(--brand)]">{props.t.cwTranslating}</span>}
        </div>
      </label>
      <label className="grid gap-1.5">
        <span className="text-xs font-black uppercase tracking-[1.2px] text-[var(--muted)]">{props.t.dariDescLabel}</span>
        <div className="relative">
          <TextArea dir="rtl" value={props.descriptionDa} onChange={(event) => props.onChange({ descriptionDa: event.target.value })} rows={3} placeholder={props.t.dariDescLabel} className={props.isTranslating ? "opacity-50" : ""} />
          {props.isTranslating && <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-[var(--brand)]">{props.t.cwTranslating}</span>}
        </div>
      </label>
    </div>
  );
}

function ExternalInstructorForm({
  instructor,
  setInstructor,
  onAdd,
  t,
}: {
  instructor: InstructorInput;
  setInstructor: Dispatch<SetStateAction<InstructorInput>>;
  onAdd: () => void;
  t: Dictionary;
}) {
  const [isTranslatingTitle, setIsTranslatingTitle] = useState(false);
  const [isTranslatingBio, setIsTranslatingBio] = useState(false);

  const patch = (v: Partial<InstructorInput>) => setInstructor((prev) => ({ ...prev, ...v }));

  async function translateTitle() {
    const source = instructor.title?.trim() ?? "";
    if (!source || isTranslatingTitle) return;
    setIsTranslatingTitle(true);
    const result = await fetchDraftTranslation(source, "instructorTitle");
    setIsTranslatingTitle(false);
    if (result) patch({ titlePs: result.ps || instructor.titlePs, titleDa: result.fa || instructor.titleDa });
  }

  async function translateBio() {
    const source = instructor.bio?.trim() ?? "";
    if (!source || isTranslatingBio) return;
    setIsTranslatingBio(true);
    const result = await fetchDraftTranslation(source, "instructorBio");
    setIsTranslatingBio(false);
    if (result) patch({ bioPs: result.ps || instructor.bioPs, bioDa: result.fa || instructor.bioDa });
  }

  const inputCls = "h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10";
  const textareaCls = "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm font-semibold leading-6 outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10";
  const labelCls = "grid gap-1 text-xs font-black uppercase tracking-[1.1px] text-[var(--muted)]";

  function TranslateBtn({ loading, onClick, disabled }: { loading: boolean; onClick: () => void; disabled: boolean }) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={loading || disabled}
        className="flex items-center gap-1.5 self-end rounded-lg border border-[#0f766e]/30 bg-teal-50 px-3 py-1.5 text-xs font-black text-[#0f766e] transition hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <svg viewBox="0 0 16 16" className="h-3 w-3 animate-spin" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="28" strokeDashoffset="10" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
            <path d="M2 4h8M6 2v2M3 4c0 3 2 5 4 6M7 4c.5 2 2 4 4 5M8 13h6M11 11l3 2-3 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {loading ? t.cwTranslating : t.cwTranslateNow}
      </button>
    );
  }

  return (
    <div className="grid gap-4 border-t border-[var(--border)] px-4 pb-4 pt-3">
      {/* Avatar */}
      <AvatarUpload
        name={instructor.name}
        currentUrl={instructor.avatarUrl}
        onChange={(url) => patch({ avatarUrl: url || undefined })}
      />

      {/* Name + Username */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          {t.instructorName}
          <input
            className={inputCls}
            value={instructor.name}
            onChange={(e) => patch({ name: e.target.value })}
            placeholder="Ahmad Karimi"
          />
        </label>
        <label className={labelCls}>
          {t.cwInstructorUsernameHint}
          <input
            className={inputCls}
            value={instructor.username ?? ""}
            onChange={(e) => patch({ username: e.target.value })}
            placeholder="ahmad-karimi"
          />
        </label>
      </div>

      {/* Job title (EN) + translate row */}
      <div className="grid gap-1">
        <div className="flex items-end gap-2">
          <label className={`${labelCls} flex-1`}>
            {t.cwInstructorJobTitle}
            <input
              className={inputCls}
              value={instructor.title ?? ""}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="Senior Software Engineer"
            />
          </label>
          <TranslateBtn loading={isTranslatingTitle} onClick={translateTitle} disabled={!instructor.title?.trim()} />
        </div>
        {/* Title translations */}
        <div className="grid gap-2 rounded-xl bg-[var(--surface)] p-2.5 sm:grid-cols-2">
          <label className={labelCls}>
            {t.cwInstructorJobTitlePs}
            <input dir="rtl" className={inputCls} value={instructor.titlePs ?? ""} onChange={(e) => patch({ titlePs: e.target.value })} placeholder={t.cwInstructorJobTitlePs} />
          </label>
          <label className={labelCls}>
            {t.cwInstructorJobTitleDa}
            <input dir="rtl" className={inputCls} value={instructor.titleDa ?? ""} onChange={(e) => patch({ titleDa: e.target.value })} placeholder={t.cwInstructorJobTitleDa} />
          </label>
        </div>
      </div>

      {/* Bio (EN) + translate row */}
      <div className="grid gap-1">
        <div className="flex items-end gap-2">
          <label className={`${labelCls} flex-1`}>
            {t.bioEnLabel}
            <textarea
              className={`${textareaCls} min-h-[80px]`}
              value={instructor.bio ?? ""}
              onChange={(e) => patch({ bio: e.target.value })}
              placeholder="Ahmad has 10 years of experience teaching software development..."
            />
          </label>
          <TranslateBtn loading={isTranslatingBio} onClick={translateBio} disabled={!instructor.bio?.trim()} />
        </div>
        {/* Bio translations */}
        <div className="grid gap-2 rounded-xl bg-[var(--surface)] p-2.5 sm:grid-cols-2">
          <label className={labelCls}>
            {t.bioPsLabel}
            <textarea dir="rtl" className={`${textareaCls} min-h-[70px]`} value={instructor.bioPs ?? ""} onChange={(e) => patch({ bioPs: e.target.value })} placeholder={t.bioPsLabel} />
          </label>
          <label className={labelCls}>
            {t.bioDaLabel}
            <textarea dir="rtl" className={`${textareaCls} min-h-[70px]`} value={instructor.bioDa ?? ""} onChange={(e) => patch({ bioDa: e.target.value })} placeholder={t.bioDaLabel} />
          </label>
        </div>
      </div>

      {/* LinkedIn + YouTube */}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelCls}>
          {t.linkedinUrlLabel}
          <input className={inputCls} type="url" value={instructor.linkedinUrl ?? ""} onChange={(e) => patch({ linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/..." />
        </label>
        <label className={labelCls}>
          {t.youtubeUrlLabel}
          <input className={inputCls} type="url" value={instructor.youtubeUrl ?? ""} onChange={(e) => patch({ youtubeUrl: e.target.value })} placeholder="https://youtube.com/@..." />
        </label>
      </div>

      <button
        type="button"
        onClick={onAdd}
        disabled={!instructor.name.trim()}
        className="h-11 rounded-xl bg-[#0f766e] text-sm font-black text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {t.addInstructor}
      </button>
    </div>
  );
}

function InstructorCard({ instructor, label }: { instructor: InstructorInput; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      <InstructorAvatar instructor={instructor} />
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-[var(--ink)]">{instructor.name}</p>
        <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
      </div>
    </div>
  );
}
