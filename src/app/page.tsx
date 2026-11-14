import Link from "next/link";
import { BankSection } from "@/components/landing/bank";
import { ClosingSection } from "@/components/landing/closing";
import { landingExamples } from "@/components/landing/examples";
import { Hero } from "@/components/landing/hero";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { START_HREF } from "@/components/landing/links";
import { OutcomesSection } from "@/components/landing/outcomes";
import { TrapSection } from "@/components/landing/trap";
import { VersusChatSection } from "@/components/landing/versus-chat";
import { Logo } from "@/components/site/shell";
import { buttonVariants } from "@/components/ui/button";

const SECTIONS = [
  { href: "#trap", label: "Problem" },
  { href: "#why-yes", label: "Insight" },
  { href: "#what", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#why-not-chat", label: "Why not ChatGPT" },
];

// The landing page. Static: its worked examples are computed by the engine when the page is built,
// and every published statistic comes from src/components/landing/facts.ts with its source.
export default function Home() {
  const examples = landingExamples();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-5 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Sections" className="hidden items-center gap-5 text-sm text-muted md:flex">
            {SECTIONS.map((section) => (
              <a key={section.href} href={section.href} className="whitespace-nowrap hover:text-ink">
                {section.label}
              </a>
            ))}
          </nav>
          <Link href={START_HREF} className={buttonVariants({ size: "sm", variant: "ink", className: "ml-auto" })}>
            Start
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <Hero />
        <TrapSection example={examples?.trap ?? null} />
        <BankSection example={examples?.bank ?? null} />
        <OutcomesSection />
        <HowItWorksSection />
        <VersusChatSection />
        <ClosingSection />
      </main>

      <footer className="border-t border-line py-8 text-sm text-muted">
        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
          Haggle. Built in 24 hours for Zimran Business Cup 2, November 2026. Sample statements are fictional. Nothing
          here is financial advice.
        </div>
      </footer>
    </>
  );
}
