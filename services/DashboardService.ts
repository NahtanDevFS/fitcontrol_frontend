// fitcontrol_frontend/services/DashboardService.ts

import { api } from "@/lib/api";
import { DashboardData } from "@/types";

export const dashboardService = {
  /**
   * Obtiene todos los datos consolidados para la página del dashboard.
   */
  getDashboardData: (userId: string) => {
    return api.get<DashboardData>(`/dashboard/${userId}`);
  },
};
