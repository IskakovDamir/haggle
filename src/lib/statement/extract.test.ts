// extractStatement against a fake model client. Nothing here touches the network.
import Anthropic from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatementError, type StatementErrorCode } from "./errors";
import { extractStatement, type StatementModelClient } from "./extract";
import { STATEMENT_JSON_SCHEMA } from "./schema";

type ModelReply = Awaited<ReturnType<StatementModelClient["messages"]["create"]>>;

/** The answer a model gives for Maria's Chase statement: printed text, and "" where nothing is printed. */
const CHASE_ANSWER = {
  isCreditCardStatement: true,
  issuerName: "Chase",
  cardName: "Freedom Unlimited",
  cardholderName: "MARIA LOPEZ",
  accountEnding: "4417",
  newBalance: "$8,400.00",
  creditLimit: "$10,000.00",
  purchaseApr: "27.24% (v)",
  penaltyApr: "",
  promoApr: "",
  promoEndsOn: "",
  minimumPaymentDue: "$274.68",
  annualFee: "$0.00",
  lateFeeCharged: "",
  interestCharged: "$190.68",
  statementClosingDate: "2026-11-06",
  paymentDueDate: "2026-12-01",
  memberSinceYear: "2020",
  latePaymentsLast12Months: "0",
};

const NOT_A_STATEMENT = Object.fromEntries(
  Object.keys(CHASE_ANSWER).map((field) => [field, field === "isCreditCardStatement" ? false : ""]),
);

const PDF = { bytes: new TextEncoder().encode("%PDF-1.7 sample"), mediaType: "application/pdf" };

const answering = (answer: unknown, stop_reason: ModelReply["stop_reason"] = "end_turn"): ModelReply => ({
  stop_reason,
  content: [{ type: "text", text: typeof answer === "string" ? answer : JSON.stringify(answer), citations: null }],
});

/** A client that replies with `reply`, or throws it when it is an error. */
function fakeClient(reply: ModelReply | Error) {
  const create = vi.fn(async (body: Anthropic.MessageCreateParamsNonStreaming) => {
    void body;
    if (reply instanceof Error) throw reply;
    return reply;
  });
  const client: StatementModelClient = { messages: { create } };
  return { client, create };
}

