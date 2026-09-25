import { create } from 'zustand';
import { MiningSite, MiningZone, EnvironmentalConditionSummary } from '../types';
import { MOCK_SITES, MOCK_ZONES } from '../services/mockData';

interface SiteStoreState {
  sites: MiningSite[];
  selectedSite: MiningSite;
  zones: MiningZone[];
  
  // Actions
  setSelectedSite: (siteId: string) => void;
  updateSiteCondition: (siteId: string, condition: Partial<EnvironmentalConditionSummary>) => void;
  updateZoneRisk: (zoneId: string, riskLevel: MiningZone['riskLevel']) => void;
}

export const useSiteStore = create<SiteStoreState>((set, get) => ({
  sites: MOCK_SITES,
  selectedSite: MOCK_SITES[0],
  zones: MOCK_ZONES,

  setSelectedSite: (siteId: string) => {
    const found = get().sites.find((s) => s.id === siteId);
    if (found) {
      set({ selectedSite: found });
    }
  },

  updateSiteCondition: (siteId: string, conditionUpdate: Partial<EnvironmentalConditionSummary>) => {
    set((state) => ({
      sites: state.sites.map((site) =>
        site.id === siteId
          ? {
              ...site,
              currentCondition: { ...site.currentCondition, ...conditionUpdate },
            }
          : site
      ),
      selectedSite:
        state.selectedSite.id === siteId
          ? {
              ...state.selectedSite,
              currentCondition: { ...state.selectedSite.currentCondition, ...conditionUpdate },
            }
          : state.selectedSite,
    }));
  },

  updateZoneRisk: (zoneId: string, riskLevel: MiningZone['riskLevel']) => {
    set((state) => ({
      zones: state.zones.map((zone) =>
        zone.id === zoneId ? { ...zone, riskLevel } : zone
      ),
    }));
  },
}));
