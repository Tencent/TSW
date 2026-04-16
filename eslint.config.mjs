import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
export default tseslint.config(
  {
    ignores: [
      "examples/**",
      "benchmark/**",
      "node_modules/**",
      "dist/**",
      "coverage/**",
      "vitest.config.ts"
    ]
  },

  ...tseslint.configs.recommended,

  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off"
    }
  },

  {
    files: ["lib/**/*.ts"],
    ignores: ["**/__test__/**", "**/__fixtures__/**"],
    plugins: {
      jsdoc
    },
    languageOptions: {
      parserOptions: {
        project: "tsconfig.json"
      }
    },
    rules: {
      "no-console": "off",

      "no-underscore-dangle": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "no-param-reassign": "off",

      "max-len": ["error", { "code": 120, "ignoreComments": true }],

      quotes: ["error", "double"],

      "comma-dangle": ["error", "never"],

      "lines-between-class-members": ["error", "always", { "exceptAfterSingleLine": true }],

      "padding-line-between-statements": [
        "error",
        { "blankLine": "always", "prev": "class", "next": "*" },
        { "blankLine": "always", "prev": "function", "next": "*" },
        { "blankLine": "always", "prev": "iife", "next": "*" },
        { "blankLine": "always", "prev": "multiline-block-like", "next": "*" },
        { "blankLine": "always", "prev": "multiline-expression", "next": "*" }
      ],

      "jsdoc/check-param-names": "error",
      "jsdoc/check-tag-names": "error",

      "@typescript-eslint/no-empty-function": [
        "error",
        { "allow": ["arrowFunctions"] }
      ],

      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",

      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off"
    }
  }
);
