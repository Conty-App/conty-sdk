import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: {
    resolve: ["@conty/core"],
    compilerOptions: { paths: { "@conty/core": ["../core/src/index.ts"] } },
  },
  noExternal: ["@conty/core"],
  target: "es2022",
  platform: "neutral",
});
