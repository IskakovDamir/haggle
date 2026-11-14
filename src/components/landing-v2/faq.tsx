// "Questions you might have": Figma node 7:220 on "Haggle — Landing · Desktop 1440".
import Image from "next/image";
import type { Copy, Locale } from "@/lib/i18n/locale";
import { FaqAccordion, type FaqEntry } from "./faq-accordion";
import { BlobPanel } from "./pricing-panel";
import { HgButton, HgSection } from "./ui";
import { Reveal } from "@/components/motion/reveal";

const COPY: Copy<{ title: string; lead: string; cta: string; questions: FaqEntry[] }> = {
  en: {
    title: "Questions you might have",
    lead: "Straight answers about banks, calls, your data and money",
    cta: "Ask us anything",
    questions: [
      {
        question: "Will a bank actually talk to an AI?",
        answer:
          "On a real call, Haggle would get through the phone menu and wait on hold, then bring you in on a three-way call to verify, after that the agent would talk with your recorded consent. In this build every call is a practice call where you play the bank.",
      },
      {
        question: "Is it legal for an AI to call and record?",
        answer:
          "Haggle is upfront about both. The agent always opens by saying it is an AI assistant calling on your behalf and that the call is recorded. In this build no real bank is called: you play the bank on a practice call.",
      },
      {
        question: "Do you need my bank login?",
        answer:
          "No. Haggle works from your credit card statement. It never asks for a bank login or a full card number, and it keeps only the last four digits of your card.",
      },
      {
        question: "What if the bank says no?",
        answer:
          "Then you pay nothing. The agent asks once for the retention team before it takes no for an answer, and Haggle shows you what to try next and when.",
      },
      {
        question: "How do you count what I saved?",
        answer:
          "We add up what the new terms save you in the first year: the interest you no longer pay on your balance at the lower APR, plus any fee the bank waives or refunds. Haggle’s fee is 20% of that, charged only after a confirmed win.",
      },
    ],
  },
  es: {
    title: "Preguntas que quizás tengas",
    lead: "Respuestas claras sobre bancos, llamadas, tus datos y tu dinero",
    cta: "Pregúntanos lo que sea",
    questions: [
      {
        question: "¿De verdad un banco habla con una IA?",
        answer:
          "En una llamada real, Haggle pasaría el menú telefónico y esperaría en línea. Luego te sumaría a una llamada de tres para verificar que eres tú, y después el agente hablaría con tu consentimiento grabado. En esta versión, todas las llamadas son de práctica y tú haces de banco.",
      },
      {
        question: "¿Es legal que una IA llame y grabe la llamada?",
        answer:
          "Haggle es claro con las dos cosas. El agente siempre empieza diciendo que es un asistente de IA que llama en tu nombre y que la llamada se graba. En esta versión no se llama a ningún banco real: tú haces de banco en una llamada de práctica.",
      },
      {
        question: "¿Necesitan mi usuario y contraseña del banco?",
        answer:
          "No. Haggle trabaja con el estado de cuenta de tu tarjeta de crédito. Nunca te pide el acceso a tu banco ni el número completo de tu tarjeta, y solo guarda los últimos cuatro dígitos.",
      },
      {
        question: "¿Y si el banco dice que no?",
        answer:
          "Entonces no pagas nada. Antes de aceptar un no, el agente pide una vez hablar con el equipo de retención, y Haggle te muestra qué intentar después y cuándo.",
      },
      {
        question: "¿Cómo calculan lo que ahorré?",
        answer:
          "Sumamos lo que te ahorran las nuevas condiciones en el primer año: los intereses que ya no pagas sobre tu saldo con la APR más baja, más cualquier cargo que el banco elimine o te devuelva. La tarifa de Haggle es el 20% de eso, y solo se cobra después de un logro confirmado.",
      },
    ],
  },
};

export function Faq({ locale = "en" }: { locale?: Locale }) {
  const t = COPY[locale];
  return (
    <HgSection id="faq" className="px-4 pt-14 pb-10 font-manrope sm:px-8 lg:px-10 xl:px-[104px]">
      <BlobPanel dir="faq" angle={155.14} bottoms={{ center: -176, left: -106 }} className="px-5 py-8 sm:px-8 lg:min-h-[556px] lg:py-10 lg:pr-7 lg:pl-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
          <Reveal amount={0.4} className="flex shrink-0 flex-col items-start gap-5 lg:w-[320px] xl:w-[400px]">
            <h2 className="text-[clamp(32px,4.5vw,48px)] leading-[1.125] font-semibold tracking-[-0.035em] text-hg-ink">{t.title}</h2>
            <p className="text-[18px] leading-7 font-medium tracking-[-0.01em] text-hg-muted">{t.lead}</p>
            <HgButton href="/start" size="s" arrow>
              {t.cta}
            </HgButton>
          </Reveal>
          <FaqAccordion items={t.questions} />
        </div>

        {/* 3D padlock, under the intro on wide screens. Decorative, so it steps aside when the layout stacks. */}
        <div aria-hidden className="pointer-events-none absolute bottom-[-15.2px] left-[124.85px] hidden size-[301.2px] items-center justify-center lg:flex">
          <Image src="/landing/faq/padlock-3d.png" alt="" width={260} height={260} sizes="260px" className="hg-float block size-[260px] max-w-none rotate-10" />
        </div>
      </BlobPanel>
    </HgSection>
  );
}
