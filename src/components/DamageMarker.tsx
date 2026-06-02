import type { DamageMarkerData } from '../types/inspection';
import { SEVERITY_COLORS } from '../types/inspection';
import { OUTLINE_W, OUTLINE_H } from './VehicleOutline';

interface Props {
  marker: DamageMarkerData;
  index: number; // 1-based number shown to the user
  onSelect?: (id: string) => void;
  active?: boolean;
}

/**
 * A single numbered damage marker rendered inside the VehicleOutline <svg>.
 * Position is stored as a fraction of the viewBox so it scales with the SVG.
 */
export default function DamageMarker({ marker, index, onSelect, active }: Props) {
  const x = marker.x * OUTLINE_W;
  const y = marker.y * OUTLINE_H;

  return (
    <g
      transform={`translate(${x} ${y})`}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect?.(marker.id);
      }}
      className="cursor-pointer"
    >
      {active && (
        <circle r={20} fill="none" stroke={SEVERITY_COLORS[marker.severity]} strokeWidth={2}>
          <animate attributeName="r" values="16;22;16" dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}
      <circle
        r={14}
        fill={SEVERITY_COLORS[marker.severity]}
        stroke="#fff"
        strokeWidth={2.5}
      />
      <text
        textAnchor="middle"
        dy="5"
        fontSize="15"
        fontWeight="700"
        fill="#fff"
        className="select-none"
      >
        {index}
      </text>
    </g>
  );
}
