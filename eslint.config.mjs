import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Patterns to ignore (migrated from .eslintignore)
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/build/**",
      "**/out/**",
      "**/public/**",
      "**/src/generated/**",
      "**/wasm.js",
      "**/react-native.js",
      "**/prisma/client/**",
      "**/*.prisma-client-*",
      "**/*.generated.*",
    ],
  },
  // Base configuration
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Specific configuration for generated files
  {
    files: ["src/generated/**/*"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-expressions": "off",
      "no-unused-vars": "off",
    },
  },
  // General rules for all other files
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
