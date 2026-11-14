/** Grey blocks in the shape of the start screen, shown until the page knows which ways in are open. */
export function StartSkeleton() {
  return (
    <div className="animate-pulse space-y-5" role="status" aria-label="Loading">
      <div className="h-10 w-3/4 max-w-md rounded-xl bg-ink/10" />
      <div className="h-6 w-full max-w-xl rounded-lg bg-ink/7" />
      <div className="h-11 w-full max-w-sm rounded-full bg-ink/7" />
      <div className="h-56 max-w-2xl rounded-2xl bg-ink/7" />
    </div>
  );
}
