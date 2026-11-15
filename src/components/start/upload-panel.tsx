"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FileUp } from "lucide-react";
import { EASE } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { SURFACE } from "./surfaces";

/** A drop zone that is also a file picker. Takes one statement or several. On a phone the picker offers the camera. */
export function UploadPanel({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);

  return (
    <div>
      <motion.label
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
        animate={{ scale: dragging ? 1.015 : 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className={cn(
          "group relative flex min-h-[304px] cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-[28px] border-2 px-6 py-14 text-center transition-[border-color,background-color,box-shadow] duration-300",
          SURFACE.wash,
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-hg-blue",
          dragging
            ? "border-hg-blue shadow-[0_0_0_6px_rgb(47_107_255/0.12),0_24px_60px_-24px_rgb(47_107_255/0.55)]"
            : "border-hg-blue-tint hover:border-hg-blue/60 hover:shadow-[0_0_0_4px_rgb(47_107_255/0.08),0_20px_48px_-28px_rgb(47_107_255/0.5)]",
        )}
      >
        {/* The silver tray sits in the top right corner. Wider screens only, where it has room beside the words. */}
        <motion.span
          aria-hidden
          animate={{ y: dragging ? -8 : 0, rotate: dragging ? -4 : 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="pointer-events-none absolute top-[26px] right-[26px] hidden w-[170px] sm:block"
        >
          <Image src="/app/3d/upload-tray-3d.png" alt="" width={170} height={169} className="h-auto w-full" />
        </motion.span>
        {/* A soft blue glow that wakes up on hover and while a file is held over the zone. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-hg-blue/20 blur-3xl transition-opacity duration-500",
            dragging ? "opacity-100" : "opacity-0 group-hover:opacity-60",
          )}
        />
        <motion.span
          animate={{ y: dragging ? -6 : 0, scale: dragging ? 1.08 : 1 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="relative flex size-14 items-center justify-center rounded-[20px] bg-hg-blue text-white shadow-[0_12px_28px_-10px_rgb(47_107_255/0.7)] transition-[translate] duration-300 group-hover:-translate-y-0.5"
        >
          <FileUp className="size-6" aria-hidden />
        </motion.span>
        <span className="relative text-[20px] leading-7 font-semibold tracking-[-0.02em] text-hg-ink">
          Drop your statements here, or choose files
        </span>
        <span className="relative max-w-[44ch] text-sm leading-5 font-medium text-muted">
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
      </motion.label>
      <p className="mt-3 text-sm text-muted">
        Each file is sent to an AI model to be read and is not stored on our server. Only the last four digits of the card
        number are kept.
      </p>
    </div>
  );
}
