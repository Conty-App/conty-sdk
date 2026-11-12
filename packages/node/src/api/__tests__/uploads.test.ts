import { describe, expect, it } from "vitest";
import { apiError, BASE, call, IDEMPOTENCY, json, setup } from "./setup";

describe("uploads.create", () => {
  const body = {
    purpose: "briefing_attachment" as const,
    file_name: "briefing.pdf",
    mime_type: "application/pdf",
    size_bytes: 1024,
  };

  it("asks for a signed URL without Idempotency-Key", async () => {
    const upload = {
      upload_url: "https://storage.example.com/put",
      upload_ref: "upl_1",
      url: null,
      expires_at: "2026-11-11T10:15:00.000Z",
    };
    const { conty, fetch } = setup([json(upload, 201)]);

    const { data } = await conty.uploads.create(body);

    expect(data).toEqual(upload);
    const { url, init, headers, body: sent } = call(fetch);
    expect(url).toBe(`${BASE}/uploads`);
    expect(init?.method).toBe("POST");
    expect(headers.get("Idempotency-Key")).toBeNull();
    expect(sent).toEqual(body);
  });

  it("does not retry and returns the validation details of a 422", async () => {
    const details = [{ path: "size_bytes", message: "Too big" }];
    const { conty, fetch } = setup([apiError(422, "validation_failed", {}, details)]);

    const { error } = await conty.uploads.create(body);

    expect(error).toMatchObject({ status: 422, code: "validation_failed", details });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("does not retry a 503 because the request has no Idempotency-Key", async () => {
    const { conty, fetch } = setup([apiError(503, "internal_error")]);

    const { error } = await conty.uploads.create(body);

    expect(error?.status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

describe("uploads.import", () => {
  const body = { purpose: "cover" as const, url: "https://example.com/cover.png" };

  it("posts the link with a generated Idempotency-Key", async () => {
    const imported = {
      upload_ref: "upl_2",
      url: "https://cdn.example.com/cover.png",
      file_name: "cover.png",
      mime_type: "image/png",
      size_bytes: 2048,
    };
    const { conty, fetch } = setup([json(imported, 201)]);

    const { data } = await conty.uploads.import(body);

    expect(data).toEqual(imported);
    const { url, init, headers, body: sent } = call(fetch);
    expect(url).toBe(`${BASE}/uploads/import`);
    expect(init?.method).toBe("POST");
    expect(headers.get("Idempotency-Key")).toBe(IDEMPOTENCY);
    expect(sent).toEqual(body);
  });

  it("retries a 502 with the same caller key", async () => {
    const { conty, fetch } = setup([apiError(502, "internal_error"), json({ upload_ref: "u" })]);

    const { error } = await conty.uploads.import(body, { idempotencyKey: "cover-1" });

    expect(error).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(call(fetch, 1).headers.get("Idempotency-Key")).toBe("cover-1");
  });

  it("returns the details of a rejected file", async () => {
    const details = { mime_type: "image/gif" };
    const { conty, fetch } = setup([apiError(422, "invalid_file_type", {}, details)]);

    const { error } = await conty.uploads.import(body);

    expect(error).toMatchObject({ status: 422, code: "invalid_file_type", details });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
