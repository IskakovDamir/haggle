// "Pay only when you save": Figma node 6:110 on "Haggle — Landing · Desktop 1440".
import Image from "next/image";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { BlobPanel } from "./pricing-panel";
import { HgButton, HgHeading, HgSection } from "./ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

type Plan = { title: string; note: string; unit: [string, string]; checks: [string, string, string]; cta: string };

type PricingCopy = {
  title: string;
  lead: string;
  perWin: Plan;
  unlimited: Plan;
  typical: {
    title: string;
    note: string;
    head: { win: string; saved: string; fee: string };
    /** One label per row, in the same order as `typicalYear`. */
    rows: [string, string, string, string];
    saved: string;
    paid: string;
  };
};

const COPY: Copy<PricingCopy> = {
  en: {
    title: "Pay only when you save",
    lead: "No win, no charge, your card is billed only after the bank says yes",
    perWin: {
      title: "Pay per win",
      note: "The default for everyone",
      unit: ["of first-year", "savings"],
      checks: ["Charged per win, after the bank says yes", "No win, no payment", "Every lever included, from APR to fees"],
      cta: "Start with a call",
    },
    unlimited: {
      title: "Unlimited",
      note: "Best if you win more than 2 or 3 times a year",
      unit: ["per", "month"],
      checks: ["No fee per win", "Cards, internet, phone and insurance", "Price-hike alerts and repeat calls"],
      cta: "Go unlimited",
    },
    typical: {
      title: "A typical year",
      note: "Four wins, billed per win at 20%",
      head: { win: "Win", saved: "Saved", fee: "Fee" },
      rows: ["Lower APR", "Annual fee waived", "Internet after promo", "Insurance renewal"],
      saved: "Saved",
      paid: "Paid to Haggle",
    },
  },
  es: {
    title: "Paga solo cuando ahorras",
    lead: "Si no ganamos, no cobramos. Tu tarjeta se cobra solo después de que el banco dice que sí",
    perWin: {
      title: "Pago por resultado",
      note: "La opción estándar para todos",
      unit: ["del ahorro del", "primer año"],
      checks: ["Se cobra por resultado, cuando el banco dice que sí", "Sin resultado, no pagas", "Todo incluido, de la APR a los cargos"],
      cta: "Empieza con una llamada",
    },
    unlimited: {
      title: "Ilimitado",
      note: "Ideal si ganas más de 2 o 3 veces al año",
      unit: ["al", "mes"],
      checks: ["Sin cargo por resultado", "Tarjetas, internet, teléfono y seguros", "Alertas de aumentos y nuevas llamadas"],
      cta: "Elegir Ilimitado",
    },
    typical: {
      title: "Un año típico",
      note: "Cuatro resultados, cobrados al 20% cada uno",
      head: { win: "Resultado", saved: "Ahorro", fee: "Cargo" },
      rows: ["APR más baja", "Cuota anual eliminada", "Internet tras la promo", "Renovación del seguro"],
      saved: "Ahorrado",
      paid: "Pagado a Haggle",
    },
  },
};

const typicalYear = [
  { saved: "$500", fee: "$100" },
  { saved: "$95", fee: "$19" },
  { saved: "$240", fee: "$48" },
  { saved: "$300", fee: "$60" },
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

export function Pricing({ locale = "en" }: { locale?: Locale }) {
  const { title, lead, perWin, unlimited, typical } = COPY[locale];
  return (
    <HgSection id="pricing" className="flex flex-col items-center gap-10 px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-10 xl:px-[104px]">
      <Reveal amount={0.5} className="flex flex-col items-center gap-4">
        <HgHeading title={title} />
        <p className="max-w-[620px] text-center text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">{lead}</p>
      </Reveal>

      <BlobPanel dir="pricing" angle={155.85} bottoms={{ center: -190, left: -120 }} className="p-3 sm:p-7">
        <Stagger gap={0.12} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <StaggerItem as="article" className="flex flex-col gap-6 overflow-hidden rounded-[34px] border border-white bg-white/92 p-6 sm:p-8">
            <PlanHead title={perWin.title} note={perWin.note} />
            <Price amount="20%" unit={perWin.unit} />
            <hr className="h-px w-full border-0 bg-hg-line" />
            <ul className="flex flex-col gap-3">
              {perWin.checks.map((label) => (
                <Check key={label} label={label} />
              ))}
            </ul>
            <HgButton href="/start" tone="dark" arrow className="mt-auto w-full">
              {perWin.cta}
            </HgButton>
          </StaggerItem>

          <StaggerItem as="article"
            className="flex flex-col gap-6 overflow-hidden rounded-[34px] p-6 sm:p-8"
            style={{ backgroundImage: "linear-gradient(127.26deg, #3a76ff 14.286%, #1a3fd6 85.714%)" }}
          >
            <PlanHead title={unlimited.title} note={unlimited.note} inverse />
            <Price amount="$14.99" unit={unlimited.unit} inverse />
            <hr className="h-px w-full border-0 bg-white/20" />
            <ul className="flex flex-col gap-3">
              {unlimited.checks.map((label) => (
                <Check key={label} label={label} inverse />
              ))}
            </ul>
            <HgButton href="/start" tone="white" arrow className="mt-auto w-full">
              {unlimited.cta}
            </HgButton>
          </StaggerItem>

          <StaggerItem as="article"
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
              <h3 className="text-[24px] leading-[30px] font-semibold tracking-[-0.02em] text-white">{typical.title}</h3>
              <p className="text-[14px] leading-5 font-medium tracking-[-0.005em] text-white/70">{typical.note}</p>
            </div>

            <div className="overflow-hidden rounded-[18px] bg-white/6">
              <table className="w-full">
                <thead>
                  <tr className="text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-white/70">
                    <th className="py-[11px] pl-4 text-left font-semibold">{typical.head.win}</th>
                    <th className="w-[64px] py-[11px] pl-2 text-right font-semibold">{typical.head.saved}</th>
                    <th className="w-[68px] py-[11px] pr-4 pl-2 text-right font-semibold">{typical.head.fee}</th>
                  </tr>
                </thead>
                <tbody className="text-[14px] leading-5 font-medium tracking-[-0.005em]">
                  {typicalYear.map((row, i) => (
                    <tr key={row.saved} className="border-t border-white/10">
                      <td className="py-[11px] pl-4 text-white/70">{typical.rows[i]}</td>
                      <td className="py-[11px] pl-2 text-right text-white">{row.saved}</td>
                      <td className="py-[11px] pr-4 pl-2 text-right text-[#a9c6ff]">{row.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-2.5">
              <Bar label={typical.saved} value="$1,135" fill="w-[99.5%] bg-white" />
              <Bar label={typical.paid} value="$227" fill="w-[20%] bg-white/45" />
            </div>
          </StaggerItem>
        </Stagger>
      </BlobPanel>
    </HgSection>
  );
}
