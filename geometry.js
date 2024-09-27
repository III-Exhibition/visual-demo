import * as THREE from 'three';
export function initSpherePoints(numParticles, radius) {
  const postions = getSpherePointsPostion(numParticles, radius);
  const colors = getSpherePointsColor(postions, radius);

  window.spherePostions = postions;
  window.sphereColors = colors;
}

function getSpherePointsPostion(numParticles, radius) {
  const postions = new Float32Array(numParticles * 4);
  for (let i = 0; i < postions.length; i += 4) {
    [postions[i], postions[i + 1], postions[i + 2]] =
      getRandomPositionInSphere(radius); // x, y, z
    postions[i + 3] = 1.0; // w
  }
  return postions;
}

function getSpherePointsColor(postions, radius) {
  // 生成球面上的粒子并为每个粒子赋予不同的颜色
  const numParticles = postions.length / 4;
  const colors = new Float32Array(numParticles * 4);
  for (let i = 0; i < numParticles; i++) {
    const [x, y, z] = postions.slice(i * 4, i * 4 + 3); // 获取位置

    // 根据位置获取颜色
    const distance = Math.sqrt(x * x + y * y + z * z);
    const [r, g, b] = getColorByPositionDistance(distance, radius);
    colors[i * 4] = r;
    colors[i * 4 + 1] = g;
    colors[i * 4 + 2] = b;
    colors[i * 3 + 3] = 1.0;
  }
  return colors;
}

// 生成球面上的随机点
function getRandomPositionOnSphere(radius) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  return [x, y, z];
}

// 生成球体内部均匀分布的随机点
function getRandomPositionInSphere(radius) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = Math.cbrt(Math.random()) * radius; // 随机半径，均匀分布在球体内部

  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.sin(phi) * Math.sin(theta);
  const z = r * Math.cos(phi);

  return [x, y, z];
}

// 定义球面区域的颜色
const faceColors = {
  "+X": [1.0, 0.2745, 0.0],   // 鲜艳的橘红色
  "-X": [1.0, 0.1961, 0.0],   // 亮丽的红橘色
  "+Y": [1.0, 0.3333, 0.0],   // 热情的亮橘色
  "-Y": [1.0, 0.1569, 0.0],   // 活力的深橘红
  "+Z": [1.0, 0.4, 0.0],      // 明亮的橙红色
  "-Z": [1.0, 0.2353, 0.0],   // 生机勃勃的橘色
};

// 根据顶点的空间位置确定其所在的区域
function getColorByPositionArea(x, y, z) {
  if (Math.abs(x) >= Math.abs(y) && Math.abs(x) >= Math.abs(z)) {
    return x >= 0 ? faceColors["+X"] : faceColors["-X"];
  } else if (Math.abs(y) >= Math.abs(x) && Math.abs(y) >= Math.abs(z)) {
    return y >= 0 ? faceColors["+Y"] : faceColors["-Y"];
  } else {
    return z >= 0 ? faceColors["+Z"] : faceColors["-Z"];
  }
}


// 创建用于颜色渐变的色板
const colorStops = [
  new THREE.Color(0xEDE7E9),  // 到球心最近的颜色
  new THREE.Color(0xEA3B4D),
  new THREE.Color(0xFB7C39),
  new THREE.Color(0xC4DED0),
  new THREE.Color(0xE4C2CA),  // 到球心最远的颜色
];

// 函数：根据距离映射颜色
function getColorByPositionDistance(distance, maxDistance) {
  const ratio = distance / maxDistance;
  const numStops = colorStops.length;
  const scaledRatio = ratio * (numStops - 1);
  const lowerIndex = Math.floor(scaledRatio);
  const upperIndex = Math.min(lowerIndex + 1, numStops - 1);
  const blendFactor = scaledRatio - lowerIndex;

  const color = new THREE.Color();
  color.lerpColors(colorStops[lowerIndex], colorStops[upperIndex], blendFactor);
  return [color.r, color.g, color.b];
}