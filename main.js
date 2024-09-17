import * as THREE from "three";
// 从 three.js 的 examples 引入 Stats
import Stats from "three/examples/jsm/libs/stats.module.js";
// 引入 OrbitControls
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// 创建场景、相机和渲染器
const scene = new THREE.Scene();
// const aspect = window.innerWidth / window.innerHeight;
// const zoomFactor = 1.5; // 初始缩放因子为 1
// const camera = new THREE.OrthographicCamera(
//   -aspect * zoomFactor,
//   aspect * zoomFactor,
//   zoomFactor,
//   -zoomFactor,
//   0.1,
//   1000
// );
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);
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

// 定义球面区域的颜色
const faceColors = {
  "+X": [0.929412, 0.905882, 0.913725], // 浅灰粉色
  "-X": [0.921569, 0.568627, 0.607843], // 浅珊瑚红
  "+Y": [0.917647, 0.231373, 0.301961], // 鲜红色
  "-Y": [0.984314, 0.486275, 0.223529], // 橙色
  "+Z": [0.768627, 0.870588, 0.815686], // 浅青绿色
  "-Z": [0.894118, 0.760784, 0.792157], // 浅粉红色
};

// 设置相机位置
camera.position.z = 2;

// 初始化 Stats 模块
const stats = new Stats();
document.body.appendChild(stats.dom);

// 创建 OrbitControls 来控制相机视角
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 添加阻尼效果（惯性），更顺滑的控制
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false; // 不允许屏幕空间平移
controls.minDistance = 0.01; // 最小缩放距离
controls.maxDistance = 100; // 最大缩放距离

// 生成均匀分布在球体内的粒子
function generateParticlesInSphere(numParticles, radius) {
  const positions = new Float32Array(numParticles * 3);

  for (let i = 0; i < numParticles; i++) {
    // 生成从 -1 到 1 的均匀随机数（仅三个分量）
    const rnd = [
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
    ];

    const twoPi = 2.0 * Math.PI;
    const theta = twoPi * rnd[0]; // 从 rnd.s 得到的随机角度
    const phi = Math.acos(2 * rnd[1] - 1.0); // 从 rnd.t 得到的球坐标角度
    const third = 1.0 / 3.0;
    const randomRadius = radius * Math.pow(Math.abs(rnd[2]), third); // 使用 rnd.p 来计算均匀半径

    // 计算点的球坐标
    const x = Math.cos(theta) * Math.sin(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(phi);

    // 应用半径，得到均匀分布在球体内的点
    positions[i * 3] = x * randomRadius;
    positions[i * 3 + 1] = y * randomRadius;
    positions[i * 3 + 2] = z * randomRadius;
  }

  return positions;
}

// 计算颜色的辅助函数，非线性渐变反转，靠近球面时变为白色
function calculateNonlinearColor(regionColor, distance, maxDistance) {
  const white = [1.0, 1.0, 1.0]; // 白色
  const color = [];

  // 使用反转的非线性渐变，使得靠近球心时保持原始颜色，靠近球面时渐变为白色
  const t = 1 - Math.pow(distance / maxDistance, 30); // 非线性反转
  // t = 1 时为分区颜色，t = 0 时为白色

  for (let i = 0; i < 3; i++) {
    color[i] = white[i] + (regionColor[i] - white[i]) * t;
  }

  return color;
}

// 包装颜色设置逻辑的函数
function assignColorsToParticles(positions, colors, numParticles, maxDistance) {
  for (let i = 0; i < numParticles; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const distance = Math.sqrt(x * x + y * y + z * z); // 点到球心的距离

    let regionColor;

    // 确定粒子所在的区域
    if (Math.abs(x) > Math.abs(y) && Math.abs(x) > Math.abs(z)) {
      regionColor = x > 0 ? faceColors["+X"] : faceColors["-X"];
    } else if (Math.abs(y) > Math.abs(x) && Math.abs(y) > Math.abs(z)) {
      regionColor = y > 0 ? faceColors["+Y"] : faceColors["-Y"];
    } else {
      regionColor = z > 0 ? faceColors["+Z"] : faceColors["-Z"];
    }

    // 计算粒子的颜色，使用非线性渐变
    const color = calculateNonlinearColor(regionColor, distance, maxDistance);

    // 设置粒子的颜色
    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];
  }
}

// 调用函数生成 100 万个粒子，半径为 1
const numParticles = 1000000;
const radius = 1; // 可调整的球体半径
const positions = generateParticlesInSphere(numParticles, radius);
const colors = new Float32Array(numParticles * 3); // 每个粒子有 R、G、B 颜色

// 调用颜色设置函数
assignColorsToParticles(positions, colors, numParticles, radius);

// 创建顶点缓冲区
const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3)); // 设置颜色缓冲区

// 创建材质，支持顶点颜色
const material = new THREE.PointsMaterial({
  vertexColors: true, // 开启顶点颜色
  size: 1,
  sizeAttenuation: false,
  transparent: true,
  opacity: 0.7,
});

// 创建粒子系统
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// 渲染循环
let lastTime = performance.now();
// 定义旋转速度向量，以每秒的角度为单位 (角度/秒)
const rotationSpeedPerSecond = new THREE.Vector3(1.321, 8.598, 1.444);

// 将旋转速度从角度转换为弧度
const rotationSpeed = rotationSpeedPerSecond.multiplyScalar(Math.PI / 180); // 统一转换为弧度

function animate() {
  const currentTime = performance.now();
  const deltaTime = (currentTime - lastTime) / 1000; // 计算时间差，以秒为单位
  lastTime = currentTime;

  // 根据 deltaTime 调整 x, y, z 方向的旋转
  particles.rotation.x += rotationSpeed.x * deltaTime;
  particles.rotation.y += rotationSpeed.y * deltaTime;
  particles.rotation.z += rotationSpeed.z * deltaTime;

  renderer.render(scene, camera);
  // 更新 Stats
  stats.update();
  requestAnimationFrame(animate);
}

animate();

// 响应窗口大小变化
window.addEventListener("resize", onWindowResize, false);

// function onWindowResize() {
//   const aspect = window.innerWidth / window.innerHeight;
//   const zoomFactor = 1.5; // 可以根据需要动态调整

//   // 根据 zoomFactor 和宽高比调整正交相机的视图体积
//   camera.left = -aspect * zoomFactor;
//   camera.right = aspect * zoomFactor;
//   camera.top = zoomFactor;
//   camera.bottom = -zoomFactor;

//   camera.updateProjectionMatrix();

//   // 更新渲染器尺寸
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
}

function saveCurrentCanvasAsImage() {
  // 确保渲染器使用透明背景
  renderer.setClearColor(0x000000, 0); // 设置背景为透明

  // 渲染当前场景
  renderer.render(scene, camera);

  // 将渲染的结果转换为图片数据URL
  const imgData = renderer.domElement.toDataURL("image/png");

  // 创建一个链接并触发下载
  const link = document.createElement("a");
  link.href = imgData;
  link.download = "rendered_scene.png";
  link.click();
}

// 调用函数保存当前渲染画布
// saveCurrentCanvasAsImage();
