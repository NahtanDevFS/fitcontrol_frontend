// types/index.ts

export interface Ejercicio {
  id_ejercicio: number;
  nombre_ejercicio: string;
  descripcion_ejercicio: string;
}

export interface RutinaDiaEjercicio {
  id_rutina_dia_semana_ejercicio?: number;
  id_rutina_dia_semana?: number;
  id_ejercicio: number | null;
  ejercicio?: Ejercicio; // Para poblar con datos del ejercicio
  repeticiones: number;
  series: number;
  peso_ejercicio?: number | null;
  grupoId?: number | null;
  musculoId?: number | null;
}

export interface RutinaDia {
  id_rutina_dia_semana?: number;
  id_rutina?: number;
  dia_semana: string;
  ejercicios: RutinaDiaEjercicio[];
}

export interface Rutina {
  id_rutina: number;
  id_usuario: string;
  nombre_rutina: string;
  fecha_creacion_rutina: string;
  dias: RutinaDia[];
}

export interface GrupoMuscular {
  id_grupo: number;
  nombre_grupo: string;
}

export interface Musculo {
  id_musculo: number;
  id_grupo: number;
  nombre_musculo: string;
}
