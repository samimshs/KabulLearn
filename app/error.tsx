"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isDbError =
    error.message?.includes("Can't reach database") ||
    error.message?.includes("ECONNREFUSED") ||
    error.name === "PrismaClientKnownRequestError";

  return (
    <main className="mx-auto grid min-h-screen w-full max-w-4xl place-items-center px-5 py-10">
      <div className="pr-card max-w-lg p-8 text-center">
        <p className="pr-eyebrow text-[var(--danger)]">
          {isDbError ? "Connection error" : "Something went wrong"}
        </p>
        <h1 className="pr-h2 mt-3">
          {isDbError ? "Database temporarily unavailable" : "Unexpected error"}
        </h1>
        <p className="pr-copy mt-4 text-sm">
          {isDbError
            ? "The server is having trouble reaching the database. Please try again in a moment."
            : "An unexpected error occurred. Please try again or return to the homepage."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="pr-btn-primary"
          >
            Try again
          </button>
          <Link
            href="/"
            className="pr-btn-ghost"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
