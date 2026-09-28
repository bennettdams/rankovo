import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";
import tsEslint from "typescript-eslint";

const eslintConfig = defineConfig([
  // Needed for "@typescript-eslint/no-unnecessary-condition"
  {
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  ...nextVitals,
  ...nextTs,
  eslint.configs.recommended,
  tsEslint.configs.recommended,
  eslintConfigPrettier,

  {
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unused-vars": "warn",

      "no-console": [
        "warn",
        {
          allow: ["info", "error", "debug", "warn"],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "node_modules/**",
    "global.d.ts",
  ]),
]);

export default eslintConfig;
