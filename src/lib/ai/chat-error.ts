export interface FormattedChatError {
  message: string;
  isRateLimit: boolean;
}

/**
 * Normalizes and formats errors from the chat API into human-friendly messages.
 * Detects 429 rate limits, 403 access restrictions, network drops, and custom server errors.
 */
export function formatChatError(error: unknown): FormattedChatError {
  if (!error) {
    return {
      message: "An unknown error occurred. Please try again.",
      isRateLimit: false,
    };
  }

  const rawMessage =
    error instanceof Error ? error.message : String(error ?? "");
  const trimmed = rawMessage.trim();

  // 1. Check for structured JSON response from /api/chat
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed.error === "string" && parsed.error.trim()) {
      const apiError = parsed.error.trim();
      const isRateLimit =
        apiError.toLowerCase().includes("too many requests") ||
        apiError.toLowerCase().includes("rate limit");
      return {
        message: apiError,
        isRateLimit,
      };
    }
  } catch {
    // Non-JSON response, continue to pattern checks
  }

  const lower = trimmed.toLowerCase();

  // 2. 429 Rate limiting
  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit")
  ) {
    return {
      message: "Too many requests. Please wait a moment and try again.",
      isRateLimit: true,
    };
  }

  // 3. 403 Access restrictions / bot protection
  if (lower.includes("403") || lower.includes("access denied")) {
    return {
      message: "Access denied. Please refresh the page and try again.",
      isRateLimit: false,
    };
  }

  // 4. Network and connection failures
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("network error") ||
    lower.includes("aborterror") ||
    lower.includes("connection")
  ) {
    return {
      message: "Connection failed. Please check your network and try again.",
      isRateLimit: false,
    };
  }

  // 5. Clean single-line message fallback
  if (trimmed && trimmed.length < 150 && !trimmed.startsWith("<")) {
    return {
      message: trimmed,
      isRateLimit: false,
    };
  }

  return {
    message: "Unable to get an answer right now. Please try again.",
    isRateLimit: false,
  };
}
