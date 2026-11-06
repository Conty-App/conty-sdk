import { describe, expect, it } from "vitest";
import { ContyError, errorFromResponse, toContyError } from "../errors";

describe("errorFromResponse", () => {
  it("reads the API error envelope", async () => {
    const response = new Response(
      JSON.stringify({ error: { code: "rate_limited", message: "Muitas.", details: { a: 1 } } }),
      { status: 429 },
    );

    await expect(errorFromResponse(response)).resolves.toMatchObject({
      status: 429,
      code: "rate_limited",
      message: "Muitas.",
      details: { a: 1 },
    });
  });

  it("accepts a non-JSON body", async () => {
    const error = await errorFromResponse(new Response("Bad Request", { status: 400 }));

    expect(error).toMatchObject({ status: 400, code: "http_400", message: "Bad Request" });
  });
});

describe("toContyError", () => {
  it("keeps ContyError and wraps anything else with the given code", () => {
    const original = new ContyError({ status: 500, code: "x", message: "y" });

    expect(toContyError(original, "network_error")).toBe(original);
    expect(toContyError(new TypeError("offline"), "network_error")).toMatchObject({
      code: "network_error",
      message: "offline",
      status: null,
    });
  });
});
