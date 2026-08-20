"use client";

// Per-flag confirm/override control (A4). The reviewer records whether they
// agree with the AI's verdict; setFlagAgreement persists it and audits the
// decision. Confirm = agree with the flag; Override = disagree.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { setFlagAgreement } from "@/lib/actions/submissions";

export function FlagControls({
  aiCheckId,
  agreed,
}: {
  aiCheckId: string;
  agreed: boolean | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pendingAgreement, setPendingAgreement] = useState<boolean | null>(null);
  const [pending, startTransition] = useTransition();

  function set(value: boolean) {
    setError(null);
    setPendingAgreement(value);
    startTransition(async () => {
      try {
        await setFlagAgreement(aiCheckId, value);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save");
      } finally {
        setPendingAgreement(null);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={agreed === true ? "primary" : "secondary"}
        disabled={pending}
        loading={pending && pendingAgreement === true}
        aria-pressed={agreed === true}
        onClick={() => set(true)}
      >
        {agreed === true ? "Confirmed" : "Confirm"}
      </Button>
      <Button
        size="sm"
        variant={agreed === false ? "danger" : "secondary"}
        disabled={pending}
        loading={pending && pendingAgreement === false}
        aria-pressed={agreed === false}
        onClick={() => set(false)}
      >
        {agreed === false ? "Overridden" : "Override"}
      </Button>
      {agreed == null ? (
        <span className="text-xs text-slate-500">Not yet reviewed</span>
      ) : null}
      {error ? (
        <span className="text-xs font-medium text-red-700" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
