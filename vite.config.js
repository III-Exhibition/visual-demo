import { defineConfig } from "vite";

export default defineConfig(({ mode}) => {
  if (mode === "cf") {
    return {
    };
  } else {
    return {
      base: "/visual-demo/",
    };
  }
});
