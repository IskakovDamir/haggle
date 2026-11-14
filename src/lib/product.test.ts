import { describe, expect, it } from "vitest";
import { PRODUCT_URL, productHref } from "./product";

describe("productHref", () => {
  it("is empty until the product is deployed", () => {
    expect(PRODUCT_URL).toBe("");
    expect(productHref("/missed")).toBeNull();
  });

  it("joins the origin and path with one slash", () => {
    expect(productHref("/missed?bank=chase", "https://app.example.com")).toBe("https://app.example.com/missed?bank=chase");
    expect(productHref("start", "https://app.example.com/")).toBe("https://app.example.com/start");
  });
});
