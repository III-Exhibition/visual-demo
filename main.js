// 引入 Three.js 模块
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import simplexNoise from "./simplexNoise3D.glsl";

// 创建场景、相机和渲染器
const postionMapScene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10); // 使用正交相机，确保图片比例正确
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建坐标轴辅助线 (长为 2 单位)
const axesHelper = new THREE.AxesHelper(2);
postionMapScene.add(axesHelper);

// 创建 OrbitControls，用于通过鼠标控制相机
const controls = new OrbitControls(camera, renderer.domElement);

// 更新 OrbitControls 的状态
controls.update();

// 创建渲染目标缓冲区 (WebGLRenderTarget)
const sphereMapRenderTarget = new THREE.WebGLRenderTarget(1000, 1000, {
  minFilter: THREE.NearestFilter, // 禁用缩小时的插值
  magFilter: THREE.NearestFilter, // 禁用放大时的插值
});

// 创建平面几何体，大小为 2x2 的正方形
const square = new THREE.PlaneGeometry(2, 2);

const vertexShaderCode = `
        varying vec2 vUv;

        void main() {
            vUv = uv; // 传递 UV 坐标给片元着色器
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

const fragmentShaderCode = `
    varying vec2 vUv;

    // 生成伪随机数
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    // 将随机点映射到球体内
    vec3 randomInSphere(vec2 uv) {
        // 预先计算常量
        const float pi = 3.14159265359;
        const float twoPi = 6.28318530718;

        // 生成三个随机数：用于极角 (θ), 方位角 (φ) 和半径 (r)
        float theta = random(uv) * pi;               // θ: 0 到 π
        float phi = random(uv + vec2(0.1)) * twoPi;  // φ: 0 到 2π
        float r = pow(random(uv + vec2(0.2)), 1.0 / 3.0);  // 半径 r，通过开立方确保均匀分布

        // 极坐标转换为笛卡尔坐标
        float sinTheta = sin(theta);
        float x = r * sinTheta * cos(phi);
        float y = r * sinTheta * sin(phi);
        float z = r * cos(theta);

        return vec3(x, y, z);  // 返回 XYZ 坐标
    }

    void main() {
        // 获取当前UV坐标
        vec2 uv = vUv;

        // 在球体内生成均匀分布的点
        vec3 point = randomInSphere(uv);

        // 将点的坐标映射为 RGB 值
        gl_FragColor = vec4((point + 1.0) / 2.0, 1.0);  // 将 [-1, 1] 的坐标范围映射为 [0, 1]
    }
`;

// 自定义噪音片元着色器
const material = new THREE.ShaderMaterial({
  vertexShader: vertexShaderCode,
  fragmentShader: fragmentShaderCode,
});

// 将几何体和材质组合成网格
const plane = new THREE.Mesh(square, material);
postionMapScene.add(plane);

// 设置正交相机位置，使平面充满视图
camera.position.z = 1;

// 渲染到缓冲区
renderer.setRenderTarget(sphereMapRenderTarget);
renderer.render(postionMapScene, camera);

renderer.setRenderTarget(null);
renderer.render(postionMapScene, camera);

{
  // 创建缓冲区来存储像素数据 (RGBA，每个通道 1 字节)
  const pixelBuffer = new Uint8Array(1000 * 1000 * 4); // 1000x1000 分辨率，每个像素 3 个通道（RGB）

  // 读取渲染目标的像素数据
  renderer.readRenderTargetPixels(
    sphereMapRenderTarget,
    0,
    0,
    1000,
    1000,
    pixelBuffer
  );

  // 输出缓冲区数据到控制台
  console.log(pixelBuffer);
  console.log(sphereMapRenderTarget.texture);
}

// 渲染到屏幕上
renderer.setRenderTarget(null);
renderer.render(postionMapScene, camera);

const convolutionFragmentShaderCode = `
    uniform sampler2D sphereMap;
    uniform float time;
    varying vec2 vUv;

    ${simplexNoise}  // 插入 Simplex 噪声函数

    void main() {
        // 从球体贴图中获取每个像素的颜色
        vec3 sphereColor = texture2D(sphereMap, vUv).rgb;

        vec3 particlePosition = vec3(vUv * 2.0 - 1.0, 0.0);  // 将 UV 坐标映射到 [-1, 1] 范围内
        float noiseValue = snoise(vec3(particlePosition.x , particlePosition.y, particlePosition.z) * 10.0 + time);

        // sphereColor += noiseValue * 0.1;  // 添加噪声
        gl_FragColor = vec4(sphereColor, 1.0);
  }
  `;

// 创建 ShaderMaterial 并将第一个着色器的结果作为控制图像传递给第二个着色器
const convolutionMaterial = new THREE.ShaderMaterial({
  uniforms: {
    sphereMap: { value: sphereMapRenderTarget.texture }, // 第一个着色器的结果作为 sphereMap
    time: { value: 0.0 },
  },
  vertexShader: vertexShaderCode, // 顶点着色器（保持不变）
  fragmentShader: convolutionFragmentShaderCode, // 第二个卷积处理的片段着色器
});

plane.material = convolutionMaterial; // 将卷积处理的 ShaderMaterial 应用到这个几何体上

// 使用卷积材质渲染并将结果存储到卷积的 WebGLRenderTarget
const postionMapRenderTarget = new THREE.WebGLRenderTarget(1000, 1000, {
  minFilter: THREE.NearestFilter, // 禁用缩小时的插值
  magFilter: THREE.NearestFilter, // 禁用放大时的插值
});

// 渲染到卷积处理的渲染目标
renderer.setRenderTarget(postionMapRenderTarget);
renderer.render(postionMapScene, camera);

renderer.setRenderTarget(null); // 恢复默认渲染目标
renderer.render(postionMapScene, camera); // 渲染到屏幕上

const feedbackRenderTarget1 = new THREE.WebGLRenderTarget(1000, 1000, {
  minFilter: THREE.NearestFilter, // 禁用缩小时的插值
  magFilter: THREE.NearestFilter, // 禁用放大时的插值
});
const feedbackRenderTarget2 = new THREE.WebGLRenderTarget(1000, 1000, {
  minFilter: THREE.NearestFilter, // 禁用缩小时的插值
  magFilter: THREE.NearestFilter, // 禁用放大时的插值
});

let currentRenderTarget = feedbackRenderTarget1;
let previousRenderTarget = postionMapRenderTarget;

const feedbackMaterial = new THREE.ShaderMaterial({
  uniforms: {
    previousFrame: { value: previousRenderTarget.texture }, // 传入前一帧的渲染结果
    time: { value: 0.0 },
  },
  vertexShader: `
        varying vec2 vUv;
    
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
  fragmentShader: `
        uniform sampler2D previousFrame;
        uniform float time;
        varying vec2 vUv;
    
        void main() {
          vec4 previousColor = texture2D(previousFrame, vUv);
    
          // 添加当前帧的一些变化，比如基于时间的颜色变化
          vec4 currentColor = vec4(sin(time) * 0.5 + 0.5, cos(time) * 0.5 + 0.5, 0.0, 1.0);
    
          // 将前一帧的颜色与当前帧混合
          gl_FragColor = mix(previousColor, currentColor, 0.05);  // 反馈效果
        }
      `,
  transparent: true,
});
renderer.setRenderTarget(currentRenderTarget);
renderer.render(postionMapScene, camera);

