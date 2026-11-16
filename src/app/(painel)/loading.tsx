export default function Loading() {
  return (
    <div className="grid gap-3" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 rounded bg-panel" />
      <div className="h-24 rounded border border-line bg-panel" />
      <div className="h-40 rounded border border-line bg-panel" />
      <p className="text-sm text-muted">Carregando ofertas…</p>
    </div>
  );
}
