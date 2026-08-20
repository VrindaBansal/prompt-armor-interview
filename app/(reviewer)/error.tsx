"use client";

import { RouteError } from "@/components/ui";

export default function ReviewerError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      description="The review data could not be loaded. Retry the request before recording a decision."
      homeHref="/queue"
      homeLabel="Return to review queue"
      reset={reset}
      title="Review workspace unavailable"
    />
  );
}
