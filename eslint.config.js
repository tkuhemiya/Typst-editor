import js from "@eslint/js";
import tailwindcss from "eslint-plugin-tailwindcss";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tailwindcss.configs["flat/recommended"],
  prettier,
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        React: "readonly",
      },
    },
    settings: {
      tailwindcss: {
        callees: ["classnames", "clsx", "ctl", "cn", "cva", "tw"],
        config: "./tailwind.config.ts",
      },
    },
  },
  {
    ignores: ["dist", "node_modules", ".bun", "*.wasm", "*.lock", "public"],
  },
];
