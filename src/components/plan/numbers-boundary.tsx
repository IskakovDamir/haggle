"use client";

import Link from "next/link";
import { catchError, type ErrorInfo } from "next/error";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/primitives";

function NumbersNotReady(_props: object, { retry }: ErrorInfo) {
  return (
    <Card className="mx-auto max-w-xl p-6 sm:p-10" role="alert">
      <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">
        The numbers are <em>not ready yet</em>
      </h1>
      <p className="mt-3 text-muted">
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
  );
}

/**
 * Wraps the plan. If the engine throws while working out the numbers, the visitor sees one calm
 * sentence and a way forward instead of a crashed page.
 */
export const NumbersBoundary = catchError(NumbersNotReady);
