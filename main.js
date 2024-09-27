import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { createNoise3D } from "simplex-noise"; // 从simplex-noise v4导入createNoise3D
import { GUI } from "lil-gui"; // 引入 lil-gui

// 创建 3D 噪声函数
const noise3D = createNoise3D();

// 创建场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true }); // 保留绘图缓冲区，以便在渲染后获取画布内容
renderer.setClearColor(0x000000, 0);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
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

// 创建粒子数量
const particleCount = 200000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3); // 粒子的速度
const initialPositions = new Float32Array(particleCount * 3);

let time = 0;

// 生成粒子分布在球体内部
const baseRadius = 70; // 初始球体半径
let dynamicRadius = baseRadius; // 用于动态调整的半径
for (let i = 0; i < particleCount; i++) {
  const rnd = [Math.random(), Math.random(), Math.random(), Math.random()];

  const twoPi = 2.0 * Math.PI;
  const theta = twoPi * rnd[0]; // 随机生成 theta
  const phi = Math.acos(2 * rnd[1] - 1); // 随机生成 phi
  const third = 1.0 / 3.0;
  const r = Math.pow(rnd[2], third) * baseRadius; // 确保点均匀分布在体积内

  const x = r * Math.cos(theta) * Math.sin(phi);
  const y = r * Math.sin(theta) * Math.sin(phi);
  const z = r * Math.cos(phi);

  initialPositions[i * 3] = x;
  initialPositions[i * 3 + 1] = y;
  initialPositions[i * 3 + 2] = z;

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  // 初始化粒子的速度为0
  velocities[i * 3] = 0;
  velocities[i * 3 + 1] = 0;
  velocities[i * 3 + 2] = 0;
}

// 设置几何体的位置
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

// 更新材质使其支持顶点颜色
const material = new THREE.PointsMaterial({
  vertexColors: true, // 启用顶点颜色
  size: 1,
  sizeAttenuation: false,
  transparent: true,
  opacity: 0.7,
  depthWrite: false,
});

// 创建粒子系统并添加到场景中
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// 设置相机位置
camera.position.z = 150;

// 添加OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// 创建 lil-gui 并添加截图功能
const gui = new GUI();
const params = {
  screenshot: () => {
    const link = document.createElement("a");
    link.href = renderer.domElement.toDataURL("image/png");
    const timeString = new Date().toISOString().replace(/[-:.]/g, "");
    const date = new Date();
    const [month, day, minute, second] = [
      (date.getMonth() + 1).toString().padStart(2, "0"), // 将月份转换为两位数
      date.getDate().toString().padStart(2, "0"), // 将日期转换为两位数
      date.getMinutes().toString().padStart(2, "0"), // 将分钟转换为两位数
      date.getSeconds().toString().padStart(2, "0"), // 将秒数转换为两位数
    ];
    const fileName = `sphere-${month}${day}${minute}${second}`;
    link.download = `${fileName}.png`;
    link.click();
  },
};

gui.add(params, "screenshot").name("Save Screenshot");

// 函数：允许边界范围动态变化，并根据噪声进行扩散
function updateDynamicRadius() {
  // 动态调整的基础是保持一定范围
  const expansionFactor = 5; // 控制扩散幅度
  dynamicRadius = baseRadius + Math.sin(time * 0.5) * expansionFactor; // 基于正弦函数变化
}

