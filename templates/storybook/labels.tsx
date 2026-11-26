// On-screen labels: extra detail drawn over the picture, listed per short in labels_data.ts (frames at 30 fps,
// positions in 1080x1920 units, scaled to the output size). Storybook paper look: cream card, plum ink border
// (the character ink colour), slight tilt, hard drop shadow; each label pops in and fades out.
//   place: date/place card, top centre   { kind: "place", a, b, title: "KYOTO", sub: "Japan, 1581" }
//   name:  name tag near a character      { kind: "name", a, b, x, y, title: "Yasuke", sub: "from Mozambique", point?: "down" | "up" | "left" | "right" }
//   fact:  fact callout                   { kind: "fact", a, b, x, y, title: "74", sub: "soldiers marching in step" }
// Keep labels out of the caption band (y ~1280-1520) and off faces. Off with inputProps `{ labels: false }`.
import React from "react";
import { AbsoluteFill, getInputProps, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LABELS } from "./labels_data";

export type Label = {
  kind: "place" | "name" | "fact"; a: number; b: number; title: string; sub?: string;
  x?: number; y?: number; point?: "down" | "up" | "left" | "right"; tilt?: number; big?: number;
};

const FONT = '"Arial Rounded MT Bold", "Arial Black", "Segoe UI Black", Arial, sans-serif';
const SUBFONT = 'Georgia, "Times New Roman", serif';
const INK = "#241726", PAPER = "#fff4dc", ACCENT = "#e8553d", HOT = "#ffd84a";

export const labelsOn = () => (getInputProps() as { labels?: boolean }).labels !== false;

const Card: React.FC<{ l: Label; u: number }> = ({ l, u }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: f - l.a, fps, config: { damping: 11, stiffness: 170, mass: 0.7 } });
  const out = interpolate(f, [l.b - 6, l.b], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const place = l.kind === "place", fact = l.kind === "fact";
  const x = (l.x ?? 540) * u, y = (l.y ?? 230) * u;
  const tilt = l.tilt ?? (place ? -1.5 : l.kind === "name" ? 2 : -2.5);
  const tSize = (place ? 92 : fact ? 120 : 64) * u, sSize = (place ? 46 : 40) * u;
  const p = l.point, tri = 36 * u;
  const pointer: React.CSSProperties | null = !p ? null : {
    position: "absolute", width: 0, height: 0, border: `${tri}px solid transparent`,
    ...(p === "down" ? { top: "100%", left: "50%", marginLeft: -tri, borderTopColor: INK } :
      p === "up" ? { bottom: "100%", left: "50%", marginLeft: -tri, borderBottomColor: INK } :
      p === "left" ? { right: "100%", top: "50%", marginTop: -tri, borderRightColor: INK } :
      { left: "100%", top: "50%", marginTop: -tri, borderLeftColor: INK }),
  };
  return (
    <div style={{
      position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${tilt}deg) scale(${pop * (l.big ?? 1)})`,
      opacity: out, width: "max-content", maxWidth: 860 * u,
    }}>
      <div style={{
        position: "relative", background: PAPER, border: `${7 * u}px solid ${INK}`, borderRadius: 26 * u,
        padding: `${(place ? 22 : 16) * u}px ${(place ? 46 : 34) * u}px ${(place ? 26 : 20) * u}px`,
        boxShadow: `${10 * u}px ${12 * u}px 0 rgba(36,23,38,0.55)`, textAlign: "center",
      }}>
        {place && <div style={{ position: "absolute", left: 18 * u, right: 18 * u, top: -14 * u, height: 14 * u, background: ACCENT, border: `${5 * u}px solid ${INK}`, borderRadius: 8 * u }} />}
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: tSize, lineHeight: 1.05, color: fact ? ACCENT : INK, letterSpacing: (place ? 6 : 1) * u, whiteSpace: "nowrap" }}>
          {l.title}
        </div>
        {l.sub && <div style={{ fontFamily: SUBFONT, fontStyle: "italic", fontWeight: 700, fontSize: sSize, lineHeight: 1.15, color: INK, marginTop: 6 * u }}>{l.sub}</div>}
        {l.kind === "name" && <div style={{ position: "absolute", left: -12 * u, top: -12 * u, width: 30 * u, height: 30 * u, borderRadius: "50%", background: HOT, border: `${5 * u}px solid ${INK}` }} />}
        {pointer && <div style={pointer} />}
      </div>
    </div>
  );
};

export const Labels: React.FC = () => {
  const f = useCurrentFrame();
  const { height } = useVideoConfig();
  const u = height / 1920;
  const live = (LABELS as Label[]).filter((l) => f >= l.a && f < l.b);
  if (!live.length) return null;
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{live.map((l, i) => <Card key={`${l.a}-${i}`} l={l} u={u} />)}</AbsoluteFill>;
};
