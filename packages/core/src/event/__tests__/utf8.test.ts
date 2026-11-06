import { describe, expect, it } from "vitest";
import { utf8ByteLength } from "../utf8";

const encoded = (text: string) => new TextEncoder().encode(text).byteLength;

describe("utf8ByteLength", () => {
  it.each([
    ["empty", ""],
    ["ascii", 'sign_up {"plan":"pro"}'],
    ["accented pt-BR", "Ação, coração, pão, avó, à vista, Conceição"],
    ["emoji", "🎉 compra feita 👩‍👩‍👧 🇧🇷"],
    ["lone high surrogate", "a\ud83db"],
    ["lone low surrogate", "a\ude00b"],
    ["trailing high surrogate", "fim\ud83d"],
    ["three byte", "€ ✓ 中文"],
  ])("matches TextEncoder for %s", (_, text) => {
    expect(utf8ByteLength(text)).toBe(encoded(text));
  });
});
