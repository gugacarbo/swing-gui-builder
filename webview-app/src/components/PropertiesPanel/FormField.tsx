import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string | null;
  className?: string;
}

export function FormField({ label, children, error, className }: FormFieldProps) {
  return (
    <label className={cn("flex flex-col gap-1 text-xs", className)} htmlFor="">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </label>
  );
}
