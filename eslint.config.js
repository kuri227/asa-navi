// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "react",
            "react-native",
            "expo",
            "expo-*",
            "@/application/*",
            "@/infrastructure/*",
          ],
        },
      ],
    },
  },
  {
    ignores: ["dist/*"],
  },
]);