async function codeOf(attempt: Promise<unknown>): Promise<StatementErrorCode | "no error"> {
  try {
    await attempt;
    return "no error";
  } catch (error) {
    if (error instanceof StatementError) return error.code;
    throw error;
  }
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("extractStatement", () => {
  it("turns the model's copy into a card with integer cents and basis points", async () => {
    const { client } = fakeClient(answering(CHASE_ANSWER));
    const extraction = await extractStatement(PDF, client);

    expect(extraction.source).toBe("upload");
    expect(extraction.holderFirstName).toBe("Maria");
    expect(extraction.warnings).toEqual([]);
    expect(extraction.card).toMatchObject({
      issuer: "chase",
      last4: "4417",
      balanceCents: 840_000,
      purchaseAprBps: 2724,
      creditLimitCents: 1_000_000,
      penaltyAprBps: null,
      promo: null,
      lateFeeCents: 0,
      statementDate: "2026-11-06",
    });
    expect(extraction.card.id).not.toBe("");
  });

  it("sends the PDF as a document before the text, with the schema and no sampling or thinking settings", async () => {
    const { client, create } = fakeClient(answering(CHASE_ANSWER));
    await extractStatement(PDF, client);

    const request = create.mock.calls[0][0];
    expect(request.output_config).toEqual({
      effort: "low",
      format: { type: "json_schema", schema: STATEMENT_JSON_SCHEMA },
    });
    expect(request).not.toHaveProperty("temperature");
    expect(request).not.toHaveProperty("top_p");
    expect(request).not.toHaveProperty("thinking");
    expect(request.messages).toHaveLength(1);
    expect(request.messages[0].content).toEqual([
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: Buffer.from(PDF.bytes).toString("base64") },
      },
      { type: "text", text: expect.any(String) },
    ]);
  });

  it("tells the model to copy, to leave blank what is not printed, and never to compute or guess", async () => {
    const { client, create } = fakeClient(answering(CHASE_ANSWER));
    await extractStatement(PDF, client);

    const instructions = String(create.mock.calls[0][0].system);
    expect(instructions).toContain("exactly as printed");
    expect(instructions).toContain("return an empty string");
    expect(instructions).toContain("Never guess");
    expect(instructions).toContain("work anything out");
  });

  it("sends a photo as an image", async () => {
    const { client, create } = fakeClient(answering(CHASE_ANSWER));
    await extractStatement({ bytes: new Uint8Array([0xff, 0xd8, 0xff]), mediaType: "image/jpeg" }, client);

    expect(create.mock.calls[0][0].messages[0].content).toMatchObject([
      { type: "image", source: { type: "base64", media_type: "image/jpeg" } },
      { type: "text" },
    ]);
  });

  it("keeps the model's misreadings as warnings for the visitor", async () => {
    const { client } = fakeClient(answering({ ...CHASE_ANSWER, purchaseApr: "72.24%", interestCharged: "" }));
    const { warnings } = await extractStatement(PDF, client);
    expect(warnings.map((warning) => warning.field)).toEqual(["purchaseAprBps"]);
  });

  it("signals unreadable when the document is not a credit card statement", async () => {
    const { client } = fakeClient(answering(NOT_A_STATEMENT));
    expect(await codeOf(extractStatement(PDF, client))).toBe("unreadable");
  });

  it("signals unreadable when neither a balance nor a rate was on the page", async () => {
    const { client } = fakeClient(answering({ ...CHASE_ANSWER, newBalance: "", purchaseApr: "" }));
    expect(await codeOf(extractStatement(PDF, client))).toBe("unreadable");
  });

  it("refuses a file type it cannot read without calling the model", async () => {
    const { client, create } = fakeClient(answering(CHASE_ANSWER));
    expect(await codeOf(extractStatement({ bytes: PDF.bytes, mediaType: "text/plain" }, client))).toBe("unsupported");
    expect(create).not.toHaveBeenCalled();
  });

  it.each(["refusal", "max_tokens"] as const)("fails when the model stops with %s", async (stopReason) => {
    const { client } = fakeClient(answering(CHASE_ANSWER, stopReason));
    expect(await codeOf(extractStatement(PDF, client))).toBe("failed");
  });

  it("fails when the answer is not JSON or not the agreed shape", async () => {
    expect(await codeOf(extractStatement(PDF, fakeClient(answering("Here is the statement:")).client))).toBe("failed");
    const extraField = { ...CHASE_ANSWER, fullCardNumber: "4111111111114417" };
    expect(await codeOf(extractStatement(PDF, fakeClient(answering(extraField)).client))).toBe("failed");
    const wrongType = { ...CHASE_ANSWER, newBalance: 8400 };
    expect(await codeOf(extractStatement(PDF, fakeClient(answering(wrongType)).client))).toBe("failed");
  });

  it("maps provider errors to our own codes and never passes the provider's message on", async () => {
    const headers = new Headers();
    const secret = "provider detail sk-ant-secret";
    const cases: [Error, StatementErrorCode][] = [
      [new Anthropic.AuthenticationError(401, undefined, secret, headers), "not_configured"],
      [new Anthropic.RateLimitError(429, undefined, secret, headers), "rate_limited"],
      [new Anthropic.BadRequestError(400, undefined, secret, headers), "unreadable"],
      [new Anthropic.InternalServerError(500, undefined, secret, headers), "failed"],
      [new Anthropic.APIConnectionError({ message: secret }), "failed"],
      [new TypeError(secret), "failed"],
    ];

    for (const [providerError, code] of cases) {
      const error: unknown = await extractStatement(PDF, fakeClient(providerError).client).catch((thrown) => thrown);
      expect(error).toBeInstanceOf(StatementError);
      expect((error as StatementError).code).toBe(code);
      expect((error as StatementError).message).not.toContain("sk-ant");
    }
  });

  it("answers not_configured when there is no key and no client was passed", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    expect(await codeOf(extractStatement(PDF))).toBe("not_configured");
  });
});
