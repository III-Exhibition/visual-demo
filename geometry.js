export function initSpherePoints(numParticles, radius) {
  const postions = getSpherePointsPostion(numParticles, radius);
  const colors = getSpherePointsColor(postions);

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

function getSpherePointsColor(postions) {
  // 生成球面上的粒子并为每个粒子赋予不同的颜色
  const numParticles = postions.length / 4;
  const colors = new Float32Array(numParticles * 3);
  for (let i = 0; i < numParticles; i++) {
    const [x, y, z] = postions.slice(i * 4, i * 4 + 3); // 获取位置

    // 根据位置获取颜色
    const [r, g, b] = getColorByPosition(x, y, z);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
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
  "+X": [1.0, 0.2745, 0.0],    // 鲜艳的橘红色
  "-X": [0.0, 0.6, 1.0],       // 明亮的蓝色（对比色）
  "+Y": [1.0, 0.8431, 0.0],    // 亮黄色（与橘色相近）
  "-Y": [0.5451, 0.0, 0.5451], // 深紫色（对比色）
  "+Z": [1.0, 0.4, 0.0],       // 明亮的橙红色
  "-Z": [0.0, 0.8, 0.6],       // 青绿色（对比色）
};

// 根据顶点的空间位置确定其所在的区域
function getColorByPosition(x, y, z) {
  if (Math.abs(x) >= Math.abs(y) && Math.abs(x) >= Math.abs(z)) {
    return x >= 0 ? faceColors["+X"] : faceColors["-X"];
  } else if (Math.abs(y) >= Math.abs(x) && Math.abs(y) >= Math.abs(z)) {
    return y >= 0 ? faceColors["+Y"] : faceColors["-Y"];
  } else {
    return z >= 0 ? faceColors["+Z"] : faceColors["-Z"];
  }
}
