import { useAppStore } from '../store/appStore';
import { Vehicle } from '../types';

export const useVehicles = (siteId?: string) => {
  const { vehicles, isLoading } = useAppStore();

  const filteredVehicles = siteId
    ? vehicles.filter((v) => v.siteId === siteId || !v.siteId)
    : vehicles;

  const getVehicleById = (id: string) => vehicles.find((v) => v.id === id);

  return {
    vehicles: filteredVehicles.length > 0 ? filteredVehicles : vehicles,
    isLoading,
    error: null,
    getVehicleById,
  };
};
