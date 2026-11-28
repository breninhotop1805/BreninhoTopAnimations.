import * as THREE from 'three';
import { loadImage, imgToCanvas, Character, buildChica, buildBonnie, buildFreddy } from './skin.js';
const q = new URLSearchParams(location.search); const W = +q.get('w'), H = +q.get('h');
const r = new THREE.WebGLRenderer({ antialias: true }); r.setSize(W, H); r.shadowMap.enabled = true; r.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(r.domElement);
const sc = new THREE.Scene(); sc.background = new THREE.Color('#202838');
sc.add(new THREE.HemisphereLight('#cfd8ff', '#403020', 1.2)); const dl = new THREE.DirectionalLight('#fff', 2.2); dl.position.set(2, 4, 5); dl.castShadow = true; dl.shadow.bias=-0.0004; dl.shadow.normalBias=0.02; dl.shadow.mapSize.set(2048,2048); Object.assign(dl.shadow.camera,{left:-6,right:6,top:6,bottom:-6}); sc.add(dl);
const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
const sk = {}; for (const n of ['chica_beak', 'chica_nobeak', 'bonnie', 'freddy', 'guard', 'scott', 'girl']) sk[n] = imgToCanvas(await loadImage(`/skins/${n}.png`));
const chars = [buildChica(sk.chica_beak, sk.chica_nobeak), buildBonnie(sk.bonnie), buildFreddy(sk.freddy), new Character('guard', sk.guard), new Character('scott', sk.scott), new Character('girl', sk.girl)];
chars.forEach((c, i) => { c.root.position.x = (i - 2.5) * 1.0; sc.add(c.root); console.log('LOG', c.name, 'slim', c.slim); });
const fl = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: '#555' })); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; sc.add(fl);
window.APP = { ready: true, duration: 4, renderAt(t) {
  chars.forEach(c => { c.reset(); c.root.rotation.y = 0; });
  if (t < 2) { const back = t >= 1; chars.forEach(c => c.root.rotation.y = back ? Math.PI : 0);
    cam.aspect = W / H; cam.updateProjectionMatrix(); cam.position.set(0, 1.2, 15); cam.lookAt(0, 1.0, 0); r.setScissorTest(false); r.setViewport(0,0,W,H); r.render(sc, cam); return; }
  const ang = t < 3 ? 0.55 : Math.PI + 0.55; const full = (t % 1) > 0.4;
  r.setScissorTest(true); const cw = W / 2, chh = H / 3; cam.aspect = cw / chh; cam.updateProjectionMatrix();
  chars.forEach((c, i) => { const x = c.root.position.x; const gx = i % 2, gy = 2 - Math.floor(i / 2);
    if (full) { c.armR.piv.rotation.x = -1.3; c.armL.piv.rotation.x = 0.6; c.legR.piv.rotation.x = 0.5; c.legL.piv.rotation.x = -0.5; c.head.rotation.y = 0.4; }
    const d = full ? 3.6 : 1.5, y = full ? 1.0 : 1.72;
    cam.position.set(x + Math.sin(ang) * d, y + 0.15, Math.cos(ang) * d); cam.lookAt(x, y, 0);
    r.setViewport(gx * cw, gy * chh, cw, chh); r.setScissor(gx * cw, gy * chh, cw, chh); r.render(sc, cam); });
} };
