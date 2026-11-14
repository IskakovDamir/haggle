// "Pay only when you save": Figma node 6:110 on "Haggle — Landing · Desktop 1440".
import Image from "next/image";
import { cn } from "@/lib/utils";
import { BlobPanel } from "./pricing-panel";
import { HgButton, HgHeading, HgSection } from "./ui";

const typicalYear = [
  { win: "Lower APR", saved: "$500", fee: "$100" },
  { win: "Annual fee waived", saved: "$95", fee: "$19" },
  { win: "Internet after promo", saved: "$240", fee: "$48" },
  { win: "Insurance renewal", saved: "$300", fee: "$60" },
];

function Check({ label, inverse = false }: { label: string; inverse?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={cn("relative size-5 shrink-0 rounded-[10px]", inverse ? "bg-white" : "bg-hg-blue")}>
        <Image
          src={inverse ? "/landing/pricing/check-inverse.svg" : "/landing/pricing/check.svg"}
          alt=""
          width={9.5}
          height={7}
          className="absolute top-[6.25px] left-[5.25px] block max-w-none"
        />
      </span>
      <span className={cn("text-[14px] leading-5 font-medium tracking-[-0.005em]", inverse ? "text-white" : "text-hg-ink-2")}>
        {label}
      </span>
    </li>
  );
}

function PlanHead({ title, note, inverse = false }: { title: string; note: string; inverse?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className={cn("text-[24px] leading-[30px] font-semibold tracking-[-0.02em]", inverse ? "text-white" : "text-hg-ink")}>{title}</h3>
      <p className={cn("text-[14px] leading-5 font-medium tracking-[-0.005em]", inverse ? "text-white/75" : "text-hg-muted")}>{note}</p>
    </div>
  );
}

function Price({ amount, unit, inverse = false }: { amount: string; unit: [string, string]; inverse?: boolean }) {
  return (
    <div className="flex items-end gap-3">
      <p className={cn("text-[64px] leading-[68px] font-semibold tracking-[-0.04em] whitespace-nowrap", inverse ? "text-white" : "text-hg-ink")}>
        {amount}
      </p>
      <p className={cn("pb-2.5 text-[14px] leading-5 font-medium tracking-[-0.005em] whitespace-nowrap", inverse ? "text-white/75" : "text-hg-muted")}>
        {unit[0]}
        <br />
        {unit[1]}
      </p>
    </div>
  );
}

function Bar({ label, value, fill }: { label: string; value: string; fill: string }) {
  return (
    <>
      <div className="flex items-start justify-between text-[17px] font-semibold whitespace-nowrap text-white">
        <span className="leading-5 tracking-[-0.005em]">{label}</span>
        <span className="leading-6 tracking-[-0.01em]">{value}</span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-lg bg-white/16">
        <div className={cn("h-4 rounded-lg", fill)} />
      </div>
    </>
  );
}

export function Pricing() {
  return (
    <HgSection id="pricing" className="flex flex-col items-center gap-10 px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-10 xl:px-[104px]">
      <div className="flex flex-col items-center gap-4">
        <HgHeading title="Pay only when you save" />
        <p className="max-w-[620px] text-center text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">
          No win, no charge, your card is billed only after the bank says yes
        </p>
      </div>

      <BlobPanel dir="pricing" angle={155.85} bottoms={{ center: -190, left: -120 }} className="p-3 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <article className="flex flex-col gap-6 overflow-hidden rounded-[34px] border border-white bg-white/92 p-6 sm:p-8">
            <PlanHead title="Pay per win" note="The default for everyone" />
            <Price amount="20%" unit={["of first-year", "savings"]} />
            <hr className="h-px w-full border-0 bg-hg-line" />
            <ul className="flex flex-col gap-3">
              <Check label="Charged per win, after the bank says yes" />
              <Check label="No win, no payment" />
              <Check label="Every lever included, from APR to fees" />
            </ul>
            <HgButton href="/start" tone="dark" arrow className="mt-auto w-full">
              Start with a call
            </HgButton>
          </article>

          <article
            className="flex flex-col gap-6 overflow-hidden rounded-[34px] p-6 sm:p-8"
            style={{ backgroundImage: "linear-gradient(127.26deg, #3a76ff 14.286%, #1a3fd6 85.714%)" }}
          >
            <PlanHead title="Unlimited" note="Best if you win more than 2 or 3 times a year" inverse />
            <Price amount="$14.99" unit={["per", "month"]} inverse />
            <hr className="h-px w-full border-0 bg-white/20" />
            <ul className="flex flex-col gap-3">
              <Check label="No fee per win" inverse />
              <Check label="Cards, internet, phone and insurance" inverse />
              <Check label="Price-hike alerts and repeat calls" inverse />
            </ul>
            <HgButton href="/start" tone="white" arrow className="mt-auto w-full">
              Go unlimited
            </HgButton>
          </article>

          <article
            className="relative isolate flex flex-col gap-5 overflow-hidden rounded-[34px] border border-white/12 p-6 sm:p-8 md:col-span-2 xl:col-span-1"
            style={{ backgroundImage: "linear-gradient(127.41deg, #1a2336 14.286%, #0b1220 85.714%)" }}
          >
            <Image
              src="/landing/pricing/typical-glow.svg"
              alt=""
              width={520}
              height={400}
              className="pointer-events-none absolute bottom-[-189px] left-[-41px] -z-10 block max-w-none"
            />
            <div className="flex flex-col gap-1">
              <h3 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-white">A typical year</h3>
              <p className="text-[14px] leading-5 font-medium tracking-[-0.005em] text-white/70">Four wins, billed per win at 20%</p>
            </div>

            <div className="overflow-hidden rounded-[18px] bg-white/6">
              <table className="w-full">
                <thead>
                  <tr className="text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-white/70">
                    <th className="py-[11px] pl-4 text-left font-semibold">Win</th>
                    <th className="w-[64px] py-[11px] pl-2 text-right font-semibold">Saved</th>
                    <th className="w-[68px] py-[11px] pr-4 pl-2 text-right font-semibold">Fee</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] leading-5 font-medium tracking-[-0.005em]">
                  {typicalYear.map((row) => (
                    <tr key={row.win} className="border-t border-white/10">
                      <td className="py-[11px] pl-4 text-white/70">{row.win}</td>
                      <td className="py-[11px] pl-2 text-right text-white">{row.saved}</td>
                      <td className="py-[11px] pr-4 pl-2 text-right text-[#a9c6ff]">{row.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2.5">
              <Bar label="Saved" value="$1,135" fill="w-[99.5%] bg-white" />
              <Bar label="Paid to Haggle" value="$227" fill="w-[20%] bg-white/45" />
            </div>
          </article>
        </div>
      </BlobPanel>
    </HgSection>
  );
}
