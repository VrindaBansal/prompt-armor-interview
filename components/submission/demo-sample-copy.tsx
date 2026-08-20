"use client";

// Demo-mode helper: fills the intake form with ready-made sample copy so an
// evaluator can watch the AI flag in real time without inventing ad copy.
// Rendered only when NEXT_PUBLIC_DEMO_MODE === "true".

type Sample = {
  key: string;
  label: string;
  title: string;
  channel: string;
  product: string;
  content: string;
};

const SAMPLES: Sample[] = [
  {
    key: "violating",
    label: "Violating",
    title: "Instant approval loan blast",
    channel: "ad",
    product: "personal_loan",
    content:
      "GUARANTEED approval with no credit check! Get cash at just 3.9% with absolutely no fees. Everyone qualifies — apply now, this exclusive offer ends tonight!",
  },
  {
    key: "clean",
    label: "Clean",
    title: "Personal loan eligibility check",
    channel: "ad",
    product: "personal_loan",
    content:
      "See if you prequalify for a fixed-rate personal loan. Representative APR 12.9%. Checking your eligibility does not affect your credit score. Rates depend on your application; terms and conditions apply.",
  },
  {
    key: "borderline",
    label: "Borderline",
    title: "Consolidate and lower payments",
    channel: "ad",
    product: "personal_loan",
    content:
      "A personal loan could lower your monthly payment. Many customers use one to consolidate higher-interest debt. Your actual rate, term, and savings depend on your approved offer.",
  },
];

function setField(name: string, value: string) {
  const el = document.getElementById(name) as
    | HTMLInputElement
    | HTMLTextAreaElement
    | HTMLSelectElement
    | null;
  if (!el) return;
  el.value = value;
  // Notify any listeners; the form reads DOM values on submit regardless.
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export function DemoSampleCopy() {
  function load(sample: Sample) {
    setField("title", sample.title);
    setField("channel", sample.channel);
    setField("product_type", sample.product);
    setField("content", sample.content);
  }

  return (
    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800">
        Demo — load sample copy
      </p>
      <p className="mt-1 text-xs text-slate-600">
        Fill the form with example copy, then click “Submit for AI review” to watch the AI flag it.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SAMPLES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => load(s)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
