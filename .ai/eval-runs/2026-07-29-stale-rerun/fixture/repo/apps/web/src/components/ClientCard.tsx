import { tokens } from "@acme/ui/tokens";

export function ClientCard({ name, status }: { name: string; status: string }) {
  return (
    <div style={{ border: `1px solid ${tokens.color.border}`, background: tokens.color.surface }}>
      <h3 style={{ color: tokens.color.text }}>{name}</h3>
      <p style={{ color: tokens.color.muted }}>{status}</p>
    </div>
  );
}
