// The app's navigation and the small words around it. Pure, so the active item and the greeting can be tested.
import type { Locale } from "@/lib/i18n/locale";

export type NavId = "overview" | "cards" | "calls" | "plan" | "savings" | "alerts";

export type NavItem = { id: NavId; href: string; label: string };

/** The sidebar, top to bottom. The same order as the dashboard picture on the landing page. */
export const NAV_ITEMS: readonly NavItem[] = [
  { id: "overview", href: "/dashboard", label: "Overview" },
  { id: "cards", href: "/cards", label: "My cards" },
  { id: "calls", href: "/calls", label: "Calls" },
  { id: "plan", href: "/plan", label: "My plan" },
  { id: "savings", href: "/savings", label: "Savings" },
  { id: "alerts", href: "/alerts", label: "Alerts" },
];

/** Routes that light up a nav item they do not share a path with. */
const ALSO_ACTIVE: Record<string, NavId> = {
  "/call": "calls",
  "/win": "calls",
  "/start": "cards",
};

const within = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

/** Which nav item the page belongs to. null for pages outside the nav, like /missed. */
export function activeNav(pathname: string): NavId | null {
  const direct = NAV_ITEMS.find((item) => within(pathname, item.href));
  if (direct) return direct.id;
  const extra = Object.entries(ALSO_ACTIVE).find(([href]) => within(pathname, href));
  return extra ? extra[1] : null;
}

/**
 * "Good morning!" before noon, "Good afternoon!" until five, "Good evening!" after. Night counts as evening.
 * In Spanish the afternoon runs until eight, as "buenas tardes" does.
 */
export function greetingFor(hour: number, locale: Locale = "en"): string {
  if (locale === "es") {
    if (hour >= 5 && hour < 12) return "¡Buenos días!";
    if (hour >= 12 && hour < 20) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  }
  if (hour >= 5 && hour < 12) return "Good morning!";
  if (hour >= 12 && hour < 17) return "Good afternoon!";
  return "Good evening!";
}

/** The first letter of the name for the avatar, or "H" for Haggle when there is no name yet. */
export function initialOf(name: string | null | undefined): string {
  const first = name?.trim().charAt(0) ?? "";
  return first ? first.toUpperCase() : "H";
}
