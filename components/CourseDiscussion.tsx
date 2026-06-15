"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDiscussionReply, createDiscussionThread } from "@/lib/actions/discussion-actions";
import { useLanguage } from "@/components/LanguageProvider";

type DiscussionThread = {
  id: string;
  title: string;
  body: string;
  createdAt: Date | string;
  author: { name: string | null; email: string };
  replies: Array<{
    id: string;
    body: string;
    createdAt: Date | string;
    author: { name: string | null; email: string };
  }>;
};

export function CourseDiscussion({
  courseId,
  threads,
  canPost
}: {
  courseId: string;
  threads: DiscussionThread[];
  canPost: boolean;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <section className="pr-card grid gap-5 p-5 lg:p-6">
      <div>
        <p className="pr-eyebrow">{t.discussionLabel}</p>
        <h2 className="pr-h2 mt-2">{threads.length > 0 ? t.joinDiscussion : t.startDiscussion}</h2>
      </div>

      {canPost ? (
        <form
          className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              const result = await createDiscussionThread({ courseId, title, body });
              setMessage(result.ok ? t.discussionPosted : result.error);
              if (result.ok) {
                setTitle("");
                setBody("");
                router.refresh();
              }
            });
          }}
        >
          <input className="pr-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.questionOrTopic} />
          <textarea className="pr-input min-h-24" value={body} onChange={(event) => setBody(event.target.value)} placeholder={t.discussionBodyPlaceholder} />
          <button type="submit" disabled={isPending} className="pr-btn-secondary !min-h-10">
            {isPending ? t.postingLabel : t.postDiscussion}
          </button>
          {message ? <p className="text-sm font-[800] text-[var(--muted)]">{message}</p> : null}
        </form>
      ) : (
        <p className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-[800] text-[var(--muted)]">
          Enroll in the course to join the discussion.
        </p>
      )}

      <div className="grid gap-4">
        {threads.length === 0 ? (
          <div className="pr-muted-box text-center font-[800] text-[var(--muted)]">
            No discussions yet.
          </div>
        ) : (
          threads.map((thread) => (
            <article key={thread.id} className="grid gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4">
              <div>
                <h3 className="text-lg font-[800] text-[var(--ink)]">{thread.title}</h3>
                <p className="mt-1 text-xs font-[800] uppercase tracking-[1px] text-[var(--muted)]">
                  {thread.author.name ?? thread.author.email}
                </p>
                <p className="mt-3 text-sm font-[500] leading-6 text-[var(--muted)]">{thread.body}</p>
              </div>

              {thread.replies.length > 0 ? (
                <div className="grid gap-2 border-s-2 border-[var(--border)] ps-4">
                  {thread.replies.map((reply) => (
                    <div key={reply.id} className="rounded-[var(--radius)] bg-[var(--surface)] p-3">
                      <p className="text-xs font-[800] text-[var(--muted)]">{reply.author.name ?? reply.author.email}</p>
                      <p className="mt-1 text-sm font-[500] leading-6 text-[var(--ink-2)]">{reply.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {canPost ? <ReplyForm threadId={thread.id} /> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function ReplyForm({ threadId }: { threadId: string }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [body, setBody] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="grid gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await createDiscussionReply({ threadId, body });
          setMessage(result.ok ? t.replyPosted : result.error);
          if (result.ok) {
            setBody("");
            router.refresh();
          }
        });
      }}
    >
      <textarea className="pr-input min-h-20" value={body} onChange={(event) => setBody(event.target.value)} placeholder={t.replyPlaceholder} />
      <button type="submit" disabled={isPending} className="pr-btn-secondary !min-h-9">
        {isPending ? t.replyingLabel : t.replyPlaceholder}
      </button>
      {message ? <p className="text-xs font-[800] text-[var(--muted)]">{message}</p> : null}
    </form>
  );
}
