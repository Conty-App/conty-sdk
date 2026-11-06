import { describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({
  Linking: { getInitialURL: vi.fn(), addEventListener: vi.fn() },
  Platform: { OS: "ios", Version: "17.4" },
  storage: { getItem: vi.fn(), setItem: vi.fn() },
}));

vi.mock("react-native", () => ({ Linking: native.Linking, Platform: native.Platform }));
vi.mock("@react-native-async-storage/async-storage", () => ({ default: native.storage }));

describe('import { conty, createConty } from "@conty/react-native"', () => {
  it("reads no deep link or storage when imported", async () => {
    const { conty, createConty } = await import("../index");

    expect(typeof conty.track).toBe("function");
    expect(typeof createConty).toBe("function");
    expect(native.Linking.getInitialURL).not.toHaveBeenCalled();
    expect(native.Linking.addEventListener).not.toHaveBeenCalled();
    expect(native.storage.getItem).not.toHaveBeenCalled();
  });

  it("defaults to AsyncStorage, Linking and Platform", async () => {
    const { createConty } = await import("../index");
    native.Linking.getInitialURL.mockResolvedValue(null);
    native.storage.getItem.mockResolvedValue(null);

    createConty({ fetch: () => Promise.resolve(new Response()) }).init("cpk_x");
    await vi.waitFor(() => expect(native.Linking.getInitialURL).toHaveBeenCalled());

    expect(native.storage.getItem).toHaveBeenCalledWith("conty_attribution");
    expect(native.Linking.addEventListener).toHaveBeenCalledWith("url", expect.any(Function));
  });
});
