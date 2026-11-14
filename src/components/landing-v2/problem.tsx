// "A credit card is a trap with no end date": Maria's card and the minimum-payment math (Figma node 4:71).
import Image from "next/image";
import { HgSection } from "./ui";

const A = "/landing/problem";

/** Blurred glow, placed by its SVG box (the Figma blob frame plus its blur bleed). */
function Glow({ src, width, height, style }: { src: string; width: number; height: number; style: React.CSSProperties }) {
  return <Image src={src} alt="" width={width} height={height} aria-hidden className="pointer-events-none absolute max-w-none" style={style} />;
}

const accounts = [
  ["Chase Freedom", "$8,400 · 27.24%"],
  ["Capital One", "$3,100 · 29.99% · $95 fee"],
  ["Credit score", "668"],
  ["Pays each month", "The minimum"],
];

type Segment = { amount: string; label: string; size: number; strong: boolean };

/** A labeled bar split into pills. `size` is each pill's Figma width, used as its share of the row. */
function StackedBar({ title, note, segments }: { title: string; note: string; segments: Segment[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-4">
        <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">{title}</p>
        <p className="text-[14px] leading-5 font-medium tracking-[-0.005em] text-hg-muted">{note}</p>
      </div>
      <div className="flex gap-1">
        {segments.map((s) => (
          <div key={s.label} className="flex min-w-0 flex-col justify-end gap-2.5" style={{ flex: `${s.size} 1 0` }}>
            <p className="flex flex-wrap items-baseline gap-x-1.5 leading-[normal]">
              <span className="text-[17px] font-semibold text-hg-ink">{s.amount}</span>
              <span className="text-[14px] font-medium text-hg-muted">{s.label}</span>
            </p>
            <div className={s.strong ? "h-4 rounded-lg bg-hg-blue" : "h-4 rounded-lg bg-hg-blue-tint"} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Problem() {
  return (
    <HgSection id="problem" className="px-4 pt-10 pb-8 font-manrope md:px-10 md:pt-14 md:pb-10">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-10">
        <div className="flex flex-col gap-4">
          <h2 className="max-w-[900px] text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-hg-ink">
            A credit card is a trap with no end date
          </h2>
          <p className="max-w-[640px] text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">
            Americans owe a record $1.29T on cards, and paying the minimum keeps most of it working for the bank
          </p>
        </div>

        <div
          className="relative overflow-hidden rounded-[40px] p-4 sm:p-7"
          style={{ backgroundImage: "linear-gradient(156.89deg, #c4ddf6 14.286%, #e4effb 50%, #cfe0ff 85.714%)" }}
        >
          <Glow src={`${A}/blob-top-left.svg`} width={800} height={520} style={{ left: -250, top: -230 }} />
          <Glow src={`${A}/blob-top-right.svg`} width={800} height={500} style={{ left: "49.167%", top: -210 }} />
          <Glow src={`${A}/blob-bottom-center.svg`} width={840} height={500} style={{ left: "16.667%", bottom: -206 }} />
          <Glow src={`${A}/blob-bottom-left.svg`} width={700} height={480} style={{ left: -290, bottom: -136 }} />

          <div className="relative flex flex-col gap-5 lg:flex-row">
            {/* Maria */}
            <div
              className="relative flex flex-col justify-between gap-8 overflow-hidden rounded-[34px] border border-white/[0.12] p-6 sm:p-8 lg:w-[400px] lg:shrink-0"
              style={{ backgroundImage: "linear-gradient(131.26deg, #1a2336 14.286%, #0b1220 85.714%)" }}
            >
              <Glow src={`${A}/maria-glow.svg`} width={540} height={420} style={{ left: 39, bottom: -205 }} />
              <div className="relative flex flex-col gap-6">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-hg-blue text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-white">
                    M
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[17px] leading-6 font-semibold tracking-[-0.01em] text-white">Maria, 34</p>
                    <p className="text-[14px] leading-5 font-medium tracking-[-0.005em] text-white/60">Teacher in Columbus, Ohio · two kids</p>
                  </div>
                </div>
                <p className="text-[18px] leading-7 font-medium tracking-[-0.01em] text-white">
                  “I’m scared to call, I don’t know what to say, and forty minutes on hold with two kids around just isn’t happening”
                </p>
              </div>
              <dl className="relative overflow-hidden rounded-[18px] bg-white/[0.07] text-[14px] leading-5 font-medium tracking-[-0.005em]">
                {accounts.map(([label, value]) => (
                  <div key={label} className="flex flex-wrap items-center justify-between gap-x-3 border-white/10 px-[18px] py-3.5 not-first:border-t">
                    <dt className="text-white/60">{label}</dt>
                    <dd className="text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The minimum-payment trap */}
            <div className="flex min-w-0 flex-1 flex-col gap-8 rounded-[34px] border border-white bg-white/[0.92] p-6 sm:p-8">
              <div className="flex flex-col gap-1.5">
                <h3 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-hg-ink">$8,000 at 24%, paying only the minimum</h3>
                <p className="text-[14px] leading-5 font-medium tracking-[-0.005em] text-hg-muted">
                  The minimum is 1% of the balance plus interest, never less than $25
                </p>
              </div>
              <StackedBar
                title="23 years of minimum payments"
                note="$22,900 paid in total"
                segments={[
                  { amount: "$8,000", label: "debt", size: 228, strong: false },
                  { amount: "$14,900", label: "interest", size: 426, strong: true },
                ]}
              />
              <StackedBar
                title="Your first $240 payment"
                note="Most of it never touches the debt"
                segments={[
                  { amount: "$160", label: "to interest", size: 436, strong: true },
                  { amount: "$80", label: "to the debt", size: 218, strong: false },
                ]}
              />
              <div className="flex items-center gap-3.5 rounded-[18px] bg-hg-blue-soft p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[18px] bg-hg-blue-soft">
                  <Image src={`${A}/statement-icon.svg`} alt="" width={13.5} height={16.5} aria-hidden />
                </span>
                <p className="flex-1 text-[14px] leading-5 font-medium tracking-[-0.005em] text-hg-ink-2">
                  By law this math is printed on every statement, Haggle reads it straight from yours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HgSection>
  );
}
