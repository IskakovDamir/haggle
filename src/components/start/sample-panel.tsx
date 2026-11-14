import { ArrowRight, ExternalLink } from "lucide-react";
import { SampleBadge } from "@/components/ui/primitives";
import { SAMPLE_STATEMENTS, type SampleStatement } from "@/lib/statement/samples";

/** The sample statements. Picking one sends its PDF through the same reading as an upload. */
export function SamplePanel({ onSample }: { onSample: (sample: SampleStatement) => void }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <SampleBadge />
        <p className="text-sm text-muted">
          Made-up people and numbers. Each one is a PDF file that is read the same way an upload is.
        </p>
      </div>
      <ul className="mt-4 space-y-3">
        {SAMPLE_STATEMENTS.map((sample) => (
          <li key={sample.id} className="rounded-2xl border border-line bg-card transition-colors hover:border-ink/40">
            <button
              type="button"
              onClick={() => onSample(sample)}
              className="flex w-full cursor-pointer items-center gap-4 rounded-2xl p-5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{sample.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{sample.blurb}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-green">
                Read it
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </button>
            <a
              href={sample.file}
              target="_blank"
              rel="noreferrer"
              className="mx-5 mb-4 inline-flex items-center gap-1.5 text-sm text-muted underline underline-offset-2 hover:text-ink"
            >
              Open the PDF
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
