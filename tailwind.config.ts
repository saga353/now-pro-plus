import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class', // ⭐️ 핵심: 수동 다크/라이트 모드 스위치 켜기!
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;