// 函数：将粒子限制在不规则的边界内，并让边界受噪声控制
function constrainToIrregularShape(positions, velocities, baseRadius) {
  for (let i = 0; i < particleCount; i++) {
    const x = positions[i * 3];
    const y = positions[i * 3 + 1];
    const z = positions[i * 3 + 2];
    const distance = Math.sqrt(x * x + y * y + z * z);

    // 使用噪声生成不规则的半径边界
    const noiseFactor = 10; // 控制噪声影响大小
    const irregularRadius =
      baseRadius + noise3D(x * 0.05, y * 0.05, time) * noiseFactor;

    // 如果粒子超出当前不规则半径边界，则将其拉回
    if (distance > irregularRadius) {
      const factor = irregularRadius / distance;
      positions[i * 3] = x * factor;
      positions[i * 3 + 1] = y * factor;
      positions[i * 3 + 2] = z * factor;

      // 减缓速度，避免剧烈移动
      velocities[i * 3] *= 0.95;
      velocities[i * 3 + 1] *= 0.95;
      velocities[i * 3 + 2] *= 0.95;
    }
  }
}

// 在渲染循环的开头创建颜色渐变数组
const colors = new Float32Array(particleCount * 3);

// 创建用于颜色渐变的色板
const colorStops = [
  new THREE.Color(0xede7e9), // 到球心最近的颜色
  new THREE.Color(0xea3b4d),
  new THREE.Color(0xfb7c39),
  new THREE.Color(0xc4ded0),
  new THREE.Color(0xe4c2ca), // 到球心最远的颜色
];

// 函数：根据距离映射颜色
function mapDistanceToColor(distance, maxDistance) {
  const ratio = distance / maxDistance;
  const numStops = colorStops.length;
  const scaledRatio = ratio * (numStops - 1);
  const lowerIndex = Math.floor(scaledRatio);
  const upperIndex = Math.min(lowerIndex + 1, numStops - 1);
  const blendFactor = scaledRatio - lowerIndex;

  const color = new THREE.Color();
  color.lerpColors(colorStops[lowerIndex], colorStops[upperIndex], blendFactor);
  return color;
}

// 在 animate 函数中更新粒子的颜色
function animate() {
  requestAnimationFrame(animate);

  time += 0.01; // 控制时间因素

  // 动态更新粒子的运动范围
  updateDynamicRadius();

  // 更新每个粒子的位置和颜色，模拟扭曲和烟雾效果
  const positionsArray = geometry.attributes.position.array;
  const maxDistance = baseRadius + 10; // 动态范围最大值，用于颜色映射
  for (let i = 0; i < particleCount; i++) {
    const x = positionsArray[i * 3];
    const y = positionsArray[i * 3 + 1];
    const z = positionsArray[i * 3 + 2];

    // 计算到球心的距离
    const distance = Math.sqrt(x * x + y * y + z * z);

    // 映射距离到颜色
    const color = mapDistanceToColor(distance, maxDistance);

    // 更新颜色数组
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    // Simplex 噪声模拟湍流，结合旋转和扭曲
    const noiseFactor = 2; // 调整噪声影响强度，使其像烟雾
    const windX = noise3D(x * 0.05, y * 0.05, time) * noiseFactor;
    const windY = noise3D(y * 0.05, z * 0.05, time) * noiseFactor;
    const windZ = noise3D(z * 0.05, x * 0.05, time) * noiseFactor;

    // 更新粒子的速度
    velocities[i * 3] += windX * 0.01;
    velocities[i * 3 + 1] += windY * 0.01;
    velocities[i * 3 + 2] += windZ * 0.01;

    // 更新粒子的位置
    positionsArray[i * 3] += velocities[i * 3];
    positionsArray[i * 3 + 1] += velocities[i * 3 + 1];
    positionsArray[i * 3 + 2] += velocities[i * 3 + 2];
  }

  // 将粒子限制在动态扩散的边界内，且边界不规则
  constrainToIrregularShape(positionsArray, velocities, dynamicRadius);

  geometry.attributes.position.needsUpdate = true; // 告诉渲染器更新位置

  // 更新粒子的颜色
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.attributes.color.needsUpdate = true;

  // 粒子整体旋转
  particles.rotation.x += 0.005;
  particles.rotation.y += 0.005;

  // 更新控件
  controls.update();

  renderer.render(scene, camera);
}

// 监听窗口大小改变，调整渲染器尺寸
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 开始动画
animate();
