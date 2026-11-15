"use client";

// The judge tour's floating card and spotlight. Mounted once in the root layout, so it follows the judge
// from page to page. It shows nothing unless a tour was started on /judges.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronUp, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EASE } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";
import { endTour, updateTour, useTour } from "./tour-store";
import { TOUR_STEPS, resumeHref, stepOnPage, type TourStep } from "./tour-steps";

const TOTAL = TOUR_STEPS.length;
const RING_PAD = 8;
/** How long an optional step waits for its element before it is skipped. */
const OPTIONAL_WAIT_MS = 3500;

const find = (id: string | undefined): HTMLElement | null =>
  id ? document.querySelector<HTMLElement>(`[data-tour="${id}"]`) : null;

const visible = (element: HTMLElement | null): element is HTMLElement => {
  if (!element) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
};

/** Moves the tour on from the step on screen. Sets a fixed step, so a second call for the same click does nothing. */
function advanceFrom(from: number) {
  updateTour((current) => (current.active ? { ...current, step: Math.min(from + 1, TOTAL - 1) } : current));
}

export function TourGuide() {
  const tour = useTour();
  const pathname = usePathname();
  const here = tour.active ? stepOnPage(TOUR_STEPS, Math.min(tour.step, TOTAL - 1), pathname) : null;

  // Follow the judge: a new page moves the tour to that page's step and remembers the address.
  useEffect(() => {
    if (!tour.active) return;
    const onTourPage = TOUR_STEPS.some((step) => step.path === pathname);
    const href = `${window.location.pathname}${window.location.search}`;
    updateTour((current) => {
      if (!current.active) return current;
      const step = stepOnPage(TOUR_STEPS, Math.min(current.step, TOTAL - 1), pathname);
      const seen = onTourPage && current.seen[pathname] !== href ? { ...current.seen, [pathname]: href } : current.seen;
      if ((step === null || step === current.step) && seen === current.seen) return current;
      return { ...current, step: step ?? current.step, seen };
    });
    // Only a page change moves the tour; Back and Next set the step themselves.
  }, [pathname, tour.active]);

  if (!tour.active) return null;

  if (here === null) {
    const step = TOUR_STEPS[Math.min(tour.step, TOTAL - 1)];
    return (
      <Link
        href={resumeHref(step, tour.seen)}
        className="fixed right-4 bottom-4 z-[60] flex h-11 items-center gap-2 rounded-full bg-hg-ink px-4 text-[13px] font-semibold text-white shadow-[0_16px_40px_-16px_rgb(11_18_32/0.6)] transition-transform duration-200 hover:-translate-y-px sm:right-5 sm:bottom-5"
      >
        <span className="size-2 rounded-full bg-[#9df27c]" aria-hidden />
        Judge tour paused · Resume step {tour.step + 1}
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    );
  }

  return <ActiveStep index={here} step={TOUR_STEPS[here]} minimized={tour.minimized} seen={tour.seen} />;
}

