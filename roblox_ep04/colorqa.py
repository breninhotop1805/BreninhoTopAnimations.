"""Color QA (measured on the 10 reference videos, Nov/2026): refs average saturation 0.50, colorfulness 71.5, 32% vivid pixels;
the 25% least colorful reference shots still have colorfulness >= 57. Our EP03 averaged 0.33 / 54 / 18% (pale: white rooms + sepia).
usage: python3 colorqa.py stills/*.jpg   -> one line per still + LOG POUCA_COR for stills below the floor + the overall average.
Run it on the storyboard stills (and on frames of the final video) BEFORE sending anything."""
import sys, cv2, numpy as np
FLOOR_COL, FLOOR_SAT, TARGET_COL, TARGET_SAT = 52, 0.38, 68, 0.47
def metrics(p):
    im = cv2.imread(p); im = cv2.resize(im, (270, 480), interpolation=cv2.INTER_AREA); h = im.shape[0]
    im = np.concatenate([im[:int(h * 0.6)], im[int(h * 0.78):]])   # ignore the subtitle band
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV); S = hsv[..., 1] / 255; V = hsv[..., 2] / 255
    b, g, r = [c.astype(np.float32) for c in cv2.split(im)]; rg = r - g; yb = 0.5 * (r + g) - b
    col = float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2))
    return float(S.mean()), col, float(((S > 0.45) & (V > 0.35)).mean()), float(V.mean())
if __name__ == '__main__':
    R = []; bad = 0
    for p in sys.argv[1:]:
        s, c, v, val = metrics(p); R.append((s, c, v)); flag = c < FLOOR_COL or s < FLOOR_SAT; bad += flag
        print(f"{'LOG POUCA_COR ' if flag else ''}{p}: sat={s:.2f} cor={c:.0f} vivos={v:.0%} brilho={val:.2f}")
    A = np.array(R).mean(0); print(f'MEDIA sat={A[0]:.2f} (alvo {TARGET_SAT}) cor={A[1]:.0f} (alvo {TARGET_COL}) vivos={A[2]:.0%} (alvo 30%) | {bad} still(s) abaixo do piso')
