import * as THREE from "three";
import { initScene } from "./scene.js";
import {
  initControls,
  initStats,
  initAxes,
  initRuler,
  initCaption,
} from "./controls.js";
import { initSpherePoints } from "./geometry.js";
import { initGPUComputationRenderer } from "./gpgpu.js";
import { initParticle } from "./particle.js";
import { generateTransformationMatrices } from "./transformationMatrix.js";
import { initGUI } from "./lilGUI.js";

const { scene, camera, renderer } = initScene();

const params = initGUI(renderer);

const controls = initControls(camera, renderer);
const stats = initStats();
// initAxes(scene);
// initRuler(scene);
// initCaption(scene);

// 设置纹理大小
const size = 1024;
const radius = 1;
// 初始化球体上的点
initSpherePoints(size * size, radius);

const { gpuCompute, positionVariable, backgroundPositionVariable } =
  initGPUComputationRenderer(size, renderer);

const points = initParticle(size);
scene.add(points);

const startTime = performance.now();
let elapsedTime = 0;
const targetFPS = 70; // 目标帧率
const frameDuration = 1000 / targetFPS; // 每帧的时间（毫秒）
let lastFrameTime = performance.now();

function animate() {
  const currentTime = performance.now();
  const elapsedTime = currentTime - startTime;
  // 计算从上一帧到现在的时间差（毫秒）
  const deltaTime = currentTime - lastFrameTime;
  if (deltaTime >= frameDuration) {
    params.noiseMatrix.translationValues.y = (elapsedTime / 1000) * 0.08;
    lastFrameTime = currentTime;

    const {
      noiseTransformationMatrix,
      positionTransformationMatrix,
      backgroundTransformationMatrix,
    } = generateTransformationMatrices(
      params.backgroundMatrix,
      params.noiseMatrix,
      params.positionMatrix,
      deltaTime
    );
    const rep = new THREE.Vector3(params.repX, params.repY, params.repZ); // 周期性噪声的 rep 参数

    // 设置 Uniforms
    positionVariable.material.uniforms.noiseTransformMatrix = {
      value: noiseTransformationMatrix,
    };
    positionVariable.material.uniforms.positionTransformMatrix = {
      value: positionTransformationMatrix,
    };
    positionVariable.material.uniforms.rep = { value: rep };
    positionVariable.material.uniforms.seed = { value: params.seed };
    backgroundPositionVariable.material.uniforms.backgroundTransformMatrix = {
      value: backgroundTransformationMatrix,
    };

    // 计算下一帧的位置
    gpuCompute.compute();

    const backgroundPositionTexture = gpuCompute.getCurrentRenderTarget(
      backgroundPositionVariable
    ).texture;

    // 获取计算后的纹理
    const posTexture =
      gpuCompute.getCurrentRenderTarget(positionVariable).texture;

    // 更新材质的 Uniform
    points.material.uniforms.positionTexture.value = posTexture;

    // 更新 OrbitControls
    controls.update();
    stats.update();
    renderer.render(scene, camera);
  }

  requestAnimationFrame(animate);
}

animate();