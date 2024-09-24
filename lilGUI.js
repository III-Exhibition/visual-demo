import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

export function initGUI(renderer) {
  const gui = new GUI();
  const params = {
    particleParams: {
      pointSize: 1.0,
      transparent: 0.7,
      useColor: true,
    },
    noiseParams: {
      seed: Math.floor(Math.random() * 300),
      periodX: 3.0,
      periodY: 3.0,
      periodZ: 3.0,
    },
    noiseMatrix: {
      rotationAngles: { x: 0, y: 0, z: 0 },
      scaleFactors: { x: 0.5, y: 0.5, z: 0.5 },
      translationValues: { x: 0, y: 0, z: 0 },
    },
    backgroundMatrix: {
      rotationAngles: { x: 1.959, y: 3.418, z: 12.8 },
      scaleFactors: { x: 1, y: 1, z: 1 },
      translationValues: { x: 0, y: 0, z: 0 },
    },
    positionMatrix: {
      rotationAngles: { x: -3.526632, y: -6.152985, z: 23.03788 },
      scaleFactors: { x: 1.099204, y: 1.123625, z: 1.087077 },
      translationValues: { x: 0, y: 0, z: 0 },
    },
    saveScreenshot: function () {
      // 获取渲染器的画布内容并转换为 data URL
      const imgData = renderer.domElement.toDataURL("image/png");

      // 创建一个临时的 <a> 标签，用于下载图片
      const link = document.createElement("a");
      link.href = imgData;
      const date = new Date();
      const [ month, day, minute, second ] = [
        (date.getMonth() + 1).toString().padStart(2, '0'), // 将月份转换为两位数
        date.getDate().toString().padStart(2, '0'), // 将日期转换为两位数
        date.getMinutes().toString().padStart(2, '0'), // 将分钟转换为两位数
        date.getSeconds().toString().padStart(2, '0') // 将秒数转换为两位数
      ];
      link.download = `particle-${month}${day}${minute}${second}.png`;
      link.click();
    },
  };

  const pointPara = gui.addFolder("point parameters");
  pointPara.add(params.particleParams, "pointSize", 0.1, 10, 0.1);
  pointPara.add(params.particleParams, "transparent", 0, 1, 0.01);
  pointPara.add(params.particleParams, "useColor");

  const noisePara = gui.addFolder("perling noise parameters");
  noisePara.add(params.noiseParams, "seed", 0, 300, 1);
  noisePara.add(params.noiseParams, "repX", 1, 10, 1);
  noisePara.add(params, "seed", 0, 300, 1);
  noisePara.add(params, "periodX", 1, 10, 1);
  noisePara.add(params, "periodY", 1, 10, 1);
  noisePara.add(params, "periodZ", 1, 10, 1);
  // 使用通用函数来创建矩阵控制
  addMatrixControls(
    gui,
    "background transformation matrix",
    params.backgroundMatrix
  );
  addMatrixControls(gui, "noise transformation matrix", params.noiseMatrix);
  addMatrixControls(
    gui,
    "position transformation matrix",
    params.positionMatrix
  );
  return params;
  // }

  // 通用的函数，用于创建矩阵相关的 GUI 控件
  function addMatrixControls(gui, folderName, matrixParams) {
    const folder = gui.addFolder(folderName);

    folder
      .add(matrixParams.rotationAngles, "x", -30, 30, 0.00001)
      .name("rotationX");
    folder
      .add(matrixParams.rotationAngles, "y", -30, 30, 0.00001)
      .name("rotationY");
    folder
      .add(matrixParams.rotationAngles, "z", -30, 30, 0.00001)
      .name("rotationZ");

    folder.add(matrixParams.scaleFactors, "x", 0.5, 1.5, 0.01).name("scaleX");
    folder.add(matrixParams.scaleFactors, "y", 0.5, 1.5, 0.01).name("scaleY");
    folder.add(matrixParams.scaleFactors, "z", 0.5, 1.5, 0.01).name("scaleZ");

    folder
      .add(matrixParams.translationValues, "x", -1, 1, 0.01)
      .name("translationX");
    folder
      .add(matrixParams.translationValues, "y", -1, 1, 0.01)
      .name("translationY")
      .listen();
    folder
      .add(matrixParams.translationValues, "z", -1, 1, 0.01)
      .name("translationZ");

    // 在 lil-gui 中添加按钮
    gui.add(params, "saveScreenshot").name("Save PNG");

    return folder;
  }
}
