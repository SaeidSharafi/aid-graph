import * as THREE from "three";
import { Effect } from "postprocessing";
import React, { forwardRef, useRef } from "react";
import { BG, NEUTRAL_INK } from "../../types/graph";

const duotoneFragmentShader = `
  uniform vec3 shadow;
  uniform vec3 highlight;

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    float l = dot(inputColor.rgb, vec3(0.299, 0.587, 0.114));
    vec3 col = mix(shadow, highlight, smoothstep(0.08, 0.96, l));
    outputColor = vec4(col, inputColor.a);
  }
`;

export class DuotoneEffectImpl extends Effect {
  constructor() {
    super("DuotoneEffect", duotoneFragmentShader, {
      uniforms: new Map([
        ["shadow", new THREE.Uniform(new THREE.Color(NEUTRAL_INK))],
        ["highlight", new THREE.Uniform(new THREE.Color(BG))],
      ]),
    });
  }
}

export const DuotoneEffect = forwardRef<DuotoneEffectImpl>((_, ref) => {
  const effectRef = useRef<DuotoneEffectImpl | null>(null);
  if (!effectRef.current) {
    effectRef.current = new DuotoneEffectImpl();
  }
  return <primitive ref={ref} object={effectRef.current} dispose={null} />;
});
DuotoneEffect.displayName = "DuotoneEffect";