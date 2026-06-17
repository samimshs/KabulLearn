"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { usesPashtoContent, type Locale } from "@/lib/i18n";
import { QuestionType } from "@prisma/client";

type LocalizedText = Record<"en" | "ps", string> & Partial<Record<Locale, string>>;

type QuizQuestion = {
  id: string;
  type: QuestionType;
  question: LocalizedText;
  explanation?: LocalizedText;
  options: LocalizedText[];
  choiceIds: string[];
  correctChoiceIds: string[];
  correctAnswer?: string;
};

type SelectedAnswer = {
  questionId: string;
  answerChoiceIds?: string[];
  textAnswer?: string;
};

type QuizBlockProps = {
  questions: QuizQuestion[];
  passScore: number;
  title?: string;
  description?: string;
  onStart: () => Promise<string | null>;
  onPass: (selectedAnswers: SelectedAnswer[], attemptId: string) => Promise<{ score: number; passed: boolean; retryAt?: string | null }>;
};

type SubmitState = "idle" | "submitted" | "saving";

export function QuizBlock({ questions, passScore, title, description, onStart, onPass }: QuizBlockProps) {
  const { locale, t } = useLanguage();
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [score, setScore] = useState<number | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [retryAtIso, setRetryAtIso] = useState<string | null>(null);
  const startedRef = useRef(false);
  const startPromiseRef = useRef<Promise<string | null> | null>(null);

  // Start ONE attempt on mount. `onStart` is a fresh function each render, so we
  // guard with a ref to avoid re-firing (which would spawn endless attempt
  // sessions and flash "Quiz attempt is not ready yet").
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    let cancelled = false;
    const p = onStart();
    startPromiseRef.current = p;
    p.then((id) => {
      if (!cancelled) setAttemptId(id);
    }).catch((err) => {
      if (!cancelled) setSubmissionError(err instanceof Error ? err.message : t.couldNotStartQuiz);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve a usable attempt id — awaits the in-flight start so a fast submit
  // (before the attempt finished creating) doesn't fail with "not ready".
  async function ensureAttempt(): Promise<string | null> {
    if (attemptId) return attemptId;
    if (startPromiseRef.current) {
      const id = await startPromiseRef.current.catch(() => null);
      if (id) { setAttemptId(id); return id; }
    }
    const fresh = await onStart().catch(() => null);
    startPromiseRef.current = Promise.resolve(fresh);
    if (fresh) setAttemptId(fresh);
    return fresh;
  }

  const allAnswered = questions.every((q) => {
    if (q.type === QuestionType.TEXT_INPUT) return Boolean(textAnswers[q.id]?.trim());
    return (selected[q.id] ?? []).length > 0;
  });
  const passed = score !== null && score >= passScore;
  const textLocale = usesPashtoContent(locale) ? "ps" : "en";

  function normalizeText(value: string) {
    return value.trim().replace(/\s+/g, " ").toLowerCase();
  }

  function isQuestionCorrect(question: QuizQuestion) {
    if (question.type === QuestionType.TEXT_INPUT) {
      return normalizeText(textAnswers[question.id] ?? "") === normalizeText(question.correctAnswer ?? "");
    }

    const selectedIds = new Set(selected[question.id] ?? []);
    const correctIds = new Set(question.correctChoiceIds);
    return selectedIds.size === correctIds.size && [...correctIds].every((id) => selectedIds.has(id));
  }

  function getChoiceStatus(question: QuizQuestion, choiceId: string) {
    if (submitState !== "submitted") return "idle";
    const questionCorrect = isQuestionCorrect(question);
    const isThisSelected = (selected[question.id] ?? []).includes(choiceId);
    const isCorrect = question.correctChoiceIds.includes(choiceId);
    if (questionCorrect && isCorrect) return "correct";
    if (isThisSelected && !isCorrect) return "wrong";
    return "idle";
  }

  function formatRetryTime(iso: string): string {
    const msLeft = new Date(iso).getTime() - Date.now();
    if (msLeft <= 0) return "now";
    const h = Math.floor(msLeft / 3_600_000);
    const m = Math.ceil((msLeft % 3_600_000) / 60_000);
    return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m} minute${m === 1 ? "" : "s"}`;
  }

  async function submitQuiz() {
    const selectedAnswers = questions.map((q) =>
      q.type === QuestionType.TEXT_INPUT
        ? { questionId: q.id, textAnswer: textAnswers[q.id] ?? "" }
        : { questionId: q.id, answerChoiceIds: selected[q.id] ?? [] }
    );
    setSubmitState("saving");
    setSubmissionError(null);
    try {
      const id = await ensureAttempt();
      if (!id) throw new Error(t.couldNotStartQuiz);
      const result = await onPass(selectedAnswers, id);
      setScore(result.score);
      setSubmitState("submitted");
      if (!result.passed && result.retryAt) {
        setRetryAtIso(result.retryAt);
      }
    } catch (error) {
      setScore(null);
      setSubmissionError(error instanceof Error ? error.message : t.unableToSaveQuiz);
      setSubmitState("submitted");
    }
  }

  function reset() {
    setSelected({});
    setTextAnswers({});
    setScore(null);
    setSubmitState("idle");
    setSubmissionError(null);
    setRetryAtIso(null);
    onStart().then(setAttemptId).catch(() => setSubmissionError(t.couldNotStartQuiz));
  }

  return (
    <div className="grid gap-4">
      <div className="pr-panel p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="pr-eyebrow">{t.requiredQuiz}</p>
            {title && <h1 className="pr-h2 mt-2">{title}</h1>}
            {description && <p className="pr-copy mt-3 max-w-2xl">{description}</p>}
          </div>
          <span className="pr-badge shrink-0">{t.passingScore}: {passScore}%</span>
        </div>
      </div>

      {questions.map((question, questionIndex) => {
        const selectedIds = selected[question.id] ?? [];
        const isSubmitted = submitState === "submitted";
        const questionCorrect = isSubmitted && isQuestionCorrect(question);

        return (
          <article
            key={question.id}
            className={`rounded-[var(--radius-lg)] border p-5 shadow-sm transition ${
              isSubmitted
                ? questionCorrect
                  ? "border-[rgba(0,87,255,0.25)] bg-[var(--brand-50)]"
                  : "border-[rgba(196,43,43,0.25)] bg-[var(--danger-50)]"
                : "border-[var(--border)] bg-[var(--card)]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-[800] uppercase tracking-[1.5px] text-[var(--brand)]">
                  {t.quiz} {questionIndex + 1}
                </p>
                <h3 className="mt-2 text-xl font-[800] tracking-[-0.35px] text-[var(--ink)]">
                  {question.question[textLocale]}
                </h3>
              </div>
              {isSubmitted ? (
                <span
                  className={`shrink-0 grid h-8 w-8 place-items-center rounded-full text-sm font-[800] ${
                    questionCorrect
                      ? "bg-[var(--brand)] text-white"
                      : "bg-[var(--danger)] text-white"
                  }`}
                  aria-label={questionCorrect ? t.correctAnswer : t.incorrectAnswer}
                >
                  {questionCorrect ? "✓" : "✗"}
                </span>
              ) : null}
            </div>

            {question.type === QuestionType.TEXT_INPUT ? (
              <div className="mt-5 grid gap-2">
                <input
                  value={textAnswers[question.id] ?? ""}
                  disabled={submitState !== "idle"}
                  onChange={(event) => setTextAnswers((current) => ({ ...current, [question.id]: event.target.value }))}
                  placeholder={t.enterYourAnswer}
                  className="min-h-12 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-[800] text-[var(--ink)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[rgba(0,87,255,0.12)] disabled:opacity-80"
                />
                {isSubmitted ? (
                  <p className={`text-sm font-[800] ${questionCorrect ? "text-[var(--brand)]" : "text-[var(--danger)]"}`}>
                    {questionCorrect ? `✓ ${t.correctAnswer}` : `✗ ${t.incorrectAnswer}`}
                  </p>
                ) : null}
              </div>
            ) : (
              <div
                className="mt-5 grid gap-2"
                role={question.type === QuestionType.SINGLE_CHOICE ? "radiogroup" : "group"}
                aria-label={question.question[textLocale]}
              >
                {question.options.map((option, optionIndex) => {
                const choiceId = question.choiceIds[optionIndex];
                const active = selectedIds.includes(choiceId);
                const status = getChoiceStatus(question, choiceId);
                const isDisabled = submitState !== "idle";

                let className =
                  "min-h-12 rounded-[var(--radius)] border px-4 text-start text-sm font-[800] transition ";
                if (status === "correct") {
                  // Blue tick — correct answer
                  className += "border-[var(--brand)] bg-[var(--brand)] text-white";
                } else if (status === "wrong") {
                  // Red cross — wrong selected answer
                  className += "border-[rgba(196,43,43,0.5)] bg-[var(--danger)] text-white";
                } else if (active && !isDisabled) {
                  className += "border-[var(--brand)] bg-[var(--brand)] text-white";
                } else {
                  className +=
                    "border-[var(--border)] bg-[var(--surface)] text-[var(--ink-2)] hover:border-[rgba(0,87,255,0.24)] hover:bg-[var(--card)]";
                }

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    role={question.type === QuestionType.SINGLE_CHOICE ? "radio" : "checkbox"}
                    aria-checked={active}
                    disabled={isDisabled}
                    onClick={() => {
                      setSelected((current) => {
                        if (question.type === QuestionType.SINGLE_CHOICE) {
                          return { ...current, [question.id]: [choiceId] };
                        }

                        const existing = current[question.id] ?? [];
                        return {
                          ...current,
                          [question.id]: existing.includes(choiceId)
                            ? existing.filter((id) => id !== choiceId)
                            : [...existing, choiceId]
                        };
                      });
                    }}
                    className={className}
                  >
                    <span className="flex items-center gap-2">
                      {status === "correct" ? "✓ " : status === "wrong" ? "✗ " : ""}
                      {option[textLocale]}
                    </span>
                  </button>
                );
              })}
              </div>
            )}

            {isSubmitted && questionCorrect && question.explanation?.[textLocale] ? (
              <div className="mt-4 rounded-[var(--radius)] border border-[rgba(0,87,255,0.18)] bg-[var(--brand-50)] p-3">
                <p className="text-xs font-[800] uppercase tracking-[1.5px] text-[var(--brand)]">{t.explanationLabel}</p>
                <p className="mt-1 text-sm font-[600] text-[var(--ink-2)]">{question.explanation[textLocale]}</p>
              </div>
            ) : null}
          </article>
        );
      })}

      <div className="pr-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {submitState === "idle" ? (
            <button
              type="button"
              disabled={!allAnswered}
              onClick={submitQuiz}
              aria-label={t.submitQuiz}
              className="pr-btn-primary disabled:cursor-not-allowed disabled:border-[var(--border)] disabled:bg-[var(--surface)] disabled:text-[var(--muted)]"
            >
              {t.submitQuiz}
            </button>
          ) : submitState === "saving" ? (
            <span className="pr-btn-ghost">
              {t.savingLabel}
            </span>
          ) : !passed ? (
            retryAtIso ? (
              <p className="text-sm font-bold text-[var(--danger)]">
                {t.quizLockedOut.replace("{time}", formatRetryTime(retryAtIso))}
              </p>
            ) : (
              <button
                type="button"
                onClick={reset}
                className="pr-btn-ghost"
              >
                {t.tryAgain}
              </button>
            )
          ) : null}

          {score !== null ? (
            <div className="text-sm font-black">
              <span className="text-[var(--muted)]">{t.yourScore}: </span>
              <span className={passed ? "text-[var(--success)]" : "text-[var(--danger)]"}>{score}%</span>
            </div>
          ) : null}
        </div>

        {score !== null ? (
          <p
            className={`mt-4 rounded-xl p-4 text-sm font-bold leading-6 ${
              passed ? "bg-[var(--success-50)] text-[var(--success)]" : "bg-[var(--danger-50)] text-[var(--danger)]"
            }`}
            role="alert"
          >
            {passed ? t.passedQuiz : t.failedQuiz}
          </p>
        ) : null}

        {submissionError ? (
          <div className="mt-4 flex items-start gap-3 rounded-[var(--radius)] bg-[var(--danger-50)] p-4" role="alert">
            <p className="flex-1 text-sm font-bold text-[var(--danger)]">{submissionError}</p>
            <button
              type="button"
              onClick={() => setSubmissionError(null)}
              className="shrink-0 text-[var(--danger)] opacity-60 transition hover:opacity-100"
              aria-label={t.dismissLabel}
            >
              ✕
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
