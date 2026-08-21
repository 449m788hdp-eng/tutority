import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";

export default [js.configs.recommended, nextPlugin.configs.recommended, { ignores: [".next/**", "node_modules/**", "supabase/**"] }];
