// The win card as HTML, for the preview on the win screen and the public /w page. Same layout as the
// images in card-image.tsx: bank, main win, second win, the savings as the biggest number, then the footer.
import type { SharePayload } from "@/lib/share/payload";
import type { CardStatus } from "@/lib/share/sign";
import { footerLabel, savingsLine, winLine } from "@/lib/share/text";
import { cn } from "@/lib/utils";

export function WinCard({ payload, status, domain, className }: { payload: SharePayload; status: CardStatus; domain: string; className?: string }) {
  const [main, ...rest] = payload.wins;
  return (
    <figure
      className={cn("flex flex-col gap-6 rounded-[32px] p-7 text-white sm:p-10", className)}
      style={{ backgroundImage: "linear-gradient(150deg, #2448f0 10%, #2f6bff 55%, #6f9bff 100%)" }}
      aria-label={`${payload.bank}: ${payload.wins.map(winLine).join(". ")}. ${savingsLine(payload)} in the first year. ${footerLabel(status)}.`}
    >
      <p className="text-[15px] leading-5 font-semibold text-white/75">{payload.bank}</p>
      <div className="flex flex-col gap-2">
        <p className="text-[clamp(26px,4vw,40px)] leading-[1.1] font-semibold tracking-[-0.03em]">{winLine(main)}</p>
        {rest.map((win) => (
          <p key={win.kind} className="text-[clamp(18px,2.4vw,24px)] leading-[1.25] font-semibold tracking-[-0.02em] text-white/85">
            {winLine(win)}
          </p>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[clamp(52px,9vw,96px)] leading-none font-semibold tracking-[-0.045em] tabular-nums">{savingsLine(payload)}</p>
        <p className="text-[15px] leading-5 font-medium text-white/75">saved in the first year</p>
      </div>
      <figcaption className="flex items-center justify-between gap-4 border-t border-white/20 pt-4 text-[13px] leading-[18px] font-semibold">
        <span>{footerLabel(status)}</span>
        <span className="text-white/70">{domain}</span>
      </figcaption>
    </figure>
  );
}
