// The app frame's words in each language: the nav, the top bar, the missed-payment card and the menus.
import type { Copy } from "@/lib/i18n/locale";
import type { NavId } from "./nav";

type ShellCopy = {
  nav: Record<NavId, string>;
  navLabel: string;
  /** "Hi Maria," above the greeting. */
  hi: (name: string | null) => string;
  newCall: string;
  missedTitle: string;
  missedLead: string;
  /** Shown in the profile row before there is a name. */
  welcome: string;
  plan: string;
  /** ", 3 open" after the alerts count, for screen readers. */
  openCount: (count: number) => string;
  alerts: (count: number) => string;
  openMenu: string;
  closeMenu: string;
  menu: string;
};

export const SHELL_COPY: Copy<ShellCopy> = {
  en: {
    nav: { overview: "Overview", cards: "My cards", calls: "Calls", plan: "My plan", savings: "Savings", alerts: "Alerts" },
    navLabel: "Main",
    hi: (name) => `Hi ${name ?? "there"},`,
    newCall: "New call",
    missedTitle: "Missed a payment?",
    missedLead: "Ask for the late fee and your old rate back.",
    welcome: "Welcome",
    plan: "Pay-per-win plan",
    openCount: (count) => `, ${count} open`,
    alerts: (count) => (count > 0 ? `Alerts, ${count} open` : "Alerts"),
    openMenu: "Open menu",
    closeMenu: "Close menu",
    menu: "Menu",
  },
  es: {
    nav: { overview: "Resumen", cards: "Mis tarjetas", calls: "Llamadas", plan: "Mi plan", savings: "Ahorros", alerts: "Alertas" },
    navLabel: "Principal",
    hi: (name) => (name ? `Hola, ${name}` : "Hola"),
    newCall: "Nueva llamada",
    missedTitle: "¿Se te pasó un pago?",
    missedLead: "Pide que te devuelvan el cargo por pago tardío y tu tasa anterior.",
    welcome: "Te damos la bienvenida",
    plan: "Pagas solo si ganas",
    openCount: (count) => `, ${count} ${count === 1 ? "abierta" : "abiertas"}`,
    alerts: (count) => (count > 0 ? `Alertas, ${count} ${count === 1 ? "abierta" : "abiertas"}` : "Alertas"),
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    menu: "Menú",
  },
};
