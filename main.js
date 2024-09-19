import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import Stats from "three/examples/jsm/libs/stats.module.js";
// 引入 gl-matrix 库
import { mat4, vec3 } from "gl-matrix";
// 引入 noise.js 并创建噪声实例
import { Noise } from "noisejs";
let noise = new Noise(Math.random()); // 使用随机种子初始化噪声

// 创建场景
const scene = new THREE.Scene();

// 创建摄像机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2;

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 设置画布的背景为渐变色
renderer.domElement.style.background = `linear-gradient(
  to bottom,
  rgb(237, 231, 233) 0%,
  rgb(109, 170, 214) 15%,
  rgb(103, 100, 120) 65%,
  rgb(69, 60, 60) 85%,
  rgb(20, 20, 20) 100%
)`;

// 添加视角控制
const controls = new OrbitControls(camera, renderer.domElement);

// 定义球面区域的颜色
const faceColors = {
  "+X": [0.929412, 0.905882, 0.913725], // 浅粉色
  "-X": [0.921569, 0.568627, 0.607843], // 淡蓝色
  "+Y": [0.917647, 0.231373, 0.301961], // 灰蓝色
  "-Y": [0.984314, 0.486275, 0.223529], // 深灰蓝色
  "+Z": [0.768627, 0.870588, 0.815686], // 深红棕色
  "-Z": [0.894118, 0.760784, 0.792157], // 接近黑色
};

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

// 初始化顶点缓冲区和权重缓冲区
const numPoints = 200000; // 10 万个点
const size = 2; // 球的直径为 4，半径为 2
const radius = size / 2; // 球的半径

const geometry = new THREE.BufferGeometry();
const vertices = [];
const colors = [];

// 生成球面上的粒子并为每个粒子赋予不同的颜色
for (let i = 0; i < numPoints; i++) {
  const [x, y, z] = getRandomPositionInSphere(radius);
  vertices.push(x, y, z, 1); // 新增 W 值，初始化为 0

  // 根据位置获取颜色
  const color = getColorByPosition(x, y, z);
  colors.push(...color);
}

// 将顶点和颜色添加到 BufferGeometry 中
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices, 4)
);
geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

// 创建一个背景缓冲区的拷贝，用于 "over" 操作
const backgroundVertices = [...vertices];

// 粒子的材质，启用顶点颜色
const material = new THREE.PointsMaterial({
  size: 1,
  vertexColors: true,
  sizeAttenuation: false,
  transparent: true,
  opacity: 0.7,
});
const points = new THREE.Points(geometry, material);

// 将点云添加到场景中
scene.add(points);

// 添加坐标轴
const axesHelper = new THREE.AxesHelper(5); // 5 表示坐标轴的长度
// scene.add(axesHelper);

// 添加标尺函数
function createRuler(axis, length, interval) {
  const rulerGroup = new THREE.Group();
  for (let i = -length; i <= length; i += interval) {
    const markerGeometry = new THREE.BufferGeometry();
    const markerVertices = [];

    if (axis === "x") {
      markerVertices.push(i, 0, 0, i, 0.2, 0); // 在 X 轴上创建垂直小线段
    } else if (axis === "y") {
      markerVertices.push(0, i, 0, 0.2, i, 0); // 在 Y 轴上创建水平小线段
    } else if (axis === "z") {
      markerVertices.push(0, 0, i, 0, 0.2, i); // 在 Z 轴上创建垂直小线段
    }

    markerGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(markerVertices, 3)
    );
    const markerMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    const marker = new THREE.Line(markerGeometry, markerMaterial);
    rulerGroup.add(marker);
  }
  return rulerGroup;
}

// 在 X, Y, Z 轴上添加标尺，长度为 5，间隔为 1
const xRuler = createRuler("x", 5, 1);
const yRuler = createRuler("y", 5, 1);
const zRuler = createRuler("z", 5, 1);

// scene.add(xRuler);
// scene.add(yRuler);
// scene.add(zRuler);

// 创建字体加载器
const fontLoader = new FontLoader();

