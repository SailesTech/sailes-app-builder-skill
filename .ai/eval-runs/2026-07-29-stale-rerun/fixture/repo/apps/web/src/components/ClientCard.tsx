import { tokens } from "@acme/ui/tokens";

export function ClientCard({ name, status }: { name: string; status: string }) {
  return (
    <div style={{ border: "1px solid #E2E8F0", background: tokens.color.surface }}>
      <h3 style={{ color: "#0F172A" }}>{name}</h3>
      <p style={{ color: "#64748B" }}>{status}</p>
    </div>
  );
}
