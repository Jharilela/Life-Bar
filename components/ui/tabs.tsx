"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex flex-wrap gap-1.5 p-1 rounded-lg", className)}
      style={{ background: "var(--accent-soft)" }}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "px-3 py-1.5 rounded-md text-xs font-bold font-body cursor-pointer transition-colors",
        "text-[var(--accent-ink)] hover:bg-[var(--panel)]/60",
        "data-[state=active]:bg-[var(--panel)] data-[state=active]:shadow-[2px_2px_0_0_var(--line)]",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn("mt-4 focus:outline-none", className)} {...props} />;
}
