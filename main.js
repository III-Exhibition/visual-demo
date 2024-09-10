import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 创建场景
const scene = new THREE.Scene();

// 创建相机，初始距离适中，让球体充满屏幕
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 25;  // 将相机距离设置为 25 以便球体充满屏幕

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加坐标轴辅助 (AxesHelper)，长度设置为 10 与球体半径相匹配
const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

// 创建 BufferGeometry 来存储粒子数据
const particles = 1000000;  // 粒子数量
const geometry = new THREE.BufferGeometry();

// 创建两个数组来存储粒子坐标和颜色
const positions = new Float32Array(particles * 3);
const colors = new Float32Array(particles * 3);  // 用于存储每个粒子的颜色
const alphas = new Float32Array(particles);      // 用于存储每个粒子的透明度

// 随机分布在球体内的点
const radius = 10;  // 球体半径设为 10

// 初始化 colorMin 和 colorMax 为极端值，只计算 functionY < 0.1 的粒子
let colorMin = Infinity;
let colorMax = -Infinity;

// 遍历所有粒子，首先计算 functionY 小于 0.1 的粒子的 colorMin 和 colorMax
for (let i = 0; i < particles; i++) {
  // 生成均匀分布的球体半径（使用立方根来均匀填充球体）
  const r = radius * Math.cbrt(Math.random());

  // 生成极角 theta 和方位角 phi
  const theta = Math.acos(2 * Math.random() - 1);  // θ 在 0 到 π 之间
  const phi = 2 * Math.PI * Math.random();         // φ 在 0 到 2π 之间

  // 将球坐标转换为笛卡尔坐标
  const x = r * Math.sin(theta) * Math.cos(phi);
  const y = r * Math.sin(theta) * Math.sin(phi);
  const z = r * Math.cos(theta);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  // 根据公式 Y = 0.2126 X + 0.7152 Y + 0.0722 Z 计算函数值
  const functionY = 0.2126 * x + 0.7152 * y + 0.0722 * z;

  // 如果 functionY 小于 0.1，更新 colorMin 和 colorMax
  if (Math.abs(functionY) < 0.1) {
    if (functionY < colorMin) colorMin = functionY;
    if (functionY > colorMax) colorMax = functionY;
  }
}

// 第二遍遍历所有粒子，设置透明度并归一化颜色
for (let i = 0; i < particles; i++) {
  const x = positions[i * 3];
  const y = positions[i * 3 + 1];
  const z = positions[i * 3 + 2];

  const functionY = 0.2126 * x + 0.7152 * y + 0.0722 * z;

  // 设置透明度：当 Y 值大于或等于 0.1 时，透明度为 0，否则为 1
  alphas[i] = Math.abs(functionY) < 0.1 ? 1.0 : 0.0;

  // 归一化颜色，只对 Y < 0.1 的粒子进行归一化
  if (Math.abs(functionY) < 0.1) {
    const normalizedValue = (functionY - colorMin) / (colorMax - colorMin);
    const color = new THREE.Color();
    color.setHSL(normalizedValue * 0.7, 1.0, 0.5);  // HSL 色彩空间，H 范围为 0 到 0.7（蓝到红）

    colors[i * 3] = color.r;  // 红色通道
    colors[i * 3 + 1] = color.g;  // 绿色通道
    colors[i * 3 + 2] = color.b;  // 蓝色通道
  } else {
    // 如果 Y >= 0.1，设为透明粒子
    colors[i * 3] = 0;
    colors[i * 3 + 1] = 0;
    colors[i * 3 + 2] = 0;
  }
}

// 将粒子位置设置到 BufferGeometry 中
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// 将颜色数据添加到几何体中
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// 创建每个粒子的透明度属性
geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

// 创建粒子材质，启用顶点颜色和透明度
const material = new THREE.PointsMaterial({
  size: 0.05,
  vertexColors: true,  // 使用顶点颜色
  transparent: true,   // 启用透明度
  opacity: 1.0,
  alphaTest: 0.001,    // 使用 alphaTest 过滤透明度为 0 的点
  depthWrite: false,   // 禁止深度写入，以便透明物体正确显示
  blending: THREE.AdditiveBlending, // 使用叠加混合，使粒子更具有发光效果
});

// 使用 Points 对象来渲染粒子系统
const particleSystem = new THREE.Points(geometry, material);
scene.add(particleSystem);

// 创建 OrbitControls 来控制相机
const controls = new OrbitControls(camera, renderer.domElement);

// 使相机能够根据鼠标进行旋转和缩放
controls.enableDamping = true;  // 添加阻尼感
controls.dampingFactor = 0.25;
controls.screenSpacePanning = false;
controls.maxDistance = 50;  // 限制最大缩放距离
controls.minDistance = 10;  // 限制最小缩放距离

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 为了增加动态效果，可以在这里添加粒子的旋转或移动
  // particleSystem.rotation.x += 0.001;
  // particleSystem.rotation.y += 0.001;

  // 更新控制器
  controls.update();

  renderer.render(scene, camera);
}

// 调整窗口大小时更新相机和渲染器
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
