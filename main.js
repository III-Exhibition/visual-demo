import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mat4, vec3 } from 'gl-matrix';

// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 100;

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加坐标轴辅助 (AxesHelper)
const axesHelper = new THREE.AxesHelper(50);
scene.add(axesHelper);

// 创建 BufferGeometry 来存储粒子数据
const particles = 100000;  // 粒子数量
const geometry = new THREE.BufferGeometry();

// 创建一个 Float32Array 来存储每个粒子的坐标
const positions = new Float32Array(particles * 3);

// 将粒子均匀分布在球体上
const radius = 50;  // 球体半径

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
}

// 将粒子位置设置到 BufferGeometry 中
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// 创建粒子材质
const material = new THREE.PointsMaterial({
  color: 0xFFFFFF,
  size: 0.05,
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
controls.maxDistance = 500;
controls.minDistance = 50;

// 初始化变换矩阵
const rotationMatrix = mat4.create();
const degToRad = Math.PI / 180;  // 度数转换为弧度

// 计算亮度的函数
function computeLuminance(r, g, b) {
  return 0.2126 * Math.abs(r) + 0.7152 * Math.abs(g) + 0.0722 * Math.abs(b);
}

// 对每个粒子应用旋转变换，使用亮度作为权重
function rotateParticles() {
  for (let i = 0; i < particles; i++) {
    const point = vec3.fromValues(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2]
    );

    // 根据位置坐标 (X, Y, Z) 计算模拟的 RGB 值
    const r = (point[0] / radius + 1) / 2;  // 归一化到 [0, 1]
    const g = (point[1] / radius + 1) / 2;
    const b = (point[2] / radius + 1) / 2;

    // 计算亮度值
    const luminance = computeLuminance(r, g, b);

    // 初始化旋转矩阵
    mat4.identity(rotationMatrix);

    // 旋转 3 度绕 X 轴, 4 度绕 Y 轴, 5 度绕 Z 轴
    mat4.rotateX(rotationMatrix, rotationMatrix, 6 * degToRad);
    mat4.rotateY(rotationMatrix, rotationMatrix, 6 * degToRad);
    mat4.rotateZ(rotationMatrix, rotationMatrix, 6 * degToRad);

    // 应用旋转矩阵，同时根据亮度值 (作为权重) 混合原始位置和旋转后的位置
    const originalPoint = vec3.clone(point);
    vec3.transformMat4(point, point, rotationMatrix);

    // 插值计算最终位置 (按亮度值控制变换强度)
    vec3.lerp(point, originalPoint, point, luminance);

    // 更新粒子的位置
    positions[i * 3] = point[0];
    positions[i * 3 + 1] = point[1];
    positions[i * 3 + 2] = point[2];
  }

  // 更新 BufferGeometry 中的位置数据
  geometry.attributes.position.needsUpdate = true;
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 每次渲染时对粒子进行旋转
  rotateParticles();

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
