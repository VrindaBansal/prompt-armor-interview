"use client";

import { RouteError } from "@/components/ui";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      description="The workspace encountered an unexpected problem. Retry the request, or return to the sign-in page."
      homeHref="/login"
      homeLabel="Return to sign in"
      reset={reset}
      title="ClearPath could not complete this request"
    />
  );
}
