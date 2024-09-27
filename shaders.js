import pnoise3D from "./shaders/classicnoise3D.vert";

export const positionComputeFragmentShader = `
  ${pnoise3D} // 包含 Perlin 噪声函数的 GLSL 代码

  uniform mat4 noiseTransformMatrix;        // 4x4 变换矩阵用于计算 Noise
  uniform mat4 positionTransformMatrix;     // 新的 4x4 变换矩阵，用于对粒子位置进行变换
  uniform vec3 rep;                         // 周期参数
  uniform float seed;                         // 周期参数
  
  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 从上一帧获取位置
    vec4 previousPosition = texture(position, uv);

    // 获取背景点云的位置
    vec4 backgroundPosition = texture(backgroundPosition, uv);
    
    // 使用 noiseTransformMatrix 进行噪声计算
    vec3 transformedPosition = (noiseTransformMatrix * vec4(previousPosition.xyz, 1.0)).xyz;
    float noiseValue = pnoise(transformedPosition, rep, seed);  // 计算噪声值，范围 [-1, 1]

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

export const colorComputeFragmentShader = `
  uniform vec3 colors[6];
  uniform float radius;

  // 函数：根据顶点的空间位置确定其所在的区域
  vec3 getColorByPositionArea(float x, float y, float z) {
    vec3 color_X_plus = colors[0];
    vec3 color_X_minus = colors[1];
    vec3 color_Y_plus = colors[2];
    vec3 color_Y_minus = colors[3];
    vec3 color_Z_plus = colors[4];
    vec3 color_Z_minus = colors[5];
    if (abs(x) >= abs(y) && abs(x) >= abs(z)) {
      return x >= 0.0 ? color_X_plus : color_X_minus;
    } else if (abs(y) >= abs(x) && abs(y) >= abs(z)) {
      return y >= 0.0 ? color_Y_plus : color_Y_minus;
    } else {
      return z >= 0.0 ? color_Z_plus : color_Z_minus;
    }
  }

  // 函数：根据距离映射颜色
  vec3 getColorByPositionDistance(float distance, float maxDistance) {
    vec3 colorStops[6] = colors;

    // 计算距离比例
    float ratio = distance / maxDistance;
    int numStops = 6;
    float scaledRatio = ratio * float(numStops - 1);
    int lowerIndex = int(floor(scaledRatio));
    int upperIndex = min(lowerIndex + 1, numStops - 1);
    float blendFactor = scaledRatio - float(lowerIndex);

    // 混合颜色
    vec3 color = mix(colorStops[lowerIndex], colorStops[upperIndex], blendFactor);
    return color;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // 获取背景点云的位置
    vec4 backgroundPosition = texture(backgroundPosition, uv);

    // 根据背景点云的位置，获取颜色
    // vec3 color = getColorByPositionArea(backgroundPosition.x, backgroundPosition.y, backgroundPosition.z);
    
    // 计算最大距离和当前距离
    float maxDistance = radius;
    float distance = length(backgroundPosition.xyz);

    // 根据距离获取颜色
    vec3 color = getColorByPositionDistance(distance, maxDistance);

    // 设置片元颜色
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const backgroundComputeFragmentShader = `
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

export const vertexShader = `
  uniform sampler2D positionTexture;
  uniform sampler2D colorTexture;
  uniform vec2 resolution;
  uniform float pointSize;
  attribute float vertexIndex;
  attribute vec4 color;
  varying vec4 vColor; // 用于传递颜色到片段着色器

  void main() {
    // 计算 UV 坐标
    float index = vertexIndex;
    float u = (mod(index, resolution.x) + 0.5) / resolution.x;
    float v = (floor(index / resolution.x) + 0.5) / resolution.y;
    vec2 uv = vec2(u, v);

    // 从 positionTexture 获取位置数据
    vec4 posData = texture(positionTexture, uv);
    vec3 pos = posData.xyz;

    // 从 colorTexture 获取颜色数据
    vColor = texture(colorTexture, uv);


    // 变换到视图空间
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

    // 设置点大小
    gl_PointSize = pointSize;

    // 设置最终位置
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const fragmentShader = `
  uniform float transparent;  // 透明度
  uniform bool useColor;      // 是否使用颜色
  varying vec4 vColor; // 接收来自顶点着色器的颜色

  void main() {
      gl_FragColor = vec4(useColor ? vColor.rgb : vec3(1.0), transparent); // 使用传递的颜色
  }
`;
