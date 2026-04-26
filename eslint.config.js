import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["apps/api/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: new URL("./apps/api", import.meta.url).pathname,
        project: "./tsconfig.json",
      },
    },
  },
  {
    files: ["apps/mobile/**/*.ts", "apps/mobile/**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: new URL("./apps/mobile", import.meta.url).pathname,
        project: "./tsconfig.json",
      },
    },
  },
];
