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

const stats = new Stats();
document.body.appendChild(stats.dom);

// 创建 OrbitControls 实例
const controls = new OrbitControls(camera, renderer.domElement);

{
  // 可选配置
  controls.enableDamping = true; // 启用阻尼（惯性），需要在动画循环中调用 controls.update()
  controls.dampingFactor = 0.05; // 阻尼系数
  controls.minDistance = 0.01; // 相机与目标的最小距离
  controls.maxDistance = 100; // 相机与目标的最大距离
  controls.enablePan = true; // 启用平移
  controls.enableZoom = true; // 启用缩放

  // 创建坐标轴辅助对象，长度为5
  const axesHelper = new THREE.AxesHelper(5);
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

  // 处理窗口大小变化
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio); // 确保在调整大小时也设置像素比
  });
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

// 设置纹理大小
const size = 2048; // 纹理大小为3x3，可以容纳9个粒子
const radius = 1; // 球体半径
const gpuCompute = new GPUComputationRenderer(size, size, renderer);

// 检查 WebGL2 支持
// if (renderer.capabilities.isWebGL2 === false) {
//   alert("GPUComputationRenderer 需要 WebGL2 支持");
// }

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

// 生成 [a, b] 范围内均匀分布的随机数
function getRandomInRange(a, b) {
  return Math.random() * (b - a) + a;
}

// 创建初始位置纹理
const initialPosition = gpuCompute.createTexture();
const posArray = initialPosition.image.data;

// 初始化位置数据，每个粒子的位置为球体上的随机点
for (let i = 0; i < posArray.length; i += 4) {
  [posArray[i], posArray[i + 1], posArray[i + 2]] =
    getRandomPositionInSphere(radius); // x, y, z
  posArray[i + 3] = 1.0; // w
}

// 创建背景点云位置的纹理
const backgroundPosition = gpuCompute.createTexture();
backgroundPosition.image.data.set(posArray);

const computeFragmentShader = `
  ${pnoise3D} // 包含 Perlin 噪声函数的 GLSL 代码

  uniform mat4 noiseTransformMatrix;        // 4x4 变换矩阵用于计算 Noise
  uniform mat4 positionTransformMatrix;     // 新的 4x4 变换矩阵，用于对粒子位置进行变换
  uniform vec3 rep;                         // 周期参数
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 从上一帧获取位置
    vec4 previousPosition = texture(position, uv);

    // 获取背景点云的位置
    vec4 backgroundPosition = texture(backgroundPosition, uv);
    
    // 使用 noiseTransformMatrix 进行噪声计算
    vec3 transformedPosition = (noiseTransformMatrix * vec4(previousPosition.xyz, 1.0)).xyz;
    float noiseValue = pnoise(transformedPosition, rep);  // 计算噪声值，范围 [-1, 1]

    // 使用 positionTransformMatrix 对 previousPosition 进行位置变换
    vec3 newPosition = (positionTransformMatrix * vec4(previousPosition.xyz, 1.0)).xyz;

    // 对 previousPosition 和 newPosition 进行线性插值，噪声值 noiseValue 作为权重
    vec3 interpolatedPosition = mix(previousPosition.xyz, newPosition, noiseValue);

    // 混合 interpolatedPosition 和 transformedBackgroundPosition, alpha 为 0.99
    vec3 finalPosition = mix(backgroundPosition.xyz, interpolatedPosition.xyz, 0.99);

    // 设置最终的位置
    gl_FragColor = vec4(finalPosition.xyz, 1.0);
  }
`;

const backgroundComputeFragmentShader = `
  uniform mat4 backgroundTransformMatrix;  // 背景点云的变换矩阵

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 从上一帧获取背景点云的位置
    vec4 backgroundPosition = texture(backgroundPosition, uv);  // 获取背景点云的 4 分量位置

    // 对背景点云应用背景矩阵的变换
    vec3 transformedBackgroundPosition = (backgroundTransformMatrix * vec4(backgroundPosition.xyz, 1.0)).xyz;

    // 设置新的背景点云位置
    gl_FragColor = vec4(transformedBackgroundPosition.xyz, 1.0);
  }
`;

// 添加位置变量并保存引用
const positionVariable = gpuCompute.addVariable(
  "position",
  computeFragmentShader,
  initialPosition
);

// 创建背景位置的变量，并使用 backgroundComputeFragmentShader 更新它
const backgroundPositionVariable = gpuCompute.addVariable(
  "backgroundPosition",
  backgroundComputeFragmentShader, // 用于更新背景点云的片段着色器
  backgroundPosition
);

// 设置变量依赖关系，确保 positionVariable 依赖于 backgroundPositionVariable
gpuCompute.setVariableDependencies(positionVariable, [
  positionVariable,
  backgroundPositionVariable,
]);
gpuCompute.setVariableDependencies(backgroundPositionVariable, [
  backgroundPositionVariable,
]);

