import tsEsLint from "typescript-eslint";
import pluginImport from "eslint-plugin-import";
import pluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import pluginUnusedImports from "eslint-plugin-unused-imports";
import pluginJs from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import pluginJest from "eslint-plugin-jest";
import pluginStylistic from "@stylistic/eslint-plugin";
import configPrettier from "eslint-config-prettier";

const testConfig = {
  ...pluginJest.configs["flat/recommended"],
  name: "Test Config",
  files: [
    "src/**/*.{test,spec}.{js,ts,jsx,tsx}",
    "src/**/__tests__/**/*.{js,ts,jsx,tsx}",
  ],
};

const stylisticConfig = {
  name: "Stylistic Config",
  files: ["src/**/*.{js,ts}"],
  plugins: { "@stylistic": pluginStylistic },
  rules: {
    "@stylistic/padding-line-between-statements": [
      "error",
      { blankLine: "always", prev: "*", next: "return" },
      { blankLine: "always", prev: "*", next: ["function", `class`] },
      { blankLine: "always", prev: "*", next: ["if", "switch"] },
      { blankLine: "always", prev: "directive", next: "*" },
      { blankLine: "never", prev: "directive", next: "directive" },
    ],
  },
};

const importConfig = {
  name: "Import Config",
  files: ["src/**/*.{js,ts}"],
  plugins: {
    import: pluginImport,
    "simple-import-sort": pluginSimpleImportSort,
    "unused-imports": pluginUnusedImports,
  },
  settings: {
    ...pluginImport.configs.react.settings,
    ...pluginImport.configs.typescript.settings,
    "import/resolver": {
      ...pluginImport.configs.typescript.settings["import/resolver"],
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
  rules: {
    ...pluginImport.configs.recommended.rules,
    ...pluginImport.configs.typescript.rules,
    "import/no-unresolved": ["error", { ignore: ["^/.+\\.(svg|png|jpg)$"] }],
    "import/extensions": [
      "error",
      "always",
      {
        js: "always",
        jsx: "always",
        ts: "always",
        tsx: "always",
        ignorePackages: true,
      },
    ],
    // for eslint-plugin-simple-import-sort
    "simple-import-sort/imports": [
      "error",
      {
        groups: [
          ["^react(-dom)?", "^node:", "^@?\\w", "^@/.*", "^\\.+/(?!assets/)"],
          ["^.+\\.json$", "^.+\\.(svg|png|jpg)$", "^.+\\.s?css$"],
        ],
      },
    ],
    "simple-import-sort/exports": "error",
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-duplicates": "error",
    // for eslint-plugin-unused-imports
    "@typescript-eslint/no-unused-vars": "off",
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        args: "after-used",
        argsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        vars: "all",
        varsIgnorePattern: "^_",
      },
    ],
  },
};

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"] },
  {
    ignores: ["{dist,build,node_modules}/**", "**/*.config.*"],
  },
  {
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
      parserOptions: {
        project: ["tsconfig.json", "tsconfig.*.json"],
      },
    },
  },
  pluginJs.configs.recommended,
  tsEsLint.configs.recommendedTypeChecked,
  tsEsLint.configs.stylistic,
  importConfig,
  stylisticConfig,
  testConfig,
  configPrettier,
]);
