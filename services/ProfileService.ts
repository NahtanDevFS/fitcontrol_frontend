// fitcontrol_frontend/services/ProfileService.ts

import { api } from "@/lib/api";
import { ProfileData, Usuario } from "@/types"; // <-- 1. Importar el nuevo tipo

type UpdateUserPayload = {
  nombre_usuario?: string;
  unidad_peso?: "kg" | "lbs";
};

export const profileService = {
  /**
   * Obtiene todos los datos consolidados para la página de perfil.
   */
  getProfileData: (userId: string) => {
    return api.get<ProfileData>(`/perfil/${userId}`);
  },

  /**
   * Actualiza los datos de un usuario.
   */
  updateUser: (userId: string, data: UpdateUserPayload) => {
    // --- 2. Especificar el tipo de dato que devuelve la API ---
    return api.put<Usuario>(`/usuario/${userId}`, data);
  },
};
