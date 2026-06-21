"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center text-zinc-100">
        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
        <p className="mt-2 max-w-md text-sm text-zinc-500">
          An unexpected error occurred. Our team has been notified. Try again, and if it keeps happening, come back in a bit.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-400"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
