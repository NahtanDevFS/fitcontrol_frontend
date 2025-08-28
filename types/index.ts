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
  ejercicio?: Ejercicio;
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

export interface CumplimientoRutina {
  id_cumplimiento_rutina: number;
  id_rutina_dia_semana: number;
  fecha_a_cumplir: string; // formato YYYY-MM-DD
  cumplido: boolean;
}

// --- NUEVOS TIPOS PARA EL MÓDULO DE DIETA ---

export interface AlimentoDetalle {
  id_dieta_alimento_detalle?: number;
  id_dieta_alimento?: number;
  nombre_alimento: string;
  calorias_alimento: number;
  proteina_alimento: number;
  grasas_alimento: number;
  carbohidratos_alimento: number;
  gramos_alimento: number;
}

export interface TiempoComida {
  id_dieta_alimento?: number;
  id_dieta: number;
  tiempo_comida: string;
  dia_semana: string;
  alimentos: AlimentoDetalle[];
}

export interface Dieta {
  id_dieta: number;
  id_usuario: string;
  nombre_dieta: string;
  // Usamos un objeto anidado para un acceso más fácil: dias['Lunes']['Desayuno']
  dias: { [key: string]: { [key: string]: TiempoComida } };
}

export interface CumplimientoDietaDia {
  id: number;
  id_usuario: string;
  id_dieta: number;
  fecha_a_cumplir: string; // formato YYYY-MM-DD
  dia_semana: string;
  cumplido: boolean;
}
