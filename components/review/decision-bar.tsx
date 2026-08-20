"use client";

// Reviewer decision bar (A3 + A4). One-click approve / reject, plus
// request-changes with a notes field that is pre-seeded with the AI's
// suggested fixes (A4) so changes_requested carries concrete, actionable edits.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, TextArea } from "@/components/ui";
import { decideReview } from "@/lib/actions/submissions";
import type { Decision } from "@/lib/types";

function fixesToNote(fixes: string[]): string {
  if (fixes.length === 0) return "";
  return ["Please address the following before resubmitting:", ...fixes.map((f) => `• ${f}`)].join("\n");
}

export function DecisionBar({
  submissionId,
  suggestedFixes = [],
}: {
  submissionId: string;
  suggestedFixes?: string[];
}) {
  const router = useRouter();
  // Seed the note with the AI's concrete fixes; the reviewer edits freely.
  const [notes, setNotes] = useState(() => fixesToNote(suggestedFixes));
  const [error, setError] = useState<string | null>(null);
  const [pendingDecision, setPendingDecision] = useState<Decision | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: Decision) {
    setError(null);
    if (decision === "changes_requested" && notes.trim().length === 0) {
      setError("Add a note describing the changes needed.");
      return;
    }
    setPendingDecision(decision);
    startTransition(async () => {
      try {
        await decideReview(submissionId, decision, notes.trim() || undefined);
        setNotes("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to record decision");
      } finally {
        setPendingDecision(null);
      }
    });
  }

  return (
    <div className="grid gap-3">
      <TextArea
        label="Reviewer notes"
        name="reviewer-notes"
        hint="Pre-filled with the AI's suggested fixes; edit as needed. Required when requesting changes — carried into the submitter's revision."
        rows={Math.max(3, Math.min(10, notes.split("\n").length + 1))}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        disabled={pending}
      />
      {suggestedFixes.length > 0 ? (
        <button
          type="button"
          className="justify-self-start text-xs font-semibold text-slate-600 underline-offset-2 hover:text-slate-950 hover:underline disabled:opacity-50"
          disabled={pending}
          onClick={() => setNotes(fixesToNote(suggestedFixes))}
        >
          Reset to AI-suggested fixes
        </button>
      ) : null}
      {error ? (
        <p className="text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button disabled={pending} variant="primary" loading={pendingDecision === "approved"} onClick={() => decide("approved")}>
          Approve
        </Button>
        <Button variant="secondary" disabled={pending} loading={pendingDecision === "changes_requested"} onClick={() => decide("changes_requested")}>
          Request changes
        </Button>
        <Button variant="danger" disabled={pending} loading={pendingDecision === "rejected"} onClick={() => decide("rejected")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
