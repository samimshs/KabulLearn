"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { QuestionType } from "@prisma/client";
import {
  addQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  addAnswerChoice,
  updateAnswerChoice,
  deleteAnswerChoice,
  reorderAnswerChoices,
  reorderQuizQuestions
} from "@/lib/actions/quiz-builder-actions";

type Choice = {
  id: string;
  order: number;
  textEn: string;
  textPs: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  order: number;
  type: QuestionType;
  promptEn: string;
  promptPs: string;
  correctAnswer: string | null;
  explanationEn: string | null;
  explanationPs: string | null;
  choices: Choice[];
};

type QuizBuilderFormProps = {
  courseId: string;
  lessonId: string;
  questions: Question[];
};

type OrderItem = {
  id: string;
  label: string;
  meta?: string;
};

function moveItem<T extends { id: string }>(items: T[], draggedId: string, targetId: string) {
  const from = items.findIndex((item) => item.id === draggedId);
  const to = items.findIndex((item) => item.id === targetId);

  if (from === -1 || to === -1 || from === to) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function DragOrderPanel({
  items,
  emptyText,
  saveLabel,
  onSave
}: {
  items: OrderItem[];
  emptyText: string;
  saveLabel: string;
  onSave: (ids: string[]) => Promise<{ ok: true; data: void } | { ok: false; error: string }>;
}) {
  const router = useRouter();
  const [orderedItems, setOrderedItems] = useState(items);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const originalIds = items.map((item) => item.id).join("|");
  const currentIds = orderedItems.map((item) => item.id).join("|");
  const hasChanges = originalIds !== currentIds;

  useEffect(() => {
    setOrderedItems(items);
  }, [originalIds]);

  if (items.length === 0) {
    return <p className="text-sm font-bold text-[#607083]">{emptyText}</p>;
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3">
      <div className="grid gap-2">
        {orderedItems.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => {
              setDraggedId(item.id);
              setMessage("");
            }}
            onDragEnd={() => setDraggedId(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (!draggedId) return;
              setOrderedItems((current) => moveItem(current, draggedId, item.id));
              setDraggedId(null);
            }}
            className={`grid cursor-grab grid-cols-[auto_1fr] items-center gap-3 rounded-xl border bg-white px-3 py-3 transition active:cursor-grabbing ${
              draggedId === item.id ? "border-[#0f766e] opacity-60" : "border-stone-200 hover:border-teal-200"
            }`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-xs font-black text-[#0f766e]">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-[#102033]">{item.label}</span>
              {item.meta ? <span className="mt-1 block text-xs font-bold text-[#607083]">{item.meta}</span> : null}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!hasChanges || isPending}
          onClick={() =>
            startTransition(async () => {
              setMessage("");
              const result = await onSave(orderedItems.map((item) => item.id));
              if (result.ok) {
                setMessage("Order saved. Submit the course again when ready.");
                router.refresh();
              } else {
                setMessage(result.error);
              }
            })
          }
          className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-xs font-black text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : saveLabel}
        </button>
        {message ? <p className="text-xs font-bold text-[#607083]">{message}</p> : null}
      </div>
    </div>
  );
}

function ChoiceItem({
  choice,
  questionId,
  onDeleted
}: {
  choice: Choice;
  questionId: string;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [edit, setEdit] = useState({ textEn: choice.textEn, textPs: choice.textPs, isCorrect: choice.isCorrect });
  const [message, setMessage] = useState("");

  return (
    <div className={`grid gap-3 rounded-xl border px-4 py-3 text-sm ${choice.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-stone-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-3">
      <div className="grid min-w-0 gap-1">
        <span className={`font-bold ${choice.isCorrect ? "text-emerald-900" : "text-[#1a2e42]"}`}>
          {choice.isCorrect ? "✓ " : ""}{choice.textEn}
        </span>
        <span className="text-xs text-[#607083]">{choice.textPs}</span>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await deleteAnswerChoice({ choiceId: choice.id });
            if (result.ok) onDeleted(choice.id);
          })
        }
        aria-label="Delete answer choice"
        className="shrink-0 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
      >
        {isPending ? "..." : "Delete"}
      </button>
      </div>
      <details>
        <summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-[#0f766e]">Edit answer</summary>
        <form
          className="mt-3 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await updateAnswerChoice({ choiceId: choice.id, questionId, ...edit });
              setMessage(result.ok ? "Answer updated." : result.error);
            });
          }}
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.textEn} onChange={(e) => setEdit({ ...edit, textEn: e.target.value })} />
            <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.textPs} onChange={(e) => setEdit({ ...edit, textPs: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs font-black text-[#1a2e42]">
            <input type="checkbox" checked={edit.isCorrect} onChange={(e) => setEdit({ ...edit, isCorrect: e.target.checked })} />
            Correct answer
          </label>
          <button className="inline-flex h-8 items-center justify-center rounded-xl bg-[#0f766e] px-3 text-xs font-black text-white" type="submit">
            Save answer
          </button>
          {message ? <p className="text-xs font-bold text-[#607083]">{message}</p> : null}
        </form>
      </details>
    </div>
  );
}

function AddChoiceForm({
  questionId,
  onAdded
}: {
  questionId: string;
  onAdded: (choice: Choice) => void;
}) {
  const router = useRouter();
  const [textEn, setTextEn] = useState("");
  const [textPs, setTextPs] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setError(null);
          const result = await addAnswerChoice({ questionId, textEn, textPs, isCorrect });
          if (result.ok) {
            onAdded({ id: result.data.choiceId, order: 999, textEn, textPs, isCorrect });
            setTextEn("");
            setTextPs("");
            setIsCorrect(false);
            router.refresh();
          } else {
            setError(result.error);
          }
        });
      }}
      className="grid gap-3 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3"
    >
      <p className="text-xs font-black uppercase tracking-wider text-[#0f766e]">Add answer choice</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={textEn}
          onChange={(e) => setTextEn(e.target.value)}
          placeholder="English answer"
          required
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
        />
        <input
          value={textPs}
          onChange={(e) => setTextPs(e.target.value)}
          placeholder="د ځواب متن"
          required
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1a2e42]">
          <input
            type="checkbox"
            checked={isCorrect}
            onChange={(e) => setIsCorrect(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
          />
          Correct answer
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-xs font-black text-white transition hover:bg-[#115e59] disabled:opacity-70"
        >
          {isPending ? "Adding..." : "Add choice"}
        </button>
      </div>
      {error ? <p className="text-xs font-bold text-rose-700">{error}</p> : null}
    </form>
  );
}

function QuestionCard({
  question,
  onDeleted
}: {
  question: Question;
  onDeleted: (id: string) => void;
}) {
  const [choices, setChoices] = useState<Choice[]>(question.choices);
  const [edit, setEdit] = useState({
    type: question.type,
    promptEn: question.promptEn,
    promptPs: question.promptPs,
    correctAnswer: question.correctAnswer ?? "",
    explanationEn: question.explanationEn ?? "",
    explanationPs: question.explanationPs ?? ""
  });
  const [editMessage, setEditMessage] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();

  return (
    <article className="grid gap-4 rounded-3xl border border-stone-200 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-1">
          <p className="text-xs font-black uppercase tracking-wider text-[#0f766e]">
            Question {question.order}
          </p>
          <h3 className="text-lg font-black text-[#102033]">{question.promptEn}</h3>
          <p className="text-sm text-[#607083]">{question.promptPs}</p>
          {question.explanationEn ? (
            <p className="mt-1 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-blue-900">
              Explanation: {question.explanationEn}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          disabled={isDeletePending}
          onClick={() =>
            startDeleteTransition(async () => {
              setDeleteError(null);
              const result = await deleteQuizQuestion({ questionId: question.id });
              if (result.ok) {
                onDeleted(question.id);
              } else {
                setDeleteError(result.error);
              }
            })
          }
          aria-label="Delete question"
          className="shrink-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-black text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
        >
          {isDeletePending ? "..." : "Delete question"}
        </button>
      </div>

      {deleteError ? <p className="text-xs font-bold text-rose-700">{deleteError}</p> : null}

      <details className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-3">
        <summary className="cursor-pointer text-xs font-black uppercase tracking-wider text-[#0f766e]">Edit question</summary>
        <form
          className="mt-3 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            startEditTransition(async () => {
              const result = await updateQuizQuestion({
                questionId: question.id,
                type: edit.type,
                promptEn: edit.promptEn,
                promptPs: edit.promptPs,
                correctAnswer: edit.type === QuestionType.TEXT_INPUT ? edit.correctAnswer : undefined,
                explanationEn: edit.explanationEn || undefined,
                explanationPs: edit.explanationPs || undefined
              });
              setEditMessage(result.ok ? "Question updated. Submit the course again when ready." : result.error);
            });
          }}
        >
          <select className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.type} onChange={(e) => setEdit({ ...edit, type: e.target.value as QuestionType })}>
            <option value={QuestionType.SINGLE_CHOICE}>Single choice</option>
            <option value={QuestionType.MULTIPLE_CHOICE}>Multiple choice</option>
            <option value={QuestionType.TEXT_INPUT}>Text / math answer</option>
          </select>
          <div className="grid gap-2 sm:grid-cols-2">
            <textarea className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.promptEn} onChange={(e) => setEdit({ ...edit, promptEn: e.target.value })} />
            <textarea className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.promptPs} onChange={(e) => setEdit({ ...edit, promptPs: e.target.value })} />
          </div>
          {edit.type === QuestionType.TEXT_INPUT ? (
            <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.correctAnswer} onChange={(e) => setEdit({ ...edit, correctAnswer: e.target.value })} placeholder="Correct answer" />
          ) : null}
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.explanationEn} onChange={(e) => setEdit({ ...edit, explanationEn: e.target.value })} placeholder="English explanation" />
            <input className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm" value={edit.explanationPs} onChange={(e) => setEdit({ ...edit, explanationPs: e.target.value })} placeholder="Pashto explanation" />
          </div>
          <button type="submit" disabled={isEditPending} className="inline-flex h-9 items-center justify-center rounded-xl bg-[#0f766e] px-4 text-xs font-black text-white">
            {isEditPending ? "Saving..." : "Save question"}
          </button>
          {editMessage ? <p className="text-xs font-bold text-[#607083]">{editMessage}</p> : null}
        </form>
      </details>

      {question.type === QuestionType.TEXT_INPUT ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-black uppercase tracking-wider text-blue-700">Text or math answer</p>
          <p className="mt-2 text-sm font-[800] text-blue-950">Correct answer: {question.correctAnswer}</p>
        </div>
      ) : (
        <div className="grid gap-2">
          <p className="text-xs font-black uppercase tracking-wider text-[#3d4a5a]">
            Answer choices ({choices.length})
            {question.type === QuestionType.SINGLE_CHOICE ? (
              <span className="ms-2 text-[#607083]">— one correct answer</span>
            ) : (
              <span className="ms-2 text-[#607083]">— multiple correct answers allowed</span>
            )}
            {choices.filter((c) => c.isCorrect).length === 0 ? (
              <span className="ms-2 text-amber-600">— mark at least one as correct</span>
            ) : null}
          </p>
          <DragOrderPanel
            items={choices.map((choice) => ({
              id: choice.id,
              label: choice.textEn,
              meta: choice.isCorrect ? "Correct answer" : "Answer choice"
            }))}
            emptyText="Add answer choices before ordering."
            saveLabel="Save choice order"
            onSave={(choiceIds) => reorderAnswerChoices({ questionId: question.id, choiceIds })}
          />
          {choices.map((choice) => (
            <ChoiceItem
              key={choice.id}
              choice={choice}
              questionId={question.id}
              onDeleted={(id) => setChoices((prev) => prev.filter((c) => c.id !== id))}
            />
          ))}
          <AddChoiceForm
            questionId={question.id}
            onAdded={(choice) => setChoices((prev) => [...prev, choice])}
          />
        </div>
      )}
    </article>
  );
}

function AddQuestionForm({
  lessonId,
  onAdded
}: {
  lessonId: string;
  onAdded: (question: Question) => void;
}) {
  const [type, setType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [promptEn, setPromptEn] = useState("");
  const [promptPs, setPromptPs] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [explanationEn, setExplanationEn] = useState("");
  const [explanationPs, setExplanationPs] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          setError(null);
          const result = await addQuizQuestion({
            lessonId,
            type,
            promptEn,
            promptPs,
            correctAnswer: type === QuestionType.TEXT_INPUT ? correctAnswer : undefined,
            explanationEn: explanationEn || undefined,
            explanationPs: explanationPs || undefined
          });
          if (result.ok) {
            onAdded({
              id: result.data.questionId,
              order: 999,
              type,
              promptEn,
              promptPs,
              correctAnswer: type === QuestionType.TEXT_INPUT ? correctAnswer : null,
              explanationEn: explanationEn || null,
              explanationPs: explanationPs || null,
              choices: []
            });
            setPromptEn("");
            setPromptPs("");
            setCorrectAnswer("");
            setExplanationEn("");
            setExplanationPs("");
          } else {
            setError(result.error);
          }
        });
      }}
      className="grid gap-4 rounded-3xl border border-stone-200 bg-[#fffdfa] p-5 shadow-sm"
    >
      <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">Add new question</p>
      <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
        Question type
        <select
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
          className="rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
        >
          <option value={QuestionType.SINGLE_CHOICE}>Single choice</option>
          <option value={QuestionType.MULTIPLE_CHOICE}>Multiple choice</option>
          <option value={QuestionType.TEXT_INPUT}>Text / math answer</option>
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          English prompt
          <textarea
            value={promptEn}
            onChange={(e) => setPromptEn(e.target.value)}
            required
            rows={2}
            placeholder="What is...?"
            className="min-h-[72px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Pashto prompt
          <textarea
            value={promptPs}
            onChange={(e) => setPromptPs(e.target.value)}
            required
            rows={2}
            placeholder="... دی؟"
            className="min-h-[72px] rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>
      {type === QuestionType.TEXT_INPUT ? (
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Correct answer
          <input
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
            required
            placeholder="Example: 42 or x = 5"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
          <span className="text-xs font-[700] text-[#607083]">For math answers, use the exact answer students should type.</span>
        </label>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Explanation (EN, optional)
          <input
            value={explanationEn}
            onChange={(e) => setExplanationEn(e.target.value)}
            placeholder="Shown after student answers"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
        <label className="grid gap-1 text-sm font-medium text-[#3d4a5a]">
          Explanation (PS, optional)
          <input
            value={explanationPs}
            onChange={(e) => setExplanationPs(e.target.value)}
            placeholder="د ځواب وروسته ښودل کیږي"
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/10"
          />
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-xl bg-[#0f3d5e] px-5 text-sm font-black text-white transition hover:bg-[#0a2d47] disabled:opacity-70"
        >
          {isPending ? "Adding..." : "Add question"}
        </button>
        {error ? <p className="text-sm font-bold text-rose-700">{error}</p> : null}
      </div>
    </form>
  );
}

export function QuizBuilderForm({ courseId, lessonId, questions: initialQuestions }: QuizBuilderFormProps) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wider text-[#0f766e]">Questions</p>
          <p className="mt-1 text-sm text-[#607083]">
            {questions.length} question{questions.length !== 1 ? "s" : ""} · add questions then answer choices
          </p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-8 text-center font-bold text-[#3d4a5a]">
          No questions yet. Add your first question below.
        </div>
      ) : (
        <div className="grid gap-4">
          <DragOrderPanel
            items={questions.map((question) => ({
              id: question.id,
              label: question.promptEn,
              meta: question.type.replace("_", " ").toLowerCase()
            }))}
            emptyText="Add questions before ordering."
            saveLabel="Save question order"
            onSave={(questionIds) => reorderQuizQuestions({ lessonId, questionIds })}
          />
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              onDeleted={(id) => setQuestions((prev) => prev.filter((q) => q.id !== id))}
            />
          ))}
        </div>
      )}

      <AddQuestionForm
        lessonId={lessonId}
        onAdded={(question) => setQuestions((prev) => [...prev, question])}
      />
    </div>
  );
}
