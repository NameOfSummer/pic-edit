import js from "@eslint/js";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      jsdoc,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    settings: {
      jsdoc: {
        mode: "typescript",
      },
    },
    rules: {
      // function 宣言、およびファイル直下の const / var / type に JSDoc を必須にする。
      // 関数内の定数と、sort / map に渡す無名関数は対象外。
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: false,
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
            MethodDefinition: false,
            ClassDeclaration: false,
          },
          contexts: [
            "Program > VariableDeclaration[kind='const']",
            "Program > VariableDeclaration[kind='var']",
            // JSDoc は export の直前に付く。内側の VariableDeclaration には紐づかない。
            "ExportNamedDeclaration[declaration.kind='const']",
            "ExportNamedDeclaration[declaration.kind='var']",
            "TSTypeAliasDeclaration",
          ],
        },
      ],
      "jsdoc/require-description": "error",
      "jsdoc/require-param": [
        "error",
        {
          contexts: ["FunctionDeclaration"],
          checkDestructured: false,
          unnamedRootBase: ["props"],
        },
      ],
      "jsdoc/require-returns": [
        "error",
        {
          contexts: ["FunctionDeclaration"],
          forceRequireReturn: true,
        },
      ],
      "jsdoc/require-returns-type": [
        "error",
        {
          contexts: ["FunctionDeclaration"],
        },
      ],
      // React Compiler 向けの厳格ルールは既存パターンと衝突するため、
      // Hooks の基本ルールのみ適用する。
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
);
