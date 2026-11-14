// The win card as an image with next/og: 1200x630 for link previews, 1080x1920 for stories.
// Manrope comes from the font files already in the repo; if they cannot be read the image still renders
// with the default font, so a share never fails because of a font.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { SharePayload } from "@/lib/share/payload";
import type { CardStatus } from "@/lib/share/sign";
import { footerLabel, savingsLine, winLine } from "@/lib/share/text";

export const LANDSCAPE = { width: 1200, height: 630 };
export const STORY = { width: 1080, height: 1920 };

async function manrope() {
  try {
    const dir = join(process.cwd(), "src/components/insights/og");
    const [semibold, extrabold] = await Promise.all([readFile(join(dir, "Manrope-600.ttf")), readFile(join(dir, "Manrope-800.ttf"))]);
    return [
      { name: "Manrope", data: semibold, weight: 600 as const, style: "normal" as const },
      { name: "Manrope", data: extrabold, weight: 800 as const, style: "normal" as const },
    ];
  } catch {
    return [];
  }
}

export async function renderWinCard(payload: SharePayload, status: CardStatus, domain: string, format: "landscape" | "story") {
  const story = format === "story";
  const size = story ? STORY : LANDSCAPE;
  const [main, ...rest] = payload.wins;
  const fonts = await manrope();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: story ? 96 : 64,
          color: "#ffffff",
          fontFamily: fonts.length > 0 ? "Manrope" : "sans-serif",
          backgroundImage: "linear-gradient(150deg, #2448f0 10%, #2f6bff 55%, #6f9bff 100%)",
        }}
      >
        <div style={{ display: "flex", fontSize: story ? 44 : 30, fontWeight: 600, color: "rgba(255,255,255,0.78)" }}>{payload.bank}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: story ? 28 : 14 }}>
          <div style={{ display: "flex", fontSize: story ? 92 : 64, lineHeight: 1.08, fontWeight: 800, letterSpacing: story ? -3 : -2 }}>{winLine(main)}</div>
          {rest.map((win) => (
            <div key={win.kind} style={{ display: "flex", fontSize: story ? 56 : 38, lineHeight: 1.2, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>
              {winLine(win)}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", fontSize: story ? 240 : 150, lineHeight: 1, fontWeight: 800, letterSpacing: story ? -10 : -6 }}>{savingsLine(payload)}</div>
          <div style={{ display: "flex", fontSize: story ? 44 : 30, fontWeight: 600, color: "rgba(255,255,255,0.78)" }}>saved in the first year</div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            paddingTop: story ? 32 : 20,
            borderTop: "2px solid rgba(255,255,255,0.25)",
            fontSize: story ? 36 : 26,
            fontWeight: 600,
          }}
        >
          <div style={{ display: "flex" }}>{footerLabel(status)}</div>
          <div style={{ display: "flex", color: "rgba(255,255,255,0.72)" }}>{domain}</div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
