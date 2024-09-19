import { defineConfig } from "vite";
import glsl from 'vite-plugin-glsl';

export default defineConfig(({ mode}) => {
  if (mode === "cf") {
    return {
      plugins: [glsl()],
    };
  } else {
    return {
      base: "/visual-demo/",
      plugins: [glsl()],
    };
  }
});
