"use client";

import { motion } from "framer-motion";
import { EASE } from "./reveal";

/** Every route fades and rises in when it mounts. Used by app/template.tsx. */
export function PageEnter({ children }: { children: React.ReactNode }) {
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
