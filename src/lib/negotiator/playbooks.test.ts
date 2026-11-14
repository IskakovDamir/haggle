import { describe, expect, it } from "vitest";
import type { Issuer } from "@/lib/types";
import { playbookFor } from "./playbooks";

const ISSUERS: Issuer[] = ["chase", "capital_one", "citi", "amex", "discover", "bank_of_america", "wells_fargo", "other"];

describe("playbooks", () => {
  it("has guidance for every issuer", () => {
    for (const issuer of ISSUERS) {
      const playbook = playbookFor(issuer);
      expect(playbook.escalateTo).toMatch(/supervisor/);
      expect(playbook.usualAsks.length).toBeGreaterThan(0);
      expect(playbook.note.length).toBeGreaterThan(0);
    }
  });

  it("contains no digits at all: no phone numbers, no rates, no statistics", () => {
    for (const issuer of ISSUERS) {
      const { escalateTo, usualAsks, note } = playbookFor(issuer);
      expect([escalateTo, ...usualAsks, note].join(" ")).not.toMatch(/\d/);
    }
  });
});
