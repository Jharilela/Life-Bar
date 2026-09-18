"use client";

import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function FormDialog({
  title,
  triggerLabel,
  triggerClassName = "lb-btn lb-btn-ghost text-xs",
  children,
}: {
  title: string;
  triggerLabel: string;
  triggerClassName?: string;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className={triggerClassName}>
          + {triggerLabel}
        </button>
      </DialogTrigger>
      <DialogContent title={title}>{children(() => setOpen(false))}</DialogContent>
    </Dialog>
  );
}
