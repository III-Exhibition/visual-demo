import * as THREE from "three";
import { mat4 } from "gl-matrix";

export function generateTransformationMatrices(
  backgroundMatrix,
  noiseMatrix,
  positionMatrix,
  deltaTime
) {
  // Helper function to validate matrix properties
  function validateMatrix(matrix) {
    if (!matrix.rotationAngles || !matrix.scaleFactors || !matrix.translationValues) {
      throw new Error("Matrix must have rotationAngles, scaleFactors, and translationValues properties");
    }
  }

  // Validate input matrices
  [backgroundMatrix, noiseMatrix, positionMatrix].forEach(validateMatrix);

  // Convert backgroundMatrix to per-frame transformation
  const backgroundMatrixPerFrame = convertToPerFrame(backgroundMatrix, deltaTime);

  // Generate transformation matrices
  const noiseTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(noiseMatrix)
  );

  const positionTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(positionMatrix)
  );

  const backgroundTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(backgroundMatrixPerFrame)
  );

  // Return the three transformation matrices
  return {
    noiseTransformationMatrix,
    positionTransformationMatrix,
    backgroundTransformationMatrix,
  };
}

// Convert matrix to per-frame transformation based on deltaTime
function convertToPerFrame(matrix, deltaTime) {
  const { rotationAngles, scaleFactors, translationValues } = matrix;

  // Calculate the ratio of deltaTime to one second (1000 ms)
  const timeRatio = deltaTime / 1000;

  // Convert each property to per-frame values based on timeRatio
  const perFrameRotationAngles = {
    x: rotationAngles.x * timeRatio,
    y: rotationAngles.y * timeRatio,
    z: rotationAngles.z * timeRatio,
  };

  const perFrameScaleFactors = {
    x: 1 + (scaleFactors.x - 1) * timeRatio,
    y: 1 + (scaleFactors.y - 1) * timeRatio,
    z: 1 + (scaleFactors.z - 1) * timeRatio,
  };

  const perFrameTranslationValues = {
    x: translationValues.x * timeRatio,
    y: translationValues.y * timeRatio,
    z: translationValues.z * timeRatio,
  };

  return {
    rotationAngles: perFrameRotationAngles,
    scaleFactors: perFrameScaleFactors,
    translationValues: perFrameTranslationValues,
  };
}

// Generate rotation, scale, and translation matrix
function generateTransformationMatrix(matrix) {
  const { rotationAngles, scaleFactors, translationValues } = matrix;
  const transformationMatrix = mat4.create();

  // Convert rotation angles to radians
  const angleX = (rotationAngles.x * Math.PI) / 180;
  const angleY = (rotationAngles.y * Math.PI) / 180;
  const angleZ = (rotationAngles.z * Math.PI) / 180;

  // Generate rotation matrix
  mat4.rotateZ(transformationMatrix, transformationMatrix, angleZ);
  mat4.rotateY(transformationMatrix, transformationMatrix, angleY);
  mat4.rotateX(transformationMatrix, transformationMatrix, angleX);

  // Scale
  mat4.scale(transformationMatrix, transformationMatrix, [
    scaleFactors.x,
    scaleFactors.y,
    scaleFactors.z,
  ]);

  // Translate
  mat4.translate(transformationMatrix, transformationMatrix, [
    translationValues.x,
    translationValues.y,
    translationValues.z,
  ]);

  return transformationMatrix;
}

// Generate a random number uniformly distributed in the range [a, b]
function getRandomInRange(a, b) {
  return Math.random() * (b - a) + a;
}