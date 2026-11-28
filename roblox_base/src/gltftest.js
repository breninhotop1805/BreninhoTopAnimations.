import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { buildStreet } from './sets.js';
const q = new URLSearchParams(location.search); const W = +q.get('w') || 540, H = +q.get('h') || 960;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setSize(W, H); renderer.shadowMap.enabled = true; renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; document.body.appendChild(renderer.domElement);
const S = {}; const scene = buildStreet(S); const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 200);
const files = ['Feminino', 'Masculino', 'Masculino quadrado']; const models = [];
const L = new GLTFLoader(); for (const f of files) { const g = await L.loadAsync('/assets/roblox_export/ROBLOX_EXPORT/' + encodeURIComponent(f) + '.gltf'); const rig = g.scene.getObjectByName('Rig') || g.scene;
  rig.traverse(o => { if (o.isMesh) { o.castShadow = true; if (/_Att$|SpawnLocation|Baseplate|Decal|Texture/.test(o.name)) o.visible = false; } }); const box = new THREE.Box3().setFromObject(rig); console.log('LOG', f, JSON.stringify(box.min), JSON.stringify(box.max)); rig.updateMatrixWorld(true); if (f === 'Masculino quadrado') { const out = []; rig.traverse(o => { if (/Rig_Att|UpperTorso_Geo|LeftUpperArm_Geo|^Rig$/.test(o.name)) { const p = o.getWorldPosition(new THREE.Vector3()); out.push(o.name + ':' + p.toArray().map(v => v.toFixed(2)).join(',') + (o.isMesh ? ' M' : '') + ' par=' + (o.parent?.name||'')); } }); console.log('LOG ' + out.join(' | ')); } models.push(rig); }
window.APP = { ready: true, duration: 10, renderAt(t) { const i = Math.floor(t), v = Math.round((t % 1) * 4); models.forEach(m => m.removeFromParent()); const m = models[i]; scene.add(m);
  const box = new THREE.Box3().setFromObject(m); const c = box.getCenter(new THREE.Vector3()), h = box.max.y - box.min.y; m.rotation.y = [0, 0.8, Math.PI / 2, Math.PI][v] || 0;
  cam.aspect = W / H; cam.position.set(c.x, c.y + h * 0.05, c.z + h * 2.4); cam.lookAt(c); cam.updateProjectionMatrix(); renderer.render(scene, cam); } };
