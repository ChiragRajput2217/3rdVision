import { create } from 'zustand';
import { useSiteStore } from './siteStore';
import { useAlertStore } from './alertStore';
import { Alert, SimulationScenario } from '../types';

export type DemoStep = {
  stepNumber: number;
  title: string;
  description: string;
  roleFocus: 'ALL' | 'SITE_ADMIN' | 'CONTROL_ROOM_OPERATOR' | 'VEHICLE_OPERATOR' | 'MANAGEMENT';
  actionSummary: string;
};

export const DEMO_STEPS: DemoStep[] = [
  {
    stepNumber: 1,
    title: 'Normal Pit Operations',
    description: 'Mine operating under standard atmospheric conditions. Visibility 25m, speed limits clear, all sensors green.',
    roleFocus: 'ALL',
    actionSummary: 'System operating normally. Telemetry streaming fine.',
  },
  {
    stepNumber: 2,
    title: 'Adverse Weather: Fog Begins',
    description: 'Atmospheric humidity rises. Cold mountain fog rolls into deep pit bench B-4.',
    roleFocus: 'SITE_ADMIN',
    actionSummary: 'Environmental Transmissometer detects fog moisture rising.',
  },
  {
    stepNumber: 3,
    title: 'Visibility Drops Below 4 Meters',
    description: 'Optical visibility drops from 25m down to critical 3.2m. Standard optical camera vision is compromised.',
    roleFocus: 'SITE_ADMIN',
    actionSummary: 'Site Admin dashboard highlights HIGH Visibility Hazard alert.',
  },
  {
    stepNumber: 4,
    title: 'Vehicle D-104 Enters High Risk Zone B-4',
    description: 'Haul dumper D-104 carrying 100T iron ore descends ramp into narrow cutting bench B-4 at 18 km/h.',
    roleFocus: 'CONTROL_ROOM_OPERATOR',
    actionSummary: 'RTK-DGPS places D-104 inside Pit Bench B-4 boundary.',
  },
  {
    stepNumber: 5,
    title: 'Front 77GHz Radar Detects Approaching Vehicle D-108',
    description: 'Millimeter-wave radar pierces dense fog and detects Komatsu Dumper D-108 approaching from blind turn.',
    roleFocus: 'CONTROL_ROOM_OPERATOR',
    actionSummary: 'Radar telemetry reads Distance: 3.2m, Relative Closing Speed: +28 km/h.',
  },
  {
    stepNumber: 6,
    title: 'Risk Score Escalates to 91%',
    description: 'V2Xperts predictive algorithm calculates imminent head-on trajectory in narrow ramp segment.',
    roleFocus: 'CONTROL_ROOM_OPERATOR',
    actionSummary: 'Vehicle status switches from SAFE to CRITICAL RED.',
  },
  {
    stepNumber: 7,
    title: 'ML Prediction Engine Triggers Collision Warning',
    description: 'Machine Learning collision inference outputs high severity collision alert with 91% confidence.',
    roleFocus: 'CONTROL_ROOM_OPERATOR',
    actionSummary: 'ML risk factor: "Safe Braking Distance Exceeded in Dense Fog".',
  },
  {
    stepNumber: 8,
    title: 'Critical Alert Appears in Command Center',
    description: 'Red blinking alert banner pops up in Control Room with audible warning chime and recommended action.',
    roleFocus: 'CONTROL_ROOM_OPERATOR',
    actionSummary: 'Alert alt-col-9102 created & pushed live via Socket.IO.',
  },
  {
    stepNumber: 9,
    title: 'Control Room Command Center Highlights Map',
    description: 'Interactive mine map centers on Zone B-4, flashing red hazard polygon and vehicle vectors.',
    roleFocus: 'CONTROL_ROOM_OPERATOR',
    actionSummary: 'Control room operator assesses situation and initiates vehicle alert.',
  },
  {
    stepNumber: 10,
    title: 'Dynamic Recommended Speed Limit Issued',
    description: 'System automatically overrides recommended speed from 20 km/h down to emergency 8 km/h advisory.',
    roleFocus: 'VEHICLE_OPERATOR',
    actionSummary: 'Advisory speed target updated across telemetry feed.',
  },
  {
    stepNumber: 11,
    title: 'Vehicle Operator Receives In-Cab Audio/Visual Warning',
    description: 'In-cab mobile console displays high contrast "REDUCE SPEED TO 8 KM/H IMMEDIATELY" alert.',
    roleFocus: 'VEHICLE_OPERATOR',
    actionSummary: 'Operator Suresh Patel sees immediate caution prompt.',
  },
  {
    stepNumber: 12,
    title: 'Vehicle Operator Acknowledges & Reduces Speed',
    description: 'Driver presses large touch button on mobile cab UI and engages hydraulic auxiliary retarder brake.',
    roleFocus: 'VEHICLE_OPERATOR',
    actionSummary: 'Speed drops from 18 km/h down to 8 km/h. Distance opens up.',
  },
  {
    stepNumber: 13,
    title: 'Near-Miss Safety Incident Recorded',
    description: 'Incident INC-2026-041 logged in database with sensor telemetry snapshot for safety audit compliance.',
    roleFocus: 'SITE_ADMIN',
    actionSummary: 'Near-miss event tagged and logged automatically.',
  },
  {
    stepNumber: 14,
    title: 'Management Analytics Updated',
    description: 'Executive dashboard updates near-miss count, risk trend graph, and safety compliance score.',
    roleFocus: 'MANAGEMENT',
    actionSummary: 'Management safety score updated to reflect proactive hazard mitigation.',
  },
];

