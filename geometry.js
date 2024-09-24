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
  "+X": [0.929412, 0.905882, 0.913725], // 浅灰粉色
  "-X": [0.921569, 0.568627, 0.607843], // 浅珊瑚红
  "+Y": [0.917647, 0.231373, 0.301961], // 鲜红色
  "-Y": [0.984314, 0.486275, 0.223529], // 橙色
  "+Z": [0.768627, 0.870588, 0.815686], // 浅青绿色
  "-Z": [0.894118, 0.760784, 0.792157], // 浅粉红色
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
