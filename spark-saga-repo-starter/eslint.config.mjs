import { defineConfig } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";

export default defineConfig([
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      ...prettierConfig.rules,
      "no-var": "error",
    },
  },
]);
