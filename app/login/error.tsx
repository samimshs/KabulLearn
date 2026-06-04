"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function LoginError({
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
    error.name === "PrismaClientKnownRequestError" ||
    error.name === "PrismaClientInitializationError";

  return (
    <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-xl content-center gap-6 px-5 py-10">
      <div className="pr-card p-8 text-center">
        <p className="pr-eyebrow text-[var(--danger)]">
          {isDbError ? "Connection error" : "Sign-in error"}
        </p>
        <h2 className="pr-h2 mt-3">
          {isDbError ? "Database temporarily unavailable" : "Something went wrong"}
        </h2>
        <p className="pr-copy mt-4 text-sm">
          {isDbError
            ? "The server cannot reach the database right now. Please try again in a moment."
            : "An unexpected error occurred during sign-in."}
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
