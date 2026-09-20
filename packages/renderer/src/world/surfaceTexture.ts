import {
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RepeatWrapping,
  RGBAFormat,
  SRGBColorSpace,
} from 'three';

/** Small, deterministic colour maps supply surface grain without external downloads. */
export function surfaceTexture(kind: 'fabric' | 'grass' | 'bark' | 'stone' | 'hair' | 'foliage' | 'sand' | 'slate') {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  const leaves = Array.from({ length: 130 }, (_, i) => {
    const angle = i * 2.399;
    const radius = Math.sqrt((i + 0.5) / 130) * 51;
    return {
      x: 64 + Math.cos(angle) * radius,
      y: 64 + Math.sin(angle) * radius,
      cos: Math.cos(i * 1.17),
      sin: Math.sin(i * 1.17),
      length: 5 + (i % 4),
      tone: 0.68 + (i % 7) * 0.045,
    };
  });
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const grain = noise - Math.floor(noise);
      const weave = ((x + y) % 2) * 0.055;
      const streak = Math.sin(x * 0.6 + Math.sin(y * 0.08) * 1.2);
      let value =
        kind === 'bark' || kind === 'hair'
          ? 0.68 + streak * 0.15 + grain * 0.15
          : kind === 'fabric'
            ? 0.83 + weave + grain * 0.1
            : 0.77 + grain * 0.2;
      if (kind === 'sand') {
        // Low-contrast ripples keep the beach readable behind the mission tiles.
        value = 0.88 + Math.sin(y * Math.PI / 16 + Math.sin(x * Math.PI / 64)) * 0.035 + grain * 0.06;
      } else if (kind === 'slate') {
        value = 0.82 + Math.sin((x + y) * Math.PI / 32) * 0.035 + grain * 0.09;
      }
      const i = (y * size + x) * 4;
      let alpha = 255;
      if (kind === 'foliage') {
        alpha = 0;
        for (const leaf of leaves) {
          const dx = x - leaf.x,
            dy = y - leaf.y;
          const u = dx * leaf.cos + dy * leaf.sin;
          const v = -dx * leaf.sin + dy * leaf.cos;
          if ((u / leaf.length) ** 2 + (v / 2.8) ** 2 < 1) {
            alpha = 255;
            value = leaf.tone + (Math.abs(v) < 0.5 ? 0.09 : 0) + grain * 0.04;
          }
        }
      }
      pixels[i] = Math.round(value * 255);
      pixels[i + 1] = Math.round(value * 255);
      pixels[i + 2] = Math.round(value * 255);
      pixels[i + 3] = alpha;
    }
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  const repeat = kind === 'grass' ? 36 : kind === 'sand' || kind === 'slate' ? 24 : kind === 'foliage' ? 1 : 2;
  texture.repeat.set(repeat, repeat);
  texture.needsUpdate = true;
  return texture;
}
