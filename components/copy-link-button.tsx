"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable; the link is still selectable as text.
    }
  }

  return (
    <button type="button" onClick={copy} className="lb-btn text-xs">
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
