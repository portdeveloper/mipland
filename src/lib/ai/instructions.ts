import type { ChatConfig } from "@/lib/ai/config";

/**
 * Set by the server and appended after whatever system prompt is configured,
 * so a custom prompt from Edge Config cannot drop it.
 */
export const EVIDENCE_RULE =
  "Status and activation rule (set by the server; it applies even if earlier " +
  "instructions say otherwise): a MIP's proposal status and its network " +
  "activation are separate facts. A Final specification does not by itself " +
  "mean the change is live on mainnet or testnet. Say a MIP is activated only " +
  "when the knowledge bundle gives separately sourced activation evidence, and " +
  "name the network and the date. When activation evidence is missing or " +
  "conflicting, say the bundle cannot confirm activation and link the " +
  "canonical specification. When you state a status or activation fact, link " +
  "the source the bundle gives for it and qualify it with that file's " +
  'verification date, for example "as verified on October 4, 2026".';

/** Today's date, kept apart from the dates the bundle's facts were checked. */
export function currentDateLine(now: Date): string {
  return (
    `Current date (UTC): ${now.toISOString().slice(0, 10)}. This is today's ` +
    "date, not a verification date; each MIP file states when its facts were " +
    'verified on its "Verified" line.'
  );
}

export function buildInstructions(config: ChatConfig, now: Date): string {
  const allowedTopicsLine =
    config.allowedTopics.length > 0
      ? `Allowed topics: ${config.allowedTopics.join("; ")}.`
      : "";

  return [
    config.systemPrompt,
    allowedTopicsLine,
    `Refusal text (use verbatim when declining): "${config.refusalText}"`,
    EVIDENCE_RULE,
    currentDateLine(now),
  ]
    .filter(Boolean)
    .join("\n\n");
}
