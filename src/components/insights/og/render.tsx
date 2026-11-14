// Social images for the insights pages and single stats, drawn with next/og in the landing's colors and Manrope.
// Every number in an image carries its provenance in text, as on the pages.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { formatDate } from "@/lib/format";
import { formatStatValue, provenanceText } from "@/lib/benchmarks";
import type { Stat } from "@/lib/benchmarks/types";

const INK = "#0b1220";
const INK_2 = "#3b4356";
const MUTED = "#7b8496";
const BLUE = "#2f6bff";

async function fonts() {
  const dir = join(process.cwd(), "src/components/insights/og");
  const [semibold, extrabold] = await Promise.all([readFile(join(dir, "Manrope-600.ttf")), readFile(join(dir, "Manrope-800.ttf"))]);
  return [
    { name: "Manrope", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Manrope", data: extrabold, weight: 800 as const, style: "normal" as const },
  ];
}

/** "Source: Federal Reserve G.19 · Nov 6, 2026" or "Estimate". */
function provenanceLine(stat: Stat): string {
  return stat.kind === "estimate" ? "Estimate" : `${provenanceText(stat)} · ${formatDate(stat.asOf)}`;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          borderRadius: 12,
          background: light ? "#ffffff" : BLUE,
          color: light ? BLUE : "#ffffff",
          fontSize: 28,
          fontWeight: 800,
        }}
      >
        h
      </div>
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800, letterSpacing: -1.6, color: light ? "#ffffff" : INK }}>haggle</div>
    </div>
  );
}

export const PAGE_IMAGE_SIZE = { width: 1200, height: 630 };

/** A page preview: title on the landing's pale blue wash, then up to three numbers with their labels. */
export async function renderPageImage({ eyebrow, title, stats }: { eyebrow: string; title: string; stats: Stat[] }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          fontFamily: "Manrope",
          backgroundImage: "linear-gradient(135deg, #c4ddf6 0%, #e6f1fc 45%, #ffffff 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: INK_2 }}>{eyebrow}</div>
        </div>
        <div style={{ display: "flex", fontSize: 56, lineHeight: 1.1, fontWeight: 800, letterSpacing: -2.4, color: INK, maxWidth: 1000 }}>{title}</div>
        <div style={{ display: "flex", gap: 16 }}>
          {stats.slice(0, 3).map((stat) => (
            <div
              key={stat.id}
              style={{ display: "flex", flexDirection: "column", flex: 1, gap: 6, padding: "22px 26px", borderRadius: 28, background: "#ffffff" }}
            >
              <div style={{ display: "flex", fontSize: 50, fontWeight: 800, letterSpacing: -1.6, color: INK }}>{formatStatValue(stat)}</div>
              <div style={{ display: "flex", fontSize: 19, lineHeight: 1.3, fontWeight: 600, color: INK_2 }}>{stat.label}</div>
              <div style={{ display: "flex", fontSize: 16, fontWeight: 600, color: MUTED }}>{provenanceLine(stat)}</div>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...PAGE_IMAGE_SIZE, fonts: await fonts() },
  );
}

/** One big number for a post: 1200x630 for X and LinkedIn, or 1080x1350 portrait for feeds. */
export async function renderStatImage(stat: Stat, format: "landscape" | "portrait") {
  const portrait = format === "portrait";
  const size = portrait ? { width: 1080, height: 1350 } : { width: 1200, height: 630 };
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: portrait ? 80 : 60,
          fontFamily: "Manrope",
          color: "#ffffff",
          backgroundImage: "linear-gradient(150deg, #2448f0 10%, #2f6bff 55%, #8db6ff 100%)",
        }}
      >
        <Logo light />
        <div style={{ display: "flex", flexDirection: "column", gap: portrait ? 28 : 18 }}>
          <div style={{ display: "flex", fontSize: portrait ? 230 : 190, lineHeight: 1, fontWeight: 800, letterSpacing: portrait ? -10 : -8 }}>
            {formatStatValue(stat)}
          </div>
          <div style={{ display: "flex", fontSize: portrait ? 54 : 42, lineHeight: 1.2, fontWeight: 600, maxWidth: portrait ? 900 : 1000 }}>{stat.label}</div>
        </div>
        <div style={{ display: "flex", fontSize: portrait ? 30 : 24, fontWeight: 600, color: "rgba(255,255,255,0.78)" }}>{provenanceLine(stat)}</div>
      </div>
    ),
    { ...size, fonts: await fonts() },
  );
}

/** A phone directory page: the issuer, its official number and where it was checked. */
export async function renderPhoneImage({ name, label, number, checked }: { name: string; label: string; number: string; checked: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 56,
          fontFamily: "Manrope",
          backgroundImage: "linear-gradient(135deg, #c4ddf6 0%, #e6f1fc 45%, #ffffff 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: INK_2 }}>Phone numbers</div>
        </div>
        <div style={{ display: "flex", fontSize: 54, lineHeight: 1.1, fontWeight: 800, letterSpacing: -2.2, color: INK, maxWidth: 1000 }}>
          {`${name} credit card customer service`}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            padding: "28px 36px",
            borderRadius: 32,
            color: "#ffffff",
            backgroundImage: "linear-gradient(161.82deg, #2453e6 14.286%, #0f2a9e 85.714%)",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{label}</div>
          <div style={{ display: "flex", fontSize: 84, lineHeight: 1, fontWeight: 800, letterSpacing: -3 }}>{number}</div>
          <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{checked}</div>
        </div>
      </div>
    ),
    { ...PAGE_IMAGE_SIZE, fonts: await fonts() },
  );
}
