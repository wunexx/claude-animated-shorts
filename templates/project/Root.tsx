import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/llorona/Bridge";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="LloronaShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="LloronaShort2K" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1440} height={2560} />
  </>
);
