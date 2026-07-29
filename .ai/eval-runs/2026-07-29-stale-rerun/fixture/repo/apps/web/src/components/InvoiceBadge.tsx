import type { ReactNode } from "react";

export function InvoiceBadge({ overdue, children }: { overdue: boolean; children: ReactNode }) {
  return (
    <span
      style={{
        backgroundColor: overdue ? "#DC2626" : "#2563EB",
        color: "#FFFFFF",
        borderRadius: 4,
      }}
    >
      {children}
    </span>
  );
}
