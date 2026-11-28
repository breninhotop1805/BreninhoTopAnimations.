// EP04 — hair that CHANGES COLOUR (the colour of the loved one's eyes), with a sweep from the crown down, a glow band at the sweep
// front, optional GLOW (emissive), TWO-TONE (left half / right half: the new girl = half blue, half brown) and a CLIP height (hair
// hidden above y so it never pokes through a hat / beanie / cap). Works on HAIR4 and HAIR6 groups (materials are cloned per char).
import * as THREE from 'three';
const _m = new THREE.Matrix4();
export function hairFX(c, group, o = {}) {
  const U = { uOld: { value: new THREE.Color(o.old || '#3a2414') }, uA: { value: new THREE.Color(o.a || o.old || '#3a2414') }, uB: { value: new THREE.Color(o.b || o.a || o.old || '#3a2414') },
    uSweep: { value: o.sweep ?? 0 }, uTwo: { value: o.two ? 1 : 0 }, uClip: { value: o.clip ?? 99 }, uBand: { value: 0 }, uHeadInv: { value: new THREE.Matrix4() } };
  const mats = new Map();
  group.traverse(m => { if (!m.isMesh) return; const src = m.material; if (!mats.has(src)) { const k = src.clone(); k.color = new THREE.Color('#ffffff'); k.emissive = new THREE.Color('#000000');
      k.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
        sh.vertexShader = 'uniform mat4 uHeadInv; varying vec3 vLoc;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vLoc = (uHeadInv * modelMatrix * vec4(position, 1.0)).xyz;');
        sh.fragmentShader = 'uniform vec3 uOld, uA, uB; uniform float uSweep, uTwo, uClip, uBand; varying vec3 vLoc;\n' + sh.fragmentShader
          .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n if (vLoc.y > uClip) discard;')
          .replace('#include <color_fragment>', `#include <color_fragment>
            vec3 nw = mix(uA, uB, uTwo * smoothstep(-0.03, 0.03, vLoc.x));
            float h = clamp((1.5 - vLoc.y) / 1.9, 0.0, 1.0);            // 0 at the crown, 1 at the tips
            float s = uSweep * 1.25 - 0.12; float k = smoothstep(h - 0.1, h + 0.02, s);
            diffuseColor.rgb *= mix(uOld, nw, k);`)
          .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
            float bandK = uBand * exp(-pow((h - s) / 0.07, 2.0)) * step(0.001, uSweep) * (1.0 - step(0.999, uSweep));
            totalEmissiveRadiance += nw * (bandK * 1.6);`); };
      k.customProgramCacheKey = () => 'hairfx' + c.name; mats.set(src, k); }
    m.material = mats.get(src); m.onBeforeRender = () => { c.head.updateWorldMatrix(true, false); U.uHeadInv.value.copy(_m.copy(c.head.matrixWorld).invert()); }; });
  const api = { group, U,
    // set the state: newA/newB = colours after the change, sweep 0..1, glow 0..1 (emissive), band 0..1 (bright front while sweeping)
    set(o2 = {}) { if (o2.old) U.uOld.value.set(o2.old); if (o2.a) U.uA.value.set(o2.a); if (o2.b) U.uB.value.set(o2.b); else if (o2.a) U.uB.value.set(o2.a); if (o2.two != null) U.uTwo.value = o2.two ? 1 : 0;
      U.uSweep.value = o2.sweep ?? U.uSweep.value; U.uBand.value = o2.band ?? 0; const gl = o2.glow ?? 0; for (const k of mats.values()) { k.emissive.copy(U.uA.value).lerp(U.uB.value, 0.5 * U.uTwo.value).multiplyScalar(0.55 * gl); } },
    reset() { U.uSweep.value = o.sweep ?? 0; U.uBand.value = 0; U.uOld.value.set(o.old || '#3a2414'); U.uA.value.set(o.a || o.old || '#3a2414'); U.uB.value.set(o.b || o.a || o.old || '#3a2414'); U.uTwo.value = o.two ? 1 : 0; for (const k of mats.values()) k.emissive.set('#000000'); } };
  api.set({ sweep: o.sweep ?? 0 }); return api; }
