export type VehicleType = 'PKW' | 'Kombi' | 'SUV' | 'Transporter';

export type DamagePhase = 'Ankunft' | 'Abfahrt';

export type DamageType = 'Delle' | 'Kratzer' | 'Riss' | 'Glasschaden' | 'Fehlend';

export type Severity = 'leicht' | 'mittel' | 'stark';

export const VEHICLE_TYPES: VehicleType[] = ['PKW', 'Kombi', 'SUV', 'Transporter'];

export const DAMAGE_TYPES: DamageType[] = [
  'Delle',
  'Kratzer',
  'Riss',
  'Glasschaden',
  'Fehlend',
];

export const SEVERITIES: Severity[] = ['leicht', 'mittel', 'stark'];

export interface DamageMarkerData {
  id: string;
  /** Position as a fraction (0..1) of the outline's intrinsic viewBox. */
  x: number;
  y: number;
  type: DamageType;
  severity: Severity;
  note: string;
  /** data URLs for attached photos */
  photos: string[];
}

export interface Inspection {
  // Step 1 — vehicle & customer
  licensePlate: string;
  customerName: string;
  mechanicName: string;
  dateTime: string; // ISO string
  mileage: string;
  fuelLevel: number; // 0..100
  vehicleType: VehicleType;

  // Step 2 — damage maps (two phases)
  damages: Record<DamagePhase, DamageMarkerData[]>;

  // Step 4 — signature
  signature: string | null; // data URL
  confirmed: boolean;
}

export function createEmptyInspection(): Inspection {
  return {
    licensePlate: '',
    customerName: '',
    mechanicName: '',
    dateTime: new Date().toISOString(),
    mileage: '',
    fuelLevel: 50,
    vehicleType: 'PKW',
    damages: {
      Ankunft: [],
      Abfahrt: [],
    },
    signature: null,
    confirmed: false,
  };
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  leicht: '#fbbf24',
  mittel: '#fb923c',
  stark: '#ef4444',
};
