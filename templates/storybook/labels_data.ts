// Per-short on-screen labels (see labels.tsx for kinds and placement rules). Frames at 30 fps, x/y in 1080x1920.
// Time each label to its word in words.json (pop in 0-3 frames before the word), hold >= 45 frames.
// Example (delete): { kind: "place", a: 0, b: 75, title: "KYOTO", sub: "Japan, 1581" },
//                   { kind: "name", a: 90, b: 160, x: 300, y: 520, title: "Yasuke", sub: "from Mozambique", point: "down" },
//                   { kind: "fact", a: 400, b: 470, x: 760, y: 360, title: "74", sub: "soldiers in step" },
import type { Label } from "./labels";
export const LABELS: Label[] = [];
