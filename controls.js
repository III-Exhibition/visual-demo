import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry";

export function initControls(camera, renderer) {
  // 创建 OrbitControls 实例
  const controls = new OrbitControls(camera, renderer.domElement);

  // 可选配置
  controls.enableDamping = true; // 启用阻尼（惯性），需要在动画循环中调用 controls.update()
  controls.dampingFactor = 0.05; // 阻尼系数
  controls.minDistance = 0.01; // 相机与目标的最小距离
  controls.maxDistance = 100; // 相机与目标的最大距离
  controls.enablePan = true; // 启用平移
  controls.enableZoom = true; // 启用缩放

  return controls;
}

export function initStats() {
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  return stats;
}

export function initAxes(scene) {
  // 创建坐标轴辅助对象，长度为5
  const axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);
}

export function initRuler(scene) {
  // 在 X, Y, Z 轴上添加标尺，长度为 5，间隔为 1
  const xRuler = createRuler("x", 3, 1);
  const yRuler = createRuler("y", 3, 1);
  const zRuler = createRuler("z", 3, 1);

  scene.add(xRuler);
  scene.add(yRuler);
  scene.add(zRuler);
}

export function initText(scene) {
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
      xTextMesh.position.set(3.5, 0, 0); // 放置在 X 轴末端
      scene.add(xTextMesh);

      // Y 轴标记
      const yTextGeometry = new TextGeometry("Y", textOptions);
      const yTextMesh = new THREE.Mesh(yTextGeometry, textMaterial);
      yTextMesh.position.set(0, 3.5, 0); // 放置在 Y 轴末端
      scene.add(yTextMesh);

      // Z 轴标记
      const zTextGeometry = new TextGeometry("Z", textOptions);
      const zTextMesh = new THREE.Mesh(zTextGeometry, textMaterial);
      zTextMesh.position.set(0, 0, 3.5); // 放置在 Z 轴末端
      scene.add(zTextMesh);
    }
  );
}

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
