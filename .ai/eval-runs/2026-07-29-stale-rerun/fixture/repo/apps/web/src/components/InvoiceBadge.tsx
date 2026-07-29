import type { ReactNode } from "react";
import { tokens } from "@acme/ui/tokens";

export function InvoiceBadge({ overdue, children }: { overdue: boolean; children: ReactNode }) {
  return (
    <span
      style={{
        backgroundColor: overdue ? tokens.color.danger : tokens.color.brand,
        color: tokens.color.surface,
        borderRadius: 4,
      }}
    >
      {children}
    </span>
  );
}
