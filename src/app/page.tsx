import { Bank } from "@/components/landing-v2/bank";
import { Closing } from "@/components/landing-v2/closing";
import { Demo } from "@/components/landing-v2/demo";
import { Faq } from "@/components/landing-v2/faq";
import { Hero } from "@/components/landing-v2/hero";
import { HowItWorks } from "@/components/landing-v2/how-it-works";
import { Insight } from "@/components/landing-v2/insight";
import { Pricing } from "@/components/landing-v2/pricing";
import { Problem } from "@/components/landing-v2/problem";
import { Stats } from "@/components/landing-v2/stats";
import { Versus } from "@/components/landing-v2/versus";
import { Wins } from "@/components/landing-v2/wins";

// The landing page, built from the Figma file "Haggle — Landing · Desktop 1440".
export default function Home() {
  return (
    <main className="flex-1 bg-white font-manrope">
      <Hero />
      <Stats />
      <Insight />
      <Problem />
      <Bank />
      <Wins />
      <HowItWorks />
      <Demo />
      <Pricing />
      <Versus />
      <Faq />
      <Closing />
    </main>
  );
}
