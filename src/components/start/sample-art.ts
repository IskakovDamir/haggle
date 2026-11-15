// Which 3D card stands for which sample statement, and the card fill it sits on.
import type { Surface } from "./surfaces";

export type SampleArt = { src: string; width: number; height: number; surface: Surface };

const ART: Record<string, SampleArt> = {
  "maria-chase": { src: "/app/3d/card-chase-3d.png", width: 170, height: 128, surface: "blue" },
  "maria-capital-one": { src: "/app/3d/card-capital-one-3d.png", width: 170, height: 139, surface: "ink" },
  "maria-citi": { src: "/app/3d/card-citi-3d.png", width: 170, height: 138, surface: "wash" },
};

/** The art for a sample, or the Chase card for anything else. */
export function sampleArt(sampleId: string | null | undefined): SampleArt {
  return (sampleId && ART[sampleId]) || ART["maria-chase"];
}
