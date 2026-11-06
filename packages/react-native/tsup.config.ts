import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: ["esm", "cjs"],
  dts: {
    resolve: ["@conty/core"],
    compilerOptions: { paths: { "@conty/core": ["../core/src/index.ts"] } },
  },
  noExternal: ["@conty/core"],
  external: ["react-native", "@react-native-async-storage/async-storage"],
  target: "es2018",
  platform: "neutral",
});
