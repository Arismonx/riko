import pluginJs from "@eslint/js";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";


/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {
    plugins: {
        "simple-import-sort": simpleImportSort,
    },
    rules: {
        "simple-import-sort/imports": "warn",
        "simple-import-sort/exports": "warn",
    },
    ignores: ["**/src/components/ui/**"],
},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];