// 加载字体文件
fontLoader.load(
  "node_modules/three/examples/fonts/helvetiker_regular.typeface.json",
  function (font) {
    // 创建 X、Y、Z 的字母标记
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const textOptions = {
      font: font,
      size: 0.2,
      depth: 0.01,
    };

    // X 轴标记
    const xTextGeometry = new TextGeometry("X", textOptions);
    const xTextMesh = new THREE.Mesh(xTextGeometry, textMaterial);
    xTextMesh.position.set(5.5, 0, 0); // 放置在 X 轴末端
    // scene.add(xTextMesh);

    // Y 轴标记
    const yTextGeometry = new TextGeometry("Y", textOptions);
    const yTextMesh = new THREE.Mesh(yTextGeometry, textMaterial);
    yTextMesh.position.set(0, 5.5, 0); // 放置在 Y 轴末端
    // scene.add(yTextMesh);

    // Z 轴标记
    const zTextGeometry = new TextGeometry("Z", textOptions);
    const zTextMesh = new THREE.Mesh(zTextGeometry, textMaterial);
    zTextMesh.position.set(0, 0, 5.5); // 放置在 Z 轴末端
    // scene.add(zTextMesh);
  }
);

// 定义权重计算函数，接受粒子的位置（X, Y, Z）
function calculateWeight(x, y, z) {
  return 0.299 * x + 0.587 * y + 0.114 * z;
}

// 初始化权重缓冲区的独立函数
function initializeWeightBuffer(vertices) {
  const weightBuffer = [];

  // 使用 Perlin 噪声生成权重
  for (let i = 0; i < vertices.length; i += 3) {
    const perlinValue = noise.perlin3(
      vertices[i] / radius,
      vertices[i + 1] / radius,
      vertices[i + 2] / radius
    ); // 生成 3D Perlin 噪声
    weightBuffer.push(perlinValue, perlinValue, perlinValue, 0); // 三个维度相同
  }

  // 将权重缓冲区添加到几何体中
  const weightAttribute = new THREE.Float32BufferAttribute(weightBuffer, 4);
  geometry.setAttribute("weight", weightAttribute);
}

// 更新权重缓冲区函数
function updateWeightBuffer(vertices, weights, transformMatrix) {
  const transformedVertex = vec3.create();

  for (let i = 0; i < vertices.length; i += 4) {
    // 获取顶点坐标
    const vertex = vec3.fromValues(
      vertices[i],
      vertices[i + 1],
      vertices[i + 2]
    );

    // 应用变换矩阵，计算变换后的顶点位置
    vec3.transformMat4(transformedVertex, vertex, transformMatrix);

    // 使用变换后的坐标生成 Perlin 噪声作为权重
    const perlinValue = noise.perlin3(
      transformedVertex[0] / radius,
      transformedVertex[1] / radius,
      transformedVertex[2] / radius
    ); // 生成 3D Perlin 噪声;

    // 将生成的权重应用到权重缓冲区的三个维度
    weights[i] = weights[i + 1] = weights[i + 2] = perlinValue;
  }
}

// 通用函数：更新背景缓冲区，应用变换矩阵
function updateBackgroundBuffer(vertices, transformMatrix) {
  const transformedVertex = vec3.create();

  for (let i = 0; i < vertices.length; i += 4) {
    const vertex = vec3.fromValues(
      vertices[i],
      vertices[i + 1],
      vertices[i + 2]
    );

    // 应用变换矩阵
    vec3.transformMat4(transformedVertex, vertex, transformMatrix);

    // 更新背景顶点位置
    vertices[i] = transformedVertex[0];
    vertices[i + 1] = transformedVertex[1];
    vertices[i + 2] = transformedVertex[2];
    // W 值保持不变
  }
}

// 在初次渲染前调用生成权重函数
initializeWeightBuffer(geometry.attributes.position.array);

