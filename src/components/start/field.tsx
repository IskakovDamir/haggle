import { Input } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  /** A few words after the label, for example "optional". */
  hint?: string;
  /** Puts "$" before the number or "%" after it. The visitor types only the number. */
  unit?: "dollars" | "percent";
  /** Why the typed text cannot be used. Shown instead of the warnings. */
  error?: string;
  /** Things to check against the statement. They do not block. */
  warnings?: string[];
};

/** One labeled input with its error or warnings right under it. */
export function Field({ id, label, hint, unit, error, warnings = [], className, ...input }: FieldProps) {
  const notes = error ? [error] : warnings;
  const notesId = `${id}-notes`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
        {hint && <span className="font-normal text-muted"> {hint}</span>}
      </label>
      <div className="relative">
        {unit === "dollars" && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-muted">
            $
          </span>
        )}
        <Input
          id={id}
          inputMode={unit ? "decimal" : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={notes.length > 0 ? notesId : undefined}
          className={cn(
            "tabular",
            unit === "dollars" && "pl-7",
            unit === "percent" && "pr-9",
            error ? "border-alarm" : warnings.length > 0 && "border-leak/60",
          )}
          {...input}
        />
        {unit === "percent" && (
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-muted">
            %
          </span>
        )}
      </div>
      {notes.length > 0 && (
        <ul id={notesId} className={cn("mt-1.5 space-y-1 text-sm leading-snug", error ? "text-alarm" : "text-leak")}>
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
