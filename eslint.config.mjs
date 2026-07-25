import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "android/**/build/**",
    "ios/**/build/**",
    "ios/DerivedData/**",
    "test-results/**",
    "playwright-report/**",
    "next-env.d.ts",
    // Compiled output of the Electron desk pet subapp.
    "apps/desk-pet/dist/**",
  ]),
]);

export default eslintConfig;
