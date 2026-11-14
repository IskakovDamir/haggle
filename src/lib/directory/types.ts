// The phone directory: official customer service numbers for US credit card issuers.
// Every number comes from the issuer's own website and is shown with a link to that page.
import type { BankSlug, Fact, Source } from "@/lib/benchmarks/types";

export type PhoneLine = {
  /** "Credit card customer service" */
  label: string;
  /** Exactly as the issuer prints it, for example "1-800-432-3117". */
  display: string;
  /** Hours exactly as the issuer prints them. Absent when the official page lists none. */
  hours?: string;
  note?: string;
};

export type Issuer = {
  slug: string;
  /** "Chase" */
  name: string;
  /** Other names people search for, such as "JPMorgan Chase". */
  aliases: string[];
  /** The issuer's own domain. Every source link must be on it. */
  domain: string;
  /** The official page the numbers were read from. */
  source: Source;
  /** ISO date the numbers were last checked on that page. */
  checkedOn: string;
  /** The first line is the main credit card number. */
  lines: PhoneLine[];
  /** Sourced facts about the phone menu, when we have one. */
  menu: Fact[];
  /** The matching /insights bank page, when there is one. */
  insights?: BankSlug;
};
