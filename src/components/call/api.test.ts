import { describe, expect, it } from "vitest";
import { z } from "zod";
import { readResponse } from "./api";

const schema = z.object({ reply: z.string(), done: z.boolean() });

describe("readResponse", () => {
  it("returns the data of a well-formed success", () => {
    expect(readResponse(200, { reply: "Hello.", done: false }, schema)).toEqual({
      ok: true,
      data: { reply: "Hello.", done: false },
    });
  });

  it("refuses a success whose body has the wrong shape", () => {
    expect(readResponse(200, { reply: 42 }, schema)).toMatchObject({ ok: false, code: "failed" });
  });

  it("passes the server's own sentence and code through on an error", () => {
    const body = { error: "Calls are not set up on this server.", code: "not_configured" };
    expect(readResponse(503, body, schema)).toEqual({ ok: false, ...body });
  });

  it("falls back to a plain sentence when an error has no readable body", () => {
    for (const body of [null, "<html>502</html>", { message: "nope" }]) {
      const result = readResponse(502, body, schema);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/could not read/);
    }
  });
});
