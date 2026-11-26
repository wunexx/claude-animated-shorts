// Which PLACES this short builds. The core template builds no scenery at all: a place exists only when it is
// registered here. Pick parts from the skill's library (library/LIBRARY.md), append their code to build.ts (sets) /
// toon.ts (characters, fx drawings) / cast.ts (staging helpers), and register one builder per place name used in
// story.ts SHOTS. A place with no entry is just sky + light (fine for close-ups on fx cards).
//   SETS.town = townSet;                                  // library/sets/town.ts.txt
//   SETS.sea = both(seaSet(PIER), quiltSet({...}));       // two parts in one place
//   SETS.attic = (c) => { buildAttic(c.root); return { indoor: true }; };   // a set written for this short
// Only places that some shot uses are built (world.ts reads SHOTS), so an unused registration costs nothing.
import * as THREE from "three";
import type { Kit, Ray } from "./build";

/** what a set builder gets: the scene root, the Kenney kit, every camera's sight lines (to leave out blockers),
 *  a glow group shown at golden/night while this place is on screen, and water(geo) to add a water surface */
export type SetCtx = { root: THREE.Object3D; kit: Kit; rays: Ray[]; glow: THREE.Group; water: (g: THREE.BufferGeometry) => void };
export type SetUpdate = { id: number; t: number; light: string; active: boolean; cam: THREE.PerspectiveCamera };
export type SetHooks = {
  clouds?: boolean;   // ring of painted sky clouds around the lens (outdoor places)
  streak?: boolean;   // moonlight path on the water at night
  indoor?: boolean;   // no sun/moon discs, no clouds, fog pushed out
  fog?: (light: string, near: number, far: number) => [number, number];
  update?: (u: SetUpdate) => void; // every frame, for every built place (active = this place is on screen)
};
export type SetBuilder = (c: SetCtx) => SetHooks | void;

/** two or more parts in one place: hooks are merged (flags OR-ed, fog of the last, updates chained) */
export const both = (...bs: SetBuilder[]): SetBuilder => (c) => {
  const hs = bs.map((b) => b(c) ?? {});
  return {
    clouds: hs.some((h) => h.clouds), streak: hs.some((h) => h.streak), indoor: hs.some((h) => h.indoor),
    fog: hs.reduce<SetHooks["fog"]>((f, h) => h.fog ?? f, undefined),
    update: (u) => { for (const h of hs) h.update?.(u); },
  };
};

export const SETS: Record<string, SetBuilder> = {
  // register this short's places here
};
