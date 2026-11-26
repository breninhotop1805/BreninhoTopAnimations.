// ======================= REAL Roblox R15 bodies (exported by him from Roblox Studio: 2016 "Woman"/"Man" + 2012 blocky) =======================
// The official part meshes are baked into OUR rig (same API as Rbx: root/hip/torso/neck/head/armR.piv/elbow/handMesh/legR.piv/knee),
// rotated to face +z, feet at y 0. Joints at the official RigAttachments (shoulder, elbow, wrist, hip, knee, ankle, waist, neck).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Rbx, plastic } from './rbx.js';
const FILES = { fem: 'Feminino', masc: 'Masculino', bloco: 'Masculino quadrado' };
const T = {}; // templates: { parts: {name: geometry (baked, world coords facing +z)}, P: {att: Vector3} }
export async function loadBodies(base = '/assets/roblox_export/ROBLOX_EXPORT/') { const L = new GLTFLoader();
  for (const [k, f] of Object.entries(FILES)) { const g = await L.loadAsync(base + encodeURIComponent(f) + '.gltf'); const rigs = []; g.scene.traverse(o => { if (o.name === 'Rig') rigs.push(o); }); const score = r => { let n = 0; r.traverse(o => { if (/Rig_Att$/.test(o.name)) n++; }); return n; }; const rig = rigs.sort((a, b) => score(b) - score(a))[0] || g.scene; g.scene.updateMatrixWorld(true);
    const rc = new THREE.Box3().setFromObject(rig).getCenter(new THREE.Vector3()); const wp = n => { let best = null, bd = 1e9; g.scene.traverse(o => { if (o.name === n) { const p = o.getWorldPosition(new THREE.Vector3()); const d = p.distanceTo(rc); if (d < bd) { bd = d; best = p; } } }); return best; };
    let root = wp('RootRig_Att'); if (!root) { const a = wp('LeftHipRig_Att'), b = wp('RightHipRig_Att'); root = a.clone().add(b).multiplyScalar(0.5); } let feet = Infinity; rig.traverse(o => { if (o.isMesh && /Foot_Geo$/.test(o.name)) { const b = new THREE.Box3().setFromObject(o); feet = Math.min(feet, b.min.y); } });
    const M = new THREE.Matrix4().makeRotationY(Math.PI).multiply(new THREE.Matrix4().makeTranslation(-root.x, -feet, -root.z));
    const parts = {}; rig.traverse(o => { if (o.isMesh && /_Geo$/.test(o.name)) { const nm = o.name.replace('_Geo', ''); if (parts[nm]) return; const geo = o.geometry.clone(); geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(M, o.matrixWorld)); geo.computeVertexNormals(); parts[nm] = geo; } });
    const P = {}; for (const a of ['RootRig', 'WaistRig', 'NeckRig', 'LeftShoulderRig', 'RightShoulderRig', 'LeftElbowRig', 'RightElbowRig', 'LeftWristRig', 'RightWristRig', 'LeftHipRig', 'RightHipRig', 'LeftKneeRig', 'RightKneeRig', 'LeftAnkleRig', 'RightAnkleRig']) { const p = wp(a + '_Att'); if (p) P[a] = p.applyMatrix4(M); } if (!P.RootRig) P.RootRig = root.clone().applyMatrix4(M); if (!P.WaistRig) P.WaistRig = P.RootRig.clone(); if (!P.NeckRig) { let top = -1e9; rig.traverse(o => { if (o.isMesh && /UpperTorso_Geo$/.test(o.name)) top = new THREE.Box3().setFromObject(o).max.y; }); P.NeckRig = new THREE.Vector3(0, top, 0).applyMatrix4(M); P.NeckRig.x = P.RootRig.x; P.NeckRig.z = P.RootRig.z; }
    // ALIGN parts and joints (the blocky export had two rigs: parts and attachments came offset). Parts: centred on x/z by the torso;
    // joints: y aligned so the neck sits exactly on top of the upper torso.
    { const tb = new THREE.Box3(); parts.UpperTorso.computeBoundingBox(); tb.copy(parts.UpperTorso.boundingBox); const cx = (tb.min.x + tb.max.x) / 2, cz = (tb.min.z + tb.max.z) / 2;
      if (Math.abs(cx) > 0.05 || Math.abs(cz) > 0.05) for (const g of Object.values(parts)) g.translate(-cx, 0, -cz);
      const dy = tb.max.y - P.NeckRig.y; if (Math.abs(dy) > 0.08) for (const v of Object.values(P)) v.y += dy; }
    console.log('LOG ' + k + ' ' + Object.entries(P).map(([a, v]) => a + ':' + v.toArray().map(x => x.toFixed(2)).join(',')).join(' ') + ' parts:' + Object.entries(parts).map(([n, g]) => { g.computeBoundingBox(); const b = g.boundingBox; return n + '[' + b.min.toArray().map(v => v.toFixed(2)) + '/' + b.max.toArray().map(v => v.toFixed(2)) + ']'; }).join(' ')); T[k] = { parts, P }; } return T; }
