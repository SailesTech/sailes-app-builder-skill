import { tokens } from "@acme/ui/tokens";

export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ background: tokens.color.brandHover, color: tokens.color.surface, padding: 8 }}
    >
      Export
    </button>
  );
}
