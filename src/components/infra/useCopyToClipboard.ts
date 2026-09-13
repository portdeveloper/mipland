import { useState, useCallback } from "react";

export async function writeClipboardText(text: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function useCopyToClipboard() {
  const [copied, setCopied] = useState<string | null>(null);
  const [copyFailed, setCopyFailed] = useState<string | null>(null);

  const copy = useCallback(async (text: string, label: string) => {
    setCopied(null);
    setCopyFailed(null);

    if (await writeClipboardText(text)) {
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } else {
      setCopyFailed(label);
    }
  }, []);

  return { copied, copyFailed, copy };
}
