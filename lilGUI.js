import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { BlendFunction } from "postprocessing";
import { animate } from "./main.js";

export function initGUI(renderer) {
  const gui = new GUI();
  const params = {
    isPaused: false,
    renderOneFrame: () => {
      animate();
    },
    // colorParams: {
    //   color_X_plus: { r: 1.0, g: 0.2745, b: 0.0 },   // 鲜艳的橘红色
    //   color_X_minus: { r: 1.0, g: 0.1961, b: 0.0 },  // 亮丽的红橘色
    //   color_Y_plus: { r: 1.0, g: 0.3333, b: 0.0 },   // 热情的亮橘色
    //   color_Y_minus: { r: 1.0, g: 0.1569, b: 0.0 },  // 活力的深橘红
    //   color_Z_plus: { r: 1.0, g: 0.4, b: 0.0 },      // 明亮的橙红色
    //   color_Z_minus: { r: 1.0, g: 0.2353, b: 0.0 },  // 生机勃勃的橘色
    // },
    afterImage: {
      damp: 0.9,
      enabled: true,
    },
    colorParams: {
      color_X_plus: { r: 0.8469, g: 0.7991, b: 0.8148 }, // 柔和的灰紫色
      color_X_minus: { r: 0.8308, g: 0.2747, b: 0.3185 }, // 暗红色
      color_Y_plus: { r: 0.8228, g: 0.0437, b: 0.0742 }, // 深红色
      color_Y_minus: { r: 0.9647, g: 0.2016, b: 0.0409 }, // 鲜艳的橙红色
      color_Z_plus: { r: 0.552, g: 0.7305, b: 0.6308 }, // 柔和的青绿色
      color_Z_minus: { r: 0.7758, g: 0.5395, b: 0.5906 }, // 柔和的粉红色
    },
    bloom: {
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.025,
      intensity: 1.0,
      mipmapBlur: true,
      radius: 0.45,
      opacity: 1.0,
      blendFunction: BlendFunction.ADD,
    },
    particleParams: {
      pointSize: 1.0,
      transparent: 0.4,
      useColor: true,
      colorPattern: "distance",
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
    saveScreenshot: () => {
      // 获取渲染器的画布内容并转换为 data URL
      const imgData = renderer.domElement.toDataURL("image/png");

      // 创建一个临时的 <a> 标签，用于下载图片
      const link = document.createElement("a");
      link.href = imgData;
      const date = new Date();
      const [month, day, minute, second] = [
        (date.getMonth() + 1).toString().padStart(2, "0"), // 将月份转换为两位数
        date.getDate().toString().padStart(2, "0"), // 将日期转换为两位数
        date.getMinutes().toString().padStart(2, "0"), // 将分钟转换为两位数
        date.getSeconds().toString().padStart(2, "0"), // 将秒数转换为两位数
      ];
      const fileName = `particle-${month}${day}${minute}${second}`;
      link.download = `${fileName}.png`;
      link.click();

      setTimeout(function () {
        // 保存 params 为 JSON 文件
        const jsonLink = document.createElement("a");
        const jsonData = new Blob([JSON.stringify(params, null, 2)], {
          type: "application/json",
        });
        jsonLink.href = URL.createObjectURL(jsonData);
        jsonLink.download = `${fileName}.json`;
        jsonLink.click();
      }, 3000);
    },
    isRecording: false,
    startRecording: () => {
      if (!params.isRecording) {
        params.isRecording = true;
        recordedChunks.length = 0; // Clear previous recordings
        mediaRecorder.start();
        recordingStatus.status = "Recording...";
        startRecordingButton.disable();
        stopRecordingButton.enable();
      }
    },
    stopRecording: () => {
      if (params.isRecording) {
        params.isRecording = false;
        mediaRecorder.stop();
        recordingStatus.status = "Not Recording";
        startRecordingButton.enable();
        stopRecordingButton.disable();
      }
    },
  };

  gui
    .add(params, "isPaused")
    .name("Pause/Resume")
    .onChange((value) => {
      params.isPaused = value;
      if (!params.isPaused) {
        animate();
        renderOneFrameButton.disable();
      } else {
        renderOneFrameButton.enable();
      }
    });
  const renderOneFrameButton = gui
    .add(params, "renderOneFrame")
    .name("Render One Frame > ")
    .disable();

  const afterImageFolder = gui.addFolder("afterImage parameters");
  afterImageFolder.add(params.afterImage, "damp", 0, 1, 0.001);
  afterImageFolder.add(params.afterImage, "enabled");

  const bloomPara = gui.addFolder("bloom parameters");
  bloomPara
    .add(params.bloom, "luminanceThreshold", 0, 1, 0.001)
    .name("lumiThreshold");
  bloomPara
    .add(params.bloom, "luminanceSmoothing", 0, 1, 0.001)
    .name("lumiSmoothing");
  bloomPara.add(params.bloom, "intensity", 0, 10, 0.01);
  bloomPara.add(params.bloom, "radius", 0.0, 1.0, 0.001);
  bloomPara.add(params.bloom, "opacity", 0, 1, 0.001);

  const pointPara = gui.addFolder("point parameters");
  pointPara.add(params.particleParams, "pointSize", 0.1, 10, 0.1);
  pointPara.add(params.particleParams, "transparent", 0, 1, 0.01);
  pointPara.add(params.particleParams, "useColor");
  pointPara.add(params.particleParams, "colorPattern", ["area", "distance"]);
  pointPara.addColor(params.colorParams, "color_X_plus");
  pointPara.addColor(params.colorParams, "color_X_minus");
  pointPara.addColor(params.colorParams, "color_Y_plus");
  pointPara.addColor(params.colorParams, "color_Y_minus");
  pointPara.addColor(params.colorParams, "color_Z_plus");
  pointPara.addColor(params.colorParams, "color_Z_minus");

  const noisePara = gui.addFolder("perling noise parameters");
  noisePara.add(params.noiseParams, "seed", 0, 300, 1);
  noisePara.add(params.noiseParams, "periodX", 1, 10, 1);
  noisePara.add(params.noiseParams, "periodY", 1, 10, 1);
  noisePara.add(params.noiseParams, "periodZ", 1, 10, 1);
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
  // 在 lil-gui 中添加按钮
  gui.add(params, "saveScreenshot").name("Save PNG");

  // Add buttons for recording
  const startRecordingButton = gui.add(params, "startRecording").name("Start Recording");
  const stopRecordingButton = gui.add(params, "stopRecording").name("Stop Recording").disable();

  // Add a label to show recording status
  const recordingStatus = { status: "Not Recording" };
  gui.add(recordingStatus, "status").name("Recording Status").listen();

  // Create a MediaRecorder instance
  const stream = renderer.domElement.captureStream();
  const mediaRecorder = new MediaRecorder(stream);
  const recordedChunks = [];

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = () => {
    const blob = new Blob(recordedChunks, {
      type: "video/webm",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "rendered_video.webm";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return params;
}

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

  return folder;
}