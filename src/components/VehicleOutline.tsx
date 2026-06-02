import { useRef } from 'react';
import type { VehicleType } from '../types/inspection';

export const OUTLINE_W = 300;
export const OUTLINE_H = 640;

interface VehicleShape {
  /** outer body width */
  bodyW: number;
  /** overall body length */
  bodyL: number;
  /** corner radius of the body */
  radius: number;
  /** windshield / rear window inset from the top of the cabin */
  cabinTop: number;
  cabinBottom: number;
  /** label */
  label: string;
}

const SHAPES: Record<VehicleType, VehicleShape> = {
  PKW: { bodyW: 150, bodyL: 380, radius: 56, cabinTop: 150, cabinBottom: 110, label: 'PKW' },
  Kombi: { bodyW: 152, bodyL: 430, radius: 44, cabinTop: 150, cabinBottom: 60, label: 'Kombi' },
  SUV: { bodyW: 168, bodyL: 410, radius: 40, cabinTop: 140, cabinBottom: 80, label: 'SUV' },
  Transporter: {
    bodyW: 172,
    bodyL: 470,
    radius: 30,
    cabinTop: 130,
    cabinBottom: 30,
    label: 'Transporter',
  },
};

interface Props {
  vehicleType: VehicleType;
  /** called with fractional (0..1) coordinates relative to the viewBox */
  onTap?: (x: number, y: number) => void;
  children?: React.ReactNode;
  /** when true the outline is read-only (no tapping) */
  readOnly?: boolean;
  className?: string;
}

/**
 * Parametric top-down (and unfolded) 2D vehicle outline.
 * The shape changes with the selected vehicle type. Tapping anywhere on the
 * outline reports fractional coordinates so markers stay anchored when the SVG
 * is scaled or re-rendered at PDF time.
 */
export default function VehicleOutline({
  vehicleType,
  onTap,
  children,
  readOnly,
  className,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const shape = SHAPES[vehicleType];

  const cx = OUTLINE_W / 2;
  const top = (OUTLINE_H - shape.bodyL) / 2;
  const left = cx - shape.bodyW / 2;
  const right = cx + shape.bodyW / 2;
  const bottom = top + shape.bodyL;

  // wheel positions (drawn outside the body to read as a top-down car)
  const wheelW = 14;
  const wheelH = 46;
  const wheelInsetY = 46;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onTap || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    onTap(x, y);
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${OUTLINE_W} ${OUTLINE_H}`}
      className={`h-full w-full touch-none select-none ${className ?? ''}`}
      onPointerDown={handlePointer}
      role="img"
      aria-label={`Fahrzeugumriss ${shape.label}`}
    >
      {/* directional labels */}
      <text x={cx} y={top - 14} textAnchor="middle" className="fill-slate-400" fontSize="16">
        Front
      </text>
      <text
        x={cx}
        y={bottom + 26}
        textAnchor="middle"
        className="fill-slate-400"
        fontSize="16"
      >
        Heck
      </text>
      <text
        x={left - 14}
        y={cx + 4}
        textAnchor="middle"
        className="fill-slate-400"
        fontSize="14"
        transform={`rotate(-90 ${left - 14} ${(top + bottom) / 2})`}
      >
        Links
      </text>
      <text
        x={right + 14}
        y={(top + bottom) / 2}
        textAnchor="middle"
        className="fill-slate-400"
        fontSize="14"
        transform={`rotate(90 ${right + 14} ${(top + bottom) / 2})`}
      >
        Rechts
      </text>

      {/* wheels */}
      {[top + wheelInsetY, bottom - wheelInsetY - wheelH].map((wy) => (
        <g key={wy}>
          <rect
            x={left - wheelW + 3}
            y={wy}
            width={wheelW}
            height={wheelH}
            rx={5}
            className="fill-slate-700 dark:fill-slate-500"
          />
          <rect
            x={right - 3}
            y={wy}
            width={wheelW}
            height={wheelH}
            rx={5}
            className="fill-slate-700 dark:fill-slate-500"
          />
        </g>
      ))}

      {/* body */}
      <rect
        x={left}
        y={top}
        width={shape.bodyW}
        height={shape.bodyL}
        rx={shape.radius}
        className="fill-slate-100 stroke-slate-400 dark:fill-slate-700/60 dark:stroke-slate-400"
        strokeWidth={3}
      />

      {/* hood / front line */}
      <line
        x1={left + 14}
        y1={top + shape.cabinTop}
        x2={right - 14}
        y2={top + shape.cabinTop}
        className="stroke-slate-300 dark:stroke-slate-500"
        strokeWidth={2}
      />
      {/* trunk / rear line */}
      <line
        x1={left + 14}
        y1={bottom - shape.cabinBottom}
        x2={right - 14}
        y2={bottom - shape.cabinBottom}
        className="stroke-slate-300 dark:stroke-slate-500"
        strokeWidth={2}
      />

      {/* roof panel (the visible top) */}
      <rect
        x={left + 22}
        y={top + shape.cabinTop + 16}
        width={shape.bodyW - 44}
        height={shape.bodyL - shape.cabinTop - shape.cabinBottom - 32}
        rx={18}
        className="fill-slate-200/70 stroke-slate-300 dark:fill-slate-600/50 dark:stroke-slate-500"
        strokeWidth={2}
      />
      <text
        x={cx}
        y={(top + shape.cabinTop + bottom - shape.cabinBottom) / 2 + 5}
        textAnchor="middle"
        className="fill-slate-400 dark:fill-slate-400"
        fontSize="15"
      >
        Dach
      </text>

      {/* windshield (front) */}
      <path
        d={`M ${left + 24} ${top + shape.cabinTop}
            L ${right - 24} ${top + shape.cabinTop}
            L ${right - 40} ${top + shape.cabinTop - 34}
            L ${left + 40} ${top + shape.cabinTop - 34} Z`}
        className="fill-sky-200/60 stroke-slate-300 dark:fill-sky-900/40 dark:stroke-slate-500"
        strokeWidth={2}
      />
      {/* rear window */}
      <path
        d={`M ${left + 28} ${bottom - shape.cabinBottom}
            L ${right - 28} ${bottom - shape.cabinBottom}
            L ${right - 42} ${bottom - shape.cabinBottom + 28}
            L ${left + 42} ${bottom - shape.cabinBottom + 28} Z`}
        className="fill-sky-200/60 stroke-slate-300 dark:fill-sky-900/40 dark:stroke-slate-500"
        strokeWidth={2}
      />

      {/* side mirrors */}
      <rect
        x={left - 8}
        y={top + shape.cabinTop + 6}
        width={10}
        height={16}
        rx={3}
        className="fill-slate-300 dark:fill-slate-500"
      />
      <rect
        x={right - 2}
        y={top + shape.cabinTop + 6}
        width={10}
        height={16}
        rx={3}
        className="fill-slate-300 dark:fill-slate-500"
      />

      {/* markers are rendered on top */}
      {children}
    </svg>
  );
}
