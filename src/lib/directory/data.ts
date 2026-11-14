// Official credit card customer service numbers, each read from the issuer's own site on the date shown.
// Hours appear only where the issuer prints them. Nothing here is measured by Haggle yet.
import { z } from "zod";
import type { Issuer } from "./types";

export const DIRECTORY_AS_OF = "2026-11-15";

export const ISSUERS: Issuer[] = [
  {
    slug: "chase",
    name: "Chase",
    aliases: ["JPMorgan Chase", "Chase Sapphire", "Chase Freedom"],
    domain: "chase.com",
    source: { name: "chase.com", url: "https://www.chase.com/digital/customer-service" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Credit card customer service", display: "1-800-432-3117" },
      { label: "Personal banking customer service", display: "1-800-935-9935" },
    ],
    menu: [
      {
        id: "chase-menu-card-number",
        text: "On the Chase Sapphire line, the first prompt asks for your full 16-digit card number.",
        kind: "cited",
        source: { name: "GetHuman", url: "https://gethuman.com/phone-number/Chase-Credit-Cards/customer-service/~3803" },
        asOf: "2026-11-04",
      },
    ],
    insights: "chase",
  },
];

// Validation runs when the module loads, so a bad edit fails the build and the tests.
const phoneDisplay = z.string().regex(/^1-\d{3}-\d{3}-\d{4}$/, "Use the 1-800-555-0100 format");

export const issuerSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    aliases: z.array(z.string()),
    domain: z.string().regex(/^[a-z0-9.-]+\.[a-z]+$/),
    source: z.object({ name: z.string().min(1), url: z.url() }),
    checkedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    lines: z
      .array(z.object({ label: z.string().min(1), display: phoneDisplay, hours: z.string().min(1).optional(), note: z.string().optional() }))
      .min(1),
    menu: z.array(z.object({ id: z.string(), text: z.string(), kind: z.literal("cited"), source: z.object({ name: z.string(), url: z.url() }), asOf: z.string() })),
    insights: z.enum(["chase", "capital-one", "citi", "amex", "discover"]).optional(),
  })
  .refine((issuer) => new URL(issuer.source.url).hostname.endsWith(issuer.domain), { message: "The source must be on the issuer's own domain" });

z.array(issuerSchema).parse(ISSUERS);
