"use client";

import { useState, useTransition } from "react";

import { type ChatConfig } from "@/lib/ai/config";
import { saveChatConfig, type SaveResult } from "./actions";

const MODEL_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "anthropic/claude-sonnet-4-6", label: "Claude Sonnet 4.6 (default)" },
  { value: "anthropic/claude-haiku-4-5", label: "Claude Haiku 4.5 (cheap)" },
  { value: "openai/gpt-5", label: "GPT-5" },
];

type Props = {
  initial: ChatConfig;
  writeReady: boolean;
};

export default function ChatConfigForm({ initial, writeReady }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SaveResult | null>(null);

  function onSubmit(formData: FormData) {
    setResult(null);
    startTransition(async () => {
      const r = await saveChatConfig(formData);
      setResult(r);
    });
  }

  return (
    <form action={onSubmit} className="flex flex-col gap-5">
      {!writeReady && (
        <div className="rounded-md border border-[var(--color-problem-accent)]/30 bg-[var(--color-problem-bg)] px-3 py-2 text-sm text-[var(--color-problem-accent-strong)]">
          Edge Config writes are not wired up. Set <code>EDGE_CONFIG</code> (or{" "}
          <code>EDGE_CONFIG_ID</code>) and <code>VERCEL_API_TOKEN</code> on this
          environment. The form will still validate values, but saves will fail.
        </div>
      )}

      <Field label="System prompt" hint="Sent on every request, ahead of the knowledge bundle.">
        <textarea
          name="systemPrompt"
          defaultValue={initial.systemPrompt}
          rows={6}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Model" hint="Routed through Vercel AI Gateway.">
        <select
          name="model"
          defaultValue={initial.model}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
        >
          {MODEL_OPTIONS.some((o) => o.value === initial.model) ? null : (
            <option value={initial.model}>{initial.model} (current)</option>
          )}
          {MODEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Allowed topics" hint="One per line. Injected into the system prompt as a guardrail.">
        <textarea
          name="allowedTopics"
          defaultValue={initial.allowedTopics.join("\n")}
          rows={4}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
        />
      </Field>

      <Field label="Refusal text" hint="Shown verbatim when the model declines.">
        <textarea
          name="refusalText"
          defaultValue={initial.refusalText}
          rows={2}
          className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Temperature" hint="0 = deterministic, 2 = wild.">
          <input
            name="temperature"
            type="number"
            step="0.1"
            min={0}
            max={2}
            defaultValue={initial.temperature}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Max output tokens" hint="Hard cap per reply.">
          <input
            name="maxTokens"
            type="number"
            min={50}
            max={4000}
            defaultValue={initial.maxTokens}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center rounded-md bg-[var(--color-solution-accent)] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--color-solution-accent)]/90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {result && (
          <span
            className={
              result.ok
                ? "text-sm text-[var(--color-solution-accent)]"
                : "text-sm text-[var(--color-problem-accent-strong)]"
            }
          >
            {result.message}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {hint ? (
        <span className="text-xs text-[var(--color-text-secondary)]">
          {hint}
        </span>
      ) : null}
      {children}
    </label>
  );
}
