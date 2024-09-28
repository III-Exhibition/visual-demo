import {
  HalfFloatType,
  MeshBasicMaterial,
  NearestFilter,
  ShaderMaterial,
  UniformsUtils,
  WebGLRenderTarget,
  BufferGeometry,
  Float32BufferAttribute,
  Mesh,
  OrthographicCamera,
} from "three";
import { Pass } from "postprocessing";
import { AfterimageShader } from "./shaders/AfterimageShader.js";

// Helper for passes that need to fill the viewport with a single quad.

const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

// https://github.com/mrdoob/three.js/pull/21358

class FullscreenTriangleGeometry extends BufferGeometry {
  constructor() {
    super();

    this.setAttribute(
      "position",
      new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3)
    );
    this.setAttribute("uv", new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  }
}

const _geometry = new FullscreenTriangleGeometry();

class FullScreenQuad {
  constructor(material) {
    this._mesh = new Mesh(_geometry, material);
  }

  dispose() {
    this._mesh.geometry.dispose();
  }

  render(renderer) {
    renderer.render(this._mesh, _camera);
  }

  get material() {
    return this._mesh.material;
  }

  set material(value) {
    this._mesh.material = value;
  }
}

class AfterimagePass extends Pass {
  constructor(damp = 0.96) {
    super("AfterimagePass");

    this.shader = AfterimageShader;

    this.uniforms = UniformsUtils.clone(this.shader.uniforms);

    this.uniforms["damp"].value = damp;

    this.textureComp = new WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        magFilter: NearestFilter,
        type: HalfFloatType,
      }
    );

    this.textureOld = new WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        magFilter: NearestFilter,
        type: HalfFloatType,
      }
    );

    this.compFsMaterial = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.shader.vertexShader,
      fragmentShader: this.shader.fragmentShader,
    });

    this.copyFsMaterial = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.shader.vertexShader,
      fragmentShader: this.shader.copyFragmentShader,
    });

    this.compFsQuad = new FullScreenQuad(this.compFsMaterial);
    this.copyFsQuad = new FullScreenQuad(this.copyFsMaterial);
  }

  render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest) {
    this.uniforms["tOld"].value = this.textureOld.texture;
    this.uniforms["tNew"].value = inputBuffer.texture;

    renderer.setRenderTarget(this.textureComp);
    this.compFsQuad.render(renderer);

    this.copyFsQuad.material.map = this.textureComp.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.copyFsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(outputBuffer);

      if (this.clear) renderer.clear();

      this.copyFsQuad.render(renderer);
    }

    // Swap buffers.
    const temp = this.textureOld;
    this.textureOld = this.textureComp;
    this.textureComp = temp;
    // Now textureOld contains the latest image, ready for the next frame.
  }

  setSize(width, height) {
    this.textureComp.setSize(width, height);
    this.textureOld.setSize(width, height);
  }

  dispose() {
    this.textureComp.dispose();
    this.textureOld.dispose();

    this.compFsMaterial.dispose();
    this.copyFsMaterial.dispose();

    this.compFsQuad.dispose();
    this.copyFsQuad.dispose();
  }
}

export { AfterimagePass };
