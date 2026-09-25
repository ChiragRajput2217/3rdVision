import { useAppStore } from '../store/appStore';

export const useSensors = (siteId?: string) => {
  const { sensors, isLoading } = useAppStore();

  const filteredSensors = siteId
    ? sensors.filter((s) => s.siteId === siteId || !s.siteId)
    : sensors;

  return {
    sensors: filteredSensors.length > 0 ? filteredSensors : sensors,
    isLoading,
  };
};
