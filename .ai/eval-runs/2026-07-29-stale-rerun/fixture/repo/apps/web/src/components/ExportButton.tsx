export function ExportButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ background: "#1D4ED8", color: "#fff", padding: 8 }}>
      Export
    </button>
  );
}
