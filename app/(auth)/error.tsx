"use client";

import { RouteError } from "@/components/ui";

export default function AuthError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      contained
      description="Your account page could not be loaded. Retry now, or return to sign in and start again."
      homeHref="/login"
      homeLabel="Return to sign in"
      reset={reset}
      title="Account page unavailable"
    />
  );
}
