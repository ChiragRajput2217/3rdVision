import { create } from 'zustand';

interface UiStoreState {
  sidebarOpen: boolean;
  notificationsOpen: boolean;
  selectedVehicleId: string | null;
  selectedSensorId: string | null;
  activeModal: string | null;
  modalData: any | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleNotifications: () => void;
  setSelectedVehicleId: (id: string | null) => void;
  setSelectedSensorId: (id: string | null) => void;
  openModal: (modalName: string, data?: any) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  sidebarOpen: true,
  notificationsOpen: false,
  selectedVehicleId: 'veh-d104',
  selectedSensorId: 'sns-rad-104',
  activeModal: null,
  modalData: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
  setSelectedVehicleId: (id) => set({ selectedVehicleId: id }),
  setSelectedSensorId: (id) => set({ selectedSensorId: id }),
  openModal: (modalName, data = null) => set({ activeModal: modalName, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
