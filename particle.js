import * as THREE from "three";
import { vertexShader, fragmentShader } from "./shaders.js";

export function initParticle(size) {
  // 创建几何体，包含8个顶点
  const geometry = new THREE.BufferGeometry();
  const numParticles = size * size; // 8个粒子
  const colors = window.sphereColors; // 每个粒子有 R、G、B 颜色

  // 创建 vertexIndex 属性
  const vertexIndices = new Float32Array(numParticles);
  for (let i = 0; i < numParticles; i++) {
    vertexIndices[i] = i;
  }
  geometry.setAttribute(
    "vertexIndex",
    new THREE.BufferAttribute(vertexIndices, 1)
  );

  // 创建 position 属性（仍需要，因为 THREE.Points 需要它，但值将由着色器覆盖）
  const positions = new Float32Array(numParticles * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 4));

  // 创建材质，使用自定义着色器
  const material = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      positionTexture: { value: null }, // 位置纹理
      resolution: { value: new THREE.Vector2(size, size) },
      pointSize: { value: 1.0 },
      transparent: { value: 0.7 },
      useColor: { value: true },
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
  });

  // 创建点
  const points = new THREE.Points(geometry, material);
  return points;
}
