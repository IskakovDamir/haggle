import { formatApr } from "@/lib/format";
import { formatDollars } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BankExample } from "./examples";
import { ASK_SUCCESS, FEE_WAIVER_SUCCESS } from "./facts";
import { FactSentence, Section } from "./section";

/** Three futures for one customer, and what each is worth to the bank. The numbers are the engine's. */
function BankTable({ example }: { example: BankExample }) {
  const rows = [
    { what: "Nothing changes", earns: example.ifNothingChangesCents, kept: false },
    { what: "The customer moves the balance to a 0% card", earns: example.ifCustomerLeavesCents, kept: false },
    {
      what: `The bank cuts the rate to ${formatApr(example.retainedAprBps)} and keeps the customer`,
      earns: example.ifRateIsCutCents,
      kept: true,
    },
  ];

  return (
    <figure>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-paper text-xs tracking-wider text-muted uppercase">
              <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                A customer owes {formatDollars(example.balanceCents)} at {formatApr(example.aprBps)}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">
                The bank earns in a year
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.what} className={cn("border-t border-line", row.kept && "bg-green-soft font-semibold")}>
                <td className="px-4 py-3.5 sm:px-5">{row.what}</td>
                <td className="tabular px-4 py-3.5 text-right text-lg font-bold sm:px-5">{formatDollars(row.earns)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-sm text-muted">
        Interest only, with the balance held where it is for a year. Our arithmetic, not a bank&apos;s figures.
      </figcaption>
    </figure>
  );
}

export function BankSection({ example }: { example: BankExample | null }) {
  return (
    <Section
      id="why-yes"
      eyebrow="02 The insight"
      title={
        <>
          Why the bank <em>says yes</em>
        </>
      }
      lead="A customer who carries a balance pays the bank interest every month. If that customer moves the balance to a 0% transfer card, the interest stops. A lower rate keeps most of it coming."
    >
      {example && <BankTable example={example} />}
      <ul className="mt-6 max-w-[70ch] space-y-2 text-lg text-muted">
        <li>
          <FactSentence fact={ASK_SUCCESS} />.
        </li>
        <li>
          <FactSentence fact={FEE_WAIVER_SUCCESS} />.
        </li>
      </ul>
      <p className="mt-6 max-w-[62ch] text-lg sm:text-xl">
        The problem is not the bank. <strong className="rounded bg-lime px-1.5">The problem is the call.</strong>
      </p>
    </Section>
  );
}
