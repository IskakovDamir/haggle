"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { EASE } from "./reveal";

/**
 * The landing fades and rises in when it mounts. Used by app/template.tsx.
 * App screens are left still here: their frame (the sidebar) stays put between pages and the shell
 * animates only the screen inside it.
 */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname !== "/") return <div className="flex flex-1 flex-col">{children}</div>;
  return (
    <motion.div
      className="flex flex-1 flex-col"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
