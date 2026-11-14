"use client";

import { useState } from "react";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

/** A drop zone that is also a file picker. Takes one statement or several. On a phone the picker offers the camera. */
export function UploadPanel({ onFiles }: { onFiles: (files: File[]) => void }) {
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
          const files = Array.from(event.dataTransfer.files);
          if (files.length > 0) onFiles(files);
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
        <span className="text-lg font-semibold">Drop your statements here, or choose files</span>
        <span className="max-w-[44ch] text-sm text-muted">
          One card or all of them: Chase, Capital One, Citi, any bank. Each a PDF up to 4 MB, or a photo of the page with the balance and the rates. Photos are made smaller in your
          browser before they are sent.
        </span>
        <input
          type="file"
          accept="application/pdf,image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            // Clear the input so choosing the same files again still fires a change.
            event.target.value = "";
            if (files.length > 0) onFiles(files);
          }}
        />
      </label>
      <p className="mt-3 text-sm text-muted">
        Each file is sent to an AI model to be read and is not stored on our server. Only the last four digits of the card
        number are kept.
      </p>
    </div>
  );
}
