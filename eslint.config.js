import { library } from "@stately-cloud/eslint";

export default [
  ...library,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: ["dist/", "**/*.pb.ts"],
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-definitions": "off",
    },
  },
];
