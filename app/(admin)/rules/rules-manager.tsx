"use client";

// Feature 13 admin UI: list the ruleset with active toggles, and an add/edit
// form. Calls the rules server actions and refreshes.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Field,
  Select,
  SeverityTag,
  TextArea,
} from "@/components/ui";
import { createRule, setRuleActive, updateRule } from "@/lib/actions/rules";
import type {
  Channel,
  NewRule,
  ProductType,
  Regulation,
  Rule,
  Severity,
} from "@/lib/types";

const REGULATIONS: Regulation[] = ["TILA", "UDAAP", "FTC_endorsement"];
const SEVERITIES: Severity[] = ["blocker", "warning", "advisory"];
const CHANNELS: Channel[] = ["ad", "email", "affiliate_landing", "social"];
const PRODUCTS: ProductType[] = ["personal_loan", "credit_card", "mortgage_prequal"];

const emptyForm: NewRule = {
  code: "",
  regulation: "TILA",
  severity: "warning",
  description: "",
  applies_to_channels: [],
  applies_to_product_types: [],
};

function CheckGroup<T extends string>({
  legend,
  options,
  selected,
  onToggle,
  hint,
}: {
  legend: string;
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  hint: string;
}) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="text-sm font-semibold text-slate-900">{legend}</legend>
      <p className="text-xs text-slate-500">{hint}</p>
      <div className="mt-1 flex flex-wrap gap-3">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-slate-800">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="size-4 rounded border-slate-300"
            />
            {opt}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function RulesManager({ initialRules }: { initialRules: Rule[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewRule>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function beginAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function beginEdit(rule: Rule) {
    setEditingId(rule.id);
    setForm({
      code: rule.code,
      regulation: rule.regulation,
      severity: rule.severity,
      description: rule.description,
      applies_to_channels: rule.applies_to_channels,
      applies_to_product_types: rule.applies_to_product_types,
    });
    setError(null);
  }

  function toggleIn<T extends string>(key: "applies_to_channels" | "applies_to_product_types", value: T) {
    setForm((f) => {
      const list = f[key] as T[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });
  }

  function save() {
    setError(null);
    startTransition(async () => {
      try {
        if (editingId) await updateRule(editingId, form);
        else await createRule(form);
        beginAdd();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save rule");
      }
    });
  }

  function toggleActive(rule: Rule) {
    startTransition(async () => {
      try {
        await setRuleActive(rule.id, !rule.is_active);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update rule");
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      {/* Add / edit form */}
      <Card className="h-fit lg:sticky lg:top-6">
        <CardHeader className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
          {editingId ? "Edit rule" : "Add rule"}
        </CardHeader>
        <CardContent className="grid gap-4">
          <Field
            label="Code"
            name="rule-code"
            hint="e.g. TILA-APR-CLARITY (auto-uppercased)"
            maxLength={80}
            required
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            disabled={pending}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Regulation"
              name="rule-regulation"
              value={form.regulation}
              onChange={(e) => setForm((f) => ({ ...f, regulation: e.target.value as Regulation }))}
              disabled={pending}
            >
              {REGULATIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
            <Select
              label="Severity"
              name="rule-severity"
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Severity }))}
              disabled={pending}
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <TextArea
            label="Requirement"
            name="rule-description"
            hint="Plain-language rule the AI evaluates copy against."
            maxLength={2000}
            required
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            disabled={pending}
          />
          <CheckGroup
            legend="Applies to channels"
            hint="Leave empty to apply to all channels."
            options={CHANNELS}
            selected={form.applies_to_channels}
            onToggle={(v) => toggleIn("applies_to_channels", v)}
          />
          <CheckGroup
            legend="Applies to products"
            hint="Leave empty to apply to all products."
            options={PRODUCTS}
            selected={form.applies_to_product_types}
            onToggle={(v) => toggleIn("applies_to_product_types", v)}
          />
          {error ? (
            <p className="text-sm font-medium text-red-700" role="alert">{error}</p>
          ) : null}
        </CardContent>
        <CardFooter>
          <Button variant="primary" loading={pending} onClick={save}>
            {editingId ? "Save changes" : "Add rule"}
          </Button>
          {editingId ? (
            <Button variant="ghost" disabled={pending} onClick={beginAdd}>Cancel</Button>
          ) : null}
        </CardFooter>
      </Card>

      {/* Rule list */}
      <div className="grid gap-3">
        {initialRules.map((rule) => (
          <Card key={rule.id} className={rule.is_active ? undefined : "opacity-60"}>
            <CardContent className="grid gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold tracking-[0.03em] text-slate-900">{rule.code}</span>
                <Badge tone="neutral">{rule.regulation}</Badge>
                <SeverityTag severity={rule.severity} />
                <Badge tone={rule.is_active ? "success" : "neutral"}>
                  {rule.is_active ? "Active" : "Inactive"}
                </Badge>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="secondary" disabled={pending} onClick={() => beginEdit(rule)}>
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant={rule.is_active ? "danger" : "primary"}
                    disabled={pending}
                    onClick={() => toggleActive(rule)}
                  >
                    {rule.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-slate-700">{rule.description}</p>
              <p className="text-xs text-slate-500">
                Channels: {rule.applies_to_channels.length ? rule.applies_to_channels.join(", ") : "all"} ·
                Products: {rule.applies_to_product_types.length ? rule.applies_to_product_types.join(", ") : "all"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
