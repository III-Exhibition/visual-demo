import * as THREE from "three";
import { mat4 } from "gl-matrix";

export function generateTransformationMatrices(elapsedTime) {
  // 设置噪声变换的参数
  const noiseRotationAngles = { x: 0, y: 0, z: 0 }; // 旋转角度（单位：度）
  const noiseScaleFactors = { x: 0.5, y: 0.5, z: 0.5 }; // 缩放因子
  const noiseTranslationValues = {
    x: 0,
    y: elapsedTime * 0.08,
    z: 0,
  }; // 平移值

  const noiseTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      noiseRotationAngles,
      noiseScaleFactors,
      noiseTranslationValues
    )
  );

  // 设置位置变换的参数
  const positionRotationAngles = {
    x: -3.526632,
    y: -6.152985,
    z: 23.03788,
  }; // 旋转角度（单位：度）
  const positionScaleFactors = {
    x: 1.099204,
    y: 1.123625,
    z: 1.087077,
  }; // 缩放因子
  const positionTranslationValues = { x: 0, y: 0, z: 0 }; // 平移值

  const positionTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      positionRotationAngles,
      positionScaleFactors,
      positionTranslationValues
    )
  );

  // 设置背景点云的变换参数
  const backgroundRotationAngles = {
    x: 1.959 / 60,
    y: 3.418 / 60,
    z: 12.8 / 60,
  }; // 旋转角度（单位：度）
  const backgroundScaleFactors = { x: 1, y: 1, z: 1 }; // 缩放因子
  const backgroundTranslationValues = { x: 0, y: 0, z: 0 }; // 平移值

  const backgroundTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      backgroundRotationAngles,
      backgroundScaleFactors,
      backgroundTranslationValues
    )
  );

  // 返回三个变换矩阵
  return {
    noiseTransformationMatrix,
    positionTransformationMatrix,
    backgroundTransformationMatrix,
  };
}

// 生成旋转、缩放和平移矩阵
function generateTransformationMatrix(
  rotationAngles,
  scaleFactors,
  translationValues
) {
  const transformationMatrix = mat4.create();

  // 旋转角度转换为弧度
  const angleX = (rotationAngles.x * Math.PI) / 180;
  const angleY = (rotationAngles.y * Math.PI) / 180;
  const angleZ = (rotationAngles.z * Math.PI) / 180;

  // 生成旋转矩阵
  mat4.rotateZ(transformationMatrix, transformationMatrix, angleZ);
  mat4.rotateY(transformationMatrix, transformationMatrix, angleY);
  mat4.rotateX(transformationMatrix, transformationMatrix, angleX);

  // 缩放
  mat4.scale(transformationMatrix, transformationMatrix, [
    scaleFactors.x,
    scaleFactors.y,
    scaleFactors.z,
  ]);

  // 平移
  mat4.translate(transformationMatrix, transformationMatrix, [
    translationValues.x,
    translationValues.y,
    translationValues.z,
  ]);

  return transformationMatrix;
}

// 生成 [a, b] 范围内均匀分布的随机数
function getRandomInRange(a, b) {
  return Math.random() * (b - a) + a;
}
