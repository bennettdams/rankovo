import { fixupConfigRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import reactCompiler from "eslint-plugin-react-compiler";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

// eslint-disable-next-line import/no-anonymous-default-export
export default [
  ...fixupConfigRules(
    compat.extends(
      "next/core-web-vitals",
      "next/typescript",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended-legacy",
      "prettier",
    ),
  ),
  {
    plugins: {
      "react-compiler": reactCompiler,
    },

    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "react-compiler/react-compiler": "error",
      "react/react-in-jsx-scope": "off",
    },
  },
];
