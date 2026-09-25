import { useAppStore } from '../store/appStore';
import { useSimulationStore, DEMO_STEPS } from '../store/simulationStore';
import { simulationEngine } from '../services/simulation';
import { SimulationScenario } from '../types';

export const useSimulation = () => {
  const {
    activeScenario,
    isPlaying,
    speedMs,
    connectionStatus,
    setScenario,
    toggleSimulation,
    setSimulationSpeed,
    acknowledgeAlert,
    resolveAlert,
    updateVehicleSpeed,
    restrictZone,
  } = useAppStore();

  const { currentStepIndex } = useSimulationStore();
  const currentStep = DEMO_STEPS[currentStepIndex] || DEMO_STEPS[0];

  const getManagementAnalytics = () => {
    return simulationEngine.getManagementAnalytics();
  };

  const getRiskPredictions = () => {
    return simulationEngine.getRiskPredictions();
  };

  return {
    activeScenario,
    isPlaying,
    speedMs,
    connectionStatus,
    currentStep,
    setScenario: (sc: SimulationScenario) => setScenario(sc),
    toggleSimulation,
    setSimulationSpeed,
    acknowledgeAlert,
    resolveAlert,
    updateVehicleSpeed,
    restrictZone,
    getManagementAnalytics,
    getRiskPredictions,
  };
};