function ActiveStep({ index, step, minimized, seen }: { index: number; step: TourStep; minimized: boolean; seen: Record<string, string> }) {
  const ring = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [found, setFound] = useState(false);
  const previous = TOUR_STEPS[index - 1];
  const canGoBack = previous !== undefined && (previous.path === step.path || previous.path === null);

  // The spotlight follows its element every frame; the step moves on by itself when its moment comes.
  useEffect(() => {
    let frame = 0;
    let scrolled = false;
    const startedAt = performance.now();
    const next = TOUR_STEPS[index + 1];

    const tick = () => {
      const target = find(step.target);
      const shown = visible(target);
      setFound((was) => (was === shown ? was : shown));

      if (ring.current) {
        if (shown) {
          const rect = target.getBoundingClientRect();
          Object.assign(ring.current.style, {
            opacity: "1",
            transform: `translate(${rect.left - RING_PAD}px, ${rect.top - RING_PAD}px)`,
            width: `${rect.width + RING_PAD * 2}px`,
            height: `${rect.height + RING_PAD * 2}px`,
          });
        } else {
          ring.current.style.opacity = "0";
        }
      }

      if (shown && !scrolled) {
        scrolled = true;
        bringIntoView(target, card.current);
      }

      if (step.advance === "appear" && next && !shown && visible(find(next.target))) {
        advanceFrom(index);
        return;
      }
      if (step.optional && !shown && performance.now() - startedAt > OPTIONAL_WAIT_MS) {
        advanceFrom(index);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [index, step]);

  // On a phone the card covers the bottom of the screen: give the page room to scroll out from under it.
  useEffect(() => {
    if (minimized) return;
    const make = () => {
      const height = card.current?.getBoundingClientRect().height ?? 0;
      document.body.style.paddingBottom = window.innerWidth < 640 && height > 0 ? `${Math.ceil(height) + 24}px` : "";
    };
    make();
    const observer = new ResizeObserver(make);
    if (card.current) observer.observe(card.current);
    window.addEventListener("resize", make);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", make);
      document.body.style.paddingBottom = "";
    };
  }, [minimized, index]);

  // A click on the highlighted element moves the tour on, after the page has handled the click.
  useEffect(() => {
    if (step.advance !== "click") return;
    const id = step.clickTarget ?? step.target;
    const onClick = (event: MouseEvent) => {
      const hit = event.target instanceof Element ? event.target.closest(`[data-tour="${id}"]`) : null;
      if (hit) window.setTimeout(() => advanceFrom(index), 0);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [index, step]);

  const waiting = step.advance !== "next" && step.hint;
  const last = index === TOTAL - 1;

  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[59] rounded-[22px] opacity-0 transition-opacity duration-300 ease-out"
      >
        <motion.span
          className="absolute inset-0 rounded-[22px] border-2 border-hg-blue"
          animate={{ boxShadow: ["0 0 0 0px rgb(47 107 255 / 0.35)", "0 0 0 10px rgb(47 107 255 / 0)"] }}
          transition={{ duration: 1.6, ease: "easeOut", repeat: Infinity }}
        />
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {minimized ? (
          <motion.button
            key="pill"
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={() => updateTour((current) => ({ ...current, minimized: false }))}
            className="fixed right-4 bottom-4 z-[60] flex h-11 cursor-pointer items-center gap-2 rounded-full bg-hg-ink px-4 text-[13px] font-semibold text-white shadow-[0_16px_40px_-16px_rgb(11_18_32/0.6)] sm:right-5 sm:bottom-5"
          >
            <span className="size-2 rounded-full bg-[#9df27c]" aria-hidden />
            Judge tour · {index + 1} of {TOTAL}
            <ChevronUp className="size-4" aria-hidden />
          </motion.button>
        ) : (
          <motion.aside
            key="card"
            ref={card}
            aria-label="Judge tour"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed inset-x-3 bottom-3 z-[60] rounded-[24px] border border-line bg-white p-5 shadow-[0_24px_60px_-20px_rgb(11_18_32/0.4)] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[360px]"
          >
            <div className="flex items-center gap-2">
              <p className="flex-1 text-[12px] font-semibold tracking-[0.06em] text-hg-muted uppercase">
                Judge tour · {index + 1} of {TOTAL}
              </p>
              <button
                type="button"
                aria-label="Minimize the tour"
                onClick={() => updateTour((current) => ({ ...current, minimized: true }))}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-hg-muted transition-colors hover:bg-hg-blue-soft hover:text-hg-ink"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Exit the tour"
                onClick={endTour}
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-hg-muted transition-colors hover:bg-hg-blue-soft hover:text-hg-ink"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-hg-blue-soft">
              <motion.div
                className="h-full rounded-full bg-hg-blue"
                initial={false}
                animate={{ width: `${((index + 1) / TOTAL) * 100}%` }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25, ease: EASE }}
                aria-live="polite"
              >
                <h2 className="mt-4 text-[18px] leading-6 font-semibold tracking-[-0.02em] text-hg-ink">{step.title}</h2>
                <p className="mt-1.5 text-[14px] leading-[1.5] text-hg-ink-2">{step.body}</p>
                {waiting && found && (
                  <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-hg-blue">
                    <span className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-hg-blue/60" />
                      <span className="relative size-2 rounded-full bg-hg-blue" />
                    </span>
                    {step.hint}
                  </p>
                )}
                {last && <ClosingLinks seen={seen} />}
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex items-center justify-between gap-2">
              {canGoBack ? (
                <Button variant="ghost" size="sm" onClick={() => updateTour((current) => ({ ...current, step: index - 1 }))}>
                  <ArrowLeft className="size-3.5" aria-hidden />
                  Back
                </Button>
              ) : (
                <span />
              )}
              {last ? (
                <Button size="sm" onClick={endTour}>
                  Finish
                </Button>
              ) : (
                step.advance === "next" && (
                  <Button size="sm" onClick={() => advanceFrom(index)}>
                    Next
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>
                )
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function ClosingLinks({ seen }: { seen: Record<string, string> }) {
  const links = [
    { href: "/start", label: "Upload a statement and get a full plan" },
    { href: seen["/call"] ?? "/demo", label: "Live coach: on the call screen, press Get live tips" },
    { href: "/es", label: "The Spanish version" },
  ];
  return (
    <ul className="mt-3 flex flex-col gap-1.5">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            onClick={endTour}
            className={cn("flex items-center gap-1.5 text-[14px] font-semibold text-hg-blue underline-offset-4 hover:underline")}
          >
            <ArrowRight className="size-3.5 shrink-0" aria-hidden />
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Scrolls the element to the middle of the space the card leaves free, when it is not already in view. */
function bringIntoView(target: HTMLElement, card: HTMLElement | null) {
  const rect = target.getBoundingClientRect();
  const cardTop = card ? card.getBoundingClientRect().top : window.innerHeight;
  // On a phone the card covers the bottom of the screen; on a wide screen it sits beside the content.
  const covers = card ? card.getBoundingClientRect().left < rect.right : false;
  const bottom = covers ? cardTop - 12 : window.innerHeight;
  if (rect.top >= 8 && rect.bottom <= bottom) return;
  const room = bottom;
  const offset = rect.height < room ? (room - rect.height) / 2 : 16;
  window.scrollTo({ top: window.scrollY + rect.top - offset, behavior: "smooth" });
}
