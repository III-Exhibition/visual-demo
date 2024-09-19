import * as THREE from "three";
import { GPUComputationRenderer } from "three/examples/jsm/misc/GPUComputationRenderer.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import pnoise3D from "./shaders/classicnoise3D.glsl";
import { mat4 } from "gl-matrix";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.x = 3;
camera.position.y = 3;
camera.position.z = 3;

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比
document.body.appendChild(renderer.domElement);

const stats = new Stats();
document.body.appendChild(stats.dom);

// 创建 OrbitControls 实例
const controls = new OrbitControls(camera, renderer.domElement);

// 可选配置
controls.enableDamping = true; // 启用阻尼（惯性），需要在动画循环中调用 controls.update()
controls.dampingFactor = 0.05; // 阻尼系数

controls.minDistance = 0.01; // 相机与目标的最小距离
controls.maxDistance = 100; // 相机与目标的最大距离

controls.enablePan = true; // 启用平移
controls.enableZoom = true; // 启用缩放

// 创建坐标轴辅助对象，长度为5
const axesHelper = new THREE.AxesHelper(5);
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

// 处理窗口大小变化
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio); // 确保在调整大小时也设置像素比
});

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

// 设置纹理大小
const size = 2048; // 纹理大小为3x3，可以容纳9个粒子
const gpuCompute = new GPUComputationRenderer(size, size, renderer);

// 检查 WebGL2 支持
if (renderer.capabilities.isWebGL2 === false) {
  alert("GPUComputationRenderer 需要 WebGL2 支持");
}

// 创建初始位置纹理
const initialPosition = gpuCompute.createTexture();
const posArray = initialPosition.image.data;

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

// 初始化位置数据，每个粒子的位置为球体上的随机点
for (let i = 0; i < posArray.length; i += 4) {
  [posArray[i], posArray[i + 1], posArray[i + 2]] =
    getRandomPositionInSphere(1.0); // x, y, z
  posArray[i + 3] = 1.0; // w
}

const computeFragmentShader = `
  ${pnoise3D} // 包含 Perlin 噪声函数的 GLSL 代码

  uniform float delta;
  uniform mat4 noiseTransformMatrix;      // 4x4 变换矩阵用于计算 Noise
  uniform mat4 positionTransformMatrix;   // 新的 4x4 变换矩阵，用于对粒子位置进行变换
  uniform vec3 rep;                       // 周期参数
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 从上一帧获取位置
    vec4 previousPosition = texture(position, uv);
    
    // 使用 noiseTransformMatrix 进行噪声计算
    vec3 transformedPosition = (noiseTransformMatrix * vec4(previousPosition.xyz, 1.0)).xyz;
    float noiseValue = pnoise(transformedPosition, rep);

    // 使用噪声更新位置
    vec3 newPosition = previousPosition.xyz + noiseValue * delta;

    // 使用 positionTransformMatrix 对位置进行进一步变换
    newPosition = (positionTransformMatrix * vec4(newPosition, 1.0)).xyz;
    
    // 设置新的位置
    gl_FragColor = vec4(newPosition, 1.0);
  }
`;

// 添加位置变量并保存引用
const positionVariable = gpuCompute.addVariable(
  "position",
  computeFragmentShader,
  initialPosition
);

// 设置变量依赖关系
gpuCompute.setVariableDependencies(positionVariable, [positionVariable]);

let noiseTransformationMatrix = null;
{
  // 设置噪声变换的参数
  const rotationAngles = { x: 0, y: 0, z: 0 }; // 旋转角度（单位：度）
  const scaleFactors = { x: 0.5, y: 0.5, z: 0.5 }; // 缩放因子
  const translationValues = { x: 0, y: 0, z: 0 }; // 平移值
  // 动态生成用于噪声计算的变换矩阵
   noiseTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      rotationAngles, // 旋转角度
      scaleFactors, // 缩放因子
      translationValues // 平移值
    )
  );
}

let positionTransformationMatrix = null;
{
  // 设置位置变换的参数
  const rotationAngles = { x: 1, y: 0, z: 0 }; // 旋转角度（单位：度）
  const scaleFactors = { x: 1, y: 1, z: 1 }; // 缩放因子
  const translationValues = { x: 0, y: 0, z: 0 }; // 平移值
  // 动态生成用于位置计算的变换矩阵
  positionTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      rotationAngles, // 旋转角度
      scaleFactors, // 缩放因子
      translationValues // 平移值
    )
  );
}

