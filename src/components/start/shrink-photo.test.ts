import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MAX_PHOTO_EDGE, fitWithin } from "./shrink-photo";

describe("fitWithin", () => {
  it("scales a phone photo down to the long edge", () => {
    expect(fitWithin(4032, 3024, MAX_PHOTO_EDGE)).toEqual({ width: 1568, height: 1176 });
    expect(fitWithin(3024, 4032, MAX_PHOTO_EDGE)).toEqual({ width: 1176, height: 1568 });
  });

  it("leaves a small image alone", () => {
    expect(fitWithin(800, 600, MAX_PHOTO_EDGE)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(1568, 1568, MAX_PHOTO_EDGE)).toEqual({ width: 1568, height: 1568 });
  });

  it("never exceeds the edge, never scales up and never collapses to nothing", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 20_000 }), fc.integer({ min: 1, max: 20_000 }), (width, height) => {
        const fitted = fitWithin(width, height, MAX_PHOTO_EDGE);
        expect(Math.max(fitted.width, fitted.height)).toBeLessThanOrEqual(MAX_PHOTO_EDGE);
        expect(fitted.width).toBeLessThanOrEqual(width);
        expect(fitted.height).toBeLessThanOrEqual(height);
        expect(Math.min(fitted.width, fitted.height)).toBeGreaterThanOrEqual(1);
      }),
    );
  });
});
