// Why a statement could not be read. The codes are the ones POST /api/extract answers with (SPEC.md),
// and every message is written for the visitor: no provider details ever reach the page.

export type StatementErrorCode =
  | "not_configured"
  | "too_large"
  | "unsupported"
  | "unreadable"
  | "rate_limited"
  | "failed";

export class StatementError extends Error {
  readonly code: StatementErrorCode;

  constructor(code: StatementErrorCode, message: string) {
    super(message);
    this.name = "StatementError";
    this.code = code;
  }
}