// 修改 applyRotationWithLerp 函数，使其根据权重缓冲区数据计算权重
function applyRotationWithLerp(vertices, weights, matrix) {
  const rotatedVertex = vec3.create();
  const lerpedVertex = vec3.create();

  for (let i = 0; i < vertices.length; i += 4) {
    // 获取当前顶点和权重缓冲区的坐标
    const vertex = vec3.fromValues(
      vertices[i],
      vertices[i + 1],
      vertices[i + 2]
    );

    // 虽然每一组权重的三个值相同，但仍然使用 calculateWeight 函数
    const weight = calculateWeight(weights[i], weights[i + 1], weights[i + 2]);

    // 应用旋转矩阵，计算旋转后的顶点位置
    vec3.transformMat4(rotatedVertex, vertex, matrix);

    // 使用 vec3.lerp 进行线性插值
    vec3.lerp(lerpedVertex, vertex, rotatedVertex, weight);

    // 更新顶点位置
    vertices[i] = lerpedVertex[0];
    vertices[i + 1] = lerpedVertex[1];
    vertices[i + 2] = lerpedVertex[2];
  }
}

// changeOpacity 函数
function changeOpacity(vertices, factor) {
  for (let i = 0; i < vertices.length; i += 4) {
    // 每个顶点的 x, y, z, w 坐标都乘以传入的数字 factor
    vertices[i] *= factor; // x 坐标
    vertices[i + 1] *= factor; // y 坐标
    vertices[i + 2] *= factor; // z 坐标
    vertices[i + 3] *= factor; // w 坐标
  }
}

// 修改 applyOver 函数，进行缓冲区的 "over" 操作
function applyOver(foreground, background) {
  for (let i = 0; i < foreground.length; i += 4) {
    const fgR = foreground[i],
      fgG = foreground[i + 1],
      fgB = foreground[i + 2],
      fgA = foreground[i + 3];
    const bgR = background[i],
      bgG = background[i + 1],
      bgB = background[i + 2],
      bgA = 1; // 背景的 A 始终为 1

    // Over 公式: 结果颜色 = 前景颜色 * 前景透明度 + 背景颜色 * (1 - 前景透明度)
    foreground[i] = fgR * fgA + bgR * (1 - fgA);
    foreground[i + 1] = fgG * fgA + bgG * (1 - fgA);
    foreground[i + 2] = fgB * fgA + bgB * (1 - fgA);
    foreground[i + 3] = 1; // 保持 A 通道为 1
  }
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

let transformationParams = {};

// 随机生成变换参数并生成矩阵
function generateAllTransformations(elapsedTime) {
  noise.seed(Math.random()); // 每次生成新的噪声种子
  // 为 updateWeightBuffer 函数生成变换参数
  transformationParams.weightBuffer = {
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 0.5, y: 0.5, z: 0.5 },
    translation: {
      x: elapsedTime * getRandomInRange(-1, 1),
      y: elapsedTime * getRandomInRange(-1, 1),
      z: elapsedTime * getRandomInRange(-1, 1),
    },
  };

  // 为 applyRotationWithLerp 函数生成变换参数
  transformationParams.rotationLerp = {
    rotation: {
      x: getRandomInRange(-20, 20),
      y: getRandomInRange(-20, 20),
      z: getRandomInRange(-20, 20),
    },
    scale: {
      x: 1 + Math.random() / 5,
      y: 1 + Math.random() / 5,
      z: 1 + Math.random() / 5,
    },
    translation: { x: 0, y: 0, z: 0 },
  };

  // 为背景生成变换参数
  transformationParams.background = {
    rotation: {
      x: getRandomInRange(-5, 5),
      y: getRandomInRange(-5, 5),
      z: getRandomInRange(-5, 5),
    },
    scale: {
      x: 1,
      y: 1,
      z: 1,
    },
    translation: { x: 0, y: 0, z: 0 },
  };

  // 生成对应的矩阵
  const weightMatrix = generateTransformationMatrix(
    transformationParams.weightBuffer.rotation,
    transformationParams.weightBuffer.scale,
    transformationParams.weightBuffer.translation
  );

  const rotationMatrix = generateTransformationMatrix(
    transformationParams.rotationLerp.rotation,
    transformationParams.rotationLerp.scale,
    transformationParams.rotationLerp.translation
  );

  const backgroundMatrix = generateTransformationMatrix(
    transformationParams.background.rotation,
    transformationParams.background.scale,
    transformationParams.background.translation
  );

  // 触发屏幕闪烁
  flashScreen();

  console.log("New transformation matrices generated.");
  console.log("Weight parameters: ", transformationParams.weightBuffer); // 权重参数
  console.log("Rotation parameters: ", transformationParams.rotationLerp); // 旋转参数
  console.log("Background parameters: ", transformationParams.background); // 背景参数
  return { weightMatrix, rotationMatrix, backgroundMatrix };
}

