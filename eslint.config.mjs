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
    "next-env.d.ts",
  ]),
  {
    files: ["src/app/(tutorial)/**"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [
          { name: "@/lib/supabase", message: "Tutorial must not use Supabase." },
          { name: "@/lib/supabase-admin", message: "Tutorial must not use Supabase." },
          { name: "@/actions/feast", message: "Tutorial must not call server actions." },
          { name: "@/actions/results", message: "Tutorial must not call server actions." },
          { name: "@/actions/content", message: "Tutorial must not call server actions." },
        ],
      }],
    },
  },
]);

export default eslintConfig;
