"use client";

// Reviewer decision bar (A3). One-click approve / reject, plus request-changes
// with a notes field. Calls the decideReview server action and refreshes.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, TextArea } from "@/components/ui";
import { decideReview } from "@/lib/actions/submissions";
import type { Decision } from "@/lib/types";

export function DecisionBar({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: Decision) {
    setError(null);
    if (decision === "changes_requested" && notes.trim().length === 0) {
      setError("Add a note describing the changes needed.");
      return;
    }
    startTransition(async () => {
      try {
        await decideReview(submissionId, decision, notes.trim() || undefined);
        setNotes("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record decision");
      }
    });
  }

  return (
    <div className="grid gap-3">
      <TextArea
        label="Reviewer notes"
        name="reviewer-notes"
        hint="Required when requesting changes; carried into the submitter's revision."
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={pending}
      />
      {error ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" loading={pending} onClick={() => decide("approved")}>
          Approve
        </Button>
        <Button variant="secondary" disabled={pending} onClick={() => decide("changes_requested")}>
          Request changes
        </Button>
        <Button variant="danger" disabled={pending} onClick={() => decide("rejected")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