// 创建缓冲区来存储像素数据 (RGBA，每个通道 1 字节)
const pixelBuffer = new Uint8Array(1000 * 1000 * 4); // 1000x1000 分辨率，每个像素 4 个通道（RGBA）

// 读取渲染目标的像素数据
renderer.readRenderTargetPixels(
  postionMapRenderTarget,
  0,
  0,
  1000,
  1000,
  pixelBuffer
);

// 输出缓冲区数据到控制台
console.log(pixelBuffer);
console.log(postionMapRenderTarget.texture);

renderer.setRenderTarget(null); // 恢复默认渲染目标
renderer.render(postionMapScene, camera); // 渲染到屏幕上

// 点群场景
const pointCloudScene = new THREE.Scene();

// 创建点云的 BufferGeometry
const size = 1000; // 点云大小
const pointCount = 1000000; // 假设我们有 100 万个点
const positions = new Float32Array(pointCount * 3); // 每个点有 x, y, z 坐标
const uvs = new Float32Array(pointCount * 2); // 每个点有 2 个 UV 坐标 (u, v)

for (let i = 0; i < size; i++) {
  for (let j = 0; j < size; j++) {
    const index = i * size + j;

    // 为每个顶点生成随机位置（具体值不重要，随便设置）
    positions[index * 3] = Math.random();
    positions[index * 3 + 1] = Math.random();
    positions[index * 3 + 2] = Math.random();

    // 计算对齐到像素中心的 UV 坐标
    uvs[index * 2] = (i + 0.5) / size; // u 坐标
    uvs[index * 2 + 1] = (j + 0.5) / size; // v 坐标
  }
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));

const pointVertexShaderCode = `
    uniform float time;
    uniform sampler2D positionMap;
    varying vec2 vUv;
    varying vec3 vPosition;

    void main() {
      vUv = uv;
      // 从位置贴图中获取每个顶点的位置信息
      vec3 newPosition = texture2D(positionMap, vUv).xyz;
      vPosition = newPosition;

      newPosition = newPosition * 2.0 - 1.0; // 将坐标范围从 [0, 1] 映射到 [-1, 1]

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      gl_PointSize = 0.05;
    }
  `;

const pointFragmentShaderCode = `
    uniform float time;
    varying vec2 vUv;
    varying vec3 vPosition;

    ${simplexNoise}  // 插入 Simplex 噪声函数

    

    void main() {
        float noiseValue = snoise(vPosition * 10.0 + time);
        vec3 color = mix(vec3(0.2, 0.6, 1.0), vec3(1.0, 0.5, 0.3), noiseValue);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

const pointMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    positionMap: { value: sphereMapRenderTarget.texture }, // 使用位置贴图
  },
  vertexShader: pointVertexShaderCode,
  fragmentShader: pointFragmentShaderCode,
  transparent: true,
});

const pointCloud = new THREE.Points(geometry, pointMaterial);
pointCloudScene.add(pointCloud);
pointCloudScene.add(axesHelper);

renderer.render(pointCloudScene, camera);
pointCloud.rotation.x += 0.34;
pointCloud.rotation.y += 0.56;

function animate() {
  requestAnimationFrame(animate);

    convolutionMaterial.uniforms.time.value += 1 / 120;
    renderer.setRenderTarget(postionMapRenderTarget);
    renderer.render(postionMapScene, camera);
  renderer.setRenderTarget(null);

  // 更新 OrbitControls

  pointMaterial.uniforms.positionMap.value = postionMapRenderTarget.texture;
  renderer.render(pointCloudScene, camera);

    pointCloud.rotation.x += 0.005;
    pointCloud.rotation.y += 0.005;

  controls.update();
}
animate();
