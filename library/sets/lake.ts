// Layout of the lake city (Tenochtitlan, our own simplified version), shared by build.ts (geometry) and cast.ts
// (people on the roofs). Local coordinates: x across, z toward the causeway (+z); world = (LX + x, y, z).
// Island ground at ISLE, split by two north-south canals; the temple (four tiers, twin shrines) on the central plaza;
// whitewashed flat-roofed houses in blocks; chinampa garden plots on the water east and west; the causeway runs +z.
import { rng } from "./paint";

export type LakeHouse = { x: number; z: number; w: number; d: number; h: number; c: number };
export const CANALS = [-48, 48]; // canal centre lines (x), 8 m wide
export const ISLAND = { x0: -80, x1: 80, z0: -95, z1: 75 };
export const TEMPLE = { x: 0, z: -20, tiers: [30, 25, 20, 15], th: 4.5 };
export const inPlaza = (x: number, z: number) => Math.abs(x) < 38 && z > -52 && z < 18;

let cache: LakeHouse[] | null = null;
export const lakeHouses = (): LakeHouse[] => {
  if (cache) return cache;
  const r = rng(77), out: LakeHouse[] = [];
  for (let gx = -72; gx <= 72; gx += 11) for (let gz = -86; gz <= 68; gz += 11) {
    const x = gx + (r() - 0.5) * 1.6, z = gz + (r() - 0.5) * 1.6, w = 6 + r() * 2.5, d = 6 + r() * 2.5, h = 3.2 + r() * 1.6, c = Math.floor(r() * 5);
    if (inPlaza(x, z) || CANALS.some((cx) => Math.abs(x - cx) < 4 + w / 2) || (Math.abs(x) < 6 + w / 2 && z > 12) || r() < 0.12) continue;
    if (Math.abs(x) + w / 2 > 78 || z + d / 2 > 74.5 || z - d / 2 < -93) continue;
    out.push({ x, z, w, d, h, c });
  }
  cache = out;
  return out;
};
/** chinampa garden plots (x0, x1, z0, z1) on the water */
export const chinampas = (): [number, number, number, number][] => {
  const out: [number, number, number, number][] = [];
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) {
    const x0 = side * (92 + k * 12), z0 = -80;
    for (let j = 0; j < 4; j++) out.push([Math.min(x0, x0 + side * 8), Math.max(x0, x0 + side * 8), z0 + j * 38, z0 + j * 38 + 32]);
  }
  return out;
};
