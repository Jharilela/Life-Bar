"use client";

import { useState, type ReactNode } from "react";

export function Disclosure({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lb-btn lb-btn-ghost text-xs"
      >
        + {label}
      </button>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="lb-label mb-0">{label}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="lb-btn lb-btn-ghost text-xs"
        >
          Cancel
        </button>
      </div>
      {children}
    </div>
  );
}
