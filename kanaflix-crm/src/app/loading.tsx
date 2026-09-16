export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[40vh] max-w-7xl items-center justify-center px-6 py-16" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden="true" />
        Carregando...
      </div>
    </div>
  );
}
