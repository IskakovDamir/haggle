"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BellOff, CalendarClock, Clock, Phone, Receipt, RotateCcw, TriangleAlert, type LucideIcon } from "lucide-react";
import { Notice, PageSkeleton } from "@/components/call/page-states";
import { ArtEmptyState } from "@/components/empty/art-empty-state";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { caption, PageTitle, Pill } from "@/components/site/app-ui";
import { useClock } from "@/components/site/use-clock";
import { buttonVariants } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { useCaseFile } from "@/lib/store";
import type { CaseFile, IsoDate } from "@/lib/types";
import { cn } from "@/lib/utils";
import { alertsFor, type Alert, type AlertKind, type AlertWhen } from "./alerts-model";

const KIND: Record<AlertKind, { icon: LucideIcon; label: string }> = {
  promo_ending: { icon: Clock, label: "Promo rate" },
  plan_step: { icon: CalendarClock, label: "From your plan" },
  ask_again: { icon: RotateCcw, label: "Ask again" },
  follow_up: { icon: Phone, label: "The bank asked" },
  fee_due: { icon: Receipt, label: "Pay after your win" },
  missed_no_call: { icon: TriangleAlert, label: "Missed payment" },
};

const GROUPS: { when: AlertWhen; title: string }[] = [
  { when: "now", title: "Now" },
  { when: "soon", title: "In the next 30 days" },
  { when: "later", title: "Later" },
];

/**
 * One dated alert. The soonest one on the page is "featured": the brand gradient with the 3D alarm clock,
 * so the eye lands on what comes first.
 */
function AlertRow({ alert, today, featured = false }: { alert: Alert; today: IsoDate; featured?: boolean }) {
  const kind = KIND[alert.kind];
  const urgent = alert.when === "now";
  return (
    <article
      className={cn(
        "group/row relative flex flex-col gap-4 overflow-hidden rounded-[24px] p-5 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 sm:flex-row sm:items-center sm:gap-5 sm:rounded-[28px]",
        featured
          ? "bg-[linear-gradient(120deg,#2448f0_0%,#2f6bff_55%,#8db6ff_100%)] text-white hover:shadow-[0_18px_40px_-24px_rgb(36_72_240/0.7)]"
          : "bg-white hover:shadow-[0_16px_36px_-24px_rgb(11_18_32/0.3)]",
      )}
    >
      {featured && (
        <Image
          src="/app/3d/alarm-clock-3d.png"
          alt=""
          aria-hidden
          width={263}
          height={363}
          className="pointer-events-none absolute -top-3.5 -right-2 hidden h-auto w-[130px] max-w-none transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/row:-rotate-6 sm:block"
        />
      )}
      <div className="relative flex min-w-0 flex-1 items-start gap-3.5">
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            featured
              ? "bg-white/8 text-white"
              : alert.kind === "missed_no_call"
                ? "bg-leak-soft text-leak"
                : urgent
                  ? "bg-hg-blue text-white"
                  : "bg-hg-blue-soft text-hg-blue",
          )}
        >
          <kind.icon className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={cn(caption, "flex flex-wrap items-center gap-x-2 gap-y-1", featured ? "text-white/68" : "text-hg-muted")}>
            <span>{kind.label}</span>
            <span aria-hidden>·</span>
            <time dateTime={alert.date} className="tabular">
              {alert.date <= today ? "Today" : formatDate(alert.date)}
            </time>
          </p>
          <h3 className={cn("mt-1 text-[16px] leading-6 font-semibold tracking-[-0.01em]", featured ? "text-white" : "text-hg-ink")}>
            {alert.title}
          </h3>
          <p className={cn("mt-0.5 text-sm leading-snug font-medium", featured ? "text-white/68" : "text-hg-muted")}>{alert.detail}</p>
        </div>
      </div>
      <Link
        href={alert.action.href}
        className={cn(
          buttonVariants({ size: "sm", variant: urgent && !featured ? "default" : "outline" }),
          "group relative shrink-0 self-start sm:self-center",
          featured && "border-white/14 bg-white text-hg-ink hover:border-white/14 hover:bg-white",
        )}
      >
        {alert.action.label}
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </article>
  );
}

function AlertsBody({ caseFile, today }: { caseFile: CaseFile; today: IsoDate }) {
  const alerts = useMemo(() => {
    try {
      return alertsFor(caseFile, today);
    } catch {
      return null;
    }
  }, [caseFile, today]);

  if (!alerts) {
    return <Notice tone="alarm">We could not work out your alerts just now. Your cards are safe in this browser. Please reload the page.</Notice>;
  }
  // The first alert shown, in group order, gets the featured treatment.
  const featuredId = GROUPS.flatMap((group) => alerts.filter((alert) => alert.when === group.when))[0]?.id;

  return (
    <div>
      <PageTitle
        title="Alerts"
        lead="Dates that matter for your cards: a promo rate ending, a step coming due, what a bank asked for, a fee waiting after a win."
      />

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[24px] bg-white p-8 text-center sm:rounded-[28px] sm:p-12">
          <span aria-hidden className="flex size-12 items-center justify-center rounded-full bg-hg-blue-soft text-hg-blue">
            <BellOff className="size-5" />
          </span>
          <p className="text-[17px] font-semibold tracking-[-0.01em] text-hg-ink">Nothing needs you right now</p>
          <p className="max-w-[44ch] text-sm font-medium text-hg-muted">
            When a promo is about to end, a step comes due or a bank asks for something, it shows up here with its date.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {GROUPS.map((group) => {
            const items = alerts.filter((alert) => alert.when === group.when);
            if (items.length === 0) return null;
            return (
              <section key={group.when} aria-labelledby={`alerts-${group.when}`}>
                <h2 id={`alerts-${group.when}`} className="mb-3 flex items-center gap-2 text-[17px] leading-6 font-semibold tracking-[-0.01em] text-hg-ink">
                  {group.title}
                  <Pill tone="blue" className="tabular px-2.5 py-0.5">
                    {items.length}
                  </Pill>
                </h2>
                <Stagger as="ul" gap={0.06} className="flex flex-col gap-3">
                  {items.map((alert) => (
                    <StaggerItem as="li" key={alert.id}>
                      <AlertRow alert={alert} today={today} featured={alert.id === featuredId} />
                    </StaggerItem>
                  ))}
                </Stagger>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** /alerts: every dated thing in the case that needs the visitor, soonest first. */
export function AlertsScreen() {
  const { caseFile, ready } = useCaseFile();
  const clock = useClock();
  if (!ready || !clock) return <PageSkeleton />;
  if (!caseFile || caseFile.cards.length === 0) {
    return (
      <ArtEmptyState title="No alerts yet" art={{ src: "/app/3d/alarm-clock-3d.png", width: 263, height: 363 }}>
        Alerts come from your cards: promo rates that end, steps with dates, what a bank asked for. Start with a card statement.
      </ArtEmptyState>
    );
  }
  return <AlertsBody caseFile={caseFile} today={clock.today} />;
}
