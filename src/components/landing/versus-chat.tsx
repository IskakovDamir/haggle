import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Section } from "./section";

/** On a phone the rows stack, so each answer carries its column's name. */
const COLUMN_NAME_ON_PHONES = "block text-xs font-semibold tracking-wider text-muted uppercase md:hidden";

/** What lowering a card rate takes, and who does each part. The Haggle column describes this build. */
const ROWS: { need: string; chat: string; haggle: string }[] = [
  {
    need: "Knowing what you can ask for",
    chat: "Tells you, if you ask the right question",
    haggle: "Finds the asks in your statement",
  },
  {
    need: "Getting the numbers right",
    chat: "A language model does the arithmetic",
    haggle: "Tested code on whole cents, with the assumptions printed",
  },
  {
    need: "Saying the words to the bank",
    chat: "Writes you a script. You make the call",
    haggle: "Speaks for you. A practice call in this build",
  },
  {
    need: "Getting past the first no",
    chat: "Is not on the call",
    haggle: "Asks for the retention team, then says truthfully what you will do instead",
  },
  {
    need: "Knowing what was really agreed",
    chat: "Takes your word for it",
    haggle: "Code checks every granted number against the bank's own words",
  },
  {
    need: "Keeping the plan going",
    chat: "You keep track",
    haggle: "Ordered steps with dates, and every call with its transcript",
  },
];

export function VersusChatSection() {
  return (
    <Section
      id="why-not-chat"
      eyebrow="05 Why not ChatGPT"
      title={
        <>
          A chat window does not <em>make the call</em>
        </>
      }
      lead="The test for any AI product: would one conversation with a chat assistant get you most of the value? Here it would not. Advice was never the hard part."
    >
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {/* Column heads only make sense once the three columns sit side by side. */}
        <div className="hidden grid-cols-3 gap-4 bg-paper px-5 py-3 text-xs font-semibold tracking-wider text-muted uppercase md:grid">
          <span>What it takes</span>
          <span>A chat assistant</span>
          <span>Haggle</span>
        </div>
        {ROWS.map((row, index) => (
          <div
            key={row.need}
            className={cn("grid gap-x-4 gap-y-2 border-line px-5 py-4 md:grid-cols-3 md:border-t", index > 0 && "border-t")}
          >
            <p className="font-semibold">{row.need}</p>
            <p className="flex items-start gap-2 text-muted">
              <Minus className="mt-1 size-4 shrink-0" aria-hidden />
              <span>
                <span className={COLUMN_NAME_ON_PHONES}>A chat assistant</span>
                {row.chat}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Check className="mt-1 size-4 shrink-0 text-green" aria-hidden />
              <span>
                <span className={COLUMN_NAME_ON_PHONES}>Haggle</span>
                {row.haggle}
              </span>
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
