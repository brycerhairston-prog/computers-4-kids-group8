import { ZONE_PATHS, ZONE_LABEL_POS, ZONE_DEBUG_COLORS, isZoneDebugEnabled } from "@/lib/courtGeometry";

/**
 * Geometry debug overlay — renders each zone with a semi-transparent fill and
 * bold outline so boundary correctness can be verified visually.
 *
 * Enable via the browser devtools:
 *   localStorage.setItem("c4k_debug_zones", "1"); location.reload();
 * Disable:
 *   localStorage.removeItem("c4k_debug_zones"); location.reload();
 *
 * Place inside the same <svg viewBox="0 0 400 500"> as the court.
 */
const ZoneDebugOverlay = () => {
  if (!isZoneDebugEnabled()) return null;

  return (
    <g pointerEvents="none" data-debug="zones">
      {[1, 2, 3, 4, 5, 6].map((z) => (
        <path
          key={`debug-fill-${z}`}
          d={ZONE_PATHS[z]}
          fill={ZONE_DEBUG_COLORS[z]}
          stroke="black"
          strokeWidth={1.5}
          strokeOpacity={0.9}
        />
      ))}
      {[1, 2, 3, 4, 5, 6].map((z) => {
        const pos = ZONE_LABEL_POS[z];
        return (
          <text
            key={`debug-label-${z}`}
            x={pos.x}
            y={pos.y}
            textAnchor="middle"
            fontSize="14"
            fontWeight="800"
            fill="black"
            stroke="white"
            strokeWidth={3}
            paintOrder="stroke"
          >
            Z{z}
          </text>
        );
      })}
    </g>
  );
};

export default ZoneDebugOverlay;
