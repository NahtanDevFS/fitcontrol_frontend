// services/routineService.ts

import { api } from "@/lib/api";
import { Rutina, RutinaDia } from "@/types";

// Tipos simplificados para la data que se envía.
// Puedes ajustarlos a tus 'types' si lo necesitas.
interface RutinaData {
  nombre_rutina: string;
  id_usuario?: string; // Opcional, ya que no se usa en la actualización
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

export const routineService = {
  /**
   * Obtiene TODAS las rutinas de un USUARIO.
   * Usa la ruta corregida para evitar conflictos.
   */
  getRutinasByUserId: (userId: string) => {
    return api.get<Rutina[]>(`/rutina/usuario/${userId}`);
  },

  /**
   * Obtiene UNA SOLA rutina por su ID.
   * Esta es la función clave para tu formulario de "Editar".
   */
  getRutinaById: (rutinaId: number | string) => {
    return api.get<Rutina>(`/rutina/${rutinaId}`);
  },

  /**
   * Crea una rutina.
   * NOTA: Se ha simplificado para que coincida con tu backend actual,
   * el cual maneja la creación completa a través de otra ruta.
   * El frontend debe manejar la lógica de 'crear y luego añadir detalles'.
   */
  createRutina: (rutinaData: {
    nombre_rutina: string;
    id_usuario: string;
    dias: any[];
  }) => {
    return api.post(`/rutina/completa`, rutinaData);
  },

  /**
   * Actualiza una rutina completa (nombre, días y ejercicios).
   */
  updateRutinaCompleta: (rutinaId: number, rutinaData: any) => {
    const { id_usuario, ...dataParaEnviar } = rutinaData;
    return api.put(`/rutina/completa/${rutinaId}`, dataParaEnviar);
  },

  /**
   * Elimina una rutina por su ID.
   */
  deleteRutina: (rutinaId: number) => {
    return api.delete(`/rutina/${rutinaId}`);
  },

  /**
   * Obtiene todos los datos necesarios para la página de rutinas.
   */
  getRutinasCompletas: (userId: string) => {
    return api.get<RutinaCompletaResponse>(`/rutina/completa/${userId}`);
  },

  /**
   * Obtiene los datos del tracker de rutina para el día actual.
   */
  getTodayRoutineTracker: (userId: string) => {
    return api.get<TrackerData>(`/tracker/rutina/hoy/${userId}`);
  },

  /**
   * Marca una rutina diaria como completada.
   */
  markDayAsCompleted: (complianceId: number) => {
    return api.put(`/cumplimiento-rutina/${complianceId}`, { cumplido: true });
  },
};
