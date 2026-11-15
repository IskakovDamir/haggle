import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import { TourGuide } from "@/components/judges/tour-guide";
import { MotionRoot } from "@/components/motion/motion-root";
import { Seen } from "@/components/site/seen";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope-face", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Haggle",
  description: "An AI agent that calls your bank: lower card interest, waived fees, and you pay only after a win.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f4f6fa" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <MotionRoot>
          {children}
          <TourGuide />
          <Seen />
        </MotionRoot>
      </body>
    </html>
  );
}
