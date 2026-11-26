// Setup smoke test (SKILL.md: never test-render a template). One lit box in a ThreeCanvas, no project code.
// setup.sh renders frame 15 of composition "Smoke" through scripts/bridge-stills.mjs to studio/.cache/smoke_15.jpg.
import React from "react";
import { Composition, registerRoot, useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";

const Box: React.FC = () => {
  const f = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} style={{ background: "#1a56c4" }} camera={{ position: [0, 0, 4], fov: 40 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.5} />
      <mesh rotation={[0.4, f * 0.05, 0]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#ffd84a" />
      </mesh>
    </ThreeCanvas>
  );
};

const Root: React.FC = () => <Composition id="Smoke" component={Box} durationInFrames={30} fps={30} width={540} height={960} />;
registerRoot(Root);
