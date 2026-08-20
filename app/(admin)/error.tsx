"use client";

import { RouteError } from "@/components/ui";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteError
      description="Operational metrics could not be loaded. Retry the request, or move to the live review queue."
      homeHref="/queue"
      homeLabel="Open review queue"
      reset={reset}
      title="Dashboard unavailable"
    />
  );
}
