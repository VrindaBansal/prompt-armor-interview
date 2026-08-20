"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;

function formatLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unavailable";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function LocalDateTime({ className, value }: { className?: string; value: string }) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const formatted = isClient ? formatLocalDateTime(value) : null;

  return <time className={className} dateTime={value}>{formatted ?? "…"}</time>;
}
