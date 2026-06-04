"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function DashboardError({
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
    error.message?.includes("connect ECONNREFUSED") ||
    error.name === "PrismaClientKnownRequestError";

  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-7xl place-items-center px-5 py-10">
      <div className="pr-card max-w-lg p-8 text-center">
        <p className="pr-eyebrow text-[var(--danger)]">
          {isDbError ? "Connection error" : "Something went wrong"}
        </p>
        <h1 className="pr-h2 mt-3">
          {isDbError ? "Database unreachable" : "Unexpected error"}
        </h1>
        <p className="pr-copy mt-4 text-sm">
          {isDbError
            ? "The database server is temporarily unavailable. Please try again in a moment."
            : "An unexpected error occurred loading your courses."}
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
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
