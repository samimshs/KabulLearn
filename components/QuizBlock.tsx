"use client";

import { useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

type LocalizedText = Record<Locale, string>;

type QuizQuestion = {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
  answerIndex: number;
};

type QuizBlockProps = {
  questions: QuizQuestion[];
  passScore: number;
  onPass: (score: number) => void;
};

export function QuizBlock({ questions, passScore, onPass }: QuizBlockProps) {
  const { locale, t } = useLanguage();
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [score, setScore] = useState<number | null>(null);
  const allAnswered = questions.every((question) => selected[question.id] !== undefined);
  const passed = score !== null && score >= passScore;

  function submitQuiz() {
    const correctAnswers = questions.filter((question) => selected[question.id] === question.answerIndex).length;
    const nextScore = Math.round((correctAnswers / questions.length) * 100);
    setScore(nextScore);
    if (nextScore >= passScore) {
      onPass(nextScore);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="rounded-3xl border border-stone-200 bg-[#fffdfa] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">{t.requiredQuiz}</p>
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-teal-900">
            {t.passingScore}: {passScore}%
          </span>
        </div>
      </div>

      {questions.map((question, questionIndex) => {
        const selectedIndex = selected[question.id];

        return (
          <article key={question.id} className="rounded-3xl border border-stone-200 bg-[#fffdfa] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#0f766e]">
                  {t.quiz} {questionIndex + 1}
                </p>
                <h3 className="mt-2 text-xl font-black tracking-tight text-[#102033]">{question.question[locale]}</h3>
              </div>
            </div>

            <div className="mt-5 grid gap-2">
              {question.options.map((option, optionIndex) => {
                const active = selectedIndex === optionIndex;
                return (
                  <button
                    key={option[locale]}
                    type="button"
                    onClick={() => {
                      setSelected((current) => ({ ...current, [question.id]: optionIndex }));
                      setScore(null);
                    }}
                    className={`min-h-12 rounded-xl border px-4 text-start text-sm font-bold transition ${
                      active
                        ? "border-[#2563eb] bg-blue-50 text-[#0d47a1]"
                        : "border-stone-200 bg-stone-50 text-[#1a2e42] hover:border-stone-300 hover:bg-white"
                    }`}
                  >
                    {option[locale]}
                  </button>
                );
              })}
            </div>
          </article>
        );
      })}

      <div className="rounded-3xl border border-stone-200 bg-[#fffdfa] p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            disabled={!allAnswered}
            onClick={submitQuiz}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563eb] px-5 text-sm font-black text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600"
          >
            {t.submitQuiz}
          </button>
          {score !== null ? (
            <div className="text-sm font-black">
              <span className="text-[#3d4a5a]">{t.yourScore}: </span>
              <span className={passed ? "text-emerald-700" : "text-rose-700"}>{score}%</span>
            </div>
          ) : null}
        </div>
        {score !== null ? (
          <p className={`mt-4 rounded-xl p-4 text-sm font-bold leading-6 ${passed ? "bg-emerald-100 text-emerald-950" : "bg-red-50 text-red-900"}`}>
            {passed ? t.passedQuiz : t.failedQuiz}
          </p>
        ) : null}
      </div>
    </div>
  );
}
