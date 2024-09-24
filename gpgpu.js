import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import {
  computeFragmentShader,
  backgroundComputeFragmentShader,
} from "./shaders.js";

// 创建 GPUComputationRenderer 实例
export function initGPUComputationRenderer(size, renderer) {
  const gpuCompute = new GPUComputationRenderer(size, size, renderer);

  // 初始化位置数据，每个粒子的位置为球体上的随机点
  const spherePoints = window.spherePostions;

  // 创建初始位置纹理
  const initialPosition = gpuCompute.createTexture();
  initialPosition.image.data.set(spherePoints);

  // 创建背景点云位置的纹理
  const backgroundPosition = gpuCompute.createTexture();
  backgroundPosition.image.data.set(spherePoints);

  // 添加位置变量并保存引用
  const positionVariable = gpuCompute.addVariable(
    "position",
    computeFragmentShader,
    initialPosition
  );

  // 创建背景位置的变量，并使用 backgroundComputeFragmentShader 更新它
  const backgroundPositionVariable = gpuCompute.addVariable(
    "backgroundPosition",
    backgroundComputeFragmentShader, // 用于更新背景点云的片段着色器
    backgroundPosition
  );

  // 设置变量依赖关系，确保 positionVariable 依赖于 backgroundPositionVariable
  gpuCompute.setVariableDependencies(positionVariable, [
    positionVariable,
    backgroundPositionVariable,
  ]);
  gpuCompute.setVariableDependencies(backgroundPositionVariable, [
    backgroundPositionVariable,
  ]);

  // 检查着色器错误
  const error = gpuCompute.init();
  if (error !== null) {
    console.error(error);
  }

  return { gpuCompute, positionVariable, backgroundPositionVariable };
}
