import { describe, expect, it } from "vitest";
import { TOUR_STEPS, resumeHref, stepOnPage } from "./tour-steps";

const index = (id: string) => TOUR_STEPS.findIndex((step) => step.id === id);

describe("TOUR_STEPS", () => {
  it("starts by filling in Maria's example and ends anywhere", () => {
    expect(TOUR_STEPS[0].id).toBe("fill");
    expect(TOUR_STEPS[0].target).toBe("fill-sample");
    expect(TOUR_STEPS.at(-1)?.path).toBeNull();
  });

  it("has unique ids and a target for every page step", () => {
    expect(new Set(TOUR_STEPS.map((step) => step.id)).size).toBe(TOUR_STEPS.length);
    for (const step of TOUR_STEPS) if (step.path !== null) expect(step.target).toBeTruthy();
  });
});

describe("stepOnPage", () => {
  it("keeps the current step on its own page", () => {
    expect(stepOnPage(TOUR_STEPS, index("worth"), "/missed")).toBe(index("worth"));
  });

  it("jumps ahead when the judge reaches a later page", () => {
    expect(stepOnPage(TOUR_STEPS, index("send"), "/call")).toBe(index("mode"));
    expect(stepOnPage(TOUR_STEPS, index("fill"), "/call")).toBe(index("mode"));
    expect(stepOnPage(TOUR_STEPS, index("play"), "/win")).toBe(index("result"));
  });

  it("goes back to a page's first step when the judge goes back", () => {
    expect(stepOnPage(TOUR_STEPS, index("pay"), "/call")).toBe(index("mode"));
  });

  it("returns null off the tour", () => {
    expect(stepOnPage(TOUR_STEPS, index("fill"), "/")).toBeNull();
    expect(stepOnPage(TOUR_STEPS, index("result"), "/dashboard")).toBeNull();
  });

  it("stays on the closing step anywhere", () => {
    expect(stepOnPage(TOUR_STEPS, index("done"), "/")).toBe(index("done"));
  });
});

describe("resumeHref", () => {
  it("goes back to the address last seen for the page", () => {
    expect(resumeHref(TOUR_STEPS[index("play")], { "/call": "/call?step=x" })).toBe("/call?step=x");
  });

  it("falls back to a sensible start", () => {
    expect(resumeHref(TOUR_STEPS[index("fill")], {})).toBe("/missed");
    expect(resumeHref(TOUR_STEPS[index("mode")], {})).toBe("/demo");
    expect(resumeHref(TOUR_STEPS[index("result")], {})).toBe("/calls");
    expect(resumeHref(TOUR_STEPS[index("done")], {})).toBe("/judges");
  });
});
