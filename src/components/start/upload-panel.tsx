"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** A drop zone that is also a file picker. On a phone the picker offers the camera. */
export function UploadPanel({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const file = event.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-green",
          dragging ? "border-green bg-green-soft" : "border-line bg-card hover:border-ink/40",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-lime">
          <FileUp className="size-6" aria-hidden />
        </span>
        <span className="text-lg font-semibold">Drop your statement here, or choose a file</span>
        <span className="max-w-[44ch] text-sm text-muted">
          A PDF up to 4 MB, or a photo of the page with the balance and the rates. Photos are made smaller in your
          browser before they are sent.
        </span>
        <input
          type="file"
          accept="application/pdf,image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Clear the input so choosing the same file again still fires a change.
            event.target.value = "";
            if (file) onFile(file);
          }}
        />
      </label>
      <p className="mt-3 text-sm text-muted">
        The file is sent to Claude to be read and is not stored on our server. Only the last four digits of the card
        number are kept.
      </p>
    </div>
  );
}