interface SimulationStoreState {
  currentStepIndex: number;
  isPlaying: boolean;
  activeScenario: SimulationScenario;
  speedMs: number;

  // Actions
  startDemoFlow: () => void;
  pauseDemoFlow: () => void;
  resetDemoFlow: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  setScenario: (scenario: SimulationScenario) => void;
  setSpeedMs: (speed: number) => void;
}

export const useSimulationStore = create<SimulationStoreState>((set, get) => ({
  currentStepIndex: 0,
  isPlaying: false,
  activeScenario: 'COLLISION_RISK',
  speedMs: 3000,

  startDemoFlow: () => set({ isPlaying: true }),
  pauseDemoFlow: () => set({ isPlaying: false }),
  
  resetDemoFlow: () => {
    set({ currentStepIndex: 0, isPlaying: false });
    // Reset site condition to normal
    useSiteStore.getState().updateSiteCondition('site-kirandul-01', {
      visibilityMeters: 25.0,
      fogLevelPercent: 10,
      status: 'CLEAR',
    });
  },

  nextStep: () => {
    const nextIdx = Math.min(get().currentStepIndex + 1, DEMO_STEPS.length - 1);
    get().goToStep(nextIdx);
  },

  prevStep: () => {
    const prevIdx = Math.max(get().currentStepIndex - 1, 0);
    get().goToStep(prevIdx);
  },

  goToStep: (index: number) => {
    set({ currentStepIndex: index });
    const siteStore = useSiteStore.getState();
    const alertStore = useAlertStore.getState();

    // Trigger state mutations according to the step
    if (index === 0) {
      siteStore.updateSiteCondition('site-kirandul-01', { visibilityMeters: 25.0, fogLevelPercent: 10, status: 'CLEAR' });
    } else if (index >= 1 && index <= 2) {
      siteStore.updateSiteCondition('site-kirandul-01', { visibilityMeters: 3.2, fogLevelPercent: 78, status: 'DENSE_FOG' });
    } else if (index >= 7) {
      // Ensure Critical Alert exists in alert store
      const criticalAlert: Alert = {
        id: 'alt-col-9102',
        siteId: 'site-kirandul-01',
        category: 'COLLISION_RISK',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        title: 'Predicted High-Speed Head-on Collision Risk',
        description: 'ML model estimated risk score: 91% — D-104 and D-108 in close proximity in Pit Bench B-4.',
        vehicleId: 'veh-d104',
        vehicleCode: 'D-104',
        secondaryVehicleId: 'veh-d108',
        secondaryVehicleCode: 'D-108',
        sensorId: 'sns-rad-104',
        sensorName: 'Front mmWave Radar 77GHz',
        zoneId: 'zone-b4',
        zoneName: 'Pit Bench B-4',
        currentValue: 'Distance: 3.2m | Closing Speed: +28 km/h | Vis: 3.2m',
        riskScorePercent: 91,
        recommendedAction: 'Reduce speed to 8 km/h & divert D-104 to outer safety turnout bench.',
        timestamp: new Date().toISOString(),
      };
      alertStore.addAlert(criticalAlert);
    }
  },

  setScenario: (scenario) => {
    set({ activeScenario: scenario });
    const siteStore = useSiteStore.getState();
    if (scenario === 'NORMAL' || scenario === 'NORMAL_OPERATION') {
      siteStore.updateSiteCondition('site-kirandul-01', { visibilityMeters: 25, fogLevelPercent: 5, status: 'CLEAR' });
    } else if (scenario === 'FOG' || scenario === 'FOG_EVENT' || scenario === 'LOW_VISIBILITY') {
      siteStore.updateSiteCondition('site-kirandul-01', { visibilityMeters: 3.2, fogLevelPercent: 85, status: 'DENSE_FOG' });
    }
  },

  setSpeedMs: (speedMs) => set({ speedMs }),
}));