// 生成 [a, b] 范围内均匀分布的随机数
function getRandomInRange(a, b) {
  return Math.random() * (b - a) + a;
}

// 屏幕闪烁函数
function flashScreen() {
  // 设置闪烁颜色
  // renderer.setClearColor(0xffffff, 1); // 白色闪烁

  // 在指定时间后恢复原始颜色
  setTimeout(() => {
    // renderer.setClearColor(0x000000, 1);
  }, flashDuration);
}

let theta = 0; // 方位角
let phi = Math.PI / 4; // 俯仰角

// 定义函数，使摄像机沿球面移动
function moveCameraOnSphere(distance, thetaSpeed, phiSpeed) {
  // 更新角度
  theta += thetaSpeed;
  phi += phiSpeed;

  // 保持 phi 在 [0, π] 的范围内，防止摄像机翻转
  if (phi >= Math.PI) phi = Math.PI - 0.001;
  if (phi <= 0) phi = 0.001;

  // 计算球面坐标下的摄像机位置
  camera.position.x = distance * Math.sin(phi) * Math.cos(theta);
  camera.position.y = distance * Math.cos(phi); // 控制垂直位置
  camera.position.z = distance * Math.sin(phi) * Math.sin(theta);

  // 摄像机始终看向场景中心
  camera.lookAt(0, 0, 0);
}

// 初始渲染时调用
let startTime = null;
let flashDuration = 100; // 闪烁的持续时间（以毫秒为单位）
let matrices = generateAllTransformations(0);
let lastMatrixUpdateTime = 0;
const matrixUpdateInterval = 20000; // 每10秒更新一次矩阵

const stats = new Stats();
document.body.appendChild(stats.dom);
let lastRotationTime = 0;

// 动画循环
function animate(currentTime) {
  requestAnimationFrame(animate);

  // 在每次渲染时调用摄像机移动函数
  // moveCameraOnSphere(radius, 0.0005, 0.0005); // 传入角速度

  // 更新视角控制，每帧都更新
  controls.update();

  if (!startTime) {
    startTime = currentTime;
  }
  const elapsedTime = currentTime - startTime;

  // 将当前时间转换为秒
  const deltaTime = (currentTime - lastRotationTime) / 1000;

  // 每 10 秒更新一次矩阵
  if (currentTime - lastMatrixUpdateTime > matrixUpdateInterval) {
    matrices = generateAllTransformations(elapsedTime);
    lastMatrixUpdateTime = currentTime;
  }

  // 仅在每 0.005 秒时更新一次粒子旋转
  if (deltaTime > 0.005) {
    lastRotationTime = currentTime;

    const opacityFactor = 0.998; // 每帧逐渐减小粒子的透明度

    // 获取顶点和权重缓冲区
    const verticesArray = geometry.attributes.position.array;
    const weightsArray = geometry.attributes.weight.array;

    // 更新权重缓冲区
    updateWeightBuffer(verticesArray, weightsArray, matrices.weightMatrix);

    // 更新粒子的旋转并根据权重缓冲区计算权重
    applyRotationWithLerp(verticesArray, weightsArray, matrices.rotationMatrix);

    // 更新背景缓冲区
    updateBackgroundBuffer(backgroundVertices, matrices.backgroundMatrix);

    // 应用 "over" 操作，将当前顶点缓冲区与背景缓冲区进行重叠计算
    applyOver(verticesArray, backgroundVertices);

    // 每帧都调用 changeOpacity 函数，逐渐把粒子向原点聚拢
    changeOpacity(verticesArray, opacityFactor);

    geometry.attributes.position.needsUpdate = true;
  }

  // 渲染场景
  renderer.render(scene, camera);
  stats.update();
}

animate();

// 窗口大小改变时，调整摄像机和渲染器的尺寸
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});