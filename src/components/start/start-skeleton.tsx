/** The shimmer of .hg-shimmer, a shade darker so it shows on the paper background. */
const BLOCK =
  "bg-[linear-gradient(90deg,#e7ecf5_25%,#f5f7fb_50%,#e7ecf5_75%)] bg-size-[200%_100%] animate-[hg-shimmer_1.6s_linear_infinite]";

/** Shimmering blocks in the shape of the start screen, shown until the page knows which ways in are open. */
export function StartSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <div className={`${BLOCK} h-11 w-3/4 max-w-md rounded-2xl`} />
      <div className={`${BLOCK} h-6 w-full max-w-xl rounded-lg`} />
      <div className={`${BLOCK} mt-8 h-12 w-full max-w-sm rounded-full`} />
      <div className={`${BLOCK} h-60 max-w-2xl rounded-[28px]`} />
    </div>
  );
}
