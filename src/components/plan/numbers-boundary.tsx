"use client";

import Link from "next/link";
import { catchError, type ErrorInfo } from "next/error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";
import { Reveal } from "@/components/motion/reveal";

function NumbersNotReady(_props: object, { retry }: ErrorInfo) {
  return (
    <Reveal y={16} className="mx-auto max-w-xl">
      <Card className="p-6 sm:rounded-[32px] sm:p-10" role="alert">
        <h1 className="text-[clamp(28px,3.6vw,40px)] leading-[1.125] font-semibold">
          The numbers are <em>not ready yet</em>
        </h1>
        <p className="mt-3 font-medium text-muted">
          We could not work out your plan just now. Your statement is safe in this browser. Try again, or check the
          numbers you entered.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => retry()}>Try again</Button>
          <Link href="/start" className={buttonVariants({ variant: "outline" })}>
            Add a statement
          </Link>
        </div>
      </Card>
    </Reveal>
  );
}

/**
 * Wraps the plan. If the engine throws while working out the numbers, the visitor sees one calm
 * sentence and a way forward instead of a crashed page.
 */
export const NumbersBoundary = catchError(NumbersNotReady);
