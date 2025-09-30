import { api } from "@/lib/api";
import { Rutina, RutinaDia } from "@/types";

//Tipos simplificados para la data que se envía.
interface RutinaData {
  nombre_rutina: string;
  id_usuario?: string;
  dias: any[];
}

interface TrackerData {
  diaDeHoy: RutinaDia | null;
  diaCumplido: boolean;
  id_cumplimiento_rutina: number;
}

interface RutinaCompletaResponse {
  rutinas: Rutina[];
  rutinaActiva: Rutina | null;
  racha: number;
  calendario: any[];
}

//Payload para crear o actualizar una rutina completa
interface RoutinePayload {
  nombre_rutina: string;
  id_usuario: string;
  dias: any[]; //Se usa 'any' para flexibilidad en el formulario
}

export const routineService = {
  //Obtiene UNA SOLA rutina por su ID.
  //Esta es la función clave para tu formulario de "Editar".
  getRutinaById: (rutinaId: number | string) => {
    return api.get<Rutina>(`/rutina/${rutinaId}`);
  },

  getRutinasCompletas: (userId: string) => {
    return api.get<RutinaCompletaResponse>(`/rutina/completa/${userId}`);
  },

  getRutinasByUserId: (userId: string) => {
    return api.get<Rutina[]>(`/rutina/usuario/${userId}`);
  },

  deleteRutina: (rutinaId: number) => {
    return api.delete(`/rutina/${rutinaId}`);
  },

  createRutina: (payload: RoutinePayload) => {
    return api.post("/rutina/completa", payload);
  },

  updateRutinaCompleta: (rutinaId: number, payload: RoutinePayload) => {
    return api.put(`/rutina/completa/${rutinaId}`, payload);
  },

  getTodayRoutineTracker: (userId: string) => {
    return api.get<TrackerData>(`/tracker/rutina/hoy/${userId}`);
  },

  markDayAsCompleted: (complianceId: number) => {
    return api.put(`/cumplimiento-rutina/${complianceId}`, { cumplido: true });
  },
};
