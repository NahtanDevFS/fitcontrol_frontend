import { api } from "@/lib/api";
import { Dieta, AlimentoDetalle } from "@/types";

interface CalendarioDay {
  fecha: string;
  status: "completed" | "missed" | "rest" | "pending" | "future";
}

interface DietaCompletaResponse {
  dieta: Dieta;
  racha: number;
  calendario: CalendarioDay[];
}

//Tipo para los datos que se envían al crear un nuevo alimento
interface AddFoodPayload {
  id_dieta: number;
  dia_semana: string;
  tiempo_comida: string;
  nombre_alimento: string;
  calorias_alimento: number;
  proteina_alimento: number;
  grasas_alimento: number;
  carbohidratos_alimento: number;
  gramos_alimento: number;
}

//Tipo para los datos que se envían al actualizar
type UpdateFoodPayload = Omit<
  AddFoodPayload,
  "id_dieta" | "dia_semana" | "tiempo_comida"
>;

interface MealStatus {
  id_dieta_alimento: number;
  cumplido: boolean;
  id_cumplimiento_dieta: number;
}

interface TrackerData {
  diaCumplido: boolean;
  id_cumplimiento_dia: number;
  comidasDeHoy: MealStatus[];
}

export const dietService = {
  //obtiene el plan de dieta completo, la racha y el calendario de un usuario.

  getDietPlan: (userId: string) => {
    return api.get<DietaCompletaResponse>(`/dieta/completa/${userId}`);
  },

  //Añade un nuevo alimento a la dieta.

  addFood: (payload: AddFoodPayload) => {
    return api.post<AlimentoDetalle>("/dieta-alimento-detalle", payload);
  },

  //Actualiza un alimento existente.
  updateFood: (foodId: number, payload: Partial<UpdateFoodPayload>) => {
    return api.put<AlimentoDetalle>(
      `/dieta-alimento-detalle/${foodId}`,
      payload
    );
  },

  //Elimina un alimento de la dieta.

  deleteFood: (foodId: number) => {
    return api.delete(`/dieta-alimento-detalle/${foodId}`);
  },

  //Obtiene el estado del tracker de dieta para el día actual.
  getTodayDietTracker: (userId: string) => {
    return api.get<TrackerData>(`/tracker/dieta/hoy/${userId}`);
  },

  //Actualiza el estado de cumplimiento de una comida individual.
  updateMealCompliance: (complianceId: number, cumplido: boolean) => {
    return api.put(`/cumplimiento-dieta/${complianceId}`, { cumplido });
  },

  //Actualiza el estado de cumplimiento para todo el día.
  updateDayCompliance: (dayComplianceId: number, cumplido: boolean) => {
    return api.put(`/cumplimiento-dieta-dia/${dayComplianceId}`, { cumplido });
  },
};
