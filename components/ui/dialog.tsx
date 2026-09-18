"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export function DialogContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { title: string }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="lb-dialog-overlay fixed inset-0 bg-[#3e3226]/35 backdrop-blur-[1px] z-40" />
      <DialogPrimitive.Content
        className={cn(
          "lb-dialog-content fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2",
          "rounded-xl border-2 p-6 shadow-[6px_6px_0_0_var(--accent-soft)]",
          "max-h-[85vh] overflow-y-auto",
          className
        )}
        style={{ background: "var(--panel)", borderColor: "var(--line)" }}
        {...props}
      >
        <div className="flex items-center justify-between mb-4">
          <DialogPrimitive.Title className="lb-card-title">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="rounded-md p-1 text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--accent-soft)] cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </DialogPrimitive.Close>
        </div>
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
