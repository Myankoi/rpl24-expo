"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, ClipboardDocumentIcon } from "@heroicons/react/24/outline";

export function CopyCodeButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button className={`copy-code-button ${copied ? "is-copied" : ""}`} type="button" onClick={copyCode} aria-label={copied ? "Kode tim tersalin" : "Salin kode tim"}>
      {copied ? <CheckIcon /> : <ClipboardDocumentIcon />}
      <span aria-live="polite">{copied ? "Tersalin" : "Salin"}</span>
    </button>
  );
}
