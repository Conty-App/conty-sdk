import { defineConfig, type Options } from "tsup";

const core: Options = { noExternal: ["@conty/core"], platform: "browser" };

export default defineConfig([
  {
    ...core,
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: {
      resolve: ["@conty/core"],
      compilerOptions: { paths: { "@conty/core": ["../core/src/index.ts"] } },
    },
    target: "es2018",
  },
  {
    ...core,
    entry: { sdk: "src/install/global.ts" },
    format: ["iife"],
    minify: "terser",
    terserOptions: { compress: { passes: 2 }, toplevel: true, ecma: 2018 },
    target: "es2018",
    outExtension: () => ({ js: ".js" }),
  },
]);
