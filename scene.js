import * as THREE from "three";

export function initScene() {
  // 创建场景
  const scene = new THREE.Scene();

  // 创建相机
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  // camera.position.x = 1;
  // camera.position.y = 1;
  camera.position.z = 2;

  // 创建渲染器
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比
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

  // 处理窗口大小变化
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // 确保在调整大小时也设置像素比
  });

  return { scene, camera, renderer };
}
