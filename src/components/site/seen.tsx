"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Tells the server which page was opened, once per page. No cookies, nothing stored in the browser. */
export function Seen() {
  const pathname = usePathname();
  useEffect(() => {
    void fetch("/api/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
