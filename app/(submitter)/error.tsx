"use client";

import { RouteError } from "@/components/ui";

export default function SubmitterError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      description="Your submission data could not be loaded. Retry without losing your current account session."
      homeHref="/submissions"
      homeLabel="Return to submissions"
      reset={reset}
      title="Submission workspace unavailable"
    />
  );
}
