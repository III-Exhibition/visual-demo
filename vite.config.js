import glsl from "vite-plugin-glsl";

export default {
  plugins: [glsl()],
  base: "/visual-demo/",
  assetsInclude: ['**/*.tiff'],
};
