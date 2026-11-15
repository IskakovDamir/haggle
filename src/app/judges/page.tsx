import type { Metadata } from "next";
import { JudgesPage } from "@/components/judges/judges-page";

export const metadata: Metadata = {
  title: "For judges · Haggle",
  description: "A 3-minute guided tour of Haggle for the Zimran Business Cup judges: a sample case, a real call, a verified win.",
};

export default function Judges() {
  return <JudgesPage />;
}
