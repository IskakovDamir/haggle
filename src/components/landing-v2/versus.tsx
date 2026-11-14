// "A chatbot can't call Chase": Figma node 7:123 on "Haggle — Landing · Desktop 1440".
import Image from "next/image";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { BlobPanel } from "./pricing-panel";
import { HgHeading, HgMark, HgSection } from "./ui";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";

type Row = { need: string; chatbot: string; haggle: string };

type VersusCopy = {
  title: string;
  lead: string;
  tableLabel: string;
  need: string;
  chatbot: string;
  /** The first column stays on one line on wide screens, so keep `need` short. */
  rows: Row[];
};

const COPY: Copy<VersusCopy> = {
  en: {
    title: "A chatbot can’t call Chase",
    lead: "It can tell you what to say, but it won’t sit on hold, push past a no or notice when your rate creeps up",
    tableLabel: "Haggle compared with a chatbot",
    need: "What it takes",
    chatbot: "A chatbot",
    rows: [
      { need: "Knows what you can ask for", chatbot: "Only if you ask it the right way", haggle: "Finds every lever in your statement" },
      { need: "Calls and waits 40 minutes on hold", chatbot: "No", haggle: "Yes, while you get on with your day" },
      { need: "Pushes past a no to retention", chatbot: "No", haggle: "Bank-specific playbooks" },
      { need: "Notices when a rate goes up", chatbot: "Waits for you to come back", haggle: "Watches and calls again on its own" },
      { need: "Runs a plan over two years", chatbot: "No memory of your case", haggle: "Step-by-step plan with a payoff timer" },
    ],
  },
  es: {
    title: "Un chatbot no puede llamar a Chase",
    lead: "Te dice qué decir, pero no espera en línea, no insiste después de un no y no se da cuenta cuando te suben la tasa",
    tableLabel: "Haggle comparado con un chatbot",
    need: "Lo que hace falta",
    chatbot: "Un chatbot",
    rows: [
      { need: "Sabe qué puedes pedir", chatbot: "Solo si le preguntas de la forma correcta", haggle: "Encuentra cada opción en tu estado de cuenta" },
      { need: "Llama y espera 40 minutos en línea", chatbot: "No", haggle: "Sí, mientras tú sigues con tu día" },
      { need: "Tras un no, pide retención", chatbot: "No", haggle: "Guiones hechos para cada banco" },
      { need: "Nota cuando sube una tasa", chatbot: "Espera a que vuelvas", haggle: "Vigila y vuelve a llamar por su cuenta" },
      { need: "Sigue un plan de dos años", chatbot: "No recuerda tu caso", haggle: "Plan paso a paso con fecha para liquidar" },
    ],
  },
};

const caption = "text-left text-[13px] leading-[18px] font-semibold tracking-[-0.002em] text-hg-muted";
const answer = "flex items-center gap-2.5 text-[14px] leading-5 font-medium tracking-[-0.005em]";

export function Versus({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale];
  return (
    <HgSection className="flex flex-col items-center gap-10 px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-10 xl:px-[104px]">
      <Reveal amount={0.5} className="flex flex-col items-center gap-4">
        <HgHeading title={t.title} />
        <p className="max-w-[640px] text-center text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">{t.lead}</p>
      </Reveal>

      <BlobPanel dir="versus" angle={158.98} bottoms={{ center: -200, left: -130 }} className="p-3 sm:p-7">
        {/* On narrow screens the table scrolls inside its own box, never the page. */}
        <div
          role="region"
          aria-label={t.tableLabel}
          tabIndex={0}
          className="overflow-x-auto rounded-[28px] border border-white bg-white/94"
        >
          <table className="w-full min-w-[720px]">
            <colgroup>
              <col />
              <col className="xl:w-[330px]" />
              <col className="xl:w-[370px]" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className={`h-[58px] px-7 py-4 ${caption}`}>
                  {t.need}
                </th>
                <th scope="col" className={`h-[58px] px-6 py-4 ${caption}`}>
                  {t.chatbot}
                </th>
                <th scope="col" className="h-[58px] bg-hg-blue px-6 py-3 text-left">
                  <span className="inline-flex items-center gap-2.5">
                    <HgMark />
                    <span className="text-[24px] leading-none font-bold tracking-[-0.05em] text-white">haggle</span>
                  </span>
                </th>
              </tr>
            </thead>
            <Stagger as="tbody" gap={0.07}>
              {t.rows.map((row) => (
                <StaggerItem as="tr" key={row.need} className="border-t border-hg-line">
                  <th
                    scope="row"
                    className="h-[68px] px-7 py-[22px] text-left text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink xl:whitespace-nowrap"
                  >
                    {row.need}
                  </th>
                  <td className="h-[68px] px-6 py-[22px]">
                    <span className={`${answer} text-hg-muted`}>
                      <span className="relative size-5 shrink-0 rounded-[10px] bg-hg-line">
                        <Image src="/landing/versus/icon-x.svg" alt="" width={7.5} height={7.5} className="absolute top-[6.25px] left-[6.25px] block max-w-none" />
                      </span>
                      {row.chatbot}
                    </span>
                  </td>
                  <td className="h-[68px] bg-hg-blue-soft px-6 py-[22px]">
                    <span className={`${answer} text-hg-ink`}>
                      <span className="relative size-5 shrink-0 rounded-[10px] bg-hg-blue">
                        <Image src="/landing/versus/check.svg" alt="" width={9.5} height={7} className="absolute top-[6.25px] left-[5.25px] block max-w-none" />
                      </span>
                      {row.haggle}
                    </span>
                  </td>
                </StaggerItem>
              ))}
            </Stagger>
          </table>
        </div>
      </BlobPanel>
    </HgSection>
  );
}
