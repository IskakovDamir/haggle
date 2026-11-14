import { PageEnter } from "@/components/motion/page-enter";

// A template remounts on every navigation, so each screen gets its entrance.
export default function Template({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
