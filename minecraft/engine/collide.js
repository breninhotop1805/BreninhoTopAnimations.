// OBB + SAT: usado pelo solver de pose (sem atravessar) e pela checagem automática
import * as THREE from 'three';
const _v = new THREE.Vector3();
export function obbOf(mesh, shrink = 0, trimTop = 0) {
  mesh.updateWorldMatrix(true, false); const g = mesh.geometry; if (!g.boundingBox) g.computeBoundingBox();
  let bb = g.boundingBox; if (trimTop) { bb = bb.clone(); bb.max.y -= trimTop; } const c = bb.getCenter(new THREE.Vector3()); const h = bb.getSize(new THREE.Vector3()).multiplyScalar(0.5);
  const m = mesh.matrixWorld; const center = c.clone().applyMatrix4(m); const axes = [], half = [];
  for (let i = 0; i < 3; i++) { const a = new THREE.Vector3().setFromMatrixColumn(m, i); const len = a.length(); axes.push(a.normalize()); half.push(Math.max(0, h.getComponent(i) * len - shrink)); }
  return { center, axes, half };
}
export function sat(A, B) {
  const T = B.center.clone().sub(A.center); const axes = [...A.axes, ...B.axes];
  for (const a of A.axes) for (const b of B.axes) { const c = a.clone().cross(b); if (c.lengthSq() > 1e-6) axes.push(c.normalize()); }
  for (const L of axes) { let ra = 0, rb = 0; for (let i = 0; i < 3; i++) { ra += A.half[i] * Math.abs(A.axes[i].dot(L)); rb += B.half[i] * Math.abs(B.axes[i].dot(L)); } if (Math.abs(T.dot(L)) > ra + rb) return false; }
  return true;
}
