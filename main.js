import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";
import Stats from "three/examples/jsm/libs/stats.module.js";
// 引入 gl-matrix 库
import { mat4, vec3 } from "gl-matrix";
// 引入 noise.js 并创建噪声实例
import { Noise } from "noisejs";
const noise = new Noise(97); // 使用随机种子初始化

// 创建场景
const scene = new THREE.Scene();

// 创建摄像机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 10;

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加视角控制
const controls = new OrbitControls(camera, renderer.domElement);

// 定义球面区域的颜色
const faceColors = {
  "+X": [1.0, 0.0, 0.0], // 红色
  "-X": [0.0, 1.0, 0.0], // 绿色
  "+Y": [0.0, 0.0, 1.0], // 蓝色
  "-Y": [1.0, 1.0, 0.0], // 黄色
  "+Z": [1.0, 0.0, 1.0], // 紫色
  "-Z": [0.0, 1.0, 1.0], // 青色
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
  const [x, y, z] = getRandomPositionOnSphere(radius);
  vertices.push(x, y, z);

  // 根据位置获取颜色
  const color = getColorByPosition(x, y, z);
  colors.push(...color);
}

// 将顶点和颜色添加到 BufferGeometry 中
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(vertices, 3)
);
geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

// 粒子的材质，启用顶点颜色
const material = new THREE.PointsMaterial({ size: 0.01, vertexColors: true });
const points = new THREE.Points(geometry, material);

// 将点云添加到场景中
scene.add(points);

// 添加坐标轴
const axesHelper = new THREE.AxesHelper(5); // 5 表示坐标轴的长度
scene.add(axesHelper);

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

scene.add(xRuler);
scene.add(yRuler);
scene.add(zRuler);

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
    scene.add(xTextMesh);

    // Y 轴标记
    const yTextGeometry = new TextGeometry("Y", textOptions);
    const yTextMesh = new THREE.Mesh(yTextGeometry, textMaterial);
    yTextMesh.position.set(0, 5.5, 0); // 放置在 Y 轴末端
    scene.add(yTextMesh);

    // Z 轴标记
    const zTextGeometry = new TextGeometry("Z", textOptions);
    const zTextMesh = new THREE.Mesh(zTextGeometry, textMaterial);
    zTextMesh.position.set(0, 0, 5.5); // 放置在 Z 轴末端
    scene.add(zTextMesh);
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
      vertices[i],
      vertices[i + 1],
      vertices[i + 2]
    ); // 生成 3D Perlin 噪声
    weightBuffer.push(perlinValue, perlinValue, perlinValue); // 三个维度相同
  }

  // 将权重缓冲区添加到几何体中
  const weightAttribute = new THREE.Float32BufferAttribute(weightBuffer, 3);
  geometry.setAttribute("weight", weightAttribute);
}

// 更新权重缓冲区函数
function updateWeightBuffer(vertices, weights, transformMatrix) {
  const transformedVertex = vec3.create();

  for (let i = 0; i < vertices.length; i += 3) {
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
      transformedVertex[0],
      transformedVertex[1],
      transformedVertex[2]
    );

    // 将生成的权重应用到权重缓冲区的三个维度
    weights[i] = weights[i + 1] = weights[i + 2] = perlinValue;
  }
}

// 在初次渲染前调用生成权重函数
initializeWeightBuffer(geometry.attributes.position.array);

// 修改 applyRotationWithLerp 函数，使其根据权重缓冲区数据计算权重
function applyRotationWithLerp(vertices, weights, matrix) {
  const rotatedVertex = vec3.create();
  const lerpedVertex = vec3.create();

  for (let i = 0; i < vertices.length; i += 3) {
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
  for (let i = 0; i < vertices.length; i += 3) {
    // 每个顶点的 x, y, z 坐标都乘以传入的数字 factor
    vertices[i] *= factor;      // x 坐标
    vertices[i + 1] *= factor;  // y 坐标
    vertices[i + 2] *= factor;  // z 坐标
  }
}

// 创建旋转矩阵生成函数
function generateRotationMatrix() {
  const rotationMatrix = mat4.create();

  // 将角度从度转换为弧度
  const angleX = (3 * Math.PI) / 180; // 绕 X 轴 -3.52 度
  const angleY = (3 * Math.PI) / 180; // 绕 Y 轴 -6.12 度
  const angleZ = (3 * Math.PI) / 180; // 绕 Z 轴 23.03 度

  // 生成旋转矩阵，先绕 Z 轴，再绕 Y 轴，最后绕 X 轴
  mat4.rotateZ(rotationMatrix, rotationMatrix, angleZ);
  mat4.rotateY(rotationMatrix, rotationMatrix, angleY);
  mat4.rotateX(rotationMatrix, rotationMatrix, angleX);

  return rotationMatrix;
}

// 创建缩放矩阵的函数，接收 x、y 和 z 轴的缩放比例作为参数
function generateScaleMatrix(scaleX, scaleY, scaleZ) {
  const scaleMatrix = mat4.create();
  // 缩放 x, y 和 z 轴
  mat4.scale(scaleMatrix, scaleMatrix, [scaleX, scaleY, scaleZ]);
  return scaleMatrix;
}

// 动画循环
const stats = new Stats();
document.body.appendChild(stats.dom);
let lastRotationTime = 0;
function animate(currentTime) {
  requestAnimationFrame(animate);

  // 更新视角控制，每帧都更新
  controls.update();

  // 将当前时间转换为秒
  const deltaTime = (currentTime - lastRotationTime) / 1000;

  // 仅在每 0.5 秒时更新一次粒子旋转
  if (deltaTime > 0.01) {
    lastRotationTime = currentTime;

    // 生成旋转矩阵
    const rotationMatrix = generateRotationMatrix();

    // 生成缩放矩阵，按需缩放 x, y, z 轴
    const scaleMatrix = generateScaleMatrix(0.5, 0.5, 0.5); // 同时缩小 x, y, z 轴

    // 获取顶点和权重缓冲区
    const verticesArray = geometry.attributes.position.array;
    const weightsArray = geometry.attributes.weight.array;

    // 更新权重缓冲区，应用缩放矩阵
    updateWeightBuffer(verticesArray, weightsArray, scaleMatrix);

    // 更新粒子的旋转并根据权重缓冲区计算权重
    applyRotationWithLerp(verticesArray, weightsArray, rotationMatrix);
    changeOpacity(verticesArray, 0.99); // 每帧都减小透明度

    geometry.attributes.position.needsUpdate = true;
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
