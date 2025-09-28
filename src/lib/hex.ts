// Hexagonal grid utilities.
// These functions convert axial coordinates to pixel positions and generate
// pointy‑top hexagon points. Adapted from the upstream repository
// (ShiruiChan/LORY_LCT). Keeping these utilities locally allows the city
// rendering logic to work without pulling from remote sources.

export const HEX_SIZE = 30; // px

export type Axial = { q: number; r: number };

/** Convert axial coordinates to pixel positions. */
export const axialToPixel = ({ q, r }: { q: number; r: number }) => {
  const x = HEX_SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = HEX_SIZE * (3 / 2) * r;
  return { x, y };
};

/** Compute the centre of a hex in pixel space. */
export const hexCenter = (q: number, r: number) => axialToPixel({ q, r });

/** Return a space separated list of x,y points describing the outline of a
 * pointy‑top hexagon. */
export const hexPolygonPoints = (q: number, r: number) => {
  const { x, y } = axialToPixel({ q, r });
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30); // pointy‑top
    const px = x + HEX_SIZE * Math.cos(angle);
    const py = y + HEX_SIZE * Math.sin(angle);
    pts.push(`${px},${py}`);
  }
  return pts.join(" ");
};

/** Generate axial coordinates for a hexagonal disk of given radius. */
export const axialDisk = (radius: number): Axial[] => {
  const res: Axial[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) res.push({ q, r });
  }
  return res;
};