const sub = (a, b) => new THREE.Vector3().subVectors(a, b);
function part(geo, origin, mat, parent) { const g = geo.clone(); g.translate(-origin.x, -origin.y, -origin.z); const m = new THREE.Mesh(g, mat); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
// o = { name, body: 'fem'|'masc'|'bloco', skin, shirt (color), sleeves: 'long'|'short'|'none', pants (color), shorts, shoes (color), head opts for Rbx (hat fn), face }
export function realChar(o) { const t = T[o.body || 'fem']; if (!t) throw new Error('loadBodies() first'); const { parts: G, P } = t;
  const c = new Rbx(o.name, { head: o.skin, torso: '#fff', arms: '#fff', legs: '#fff', faceDefault: o.face, hat: o.hat });
  // remove the R6 meshes, keep the groups
  for (const m of [c.torsoMesh, c.armR.mesh, c.armL.mesh, c.legR.mesh, c.legL.mesh]) m.removeFromParent();
  const skin = plastic(o.skin || '#f3c99a'), shirt = plastic(o.shirt || '#3a7ae8'), pants = plastic(o.pants || '#2a3a6a'), shoes = plastic(o.shoes || '#f2f2f2');
  const sl = o.sleeves || 'long'; const upperArmM = sl === 'none' ? skin : shirt, lowerArmM = sl === 'long' ? shirt : skin, lowerLegM = o.shorts ? skin : pants;
  const R = P.RootRig; c.hip.position.copy(R); c.torso.position.set(0, 0, 0);
  c.lowerTorso = part(G.LowerTorso, R, o.belt ? plastic(o.belt) : pants, c.hip); c.torsoMesh = part(G.UpperTorso, R, shirt, c.torso);
  c.neck.position.copy(sub(P.NeckRig, R)); c.headMesh.position.y = 0.6; c.faceMesh.position.y = 0.6;
  for (const [A, s] of [[c.armR, 'Right'], [c.armL, 'Left']]) { const S = P[s + 'ShoulderRig'], E = P[s + 'ElbowRig'], W = P[s + 'WristRig'];
    A.piv.position.copy(sub(S, R)); A.mesh = part(G[s + 'UpperArm'], S, upperArmM, A.piv);
    const el = new THREE.Group(); el.position.copy(sub(E, S)); A.piv.add(el); A.elbow = el; A.lower = part(G[s + 'LowerArm'], E, lowerArmM, el);
    const wr = new THREE.Group(); wr.position.copy(sub(W, E)); el.add(wr); A.wrist = wr; A.handMesh = part(G[s + 'Hand'], W, skin, wr); }
  for (const [Lg, s] of [[c.legR, 'Right'], [c.legL, 'Left']]) { const Hh = P[s + 'HipRig'], K = P[s + 'KneeRig'], An = P[s + 'AnkleRig'];
    Lg.piv.position.copy(sub(Hh, R)); Lg.mesh = part(G[s + 'UpperLeg'], Hh, pants, Lg.piv);
    const kn = new THREE.Group(); kn.position.copy(sub(K, Hh)); Lg.piv.add(kn); Lg.knee = kn; Lg.lower = part(G[s + 'LowerLeg'], K, lowerLegM, kn);
    const an = new THREE.Group(); an.position.copy(sub(An, K)); kn.add(an); Lg.ankle = an; Lg.foot = part(G[s + 'Foot'], An, shoes, an); }
  const hipY = R.y; const r0 = c.reset.bind(c); c.reset = () => { r0(); c.hip.position.set(0, hipY, 0); for (const X of [c.armR, c.armL]) { X.elbow.rotation.set(0, 0, 0); X.wrist.rotation.set(0, 0, 0); } for (const X of [c.legR, c.legL]) { X.knee.rotation.set(0, 0, 0); X.ankle.rotation.set(0, 0, 0); } };
  c.hipY = hipY; c.body = o.body || 'fem'; c.baseScale = o.scale || 1; c.reset(); c.root.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return c; }
