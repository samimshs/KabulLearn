"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function EducatorError({
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

  const isAuthError =
    error.name === "AuthorizationError" ||
    error.name === "AuthenticationError";

  return (
    <main className="mx-auto grid min-h-[70vh] w-full max-w-4xl place-items-center px-5 py-10">
      <div className="pr-card max-w-lg p-8 text-center">
        <p className="pr-eyebrow text-[var(--danger)]">
          {isDbError ? "Connection error" : isAuthError ? "Access denied" : "Something went wrong"}
        </p>
        <h1 className="pr-h2 mt-3">
          {isDbError
            ? "Database temporarily unavailable"
            : isAuthError
              ? "Educator access required"
              : "Unexpected error"}
        </h1>
        <p className="pr-copy mt-4 text-sm">
          {isDbError
            ? "Could not load your educator workspace. Please try again in a moment."
            : isAuthError
              ? "This area requires an educator account. Contact the admin to request educator access."
              : "An unexpected error occurred in the educator portal."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!isAuthError ? (
            <button
              type="button"
              onClick={reset}
              className="pr-btn-primary"
            >
              Try again
            </button>
          ) : null}
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
