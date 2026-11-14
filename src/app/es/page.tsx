import type { Metadata } from "next";
import { RememberLocale } from "@/components/i18n/locale-switch";
import { Landing } from "@/components/landing-v2/landing";

export const metadata: Metadata = {
  title: "Haggle en español",
  description: "Un agente de IA que llama a tu banco: menos interés en tu tarjeta, cargos eliminados, y solo pagas si ganas.",
  openGraph: { locale: "es_US" },
};

// The Spanish landing. Same sections as "/", and it remembers Spanish so the app screens follow.
export default function HomeEs() {
  return (
    <>
      <RememberLocale locale="es" />
      <Landing locale="es" />
    </>
  );
}
