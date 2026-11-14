// The whole landing page in one language. "/" renders it in English and "/es" in Spanish.
import type { Locale } from "@/lib/i18n/locale";
import { Bank } from "./bank";
import { Closing } from "./closing";
import { Demo } from "./demo";
import { Faq } from "./faq";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Insight } from "./insight";
import { Pricing } from "./pricing";
import { Problem } from "./problem";
import { Stats } from "./stats";
import { Versus } from "./versus";
import { Wins } from "./wins";

export function Landing({ locale = "en" }: { locale?: Locale }) {
  return (
    <main className="flex-1 bg-white font-manrope">
      <Hero locale={locale} />
      <Stats locale={locale} />
      <Insight locale={locale} />
      <Problem locale={locale} />
      <Bank locale={locale} />
      <Wins locale={locale} />
      <HowItWorks locale={locale} />
      <Demo locale={locale} />
      <Pricing locale={locale} />
      <Versus locale={locale} />
      <Faq locale={locale} />
      <Closing locale={locale} />
    </main>
  );
}
