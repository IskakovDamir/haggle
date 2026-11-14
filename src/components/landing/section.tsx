import type { Fact, Source } from "./facts";

/** The frame every section below the hero shares: a numbered eyebrow, a heading and a lead. */
export function Section({
  id,
  eyebrow,
  title,
  lead,
  children,
}: {
  id: string;
  eyebrow: string;
  /** May contain <em> for the italic serif accent. */
  title: React.ReactNode;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="border-t border-line py-16 sm:py-20">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <p className="mb-2.5 text-xs font-bold tracking-widest text-green uppercase">{eyebrow}</p>
        <h2 className="max-w-[22ch] text-3xl leading-[1.1] font-extrabold sm:text-[2.75rem]">{title}</h2>
        {lead && <p className="mt-4 max-w-[64ch] text-lg text-muted">{lead}</p>}
        <div className="mt-9">{children}</div>
      </div>
    </section>
  );
}

export function SourceLink({ source, className }: { source: Source; className?: string }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className={className ?? "underline decoration-line underline-offset-2 hover:decoration-ink"}
    >
      {source.label}
    </a>
  );
}

/** A statistic as one sentence with its source right behind it. */
export function FactSentence({ fact }: { fact: Fact }) {
  return (
    <>
      <strong className="text-ink">{fact.value}</strong> {fact.claim} (<SourceLink source={fact.source} />)
    </>
  );
}
