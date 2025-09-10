// fitcontrol_frontend/services/ProgressService.ts

import { api } from "@/lib/api";
import { Progreso } from "@/types";

// Definimos un tipo para la respuesta de nuestro nuevo endpoint
interface ProgresoActivoResponse {
  progreso: Progreso | null;
  unidad_peso: "kg" | "lbs";
}

interface CreateProgresoPayload {
  id_usuario: string;
  peso_actual: number;
  peso_deseado: number;
}

interface UpdateProgresoPayload {
  peso_actual?: number;
  estado?: number;
  fecha_final_proceso?: string;
}

export const progressService = {
  /**
   * Obtiene el progreso activo y la unidad de peso de un usuario.
   */
  getProgresoActivo: (userId: string) => {
    return api.get<ProgresoActivoResponse>(
      `/progreso-usuario/activo/${userId}`
    );
  },
  /**
   * Crea un nuevo registro de progreso para un usuario.
   * @param progresoData - Los datos para crear la nueva meta.
   */
  createProgreso: (progresoData: CreateProgresoPayload) => {
    // La API espera un POST en la ruta base del progreso
    return api.post<Progreso>("/progreso-usuario", progresoData);
  },

  /**
   * Actualiza un registro de progreso existente.
   * @param progresoId - El ID del registro de progreso a actualizar.
   * @param updateData - Los campos a actualizar.
   */
  updateProgreso: (progresoId: number, updateData: UpdateProgresoPayload) => {
    return api.put<Progreso>(`/progreso-usuario/${progresoId}`, updateData);
  },

  /**
   * Finaliza una meta activa, cambiando su estado a 2.
   * @param progresoId - El ID del registro de progreso a finalizar.
   */
  finishProgreso: (progresoId: number) => {
    const updateData: UpdateProgresoPayload = {
      estado: 2,
      fecha_final_proceso: new Date().toISOString(),
    };
    return api.put<Progreso>(`/progreso-usuario/${progresoId}`, updateData);
  },
};