const rep = new THREE.Vector3(3.0, 3.0, 3.0); // 周期性噪声的 rep 参数

// 设置 Uniforms
positionVariable.material.uniforms.time = { value: 0.0 };
positionVariable.material.uniforms.delta = { value: 0.0 };
positionVariable.material.uniforms.noiseTransformMatrix = {
  value: noiseTransformationMatrix,
};
positionVariable.material.uniforms.positionTransformMatrix = {
  value: positionTransformationMatrix,
};
positionVariable.material.uniforms.rep = { value: rep };

// 检查着色器错误
const error = gpuCompute.init();
if (error !== null) {
  console.error(error);
}

// 创建几何体，包含8个顶点
const geometry = new THREE.BufferGeometry();
const numParticles = size * size; // 8个粒子

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

// 创建材质，使用自定义着色器
const material = new THREE.ShaderMaterial({
  transparent: true,
  uniforms: {
    positionTexture: { value: null }, // 位置纹理
    resolution: { value: new THREE.Vector2(size, size) },
    cameraConstant: { value: getCameraConstant(camera) },
  },
  vertexShader: `
  uniform sampler2D positionTexture;
  uniform float cameraConstant;
  uniform vec2 resolution;
  attribute float vertexIndex;
  varying vec3 vColor; // 用于传递颜色到片段着色器

  void main() {
    // 计算 UV 坐标
    float index = vertexIndex;
    float u = (mod(index, resolution.x) + 0.5) / resolution.x;
    float v = (floor(index / resolution.x) + 0.5) / resolution.y;
    vec2 uv = vec2(u, v);

    // 从 positionTexture 获取位置数据
    vec4 posData = texture2D(positionTexture, uv);
    vec3 pos = posData.xyz;

    // 变换到视图空间
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // 设置点大小
    gl_PointSize = 2.0;

    // 设置最终位置
    gl_Position = projectionMatrix * mvPosition;

    // 根据 vertexIndex 计算颜色（按 index 对 8 的模依次改变颜色）
    vec3 colors[8] = vec3[](
      vec3(1.0, 0.0, 0.0), // 红色
      vec3(0.0, 1.0, 0.0), // 绿色
      vec3(0.0, 0.0, 1.0), // 蓝色
      vec3(1.0, 1.0, 0.0), // 黄色
      vec3(1.0, 0.0, 1.0), // 品红
      vec3(0.0, 1.0, 1.0), // 青色
      vec3(1.0, 0.5, 0.0), // 橙色
      vec3(0.5, 0.5, 0.5)  // 灰色
    );
    vColor = colors[int(mod(index, 8.0))];
  }
`,
  fragmentShader: `
  varying vec3 vColor; // 接收来自顶点着色器的颜色

  void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 0.7); // 使用传递的颜色
  }
`,
});

// 创建点
const points = new THREE.Points(geometry, material);
scene.add(points);

// 辅助函数：计算相机常数
function getCameraConstant(camera) {
  return (
    window.innerHeight /
    (Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * 2)
  );
}

// 动画循环
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  const elapsedTime = clock.elapsedTime;

  // 更新计算器的 Uniforms
  positionVariable.material.uniforms.time.value = elapsedTime;
  positionVariable.material.uniforms.delta.value = delta;

  // 计算下一帧的位置
  gpuCompute.compute();

  // 获取计算后的纹理
  const posTexture =
    gpuCompute.getCurrentRenderTarget(positionVariable).texture;

  // 更新材质的 Uniform
  material.uniforms.positionTexture.value = posTexture;

  // 更新 OrbitControls
  controls.update();
  stats.update();
  renderer.render(scene, camera);

  requestAnimationFrame(animate);
}

// // 添加一个透明的正方体作为参考
// const cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
// const cubeMaterial = new THREE.MeshBasicMaterial({
//   color: 0xffffff,
//   wireframe: true,
//   transparent: true,
//   opacity: 0.3
// });
// const referenceCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
// scene.add(referenceCube);

animate();
