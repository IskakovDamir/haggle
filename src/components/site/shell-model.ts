// What the app frame shows around every screen: who it is for, the alert count, the top bar's alert and
// where "New call" goes. Pure. When the engine cannot work the case out, the frame still renders, quietly.
import type { CaseFile, IsoDate } from "@/lib/types";
import { alertsFor, headlineAlert, type Alert } from "@/components/alerts/alerts-model";
import { newCallHref } from "@/components/overview/overview-model";
import { initialOf } from "./nav";

export type ShellData = {
  /** The holder's first name, or null before there is a case. */
  name: string | null;
  initial: string;
  alertCount: number;
  /** The alert the top bar names, if there is one. */
  chip: Alert | null;
  newCallHref: string;
};

export function shellData(caseFile: CaseFile | null, today: IsoDate): ShellData {
  const name = caseFile?.holderFirstName.trim() || null;
  let alerts: Alert[] = [];
  let href = "/start";
  try {
    if (caseFile && caseFile.cards.length > 0) alerts = alertsFor(caseFile, today);
    href = newCallHref(caseFile, today);
  } catch {
    // The screen itself explains what went wrong; the frame just leaves the extras out.
    href = caseFile && caseFile.cards.length > 0 ? "/calls" : "/start";
  }
  return { name, initial: initialOf(name), alertCount: alerts.length, chip: headlineAlert(alerts, today), newCallHref: href };
}