function generateTransformationMatrices(elapsedTime) {
  // 设置噪声变换的参数
  const noiseRotationAngles = { x: 0, y: 0, z: 0 }; // 旋转角度（单位：度）
  const noiseScaleFactors = { x: 0.5, y: 0.5, z: 0.5 }; // 缩放因子
  const noiseTranslationValues = {
    x: 0,
    y: 0,
    z: 0,
  }; // 平移值

  const noiseTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      noiseRotationAngles,
      noiseScaleFactors,
      noiseTranslationValues
    )
  );

  // 设置位置变换的参数
  const positionRotationAngles = {
    x: 0,
    y: 0,
    z: 0,
  }; // 旋转角度（单位：度）
  const positionScaleFactors = {
    x: 1,
    y: 1,
    z: 1,
  }; // 缩放因子
  const positionTranslationValues = { x: 0, y: 0, z: 0 }; // 平移值

  const positionTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      positionRotationAngles,
      positionScaleFactors,
      positionTranslationValues
    )
  );

  // 设置背景点云的变换参数
  const backgroundRotationAngles = {
    x: 0,
    y: 0,
    z: 0,
  }; // 旋转角度（单位：度）
  const backgroundScaleFactors = { x: 1, y: 1, z: 1 }; // 缩放因子
  const backgroundTranslationValues = { x: 0, y: 0, z: 0 }; // 平移值

  const backgroundTransformationMatrix = new THREE.Matrix4().fromArray(
    generateTransformationMatrix(
      backgroundRotationAngles,
      backgroundScaleFactors,
      backgroundTranslationValues
    )
  );

  // 返回三个变换矩阵
  return {
    noiseTransformationMatrix,
    positionTransformationMatrix,
    backgroundTransformationMatrix,
  };
}

const {
  noiseTransformationMatrix,
  positionTransformationMatrix,
  backgroundTransformationMatrix,
} = generateTransformationMatrices(1);
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
backgroundPositionVariable.material.uniforms.backgroundTransformMatrix = {
  value: backgroundTransformationMatrix,
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
const colors = []; // 每个粒子有 R、G、B 颜色

// 生成球面上的粒子并为每个粒子赋予不同的颜色
for (let i = 0; i < numParticles; i++) {
  const [x, y, z] = posArray.slice(i * 4, i * 4 + 3); // 获取位置

  // 根据位置获取颜色
  const color = getColorByPosition(x, y, z);
  colors.push(...color);
}

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
geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));

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
  attribute vec3 color;
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
    gl_PointSize = 1.0;

    // 设置最终位置
    gl_Position = projectionMatrix * mvPosition;

    vColor = color;
  }
`,
  fragmentShader: `
  varying vec3 vColor; // 接收来自顶点着色器的颜色

  void main() {
      // 伽马校正
      vec3 gammaCorrectedColor = pow(vColor, vec3(1.0 / 2.2)); 
      gl_FragColor = vec4(gammaCorrectedColor, 0.6); // 使用传递的颜色
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
// 设置时间间隔（例如，每 5 秒调用一次函数）
const interval = 6; // 单位为秒
let elapsedTime = 0;

function animate() {
  // 获取从上次动画帧以来的时间增量
  const delta = clock.getDelta();
  // 增加累计时间
  elapsedTime += delta;

  // 当累计时间超过设定的间隔时调用函数
  // if (elapsedTime >= interval) {
  //   const runningTime = clock.getElapsedTime()
  //   const {
  //     noiseTransformationMatrix,
  //     positionTransformationMatrix,
  //     backgroundTransformationMatrix,
  //   } = generateTransformationMatrices(runningTime);
  //   const rep = new THREE.Vector3(3.0, 3.0, 3.0); // 周期性噪声的 rep 参数

  //   console.log("Updating transformation matrices");
  //   console.log("Noise transformation matrix:");
  //   console.log(noiseTransformationMatrix);
  //   console.log("Position transformation matrix:");
  //   console.log(positionTransformationMatrix);
  //   console.log("Background transformation matrix:");
  //   console.log(backgroundTransformationMatrix);
  //   console.log("Rep:");
  //   console.log(rep);
  //   console.log("Elapsed time:");
  //   console.log(runningTime);

  //   // 设置 Uniforms
  //   positionVariable.material.uniforms.time = { value: 0.0 };
  //   positionVariable.material.uniforms.delta = { value: 0.0 };
  //   positionVariable.material.uniforms.noiseTransformMatrix = {
  //     value: noiseTransformationMatrix,
  //   };
  //   positionVariable.material.uniforms.positionTransformMatrix = {
  //     value: positionTransformationMatrix,
  //   };
  //   backgroundPositionVariable.material.uniforms.backgroundTransformMatrix = {
  //     value: backgroundTransformationMatrix,
  //   };
  //   positionVariable.material.uniforms.rep = { value: rep };
  //   elapsedTime = 0; // 重置累计时间
  // }

  // 计算下一帧的位置
  gpuCompute.compute();

  const backgroundPositionTexture = gpuCompute.getCurrentRenderTarget(
    backgroundPositionVariable
  ).texture;

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
