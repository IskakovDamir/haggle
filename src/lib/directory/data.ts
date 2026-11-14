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
  {
    slug: "american-express",
    name: "American Express",
    aliases: ["Amex"],
    domain: "americanexpress.com",
    source: { name: "americanexpress.com", url: "https://www.americanexpress.com/en-us/support/contacts/" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Card member customer service", display: "1-800-528-4800", hours: "24/7" },
      { label: "Make a payment", display: "1-800-472-9297", hours: "24/7" },
      { label: "Small business cards customer service", display: "1-800-492-3344", hours: "24/7" },
    ],
    menu: [],
    insights: "amex",
  },
  {
    slug: "bank-of-america",
    name: "Bank of America",
    aliases: ["BofA", "BoA"],
    domain: "bankofamerica.com",
    source: { name: "bankofamerica.com", url: "https://www.bankofamerica.com/customer-service/contact-us/credit-card/" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Credit card customer service, including lost or stolen cards", display: "1-800-732-9194", hours: "24/7" },
      { label: "Calling from outside the US", display: "1-302-738-5719", hours: "24/7" },
      { label: "Card activation", display: "1-800-276-9939", hours: "24/7" },
      { label: "Billing questions", display: "1-866-266-0212" },
    ],
    menu: [],
  },
  {
    slug: "barclays",
    name: "Barclays",
    aliases: ["Barclaycard", "Barclays US"],
    domain: "barclaycardus.com",
    source: { name: "barclaycardus.com", url: "https://cards.barclaycardus.com/banking/contact-us/" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Credit card customer support", display: "1-877-523-0478", hours: "24/7" },
      { label: "Card activation", display: "1-877-408-8866" },
      { label: "Calling from outside the US (collect)", display: "1-302-255-8888" },
    ],
    menu: [],
  },
  {
    slug: "capital-one",
    name: "Capital One",
    aliases: ["Capital One Quicksilver", "Capital One Venture"],
    domain: "capitalone.com",
    source: { name: "capitalone.com", url: "https://www.capitalone.com/contact/" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Credit card customer service", display: "1-800-227-4825", note: "Printed as 1-800-CAPITAL." },
      { label: "Credit card, calling from outside the US (collect)", display: "1-804-934-2001" },
      { label: "Credit card online account support", display: "1-866-750-0873" },
    ],
    menu: [],
    insights: "capital-one",
  },
  {
    slug: "citi",
    name: "Citi",
    aliases: ["Citibank", "Citi Double Cash", "Costco Citi card"],
    domain: "citi.com",
    source: {
      name: "citi.com",
      url: "https://www.citi.com/credit-cards/understanding-credit-cards/what-to-do-when-you-lose-your-credit-card",
    },
    checkedOn: "2026-11-15",
    lines: [{ label: "Credit card customer service, including lost or stolen cards", display: "1-800-950-5114" }],
    menu: [],
    insights: "citi",
  },
  {
    slug: "discover",
    name: "Discover",
    aliases: ["Discover it"],
    domain: "discover.com",
    source: { name: "discover.com", url: "https://www.discover.com/credit-cards/help-center/contact-us/" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Credit card customer service", display: "1-800-347-2683", hours: "24/7", note: "Printed as 1-800-DISCOVER." },
      { label: "Calling from outside the US", display: "1-224-888-7777" },
    ],
    menu: [],
    insights: "discover",
  },
  {
    slug: "navy-federal",
    name: "Navy Federal Credit Union",
    aliases: ["Navy Federal", "NFCU"],
    domain: "navyfederal.org",
    source: { name: "navyfederal.org", url: "https://www.navyfederal.org/contact-us.html" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Member services, including lost or stolen cards", display: "1-888-842-6328", hours: "24/7" },
      { label: "Collections", display: "1-800-336-3767", hours: "Mon to Fri 8 am to 9 pm ET, Sat 9 am to 5:30 pm ET" },
    ],
    menu: [],
  },
  {
    slug: "pnc",
    name: "PNC",
    aliases: ["PNC Bank"],
    domain: "pnc.com",
    source: { name: "pnc.com", url: "https://www.pnc.com/en/customer-service/credit-card-customer-service.html" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Credit card customer service", display: "1-800-558-8472" },
      { label: "Business credit card", display: "1-800-474-2101" },
    ],
    menu: [],
  },
  {
    slug: "synchrony",
    name: "Synchrony",
    aliases: ["Synchrony Bank", "Synchrony store cards", "CareCredit"],
    domain: "synchrony.com",
    source: { name: "synchrony.com", url: "https://www.synchrony.com/help/contact-us" },
    checkedOn: "2026-11-15",
    lines: [
      {
        label: "General card customer service",
        display: "1-866-419-4096",
        note: "Synchrony lists this when you cannot find the right department. Most store cards have their own number on the back of the card.",
      },
      { label: "CareCredit account help", display: "1-866-893-7864" },
    ],
    menu: [],
  },
  {
    slug: "us-bank",
    name: "U.S. Bank",
    aliases: ["US Bank", "U.S. Bank Altitude"],
    domain: "usbank.com",
    source: { name: "usbank.com", url: "https://www.usbank.com/customer-service/personal-banking/credit-cards.html" },
    checkedOn: "2026-11-15",
    lines: [
      { label: "Credit card customer service", display: "1-800-285-8585" },
      { label: "Altitude Reserve card", display: "1-844-357-2015" },
      { label: "Rewards center", display: "1-888-229-8864" },
    ],
    menu: [],
  },
  {
    slug: "apple-card",
    name: "Apple Card",
    aliases: ["Goldman Sachs Apple Card"],
    domain: "apple.com",
    source: { name: "support.apple.com", url: "https://support.apple.com/en-us/102517" },
    checkedOn: "2026-11-15",
    lines: [
      {
        label: "Apple Card support by Goldman Sachs",
        display: "1-877-255-5923",
        note: "Apple lists this number for a replacement card. Most Apple Card help happens in Messages on your iPhone.",
      },
    ],
    menu: [],
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
